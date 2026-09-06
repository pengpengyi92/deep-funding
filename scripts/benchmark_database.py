import json
import platform
import statistics
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend import models as m
from backend.database import make_database
from backend.knowledge import load_knowledge
from backend.services.matching import generate_match
from scripts.seed_database import seed


def main():
    records = load_knowledge()
    samples = []
    with tempfile.TemporaryDirectory() as directory:
        url = f"sqlite:///{Path(directory) / 'benchmark.db'}"
        counts = seed(url)
        engine, sessions = make_database(url)
        for index in range(30):
            start = perf_counter()
            with sessions.begin() as session:
                result = generate_match(session, session.get(m.CompanyProfile, "demo-company-1"),
                    session.get(m.FundingProviderProfile, "demo-provider-1"),
                    session.get(m.CompanyFundingNeed, "demo-need-1"), records)
                assert result.evidence_json["decision"] == "requires_review"
                assert result.founder_score is None and result.risk_score is None
            elapsed = (perf_counter() - start) * 1000
            if index >= 5:
                samples.append(elapsed)
        engine.dispose()
    report = {
        "version": "0.3.0", "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": platform.platform(), "python": platform.python_version(),
        "protocol": "5 warmups + 25 transactions on the same fixed synthetic company/provider; SQL reads, retrieval, match + 4 run + audit writes, commit included; no HTTP/browser/network.",
        "baseline": "v0.2 lacks this Python private-profile schema; historical TypeScript engine is unchanged. Timing is not a cross-version speed comparison.",
        "seed_counts": counts, "knowledge_records": len(records), "samples_ms": samples,
        "median_ms": statistics.median(samples), "p95_ms": sorted(samples)[23],
        "runtime_llm_calls": 0, "runtime_llm_tokens": 0,
        "development_tokens": "UNMEASURED", "funding_accuracy": "UNMEASURED", "calibration": "UNMEASURED",
    }
    target = ROOT / "docs/benchmarks/v0.3-database.json"
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "samples_ms"}, indent=2))


if __name__ == "__main__":
    main()
