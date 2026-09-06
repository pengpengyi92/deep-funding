"""Run private FastAPI workspace on loopback only."""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import uvicorn

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8793)
    args = parser.parse_args()
    uvicorn.run("backend.app:app", host="127.0.0.1", port=args.port, proxy_headers=False)
