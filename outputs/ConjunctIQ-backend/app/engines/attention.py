"""Transparent attention assessment; never a collision prediction or maneuver recommendation."""
from datetime import datetime, timezone
from app.schemas.contracts import Assessment, EvidenceItem, UpdateInput
THRESHOLDS = {"miss_distance_high_km": 10.0, "miss_distance_critical_km": 2.0, "probability_high": 1e-4, "probability_critical": 1e-3, "uncertainty_high_km": 10.0, "hours_to_tca_urgent": 24.0, "monitor_score":20,"high_score":45,"critical_score":70}
DISCLAIMER = "Operational attention assessment only; it is not a certified collision probability, maneuver recommendation, or spacecraft command."
def _hours(tca):
    if tca.tzinfo is None: tca=tca.replace(tzinfo=timezone.utc)
    return (tca-datetime.now(timezone.utc)).total_seconds()/3600
def uncertainty(u):
    vals=[v for v in (u.radial_uncertainty_km,u.along_track_uncertainty_km,u.cross_track_uncertainty_km) if v is not None]
    return max(vals) if vals else None
def assess(u: UpdateInput, escalation=False):
    score=0; factors=[]; evidence=[]
    def add(name, points, observed, reference, explanation, unit=None):
        nonlocal score; score+=points
        factors.append({"factor":name,"observed":observed,"reference":reference,"direction":"increases_attention","points":points,"explanation":explanation})
        evidence.append(EvidenceItem(factor=name,value=observed,unit=unit,baseline=reference,comparison="attention_reference",importance="high" if points>=20 else "medium",explanation=explanation))
    if u.miss_distance_km is None: add("missing_miss_distance",12,None,"required for separation context","Predicted miss distance is unavailable.")
    elif u.miss_distance_km<=2: add("miss_distance",35,u.miss_distance_km,2,"Predicted separation is below the critical attention reference.","km")
    elif u.miss_distance_km<=10: add("miss_distance",20,u.miss_distance_km,10,"Predicted separation is below the attention reference.","km")
    if u.collision_probability is None: add("missing_collision_probability",5,None,"reported probability","Collision probability was not supplied; this is a data gap, not an estimate.")
    elif u.collision_probability>=1e-3: add("collision_probability",35,u.collision_probability,1e-3,"Reported probability exceeds the critical attention reference.")
    elif u.collision_probability>=1e-4: add("collision_probability",20,u.collision_probability,1e-4,"Reported probability exceeds the high attention reference.")
    un=uncertainty(u)
    if un is None: add("missing_uncertainty",10,None,"uncertainty components","Uncertainty data is unavailable.")
    elif un>=10: add("uncertainty",15,un,10,"At least one uncertainty component is elevated.","km")
    h=_hours(u.time_of_closest_approach)
    if 0<=h<=24: add("time_to_tca",10,round(h,1),24,"Time remaining until closest approach is short.","hours")
    if escalation: add("recent_escalation",12,"escalating","stable","A prior update indicates an attention-relevant increase.")
    score=min(100,score); cls="CRITICAL ATTENTION" if score>=70 else "HIGH ATTENTION" if score>=45 else "MONITOR" if score>=20 else "LOW"
    return Assessment(score=score,classification=cls,disclaimer=DISCLAIMER,factors=factors), evidence
