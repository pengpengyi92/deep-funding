"""Generate the ONLY public knowledge export from the two checked-in graph trees."""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend.knowledge import load_knowledge


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    records = load_knowledge()
    target = ROOT / "data" / "knowledge-public.json"
    data = json.dumps({"version": "0.3.0", "records": records}, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not target.is_file() or target.read_text(encoding="utf-8") != data:
            raise SystemExit("Public knowledge index is stale. Run python scripts/build_knowledge.py")
    else:
        target.write_text(data, encoding="utf-8")
    print(json.dumps({"records": len(records), "funding_entities": sum(
        r["kind"] == "funding" and r["record_type"] == "entity" for r in records)}, indent=2))


if __name__ == "__main__":
    main()
