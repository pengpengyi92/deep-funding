"""A real Uvicorn process stop/start, not just rebuilding an in-memory TestClient."""
import os
import socket
import subprocess
import sys
import time

import httpx

from backend.database import ROOT


def test_real_server_restart(tmp_path):
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = {**os.environ, "DEEP_FUNDING_DATABASE_URL": f"sqlite:///{tmp_path / 'restart.db'}"}
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    processes = []

    def start():
        process = subprocess.Popen([sys.executable, "scripts/serve_database.py", "--port", str(port)],
            cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
        processes.append(process)
        for _ in range(100):
            if process.poll() is not None:
                raise AssertionError("Local backend exited before health check")
            try:
                if httpx.get(f"http://127.0.0.1:{port}/api/health", trust_env=False).status_code == 200:
                    return process
            except httpx.HTTPError:
                pass
            time.sleep(0.1)
        raise AssertionError("Server did not start")

    try:
        process = start()
        with httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False,
                          headers={"X-Deep-Funding-Local": "1"}) as client:
            user = client.post("/api/users", json={"name": "Restart fixture", "email": "restart@example.invalid"}).json()
            company = client.post("/api/companies", json={"owner_user_id": user["id"], "company_name": "Saved across process restart",
                "company_stage": "pre_seed", "industry": "ai", "location": "Shenzhen"}).json()
            provider = client.post("/api/funding-providers", json={"owner_user_id": user["id"],
                "name": "Synthetic restart provider", "provider_type": "angel"}).json()
            match = client.post("/api/matches/generate", json={"company_id": company["id"], "funding_provider_id": provider["id"]}).json()
        process.terminate()
        process.wait(timeout=10)
        start()
        with httpx.Client(base_url=f"http://127.0.0.1:{port}", trust_env=False) as client:
            assert client.get(f"/api/companies/{company['id']}").json()["company_name"] == "Saved across process restart"
            assert client.get(f"/api/matches/{match['id']}").json()["id"] == match["id"]
            assert len(client.get("/api/agent-runs").json()) == 4
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=10)
