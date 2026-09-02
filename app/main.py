from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import Base, engine
from app.api.routes import router
from app.api.research import router as research_router

app = FastAPI(
    title="ConjunctIQ API",
    version="0.1.0",
    description="Decision-support only. No autonomous spacecraft control or maneuver advice.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(router)
app.include_router(research_router)

# Serve the frontend SPA
_FRONTEND = Path(__file__).parent.parent / "frontend" / "dist"
if _FRONTEND.exists():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            # Let API routes handle this, though include_router should catch it first
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(str(_FRONTEND / "index.html"))
