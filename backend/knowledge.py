"""Parse checked-in knowledge only. No remote fetches or instruction execution."""
import hashlib
import json
from datetime import date, datetime
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import select

from .database import ROOT
from .models import ComplianceCase, KnowledgeEntity


class Metadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name: str
    kind: Literal["funding", "compliance"]
    record_type: Literal["entity", "case", "template", "taxonomy"]
    category: list[str]
    stage: list[str] = Field(default_factory=list)
    industry: list[str] = Field(default_factory=list)
    location: list[str] = Field(default_factory=list)
    provides: list[str] = Field(default_factory=list)
    ticket_min: float | None = None
    ticket_max: float | None = None
    currency: str | None = None
    status: str
    verification_status: Literal["verified_scope", "needs_review", "template", "reference"]
    verified_scope: list[str] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)
    last_verified: date
    company: str | None = None
    jurisdiction: list[str] = Field(default_factory=list)
    evidence_level: Literal["official_source", "regulatory_finding", "company_statement",
                            "media_report", "unverified", "template"] = "official_source"
    risk_tags: list[str] = Field(default_factory=list)
    claims: list[dict] = Field(default_factory=list)
    related_ids: list[str] = Field(default_factory=list)

    @field_validator("source_urls")
    @classmethod
    def safe_urls(cls, urls):
        if any(not url.startswith("https://") for url in urls):
            raise ValueError("Knowledge citations must use HTTPS")
        return urls

    @model_validator(mode="after")
    def evidence_boundary(self):
        if self.record_type in ("entity", "case") and not self.source_urls:
            raise ValueError("Named entities/cases need sources")
        allowed = {"confirmed_fact", "regulatory_finding", "company_statement",
                   "media_report", "allegation", "disputed_claim", "analysis"}
        for claim in self.claims:
            if set(claim) != {"type", "text", "source_url"} or claim["type"] not in allowed:
                raise ValueError("Claims require type, text and source_url")
            if claim["source_url"] and claim["source_url"] not in self.source_urls:
                raise ValueError("Claim source is outside the record source list")
            if self.status == "disputed" and claim["type"] == "regulatory_finding":
                raise ValueError("Disputed media case cannot assert a regulatory finding")
        return self


def load_knowledge(root=ROOT):
    records = []
    for kind in ("funding", "compliance"):
        for path in sorted((Path(root) / f"{kind}-rag-graph").rglob("*.md")):
            text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
            if not text.startswith("---\n"):
                continue
            _, frontmatter, markdown = text.split("---\n", 2)
            metadata = Metadata.model_validate(yaml.safe_load(frontmatter))
            if metadata.kind != kind:
                raise ValueError(f"Wrong knowledge directory: {path.name}")
            records.append({
                **metadata.model_dump(mode="json"),
                "markdown": markdown.strip(),
                "path": path.relative_to(root).as_posix(),
                "content_hash": hashlib.sha256(text.encode()).hexdigest(),
            })
    ids = [row["id"] for row in records]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate knowledge IDs")
    for record in records:
        if any(link not in ids for link in record["related_ids"]):
            raise ValueError(f"Dangling graph edge: {record['id']}")
    return records


def filter_knowledge(records, kind, **filters):
    def matches(row):
        if row["kind"] != kind:
            return False
        for key, value in filters.items():
            if not value:
                continue
            value = str(value).casefold()
            if key == "q":
                if value not in json.dumps(row, ensure_ascii=False).casefold():
                    return False
            elif key in ("category", "stage", "industry", "location", "jurisdiction", "risk_tags"):
                if value not in [str(v).casefold() for v in row.get(key, [])]:
                    return False
            elif value != str(row.get(key, "")).casefold():
                return False
        return True
    return [row for row in records if matches(row)]


def sync_knowledge(session, records):
    for row in records:
        if row["kind"] == "funding":
            item = session.scalar(select(KnowledgeEntity).where(KnowledgeEntity.slug == row["id"]))
            if item is None:
                item = KnowledgeEntity(slug=row["id"])
                session.add(item)
            item.name = row["name"]
            item.entity_type = row["category"]
            item.verification_status = row["verification_status"]
        else:
            item = session.scalar(select(ComplianceCase).where(ComplianceCase.case_id == row["id"]))
            if item is None:
                item = ComplianceCase(case_id=row["id"])
                session.add(item)
            item.company = row["company"] or row["name"]
            item.category = row["category"]
            item.status = row["status"]
            item.evidence_level = row["evidence_level"]
        item.metadata_json = {key: value for key, value in row.items() if key != "markdown"}
        item.markdown = row["markdown"]
        item.source_urls = row["source_urls"]
        item.content_hash = row["content_hash"]
    session.flush()
