# Frontend integration

The API is versionless for this hackathon; treat OpenAPI schemas as the contract and show transport/empty states directly.

| Screen | Endpoints | UI guidance |
|---|---|---|
| Dashboard | `GET /summary`, `GET /events` | Render server-calculated counts; show the synthetic-data label. |
| Event detail | `GET /events/{id}`, `/assessment` | Show unavailable fields as “not reported,” never zero. |
| Why flagged | `GET /events/{id}/evidence` | Render each evidence item with its baseline and explanation. |
| Event evolution | `GET /events/{id}/changes` | Use “insufficient data” as a valid empty/comparison state. |
| Next Best Observation | `GET /events/{id}/next-observation` | Display information-prioritization disclaimer. |
| AI briefing | `POST /events/{id}/briefing` | Support mock/unavailable statuses and audience selector. |
| Chat | `POST /events/{id}/chat` | Present returned sources; do not imply guarantees. |
| Simulation | `POST /events/{id}/simulate` | Label every result hypothetical; only uncertainty fields are accepted. |

Use loading skeletons for calls, a recoverable error state for 4xx/5xx, and an empty dashboard state when `total_events` is zero. OpenAPI example schemas are generated at `/docs`.
