from app.schemas.contracts import UpdateInput
from app.engines.attention import assess, uncertainty
FIELDS=("miss_distance_km","collision_probability","relative_velocity_km_s")
def compare(previous: UpdateInput|None,current: UpdateInput)->dict:
    if not previous: return {"status":"insufficient data","changes":[],"message":"No earlier update is available for comparison."}
    changes=[]; escalations=0
    for field in FIELDS:
        p,c=getattr(previous,field),getattr(current,field)
        if p is None or c is None:
            changes.append({"field":field,"previous":p,"current":c,"direction":"unknown","significance":"low","reason":"One or both values are missing."}); continue
        d=c-p; r=None if p==0 else d/abs(p); worse=(field=="miss_distance_km" and d<0) or (field=="collision_probability" and d>0); sig=abs(r or 0)>=.25
        escalations += int(worse and sig)
        changes.append({"field":field,"previous":p,"current":c,"absolute_change":d,"relative_change":r,"direction":"increased" if d>0 else "decreased" if d<0 else "unchanged","significance":"high" if sig else "low"})
    pu,cu=uncertainty(previous),uncertainty(current)
    if pu is not None and cu is not None: changes.append({"field":"max_uncertainty_km","previous":pu,"current":cu,"absolute_change":cu-pu,"relative_change":(cu-pu)/pu if pu else None,"direction":"increased" if cu>pu else "decreased" if cu<pu else "unchanged","significance":"high" if pu and abs(cu-pu)/pu>=.25 else "low"})
    pa,_=assess(previous); ca,_=assess(current); changes.append({"field":"attention_classification","previous":pa.classification,"current":ca.classification,"direction":"changed" if pa.classification!=ca.classification else "unchanged","significance":"high" if pa.classification!=ca.classification else "low"})
    status="escalating" if escalations else "improving/resolving" if any(x.get("field")=="miss_distance_km" and x.get("direction")=="increased" for x in changes) else "stable"
    return {"status":status,"changes":changes}
