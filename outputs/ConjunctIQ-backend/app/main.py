from fastapi import FastAPI
from app.db.session import Base, engine
from app.api.routes import router
app=FastAPI(title="ConjunctIQ API",version="0.1.0",description="Decision-support only. No autonomous spacecraft control or maneuver advice.")
Base.metadata.create_all(bind=engine)
app.include_router(router)
