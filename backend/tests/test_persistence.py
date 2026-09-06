import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from backend.app import create_app
from backend.knowledge import Metadata, filter_knowledge, load_knowledge
from scripts.seed_database import seed

HEADERS = {"X-Deep-Funding-Local": "1"}


@pytest.fixture
def store(tmp_path):
    url = f"sqlite:///{tmp_path / 'test.db'}"
    seed(url)
    return url


@pytest.fixture
def client(store):
    with TestClient(create_app(store), base_url="http://127.0.0.1", headers=HEADERS) as client:
        yield client


def test_twelve_tables(client):
    names = {table["name"] for table in client.get("/api/database").json()["tables"]}
    assert len(names) == 12
    assert "funding_preferences" in names
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200
    assert "/api/matches/generate" in client.get("/openapi.json").json()["paths"]


def test_create_chain_restart(store):
    app = create_app(store)
    with TestClient(app, base_url="http://127.0.0.1", headers=HEADERS) as client:
        user = client.post("/api/users", json={"email": "new@example.invalid", "name": "New synthetic user"}).json()
        company = client.post("/api/companies", json={"owner_user_id": user["id"], "company_name": "Restart case",
            "company_stage": "pre_seed", "industry": "ai", "location": "Shenzhen"}).json()
        assert company["annual_revenue"] is None
        provider = client.post("/api/funding-providers", json={"owner_user_id": user["id"], "name": "Synthetic fund",
            "provider_type": "venture_capital", "target_stages": ["pre_seed"]}).json()
        need = client.post("/api/funding-needs", json={"company_id": company["id"], "target_amount": 300000}).json()
        result = client.post("/api/matches/generate", json={"company_id": company["id"],
            "funding_provider_id": provider["id"]})
        assert result.status_code == 201, result.text
        match = result.json()
        assert match["status"] == "generated"
        assert match["evidence_json"]["funding_retrieval"]
        assert match["evidence_json"]["compliance_retrieval"]
        assert len(client.get("/api/agent-runs").json()) >= 4
    with TestClient(create_app(store), base_url="http://127.0.0.1", headers=HEADERS) as restarted:
        assert restarted.get(f"/api/companies/{company['id']}").json()["company_name"] == "Restart case"
        assert restarted.get(f"/api/matches/{match['id']}").json()["stale"] is False
        assert restarted.get(f"/api/funding-needs/{company['id']}").json()[0]["id"] == need["id"]


def test_patch_validates_and_stales(client):
    result = client.post("/api/matches/generate", json={"company_id": "demo-company-1", "funding_provider_id": "demo-provider-1"}).json()
    assert client.patch("/api/companies/demo-company-1", json={"company_name": ""}).status_code == 422
    assert client.patch("/api/companies/demo-company-1", json={"company_stage": None}).status_code == 422
    assert client.patch("/api/companies/demo-company-1", json={"annual_revenue": -1}).status_code == 422
    assert client.patch("/api/companies/demo-company-1", json={"company_name": "Changed"}).status_code == 200
    assert client.get(f"/api/matches/{result['id']}").json()["stale"] is True
    assert client.patch("/api/funding-providers/demo-provider-1", json={"ticket_min": 2000000}).status_code == 422


def test_integrity_and_no_overposting(client):
    assert client.post("/api/users", json={"email": "founder1@example.invalid", "name": "Duplicate"}).status_code == 409
    assert client.post("/api/companies", json={"owner_user_id": "missing", "company_name": "Invalid",
        "company_stage": "seed", "industry": "ai", "location": "Shenzhen"}).status_code == 409
    assert client.post("/api/users", json={"email": "ok@example.invalid", "name": "Name", "id": "overwrite"}).status_code == 422


def test_local_security(client):
    assert client.get("/api/users", headers={"Host": "evil.example"}).status_code == 403
    assert client.get("/api/users", headers={"Origin": "https://evil.example"}).status_code == 403
    assert client.get("/api/users", headers={"Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert client.post("/api/users", json={"email": "x@example.invalid", "name": "x"},
                       headers={"X-Deep-Funding-Local": ""}).status_code == 403
    assert client.post("/api/users", content="x" * 140000, headers={"Content-Type": "application/json"}).status_code == 413
    assert client.get("/data-explorer").headers["cache-control"] == "no-store"
    assert client.get("/data/deep_funding.db").headers.get("content-type", "").startswith("text/html")


def test_explorer_filters_sort_and_counts(client):
    data = client.get("/api/database/companies?q=Research&sort=company_name&direction=asc&limit=2").json()
    assert data["total"] == 3
    assert len(data["records"]) == 2
    assert client.get("/api/database/companies?filter_field=company_stage&filter_value=pre_seed").json()["total"] == 1
    assert client.get("/api/database/companies?sort=DROP%20TABLE").status_code == 422
    assert client.get("/api/database/not_allowed").status_code == 404
    assert client.get("/api/database/companies?q=%25").json()["total"] == 0


def test_knowledge_and_disputed_boundary(client):
    records = load_knowledge()
    assert len([r for r in records if r["kind"] == "funding" and r["record_type"] == "entity"]) >= 18
    banks = filter_knowledge(records, "funding", category="bank")
    assert len(banks) >= 3
    disputed = client.get("/api/knowledge/compliance?status=disputed").json()["records"]
    assert len(disputed) == 1
    assert disputed[0]["evidence_level"] == "media_report"
    assert any(c["type"] == "company_statement" for c in disputed[0]["claims"])
    altered = {k: v for k, v in disputed[0].items() if k in Metadata.model_fields}
    altered["claims"] = [{"type": "regulatory_finding", "text": "guilty", "source_url": altered["source_urls"][0]}]
    with pytest.raises(ValueError):
        Metadata.model_validate(altered)


def test_no_case_association_penalty(client):
    first = client.post("/api/matches/generate", json={"company_id": "demo-company-1", "funding_provider_id": "demo-provider-1"}).json()
    evidence = first["evidence_json"]["compliance_retrieval"]
    assert any(row["id"] == "xiaohongshu-disputed-2026" for row in evidence)
    assert all(row["applies_to_company_as_fact"] is False for row in evidence)
    client.patch("/api/companies/demo-company-1", json={"evidence_json": {}})
    second = client.post("/api/matches/generate", json={"company_id": "demo-company-1", "funding_provider_id": "demo-provider-1"}).json()
    assert first["overall_score"] == second["overall_score"]
    assert all(row["id"] != "xiaohongshu-disputed-2026" for row in second["evidence_json"]["compliance_retrieval"])


def test_bank_unknown_not_approval(client):
    result = client.post("/api/matches/generate", json={"company_id": "demo-company-1", "funding_provider_id": "demo-provider-2"}).json()
    assert "annual revenue: missing or currency mismatch" in result["missing_information"]
    assert result["financial_score"] is None
    assert result["evidence_json"]["human_approval_required"] is True
    assert result["status"] == "generated"


def test_seed_idempotent(store):
    first = seed(store)
    second = seed(store)
    assert first == second


@pytest.mark.parametrize("evidence", [
    {"review_topics": None}, {"review_topics": 5}, {"review_topics": [{}]},
    {"profitability": "yes"}, {"collateral": 1},
])
def test_invalid_review_inputs_fail_early(client, evidence):
    assert client.patch("/api/companies/demo-company-1", json={"evidence_json": evidence}).status_code == 422


def test_explicit_financial_requirement_failure(client):
    client.patch("/api/companies/demo-company-1", json={"evidence_json": {"positive_cash_flow": False}})
    result = client.post("/api/matches/generate", json={"company_id": "demo-company-1",
        "funding_provider_id": "demo-provider-2"}).json()
    assert "Stated requirement not met: positive_cash_flow" in result["risks"]
    assert result["evidence_json"]["decision"] == "incompatible"


def test_stale_preference_and_need(client):
    result = client.post("/api/matches/generate", json={"company_id": "demo-company-1",
        "funding_provider_id": "demo-provider-1"}).json()
    client.post("/api/funding-needs", json={"company_id": "demo-company-1", "target_amount": 200000})
    assert client.get(f"/api/matches/{result['id']}").json()["stale"] is True


def test_match_status_writes_audit_only(client):
    result = client.post("/api/matches/generate", json={"company_id": "demo-company-1",
        "funding_provider_id": "demo-provider-1"}).json()
    response = client.patch(f"/api/matches/{result['id']}", json={"status": "shortlisted", "note": "Synthetic review"})
    assert response.status_code == 200
    assert any(a["audit_type"] == "human_status_update" for a in client.get("/api/audits").json())
    assert response.json()["evidence_json"]["outbound_actions"] == []
