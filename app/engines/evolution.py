from app.schemas.contracts import UpdateInput
from app.engines.attention import assess, uncertainty
FIELDS=("miss_distance_km","collision_probability","relative_velocity_km_s")

def _relative(d, p):
    """Compute relative change safely.

    When the baseline is zero we fall back to an absolute-magnitude guard
    (any non-zero movement is treated as significant) rather than returning
    None which would silently mark the change as low-significance.
    """
    if p == 0:
        # Cannot compute a ratio — treat any movement as significant
        return None, abs(d) > 0
    r = d / abs(p)
    return r, abs(r) >= 0.25

def compare(previous: UpdateInput | None, current: UpdateInput) -> dict:
    if not previous:
        return {"status": "insufficient data", "changes": [], "message": "No earlier update is available for comparison."}
    changes = []
    escalations = 0
    improvements = 0

    for field in FIELDS:
        p, c = getattr(previous, field), getattr(current, field)
        if p is None or c is None:
            changes.append({"field": field, "previous": p, "current": c, "direction": "unknown", "significance": "low", "reason": "One or both values are missing."})
            continue
        d = c - p
        r, sig = _relative(d, p)
        # worse = moving in the attention-increasing direction
        worse = (field == "miss_distance_km" and d < 0) or (field in ("collision_probability", "relative_velocity_km_s") and d > 0)
        # better = moving in the attention-reducing direction
        better = (field == "miss_distance_km" and d > 0) or (field in ("collision_probability", "relative_velocity_km_s") and d < 0)
        if worse and sig:
            escalations += 1
        elif better and sig:
            improvements += 1
        changes.append({"field": field, "previous": p, "current": c, "absolute_change": d, "relative_change": r, "direction": "increased" if d > 0 else "decreased" if d < 0 else "unchanged", "significance": "high" if sig else "low"})

    pu, cu = uncertainty(previous), uncertainty(current)
    if pu is not None and cu is not None:
        ud = cu - pu
        ur, usig = _relative(ud, pu)
        # Significant uncertainty increase is also an escalating signal
        if usig and cu > pu:
            escalations += 1
        elif usig and cu < pu:
            improvements += 1
        changes.append({"field": "max_uncertainty_km", "previous": pu, "current": cu, "absolute_change": ud, "relative_change": ur, "direction": "increased" if cu > pu else "decreased" if cu < pu else "unchanged", "significance": "high" if usig else "low"})

    pa, _ = assess(previous)
    ca, _ = assess(current)
    changes.append({"field": "attention_classification", "previous": pa.classification, "current": ca.classification, "direction": "changed" if pa.classification != ca.classification else "unchanged", "significance": "high" if pa.classification != ca.classification else "low"})

    # Net-directional: only call it escalating if escalating signals outnumber improving ones.
    # A single marginal escalation should not override many clear improvements.
    if escalations > improvements:
        status = "escalating"
    elif improvements > 0:
        status = "improving/resolving"
    else:
        status = "stable"
    return {"status": status, "changes": changes}
