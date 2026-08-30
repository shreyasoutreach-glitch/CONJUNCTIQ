from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas import IngestRequest, SimulationRequest, BriefingRequest, ChatRequest
from app.services.events import ingest, latest, previous, list_latest
from app.engines.attention import assess
from app.engines.evolution import compare
from app.engines.observation import recommend
from app.models import SimulationRun, KnowledgeDocument
from app.knowledge.corpus import retrieve, DOCUMENTS
from app.ai.provider import get_provider
from app.core.config import settings
router=APIRouter(prefix="/api")
def event_or_404(db,event_id):
    e=latest(db,event_id)
    if not e: raise HTTPException(404,"Event not found")
    return e
def bundle(db,event_id):
    e=event_or_404(db,event_id); p=previous(db,event_id,e.update_number); changes=compare(p,e); assessment,evidence=assess(e,changes["status"]=="escalating")
    return e,assessment,evidence,changes,recommend(e)
@router.get("/health")
def health(): return {"status":"ok","service":"ConjunctIQ","principle":"Deterministic systems calculate; AI interprets and communicates."}
@router.post("/ingest",status_code=201)
def post_ingest(payload:IngestRequest,db:Session=Depends(get_db)):
    try:return {"ingested":ingest(db,payload.updates)}
    except ValueError as e: raise HTTPException(409,str(e))
@router.get("/events")
def events(db:Session=Depends(get_db)):
    out=[]
    for e in list_latest(db):
        a,_=assess(e); out.append({"event":e,"assessment":a})
    return out
@router.get("/events/{event_id}")
def get_event(event_id:str,db:Session=Depends(get_db)): return event_or_404(db,event_id)
@router.get("/events/{event_id}/assessment")
def assessment(event_id:str,db:Session=Depends(get_db)): return bundle(db,event_id)[1]
@router.get("/events/{event_id}/evidence")
def evidence(event_id:str,db:Session=Depends(get_db)): return bundle(db,event_id)[2]
@router.get("/events/{event_id}/changes")
def changes(event_id:str,db:Session=Depends(get_db)): return bundle(db,event_id)[3]
@router.get("/events/{event_id}/next-observation")
def next_observation(event_id:str,db:Session=Depends(get_db)): return bundle(db,event_id)[4]
@router.post("/events/{event_id}/simulate")
def simulate(event_id:str,payload:SimulationRequest,db:Session=Depends(get_db)):
    e,a,_,_,_=bundle(db,event_id); changed=e.model_copy(update={k:v for k,v in payload.model_dump().items() if v is not None}); after,_=assess(changed)
    result={"simulation":True,"disclaimer":"Hypothetical uncertainty scenario only; not orbital propagation or maneuver planning.","before":a,"after":after,"changed_factors":[k for k,v in payload.model_dump().items() if v is not None]}; db.add(SimulationRun(event_id=event_id,inputs=payload.model_dump(),result={"before":a.model_dump(),"after":after.model_dump()})); db.commit(); return result
@router.post("/events/{event_id}/briefing")
def briefing(event_id:str,payload:BriefingRequest,db:Session=Depends(get_db)):
    e,a,ev,ch,no=bundle(db,event_id); return get_provider(settings.llm_provider).briefing(payload.audience,e,a,ev,ch,no,retrieve("conjunction uncertainty TCA"))
@router.post("/events/{event_id}/chat")
def chat(event_id:str,payload:ChatRequest,db:Session=Depends(get_db)):
    e,a,ev,ch,no=bundle(db,event_id); answer=get_provider(settings.llm_provider).briefing("analyst",e,a,ev,ch,no,retrieve(payload.question)); return {"question":payload.question,"answer":answer,"context_sources":retrieve(payload.question)}
@router.get("/knowledge")
def knowledge(): return DOCUMENTS
@router.get("/summary")
def summary(db:Session=Depends(get_db)):
    rows=[]
    for e in list_latest(db):
        p=previous(db,e.event_id,e.update_number); ch=compare(p,e); a,_=assess(e,ch["status"]=="escalating"); rows.append((e,a,ch))
    count=lambda c:sum(a.classification==c for _,a,_ in rows)
    return {"total_events":len(rows),"critical_events":count("CRITICAL ATTENTION"),"high_attention_events":count("HIGH ATTENTION"),"monitor_events":count("MONITOR"),"low_attention_events":count("LOW"),"escalating_events":sum(c["status"]=="escalating" for _,_,c in rows),"newest_events":[e.event_id for e,_,_ in rows[-5:]],"events_approaching_tca":[e.event_id for e,a,_ in rows if any(x["factor"]=="time_to_tca" for x in a.factors)],"events_with_poor_data":[e.event_id for e,_,_ in rows if e.miss_distance_km is None or e.collision_probability is None]}
