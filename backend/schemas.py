from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, create_model, field_validator, model_validator

Text = Annotated[str, Field(max_length=20000)]
Name = Annotated[str, Field(min_length=1, max_length=200)]
Nonnegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]
Count = Annotated[int, Field(ge=0)]
Currency = Annotated[str, Field(pattern=r"^[A-Z]{3}$")]
Stage = Literal["idea", "pre_seed", "seed", "series_a", "series_b", "growth", "mature", "pre_ipo", "public"]
ProviderType = Literal[
    "angel", "incubator", "accelerator", "pre_seed_vc", "seed_vc", "venture_capital", "growth_vc",
    "private_equity", "growth_equity", "bank", "venture_debt", "industrial_fund", "government_fund",
    "strategic_investor", "corporate_vc", "family_office", "grant", "university_fund", "other",
]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


class UserInput(Input):
    email: Annotated[str, Field(pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", max_length=254)]
    name: Name
    role: Literal["founder", "company_member", "funding_provider", "admin"] = "founder"


class FounderInput(Input):
    user_id: Name
    full_name: Name
    location: Name | None = None
    bio: Text | None = None
    education: Text | None = None
    work_experience: Text | None = None
    technical_background: Text | None = None
    industry_experience: Text | None = None
    previous_startups: Text | None = None
    previous_exits: Text | None = None
    linkedin_url: Text | None = None
    github_url: Text | None = None
    website_url: Text | None = None
    custom_fields_json: dict = Field(default_factory=dict)


class CompanyInput(Input):
    owner_user_id: Name
    company_name: Name
    legal_name: Name | None = None
    company_stage: Stage
    industry: Name
    sub_industry: Name | None = None
    location: Name
    founded_at: datetime | None = None
    team_size: Count | None = None
    description: Text | None = None
    problem: Text | None = None
    solution: Text | None = None
    product_status: Name | None = None
    website_url: Text | None = None
    demo_url: Text | None = None
    github_url: Text | None = None
    pitch_deck_url: Text | None = None
    currency: Currency = "USD"
    revenue: Nonnegative | None = None
    monthly_revenue: Nonnegative | None = None
    annual_revenue: Nonnegative | None = None
    growth_rate: Annotated[float, Field(ge=-1)] | None = None
    customer_count: Count | None = None
    design_partner_count: Count | None = None
    cash_balance: Nonnegative | None = None
    burn_rate: Nonnegative | None = None
    runway_months: Nonnegative | None = None
    funding_raised: Nonnegative | None = None
    latest_round: Name | None = None
    valuation: Nonnegative | None = None
    evidence_json: dict = Field(default_factory=dict)

    @field_validator("founded_at")
    @classmethod
    def not_future(cls, value):
        if value and value.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            raise ValueError("founded_at must not be in the future")
        return value

    @field_validator("evidence_json")
    @classmethod
    def review_evidence(cls, value):
        topics = value.get("review_topics", [])
        if not isinstance(topics, list) or any(not isinstance(item, str) for item in topics):
            raise ValueError("review_topics must be a list of strings")
        for key in ("profitability", "positive_cash_flow", "collateral", "audited_financials"):
            if value.get(key) is not None and not isinstance(value[key], bool):
                raise ValueError(f"{key} must be boolean or null")
        return value


class FundingNeedInput(Input):
    company_id: Name
    target_amount: Annotated[float, Field(gt=0)]
    currency: Currency = "USD"
    preferred_funding_types: list[ProviderType] = Field(default_factory=list, max_length=20)
    use_of_funds: Text | None = None
    target_timeline: Name | None = None
    equity_or_debt: Literal["equity", "debt", "grant", "resources", "mixed"] = "equity"
    preferred_geography: list[Name] = Field(default_factory=list, max_length=50)
    notes: Text | None = None


class ProviderInput(Input):
    owner_user_id: Name
    name: Name
    provider_type: ProviderType
    categories: list[ProviderType] = Field(default_factory=list, max_length=20)
    description: Text | None = None
    headquarters: Name | None = None
    geographies: list[Name] = Field(default_factory=list, max_length=50)
    website_url: Text | None = None
    application_url: Text | None = None
    aum: Nonnegative | None = None
    fund_size: Nonnegative | None = None
    ticket_min: Nonnegative | None = None
    ticket_max: Nonnegative | None = None
    currency: Currency = "USD"
    target_stages: list[Stage] = Field(default_factory=list)
    target_industries: list[Name] = Field(default_factory=list, max_length=50)
    provides_capital: bool | None = None
    provides_mentorship: bool | None = None
    provides_compute: bool | None = None
    provides_office: bool | None = None
    provides_customer_introduction: bool | None = None
    provides_investor_network: bool | None = None
    provides_government_resources: bool | None = None

    @model_validator(mode="after")
    def ticket_range(self):
        if self.ticket_min is not None and self.ticket_max is not None and self.ticket_min > self.ticket_max:
            raise ValueError("ticket_min must not exceed ticket_max")
        return self


class PreferenceInput(Input):
    funding_provider_id: Name
    preferred_company_stages: list[Stage] = Field(default_factory=list)
    preferred_industries: list[Name] = Field(default_factory=list)
    preferred_geographies: list[Name] = Field(default_factory=list)
    minimum_revenue: Nonnegative | None = None
    minimum_growth_rate: float | None = None
    minimum_customer_count: Count | None = None
    minimum_company_age: Nonnegative | None = None
    maximum_company_age: Nonnegative | None = None
    requires_profitability: bool | None = None
    requires_positive_cash_flow: bool | None = None
    requires_collateral: bool | None = None
    requires_audited_financials: bool | None = None
    founder_weight: Nonnegative = 1
    team_weight: Nonnegative = 1
    market_weight: Nonnegative = 1
    product_weight: Nonnegative = 1
    traction_weight: Nonnegative = 1
    financial_weight: Nonnegative = 1
    risk_weight: Nonnegative = 1
    hard_constraints_json: dict = Field(default_factory=dict)
    soft_preferences_json: dict = Field(default_factory=dict)
    red_flags_json: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def age_range(self):
        if self.minimum_company_age is not None and self.maximum_company_age is not None:
            if self.minimum_company_age > self.maximum_company_age:
                raise ValueError("minimum_company_age must not exceed maximum_company_age")
        return self


class GenerateInput(Input):
    company_id: Name
    funding_provider_id: Name


class MatchStatusInput(Input):
    status: Literal["generated", "shortlisted", "contacted", "meeting", "due_diligence",
                    "negotiation", "funded", "rejected", "archived"]
    note: Annotated[str, Field(min_length=1, max_length=2000)]


def patch_schema(schema):
    # Partial payload only; API revalidates the complete merged record before saving.
    return create_model(schema.__name__ + "Patch", __config__=Input.model_config, **{
        name: (field.annotation | None, None) for name, field in schema.model_fields.items()
    })


FounderPatch = patch_schema(FounderInput)
CompanyPatch = patch_schema(CompanyInput)
ProviderPatch = patch_schema(ProviderInput)
PreferencePatch = patch_schema(PreferenceInput)
