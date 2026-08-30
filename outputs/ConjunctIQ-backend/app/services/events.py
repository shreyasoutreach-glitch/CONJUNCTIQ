from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import ConjunctionEvent, EventUpdate
from app.schemas import UpdateInput
def to_schema(row):
    return UpdateInput(event_id=row.event_id,primary_object_id=row.primary_object_id,secondary_object_id=row.secondary_object_id,timestamp=row.timestamp,time_of_closest_approach=row.time_of_closest_approach,update_number=row.update_number,miss_distance_km=row.miss_distance_km,collision_probability=row.collision_probability,relative_velocity_km_s=row.relative_velocity_km_s,radial_uncertainty_km=row.radial_uncertainty_km,along_track_uncertainty_km=row.along_track_uncertainty_km,cross_track_uncertainty_km=row.cross_track_uncertainty_km,data_source=row.data_source,object_metadata=row.object_metadata or {})
def ingest(db: Session, updates):
    added=0
    for u in updates:
        if not db.get(ConjunctionEvent,u.event_id): db.add(ConjunctionEvent(event_id=u.event_id,primary_object_id=u.primary_object_id,secondary_object_id=u.secondary_object_id))
        exists=db.scalar(select(EventUpdate).where(EventUpdate.event_id==u.event_id,EventUpdate.update_number==u.update_number))
        if exists: raise ValueError(f"Duplicate update: {u.event_id} update {u.update_number}")
        db.add(EventUpdate(**u.model_dump())); added+=1
    db.commit(); return added
def latest(db,event_id):
    row=db.scalar(select(EventUpdate).where(EventUpdate.event_id==event_id).order_by(EventUpdate.update_number.desc()))
    return to_schema(row) if row else None
def previous(db,event_id,current_no):
    row=db.scalar(select(EventUpdate).where(EventUpdate.event_id==event_id,EventUpdate.update_number<current_no).order_by(EventUpdate.update_number.desc()))
    return to_schema(row) if row else None
def list_latest(db):
    ids=db.scalars(select(ConjunctionEvent.event_id)).all(); return [latest(db,x) for x in ids]
