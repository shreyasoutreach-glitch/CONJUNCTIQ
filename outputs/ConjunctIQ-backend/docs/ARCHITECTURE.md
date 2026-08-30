# Architecture

`services/csv_ingestion.py` is the source adapter; JSON ingestion uses the same `UpdateInput` contract. Pydantic rejects malformed timestamps, negative ranges, unknown fields, and missing required identities. SQLite stores a stable event identity plus many numbered updates.

The engines are pure deterministic functions: `attention` calculates an operational attention score and evidence, `evolution` compares updates, and `observation` ranks the largest information gap. `api/routes.py` composes these engines only; it contains no orbital decision logic. AI and knowledge adapters are optional and cannot alter calculated numbers.

Principles: deterministic systems calculate; AI interprets; evidence supports conclusions; uncertainty is explicit; humans retain operational responsibility.
