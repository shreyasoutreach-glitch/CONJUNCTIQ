# ConjunctIQ

**From orbital alerts to operational clarity.** ConjunctIQ is a decision-support platform designed to transform raw orbital conjunction data into clear, actionable operational intelligence. It integrates deterministic orbital physics analysis, space economics modeling, and an intelligent autonomous assistant to help satellite operators triage and manage orbital close approaches (conjunctions).

---

## Features & Architecture


---

## ?? Cloud Deployment Status

**Notice:** The live Vercel deployment is currently running in a **fully degraded Mock/Demo mode**. 

During the final configuration phase, we were unable to retrieve the required IBM Cloud / Watsonx ID credentials (due to identity verification / credit card requirements). Without these credentials, the production Python backend could not be securely hosted. 

To ensure the frontend UI remains fully accessible for portfolio and judging purposes, the React client has been configured to intercept failed backend calls and inject deterministic demo data. The UI, visualizations, and charts are fully functional, but the underlying data is simulated.


### 1. Command Center & Telemetry Integration
- **Real-time Event Ingestion:** Processes simulated CSV/JSON data into a highly structured SQLite backend via Pydantic validation.
- **Dynamic 3D Visualization:** Includes an interactive WebGL Orbital Scene integrated into a premium, minimalist Apple-inspired aerospace interface.
- **Immutable Data Integrity:** Never hallucinates external telemetry. Fallback mechanisms explicitly surface "Synthetic / Demo Data" or "Unavailable" statuses if upstream providers (e.g., NASA JPL CNEOS) are uncontactable.

### 2. Operational-Attention Engine
- **Deterministic Assessment:** Generates an attention score (0-100) based on miss distance, collision probability, relative velocity, and orbital uncertainty.
- **Evidence & Changes Analysis:** Surfaces critical escalations and changes in trajectory data across multiple updates.
- **Simulation Environment:** Allows operators to input hypothetical parameters (e.g., reduced uncertainty or manipulated collision probabilities) to recalculate risk scores without affecting production databases.

### 3. Space Economics Intelligence
- **Live Asset Exposure Modeling:** Operators can calculate the financial exposure of satellite downtime versus the propellant costs of performing a collision avoidance maneuver (CAM).
- **Cost-Benefit Matrices:** Synthesizes constellation downtime, revenue per day, and capex replacement costs to suggest financially optimal mitigation strategies.

### 4. Persistent Autonomous AI (Command & Research)
- **Universal Context Awareness:** The Persistent AI panel follows the user across the application, maintaining state through React rendering boundaries without dropping context.
- **Grounded Research Integration:** Equipped with tool-use capability (JPL Horizons, SIMBAD, NASA ADS, Orbital Simulations) to answer deep domain-specific queries.
- **Robust Mock Fallbacks:** Built-in deterministic mock routing ensures the AI degrades gracefully and provides high-quality predefined insights when offline or uncredentialed.

---

## Engineering Iterations & Bug Remediation

During the final stabilization phase of the Hackathon, several critical integration bugs were diagnosed and resolved to ensure enterprise-grade reliability:

### 1. `TypeError: tools.map is not a function` (API Shape Normalization)
**Issue:** The React frontend experienced fatal crashes when attempting to render the Astronomy Research capabilities. The client blindly assumed the `GET /api/research/tools` payload was an array, while the FastAPI backend correctly wrapped it in a JSON object (`{"tools": [...]}`).
**Resolution:** The response parsing in `ResearchDashboard.tsx` was rewritten to safely unwrap the object (`t.tools || t`). We eliminated scattered `.map()` defensive hacks in favor of a single normalized API boundary and injected robust TypeScript interfaces (`ToolInfo[]`).

### 2. Global React Tree Unmounting (The "Black Screen" Bug)
**Issue:** Deeply nested undefined properties inside complex backend responses (e.g., `assessment.classification`) caused silent runtime exceptions that unmounted the entire React root, resulting in a blank black screen.
**Resolution:** 
- Implemented a global `ErrorBoundary` wrapper around the core workstation to trap isolated component failures and render an elegant Apple-styled fallback UI, preserving the surrounding navigation and AI state.
- Audited all mapping functions across `EventDashboard` and `PersistentAIPanel` to enforce strict Optional Chaining (`?.`) and fallback default arrays (`[]`), guaranteeing zero unhandled exceptions even if the backend returns malformed entities.

### 3. Asynchronous Data Race in Persistent AI
**Issue:** Submitting concurrent questions to the `PersistentAIPanel` or navigating views mid-stream caused context duplication and dropped tool-call payloads.
**Resolution:** Hardened the conversational state (`researchMsgs`, `eventMsgs`) by moving state management outside the dynamic view router and into the persistent app layout. Applied functional state updates (`setResearchMsgs(prev => [...prev])`) to guarantee chronological message integrity. The AI engine was also patched to reliably fall back to `"No response."` rather than crashing if `result.answer` is undefined.

---

## Run Locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --port 8001 --host 127.0.0.1
```
*(Frontend requires Node 18+ and `npm run dev` in the `/frontend` directory).*

**Disclaimer:** ConjunctIQ is a demonstration platform. It never commands spacecraft, recommends maneuvers, or guarantees collision probability.
