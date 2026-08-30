from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.db.session import Base, engine
from app.api.routes import router
from app.api.research import router as research_router

app = FastAPI(
    title="ConjunctIQ API",
    version="0.1.0",
    description="Decision-support only. No autonomous spacecraft control or maneuver advice.",
)
Base.metadata.create_all(bind=engine)
app.include_router(router)
app.include_router(research_router)

# Serve the frontend SPA
_FRONTEND = Path(__file__).parent.parent / "frontend"
if _FRONTEND.exists():
    app.mount("/static", StaticFiles(directory=str(_FRONTEND)), name="static")

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(str(_FRONTEND / "index.html"))
