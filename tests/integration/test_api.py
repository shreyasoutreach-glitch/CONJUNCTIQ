"""Integration tests — runs against TestClient (isolated in-memory SQLite, seeded each test)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, get_db
from app.services.csv_ingestion import read_csv
from app.services.events import ingest

# Use a separate in-memory database for tests so the real conjunctiq.db is never touched.
_TEST_DB_URL = "sqlite:///./test_conjunctiq.db"
_test_engine = create_engine(_TEST_DB_URL, connect_args={"check_same_thread": False})
_TestingSessionLocal = sessionmaker(bind=_test_engine, autoflush=False, autocommit=False)


def _override_get_db():
    db = _TestingSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)

FULL_UPDATE = {
    "event_id": "TEST-001",
    "primary_object_id": "SAT-A",
    "secondary_object_id": "DEB-B",
    "timestamp": "2030-01-01T00:00:00Z",
    "time_of_closest_approach": "2030-01-02T12:00:00Z",
    "update_number": 1,
    "miss_distance_km": 1.5,
    "collision_probability": 0.002,
    "relative_velocity_km_s": 9.0,
    "radial_uncertainty_km": 2.0,
    "along_track_uncertainty_km": 3.0,
    "cross_track_uncertainty_km": 1.5,
    "data_source": "TEST",
    "object_metadata": {},
}


@pytest.fixture(autouse=True)
def fresh_db():
    """Rebuild schema on isolated test DB before every test; never touches conjunctiq.db."""
    Base.metadata.drop_all(bind=_test_engine)
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


def seed_demo():
    with _TestingSessionLocal() as db:
        try:
            ingest(db, read_csv("data/sample/synthetic_conjunctions.csv"))
        except ValueError:
            pass  # Already seeded


# ── health & validation ─────────────────────────────────────────────────────

def test_health_and_validation():
    assert client.get("/api/health").status_code == 200
    assert client.post("/api/ingest", json={"updates": [{"event_id": "bad"}]}).status_code == 422


def test_health_response_contains_service_name():
    r = client.get("/api/health").json()
    assert r["status"] == "ok"
    assert "ConjunctIQ" in r["service"]


# ── ingest ──────────────────────────────────────────────────────────────────

def test_ingest_success():
    r = client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    assert r.status_code == 201
    assert r.json()["ingested"] == 1


def test_ingest_duplicate_rejected():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    assert r.status_code == 409


def test_ingest_empty_list_rejected():
    r = client.post("/api/ingest", json={"updates": []})
    assert r.status_code == 422


# ── events & assessment ─────────────────────────────────────────────────────

def test_events_list_returns_correct_shape():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.get("/api/events")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert "event" in items[0] and "assessment" in items[0]
    a = items[0]["assessment"]
    assert {"score", "classification", "disclaimer", "factors"} <= set(a.keys())


def test_events_list_score_matches_detail_assessment():
    """Bug fix: /events list must include escalation bonus — score must match /assessment."""
    seed_demo()
    items = client.get("/api/events").json()
    mismatches = []
    for item in items:
        eid = item["event"]["event_id"]
        list_score = item["assessment"]["score"]
        detail_score = client.get(f"/api/events/{eid}/assessment").json()["score"]
        if list_score != detail_score:
            mismatches.append(f"{eid}: list={list_score} detail={detail_score}")
    assert not mismatches, f"Score mismatches between /events and /assessment: {mismatches}"


def test_unknown_event_returns_404():
    assert client.get("/api/events/DOES-NOT-EXIST").status_code == 404
    assert client.get("/api/events/DOES-NOT-EXIST/assessment").status_code == 404


def test_assessment_structure():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.get("/api/events/TEST-001/assessment").json()
    assert r["score"] >= 0
    assert r["classification"] in ("LOW", "MONITOR", "HIGH ATTENTION", "CRITICAL ATTENTION")
    assert isinstance(r["factors"], list)


def test_evidence_structure():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    ev = client.get("/api/events/TEST-001/evidence").json()
    assert isinstance(ev, list)
    assert all("factor" in e and "explanation" in e for e in ev)


# ── changes / evolution ─────────────────────────────────────────────────────

def test_changes_no_previous():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    ch = client.get("/api/events/TEST-001/changes").json()
    assert ch["status"] == "insufficient data"


def test_changes_with_two_updates_shows_escalation():
    # First update: good numbers
    u1 = {**FULL_UPDATE, "update_number": 1, "miss_distance_km": 20.0, "collision_probability": 1e-5}
    # Second update: bad numbers
    u2 = {**FULL_UPDATE, "update_number": 2, "miss_distance_km": 1.5, "collision_probability": 0.002}
    client.post("/api/ingest", json={"updates": [u1, u2]})
    ch = client.get("/api/events/TEST-001/changes").json()
    assert ch["status"] == "escalating"
    assert any(c["field"] == "miss_distance_km" for c in ch["changes"])


# ── simulate ────────────────────────────────────────────────────────────────

def test_simulate_returns_before_after():
    """Bug fix: before/after must be fully serialized dicts, not Pydantic repr strings."""
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/simulate", json={}).json()
    assert r["simulation"] is True
    assert isinstance(r["before"], dict), "before should be a dict, not a Pydantic object repr"
    assert isinstance(r["after"], dict), "after should be a dict, not a Pydantic object repr"
    assert "score" in r["before"] and "score" in r["after"]


def test_simulate_with_overrides_changes_after():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    # Raise uncertainty massively — should increase score
    before_score = client.get("/api/events/TEST-001/assessment").json()["score"]
    r = client.post("/api/events/TEST-001/simulate", json={"radial_uncertainty_km": 50.0}).json()
    assert r["after"]["score"] >= before_score


def test_simulate_records_changed_factors():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/simulate", json={"radial_uncertainty_km": 20.0}).json()
    assert "radial_uncertainty_km" in r["changed_factors"]


# ── next-observation ────────────────────────────────────────────────────────

def test_next_observation_structure():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    obs = client.get("/api/events/TEST-001/next-observation").json()
    assert {"priority", "information_gap", "suggestion", "disclaimer"} <= set(obs.keys())


# ── briefing & chat ─────────────────────────────────────────────────────────

def test_briefing_mock():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/briefing", json={"audience": "operator"}).json()
    assert r["status"] == "mock"
    assert "observed_facts" in r


def test_briefing_invalid_audience():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/briefing", json={"audience": "unknown_role"})
    assert r.status_code == 422


def test_chat_returns_answer():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/chat", json={"question": "What is TCA?"}).json()
    assert "question" in r and "answer" in r
    assert r["question"] == "What is TCA?"


def test_chat_empty_question_rejected():
    client.post("/api/ingest", json={"updates": [FULL_UPDATE]})
    r = client.post("/api/events/TEST-001/chat", json={"question": ""})
    assert r.status_code == 422


# ── summary ─────────────────────────────────────────────────────────────────

def test_summary_structure():
    seed_demo()
    r = client.get("/api/summary").json()
    assert "total_events" in r
    assert "critical_events" in r
    assert "escalating_events" in r
    assert r["total_events"] >= 1


# ── knowledge ───────────────────────────────────────────────────────────────

def test_knowledge_returns_documents():
    r = client.get("/api/knowledge").json()
    assert isinstance(r, list)
    assert len(r) >= 1
    assert all("title" in d and "content" in d for d in r)
