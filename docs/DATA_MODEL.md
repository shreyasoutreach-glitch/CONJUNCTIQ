# Data model

`conjunction_events` stores the stable event and object identifiers. `event_updates` holds ordered estimates with nullable telemetry and a uniqueness constraint on `(event_id, update_number)`. `simulation_runs` retains clearly-labelled hypothetical inputs/results. `knowledge_documents` is reserved for a persistent trusted corpus.

Nullable telemetry represents missing information; it is never invented or converted to zero. `object_metadata` stores source-specific metadata without destabilizing the core contract.
