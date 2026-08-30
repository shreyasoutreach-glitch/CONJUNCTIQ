"""Quick smoke-test of every API route using TestClient."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, get_db
from app.services.csv_ingestion import read_csv
from app.services.events import ingest

DB_URL = "sqlite:///./smoke_check.db"
_e = create_engine(DB_URL, connect_args={"check_same_thread": False})
_S = sessionmaker(bind=_e, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=_e)
with _S() as db:
    try:
        ingest(db, read_csv("data/sample/synthetic_conjunctions.csv"))
    except ValueError:
        pass

def override():
    db = _S()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override
client = TestClient(app)

checks = []
def chk(label, r, code=200, json=True):
    ok = r.status_code == code
    checks.append((label, ok, r.status_code))
    status = "PASS" if ok else "FAIL"
    print(f"  {status}  {label}  [{r.status_code}]")
    if ok and json:
        try:
            return r.json()
        except Exception:
            return {}
    return {}

print("\n=== ConjunctIQ Smoke Test ===\n")

chk("GET /", client.get("/"), json=False)
chk("GET /api/health", client.get("/api/health"))
chk("GET /api/status", client.get("/api/status"))
chk("GET /api/summary", client.get("/api/summary"))
chk("GET /api/knowledge", client.get("/api/knowledge"))

events = client.get("/api/events").json()
chk("GET /api/events", client.get("/api/events"))
print(f"        Events loaded: {len(events)}")

if events:
    eid = events[0]["event"]["event_id"]
    score = chk(f"GET /api/events/{eid}/assessment", client.get(f"/api/events/{eid}/assessment")).get("score")
    print(f"        Score: {score}")
    chk(f"GET /api/events/{eid}/evidence", client.get(f"/api/events/{eid}/evidence"))
    changes = chk(f"GET /api/events/{eid}/changes", client.get(f"/api/events/{eid}/changes"))
    print(f"        Changes status: {changes.get('status')}")
    chk(f"GET /api/events/{eid}/next-observation", client.get(f"/api/events/{eid}/next-observation"))
    briefing = chk(f"POST /api/events/{eid}/briefing", client.post(f"/api/events/{eid}/briefing", json={"audience": "operator"}))
    print(f"        Briefing status: {briefing.get('status')}")
    chat = chk(f"POST /api/events/{eid}/chat (hello)", client.post(f"/api/events/{eid}/chat", json={"question": "hello"}))
    answer = chat.get("answer", "")
    if isinstance(answer, dict):
        answer = answer.get("answer", "")
    print(f"        Chat answer: {str(answer)[:70]}")
    sim = chk(f"POST /api/events/{eid}/simulate", client.post(f"/api/events/{eid}/simulate", json={}))
    print(f"        Sim before={sim.get('before',{}).get('score')} after={sim.get('after',{}).get('score')}")

# 404 check
r = client.get("/api/events/DOES-NOT-EXIST")
chk("GET /api/events/DOES-NOT-EXIST (expect 404)", r, 404)

# Bad ingest
r = client.post("/api/ingest", json={"updates": []})
chk("POST /api/ingest empty (expect 422)", r, 422)

# NASA approaches (may return 0 rows if offline — that's OK)
r = client.get("/api/nasa/approaches")
chk("GET /api/nasa/approaches", r)

print()
failed = [l for l, ok, _ in checks if not ok]
if failed:
    print(f"FAILED: {len(failed)} checks")
    for f in failed:
        print(f"  - {f}")
    sys.exit(1)
else:
    print(f"ALL {len(checks)} SMOKE CHECKS PASSED")

os.unlink("smoke_check.db")
