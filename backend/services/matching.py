import hashlib
import json
from datetime import datetime, timezone
from time import perf_counter

from sqlalchemy import select

from ..models import AgentRun, AuditRecord, FounderProfile, FundingPreference, Match
from .rag.funding_retriever import retrieve_funding
from .rag.compliance_retriever import retrieve_compliance

ENGINE = "rules-v0.3.0"


def snapshot(record):
    return {column.name: (value.isoformat() if isinstance(value, datetime) else value)
            for column in record.__table__.columns if (value := getattr(record, column.name)) is not None}


def generate_match(session, company, provider, need, records):
    started = perf_counter()
    preference = session.scalar(select(FundingPreference).where(
        FundingPreference.funding_provider_id == provider.id))
    founder = session.scalar(select(FounderProfile).where(FounderProfile.user_id == company.owner_user_id))
    missing, failures = [], []

    def dimension(value, allowed, name):
        if not allowed:
            missing.append(f"{name}: provider policy unknown")
            return None
        return 100.0 if str(value).casefold() in {v.casefold() for v in allowed} or "global" in allowed else 0.0

    stages = preference.preferred_company_stages if preference and preference.preferred_company_stages else provider.target_stages
    industries = preference.preferred_industries if preference and preference.preferred_industries else provider.target_industries
    geographies = preference.preferred_geographies if preference and preference.preferred_geographies else provider.geographies
    scores = {
        "stage_score": dimension(company.company_stage, stages, "stage"),
        "industry_score": dimension(company.industry, industries, "industry"),
        "geography_score": dimension(company.location, geographies, "geography"),
        # These are not credible quality scores without evaluated evidence.
        "founder_score": None, "team_score": None, "traction_score": None,
        "financial_score": None, "risk_score": None,
    }
    missing.extend(["founder/team/product quality: not evaluated", "risk assessment: human review required"])
    if not founder:
        missing.append("founder profile")
    if need is None:
        missing.append("funding need")
    elif need.currency != provider.currency:
        missing.append("ticket currency mismatch: no FX conversion")
    elif provider.ticket_min is None or provider.ticket_max is None:
        missing.append("ticket range")
    elif not provider.ticket_min <= need.target_amount <= provider.ticket_max:
        failures.append("Requested funding outside provider ticket range")
    if need and need.preferred_funding_types:
        if not set(need.preferred_funding_types).intersection([provider.provider_type, *provider.categories]):
            failures.append("Requested capital type differs from provider category")
    if scores["stage_score"] == 0:
        failures.append("Company stage outside stated provider stages")
    finance_results, traction_results = [], []
    if preference:
        for required, actual, title, results in (
            (preference.minimum_revenue, company.annual_revenue, "annual revenue", finance_results),
            (preference.minimum_growth_rate, company.growth_rate, "growth rate", traction_results),
            (preference.minimum_customer_count, company.customer_count, "customer count", traction_results),
        ):
            if required is not None:
                if actual is None or (title == "annual revenue" and provider.currency != company.currency):
                    missing.append(f"{title}: missing or currency mismatch")
                else:
                    results.append(100 if actual >= required else 0)
                    if actual < required:
                        failures.append(f"Below minimum {title}")
        for field in ("profitability", "positive_cash_flow", "collateral", "audited_financials"):
            if getattr(preference, "requires_" + field):
                evidence = company.evidence_json.get(field)
                if evidence is False:
                    failures.append(f"Stated requirement not met: {field}")
                elif evidence is not True:
                    missing.append(f"{field}: evidence required")
        if preference.minimum_company_age is not None or preference.maximum_company_age is not None:
            if company.founded_at is None:
                missing.append("company age")
            else:
                founded = company.founded_at.replace(tzinfo=timezone.utc)
                age = (datetime.now(timezone.utc) - founded).days / 365.25
                if ((preference.minimum_company_age is not None and age < preference.minimum_company_age)
                        or (preference.maximum_company_age is not None and age > preference.maximum_company_age)):
                    failures.append("Outside stated company-age range")
        for key in ("hard_constraints_json", "soft_preferences_json", "red_flags_json"):
            if getattr(preference, key):
                missing.append(f"{key}: unstructured policy requires human review")
    else:
        missing.append("funding preference not supplied")
    if finance_results:
        scores["financial_score"] = sum(finance_results) / len(finance_results)
    if traction_results:
        scores["traction_score"] = sum(traction_results) / len(traction_results)
    if provider.provider_type in ("bank", "venture_debt"):
        missing.extend(["repayment source and debt capacity", "credit history", "guarantee/collateral policy",
                        "financial statements and cash-flow verification"])
    funding = retrieve_funding(records, company_stage=company.company_stage, industry=company.industry,
                               location=company.location, target_amount=need.target_amount if need else None,
                               currency=need.currency if need else None)
    compliance = retrieve_compliance(records, company)
    measured = [value for value in scores.values() if value is not None]
    overall = round(sum(measured) / len(measured), 2) if measured else None
    if failures:
        overall = 0.0
    decision = "incompatible" if failures else "requires_review"
    evidence = {
        "engine": ENGINE, "decision": decision, "score_semantics": "unweighted known-dimension screening, not funding probability",
        "evaluated_dimensions": len(measured), "total_dimensions": len(scores),
        "weights_applied": False,
        "weight_note": "Preference weights stored for future calibrated scoring; quality/risk scores remain unknown.",
        "company_snapshot": snapshot(company), "provider_snapshot": snapshot(provider),
        "need_snapshot": snapshot(need) if need else None,
        "preference_snapshot": snapshot(preference) if preference else None,
        "funding_retrieval": funding, "compliance_retrieval": compliance,
        "human_approval_required": True, "outbound_actions": [],
    }
    evidence["input_hash"] = hashlib.sha256(json.dumps(evidence, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    match = Match(company_id=company.id, funding_provider_id=provider.id, **scores,
                  overall_score=overall, status="generated",
                  match_reason=f"{decision}: {len(measured)}/{len(scores)} dimensions measured; verify before contacting.",
                  risks=failures, missing_information=sorted(set(missing)), evidence_json=evidence)
    session.add(match)
    session.flush()
    for agent, output in (
        ("Information Agent", {"funding": funding, "stored_profile_ids": [company.id, provider.id]}),
        ("Analysis Agent", {"scores": scores, "decision": decision}),
        ("Audit Agent", {"compliance": compliance, "missing": match.missing_information, "failures": failures}),
        ("A2A Match Agent", {"match_id": match.id, "status": "generated", "human_approval_required": True}),
    ):
        session.add(AgentRun(agent_name=agent, user_id=company.owner_user_id, company_id=company.id,
                             funding_provider_id=provider.id, input_json={"match_id": match.id, "input_hash": evidence["input_hash"]},
                             output_json=output, model=ENGINE, status="completed", latency_ms=(perf_counter()-started)*1000))
    session.add(AuditRecord(entity_type="match", entity_id=match.id, audit_type="evidence_gate",
                            severity="review", finding=decision, evidence={"failures": failures, "missing": match.missing_information},
                            recommendation="Human evidence review. No automatic introduction, investment or legal conclusion."))
    session.flush()
    return match
