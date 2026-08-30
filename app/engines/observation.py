from app.schemas.contracts import UpdateInput
from app.engines.attention import uncertainty
def recommend(u: UpdateInput)->dict:
    missing=[x for x in ("miss_distance_km","collision_probability") if getattr(u,x) is None]; un=uncertainty(u)
    if missing: return {"priority":"high","information_gap":", ".join(missing),"why_it_matters":"Core conjunction context is absent, limiting interpretation.","suggestion":"Obtain a newer conjunction update with the missing reported fields.","decision_value":"high","disclaimer":"Information prioritization only; not sensor tasking or maneuver planning."}
    if un is None or un>=10: return {"priority":"high","information_gap":"positional uncertainty","why_it_matters":"Elevated or missing uncertainty limits confidence in reported geometry.","suggestion":"Seek updated tracking and uncertainty estimates for both objects.","decision_value":"high","disclaimer":"Information prioritization only; not sensor tasking or maneuver planning."}
    return {"priority":"medium","information_gap":"freshness of conjunction estimate","why_it_matters":"Complete estimates can change as new observations arrive.","suggestion":"Review the next available conjunction update and recent tracking history.","decision_value":"medium","disclaimer":"Information prioritization only; not sensor tasking or maneuver planning."}
