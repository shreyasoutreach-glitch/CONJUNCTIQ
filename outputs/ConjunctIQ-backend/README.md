# ConjunctIQ

**From orbital alerts to operational clarity.** ConjunctIQ is a hackathon decision-support backend for interpreting conjunction updates. It ingests structured event updates, produces transparent operational-attention assessments, highlights evidence and change, identifies information gaps, and offers a hypothetical uncertainty simulation. It never commands spacecraft, recommends maneuvers, or guarantees collision probability.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for OpenAPI. The database is SQLite (`conjunctiq.db`). Set variables from `.env.example`; default `CONJUNCTIQ_LLM_PROVIDER=mock` requires no key. Any other provider returns an AI-unavailable response while deterministic endpoints continue working.

## Architecture and demo flow

CSV/JSON ingestion → Pydantic validation → SQLite → deterministic attention/evidence/evolution/observation engines → REST API → optional grounded AI adapter. Run the seed script, call `GET /api/summary`, inspect `DEMO-003` at `/api/events/DEMO-003/changes`, then post an uncertainty scenario to `/api/events/DEMO-003/simulate`.

All rows in `data/sample/` are **Synthetic demonstration data**, not NASA/ESA data. Thresholds live in `app/engines/attention.py` and are intentionally simple and inspectable.

## API

`GET /api/health`, `/events`, `/events/{id}`, `/assessment`, `/evidence`, `/changes`, `/next-observation`, `/summary`, `/knowledge`; `POST /api/ingest`, `/events/{id}/simulate`, `/briefing`, `/chat`.

See `docs/` for architecture, AI grounding, limitations, data model, and frontend integration.

## IBM Bob handoff

Build a presentation-only frontend against the OpenAPI contract. Do not duplicate business logic client-side; use `summary` for dashboard counts and event-specific endpoints for detail tabs. Display the API disclaimers prominently.
