"""Idempotent synthetic local demo. Never copies public KB into private investor mandates."""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from sqlalchemy import func, select
from backend import models as m
from backend.database import initialize, make_database
from backend.knowledge import load_knowledge, sync_knowledge
from backend.services.matching import generate_match


def seed(url=None):
    engine, sessions = make_database(url)
    initialize(engine)
    records = load_knowledge()
    with sessions.begin() as session:
        sync_knowledge(session, records)
        for i, (industry, stage, revenue) in enumerate([
            ("ai", "pre_seed", None), ("hardware", "seed", 120000), ("consumer", "growth", 5000000)
        ], 1):
            uid, cid = f"demo-user-{i}", f"demo-company-{i}"
            if not session.get(m.User, uid):
                session.add(m.User(id=uid, email=f"founder{i}@example.invalid", name=f"Demo founder {i}", role="founder"))
                session.flush()
                session.add(m.Subscription(user_id=uid))
                session.add(m.FounderProfile(id=f"demo-founder-{i}", user_id=uid, full_name=f"Demo founder {i}",
                    location="Shenzhen", bio="Synthetic example. Not a real person.",
                    technical_background="Example engineering background, unverified."))
            if not session.get(m.CompanyProfile, cid):
                session.add(m.CompanyProfile(id=cid, owner_user_id=uid, company_name=f"Fictional Research Co {i}",
                    company_stage=stage, industry=industry, location="Shenzhen", currency="USD",
                    team_size=3, annual_revenue=revenue, description="Synthetic demo, not a funding applicant.",
                    evidence_json={"review_topics": ["employment", "personal_data"]} if i == 1 else {}))
                session.flush()
                session.add(m.CompanyFundingNeed(id=f"demo-need-{i}", company_id=cid,
                    target_amount=300000 * i, currency="USD", preferred_funding_types=["venture_capital"],
                    use_of_funds="Synthetic engineering and validation budget"))
        session.flush()
        types = ["venture_capital", "bank", "private_equity", "accelerator", "angel",
                 "grant", "corporate_vc", "industrial_fund", "family_office", "venture_debt"]
        for i, kind in enumerate(types, 1):
            pid = f"demo-provider-{i}"
            if not session.get(m.FundingProviderProfile, pid):
                session.add(m.FundingProviderProfile(id=pid, owner_user_id="demo-user-1",
                    name=f"Fictional {kind.replace('_', ' ').title()} {i}", provider_type=kind,
                    description="Synthetic mandate for deterministic tests. No real institution.", currency="USD",
                    ticket_min=100000, ticket_max=1000000, target_stages=["pre_seed", "seed"] if i != 3 else ["growth"],
                    target_industries=["ai", "hardware"], geographies=["Shenzhen"], provides_capital=True))
                session.flush()
                session.add(m.FundingPreference(funding_provider_id=pid,
                    preferred_company_stages=["pre_seed", "seed"] if i != 3 else ["growth"],
                    preferred_industries=["ai", "hardware"], preferred_geographies=["Shenzhen"],
                    minimum_revenue=200000 if kind in ("bank", "private_equity") else None,
                    requires_positive_cash_flow=kind == "bank"))
        session.flush()
        for i in (1, 2, 3):
            exists = session.scalar(select(m.Match).where(m.Match.company_id == "demo-company-1",
                m.Match.funding_provider_id == f"demo-provider-{i}"))
            if exists is None:
                generate_match(session, session.get(m.CompanyProfile, "demo-company-1"),
                    session.get(m.FundingProviderProfile, f"demo-provider-{i}"),
                    session.get(m.CompanyFundingNeed, "demo-need-1"), records)
        session.flush()
        counts = {name: session.scalar(select(func.count()).select_from(model)) for name, model in m.TABLES.items()}
    engine.dispose()
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--database-url")
    args = parser.parse_args()
    print(json.dumps({"synthetic_seed": True, "counts": seed(args.database_url)}, indent=2))
