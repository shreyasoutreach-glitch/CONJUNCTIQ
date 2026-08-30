"""Load the clearly labelled synthetic demo data."""
from pathlib import Path
import sys

# Permit `python scripts/seed.py` from a fresh clone.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.db.session import Base, engine, SessionLocal
from app.services.csv_ingestion import read_csv
from app.services.events import ingest
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    try: print(f"Seeded {ingest(db, read_csv(str(Path('data/sample/synthetic_conjunctions.csv'))))} updates.")
    except ValueError as exc: print(f"No changes: {exc}")
