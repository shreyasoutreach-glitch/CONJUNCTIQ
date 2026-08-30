# AI architecture

The LLM provider interface accepts only structured event facts, assessment, evidence, change report, observation recommendation, and retrieved trusted corpus entries. `MockProvider` is deterministic for local development. Unknown providers deliberately degrade to an `unavailable` response rather than failing dashboard work.

The current corpus is a small trusted lexical retrieval prototype. It is intentionally not a source of telemetry; event numbers remain structured database facts. A production watsonx/Granite provider may replace the adapter without changing API routes or engines. Briefings explicitly separate observed facts, calculated assessment, interpretation, and uncertainty.
