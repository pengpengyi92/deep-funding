from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Record:
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class User(Record, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(40), default="founder")


class FounderProfile(Record, Base):
    __tablename__ = "founders"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    full_name: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    education: Mapped[str | None] = mapped_column(Text)
    work_experience: Mapped[str | None] = mapped_column(Text)
    technical_background: Mapped[str | None] = mapped_column(Text)
    industry_experience: Mapped[str | None] = mapped_column(Text)
    previous_startups: Mapped[str | None] = mapped_column(Text)
    previous_exits: Mapped[str | None] = mapped_column(Text)
    linkedin_url: Mapped[str | None] = mapped_column(String(2000))
    github_url: Mapped[str | None] = mapped_column(String(2000))
    website_url: Mapped[str | None] = mapped_column(String(2000))
    custom_fields_json: Mapped[dict] = mapped_column(JSON, default=dict)


class CompanyProfile(Record, Base):
    __tablename__ = "companies"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    company_name: Mapped[str] = mapped_column(String(200), index=True)
    legal_name: Mapped[str | None] = mapped_column(String(200))
    company_stage: Mapped[str] = mapped_column(String(40), index=True)
    industry: Mapped[str] = mapped_column(String(100), index=True)
    sub_industry: Mapped[str | None] = mapped_column(String(100))
    location: Mapped[str] = mapped_column(String(200))
    founded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    team_size: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    problem: Mapped[str | None] = mapped_column(Text)
    solution: Mapped[str | None] = mapped_column(Text)
    product_status: Mapped[str | None] = mapped_column(String(100))
    website_url: Mapped[str | None] = mapped_column(String(2000))
    demo_url: Mapped[str | None] = mapped_column(String(2000))
    github_url: Mapped[str | None] = mapped_column(String(2000))
    pitch_deck_url: Mapped[str | None] = mapped_column(String(2000))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    revenue: Mapped[float | None] = mapped_column(Float)
    monthly_revenue: Mapped[float | None] = mapped_column(Float)
    annual_revenue: Mapped[float | None] = mapped_column(Float)
    growth_rate: Mapped[float | None] = mapped_column(Float)
    customer_count: Mapped[int | None] = mapped_column(Integer)
    design_partner_count: Mapped[int | None] = mapped_column(Integer)
    cash_balance: Mapped[float | None] = mapped_column(Float)
    burn_rate: Mapped[float | None] = mapped_column(Float)
    runway_months: Mapped[float | None] = mapped_column(Float)
    funding_raised: Mapped[float | None] = mapped_column(Float)
    latest_round: Mapped[str | None] = mapped_column(String(100))
    valuation: Mapped[float | None] = mapped_column(Float)
    # Explicit inputs, never inferred from another company's compliance case.
    evidence_json: Mapped[dict] = mapped_column(JSON, default=dict)


class CompanyFundingNeed(Record, Base):
    __tablename__ = "funding_needs"
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), index=True)
    target_amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    preferred_funding_types: Mapped[list] = mapped_column(JSON, default=list)
    use_of_funds: Mapped[str | None] = mapped_column(Text)
    target_timeline: Mapped[str | None] = mapped_column(String(200))
    equity_or_debt: Mapped[str] = mapped_column(String(30), default="equity")
    preferred_geography: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text)


class FundingProviderProfile(Record, Base):
    __tablename__ = "funding_providers"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    provider_type: Mapped[str] = mapped_column(String(50), index=True)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str | None] = mapped_column(Text)
    headquarters: Mapped[str | None] = mapped_column(String(200))
    geographies: Mapped[list] = mapped_column(JSON, default=list)
    website_url: Mapped[str | None] = mapped_column(String(2000))
    application_url: Mapped[str | None] = mapped_column(String(2000))
    aum: Mapped[float | None] = mapped_column(Float)
    fund_size: Mapped[float | None] = mapped_column(Float)
    ticket_min: Mapped[float | None] = mapped_column(Float)
    ticket_max: Mapped[float | None] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    target_stages: Mapped[list] = mapped_column(JSON, default=list)
    target_industries: Mapped[list] = mapped_column(JSON, default=list)
    provides_capital: Mapped[bool | None] = mapped_column(Boolean)
    provides_mentorship: Mapped[bool | None] = mapped_column(Boolean)
    provides_compute: Mapped[bool | None] = mapped_column(Boolean)
    provides_office: Mapped[bool | None] = mapped_column(Boolean)
    provides_customer_introduction: Mapped[bool | None] = mapped_column(Boolean)
    provides_investor_network: Mapped[bool | None] = mapped_column(Boolean)
    provides_government_resources: Mapped[bool | None] = mapped_column(Boolean)


class FundingPreference(Record, Base):
    __tablename__ = "funding_preferences"
    funding_provider_id: Mapped[str] = mapped_column(ForeignKey("funding_providers.id"), unique=True)
    preferred_company_stages: Mapped[list] = mapped_column(JSON, default=list)
    preferred_industries: Mapped[list] = mapped_column(JSON, default=list)
    preferred_geographies: Mapped[list] = mapped_column(JSON, default=list)
    minimum_revenue: Mapped[float | None] = mapped_column(Float)
    minimum_growth_rate: Mapped[float | None] = mapped_column(Float)
    minimum_customer_count: Mapped[int | None] = mapped_column(Integer)
    minimum_company_age: Mapped[float | None] = mapped_column(Float)
    maximum_company_age: Mapped[float | None] = mapped_column(Float)
    requires_profitability: Mapped[bool | None] = mapped_column(Boolean)
    requires_positive_cash_flow: Mapped[bool | None] = mapped_column(Boolean)
    requires_collateral: Mapped[bool | None] = mapped_column(Boolean)
    requires_audited_financials: Mapped[bool | None] = mapped_column(Boolean)
    founder_weight: Mapped[float] = mapped_column(Float, default=1)
    team_weight: Mapped[float] = mapped_column(Float, default=1)
    market_weight: Mapped[float] = mapped_column(Float, default=1)
    product_weight: Mapped[float] = mapped_column(Float, default=1)
    traction_weight: Mapped[float] = mapped_column(Float, default=1)
    financial_weight: Mapped[float] = mapped_column(Float, default=1)
    risk_weight: Mapped[float] = mapped_column(Float, default=1)
    hard_constraints_json: Mapped[dict] = mapped_column(JSON, default=dict)
    soft_preferences_json: Mapped[dict] = mapped_column(JSON, default=dict)
    red_flags_json: Mapped[dict] = mapped_column(JSON, default=dict)


class Match(Record, Base):
    __tablename__ = "matches"
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"), index=True)
    funding_provider_id: Mapped[str] = mapped_column(ForeignKey("funding_providers.id"), index=True)
    overall_score: Mapped[float | None] = mapped_column(Float)
    stage_score: Mapped[float | None] = mapped_column(Float)
    industry_score: Mapped[float | None] = mapped_column(Float)
    geography_score: Mapped[float | None] = mapped_column(Float)
    founder_score: Mapped[float | None] = mapped_column(Float)
    team_score: Mapped[float | None] = mapped_column(Float)
    traction_score: Mapped[float | None] = mapped_column(Float)
    financial_score: Mapped[float | None] = mapped_column(Float)
    risk_score: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(40), default="generated")
    match_reason: Mapped[str] = mapped_column(Text)
    risks: Mapped[list] = mapped_column(JSON, default=list)
    missing_information: Mapped[list] = mapped_column(JSON, default=list)
    evidence_json: Mapped[dict] = mapped_column(JSON, default=dict)


class AgentRun(Record, Base):
    __tablename__ = "agent_runs"
    agent_name: Mapped[str] = mapped_column(String(100))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id"))
    funding_provider_id: Mapped[str | None] = mapped_column(ForeignKey("funding_providers.id"))
    input_json: Mapped[dict] = mapped_column(JSON)
    output_json: Mapped[dict] = mapped_column(JSON)
    model: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(40))
    latency_ms: Mapped[float] = mapped_column(Float)


class AuditRecord(Record, Base):
    __tablename__ = "audit_records"
    entity_type: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    audit_type: Mapped[str] = mapped_column(String(60))
    severity: Mapped[str] = mapped_column(String(40))
    finding: Mapped[str] = mapped_column(Text)
    evidence: Mapped[dict] = mapped_column(JSON)
    recommendation: Mapped[str] = mapped_column(Text)


class Subscription(Record, Base):
    __tablename__ = "subscriptions"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    plan: Mapped[str] = mapped_column(String(40), default="free")
    status: Mapped[str] = mapped_column(String(40), default="active")
    monthly_agent_calls: Mapped[int] = mapped_column(Integer, default=0)
    monthly_data_access: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class KnowledgeEntity(Record, Base):
    __tablename__ = "knowledge_entities"
    slug: Mapped[str] = mapped_column(String(250), unique=True)
    name: Mapped[str] = mapped_column(String(250))
    entity_type: Mapped[list] = mapped_column(JSON)
    verification_status: Mapped[str] = mapped_column(String(60))
    metadata_json: Mapped[dict] = mapped_column(JSON)
    markdown: Mapped[str] = mapped_column(Text)
    source_urls: Mapped[list] = mapped_column(JSON)
    content_hash: Mapped[str] = mapped_column(String(64))


class ComplianceCase(Record, Base):
    __tablename__ = "compliance_cases"
    case_id: Mapped[str] = mapped_column(String(250), unique=True)
    company: Mapped[str] = mapped_column(String(250))
    category: Mapped[list] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(60))
    evidence_level: Mapped[str] = mapped_column(String(60))
    metadata_json: Mapped[dict] = mapped_column(JSON)
    markdown: Mapped[str] = mapped_column(Text)
    source_urls: Mapped[list] = mapped_column(JSON)
    content_hash: Mapped[str] = mapped_column(String(64))


TABLES = {model.__tablename__: model for model in (
    User, FounderProfile, CompanyProfile, CompanyFundingNeed, FundingProviderProfile,
    FundingPreference, Match, AgentRun, AuditRecord, Subscription, KnowledgeEntity, ComplianceCase,
)}
