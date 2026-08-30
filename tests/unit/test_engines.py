from datetime import datetime, timedelta, timezone
from app.schemas import UpdateInput
from app.engines.attention import assess
from app.engines.evolution import compare
from app.engines.observation import recommend


def event(**overrides):
    d = dict(
        event_id="x", primary_object_id="a", secondary_object_id="b",
        timestamp=datetime.now(timezone.utc),
        time_of_closest_approach=datetime.now(timezone.utc) + timedelta(hours=6),
        update_number=1,
        miss_distance_km=1.0, collision_probability=0.002,
        relative_velocity_km_s=9,
        radial_uncertainty_km=1, along_track_uncertainty_km=1, cross_track_uncertainty_km=1,
    )
    d.update(overrides)
    return UpdateInput(**d)


# ── attention engine ────────────────────────────────────────────────────────

def test_attention_is_deterministic_and_critical():
    a, _ = assess(event())
    assert a.classification == "CRITICAL ATTENTION" and a.score >= 70


def test_missing_data_is_explicit():
    a, e = assess(event(miss_distance_km=None, collision_probability=None))
    assert any(x.factor == "missing_miss_distance" for x in e)


def test_escalation_bonus_raises_score():
    """The escalation=True flag must add the recent_escalation factor."""
    a_no, _ = assess(event())
    a_esc, _ = assess(event(), escalation=True)
    assert a_esc.score > a_no.score
    assert any(f["factor"] == "recent_escalation" for f in a_esc.factors)


def test_past_tca_event_is_urgent():
    """An event whose TCA is in the past should still get the time_to_tca urgency factor."""
    past_tca = datetime.now(timezone.utc) - timedelta(hours=2)
    a, _ = assess(event(time_of_closest_approach=past_tca))
    assert any(f["factor"] == "time_to_tca" for f in a.factors)


def test_score_clamped_at_100():
    """No matter how many factors fire, the score must not exceed 100."""
    a, _ = assess(event(), escalation=True)
    assert a.score <= 100


# ── evolution engine ────────────────────────────────────────────────────────

def test_escalation_and_observation():
    old = event(update_number=0, miss_distance_km=20, collision_probability=0.00001)
    new = event()
    assert compare(old, new)["status"] == "escalating"
    assert recommend(event(along_track_uncertainty_km=20))["priority"] == "high"


def test_no_previous_returns_insufficient():
    result = compare(None, event())
    assert result["status"] == "insufficient data"
    assert result["changes"] == []


def test_zero_baseline_probability_escalation():
    """Bug fix: when previous probability is 0.0, a jump to critical should still be
    detected as a significant escalation — not silently ignored because r=None."""
    old = event(collision_probability=0.0, miss_distance_km=20.0)
    new = event(collision_probability=1e-3, miss_distance_km=20.0)
    result = compare(old, new)
    assert result["status"] == "escalating", (
        "A jump from 0 probability to 1e-3 must be flagged as escalating "
        "(baseline-zero relative-change guard was broken)"
    )


def test_net_directional_status():
    """Bug fix: many improvements + 1 escalation should be 'improving/resolving',
    not 'escalating' (the old binary logic gave escalating for any single escalation)."""
    old = event(miss_distance_km=5.0, collision_probability=0.002, relative_velocity_km_s=12.0)
    # miss improved a lot, velocity improved a lot — 2 clear improvements
    # probability ticked up slightly but not significantly (within 25%)
    new = event(miss_distance_km=20.0, collision_probability=0.0025, relative_velocity_km_s=6.0)
    result = compare(old, new)
    assert result["status"] == "improving/resolving", (
        f"2 improvements vs 0 significant escalations should be improving/resolving, got {result['status']}"
    )


def test_stable_when_no_significant_change():
    """If nothing moves significantly the status should be 'stable'."""
    base = event(miss_distance_km=10.0, collision_probability=1e-4, relative_velocity_km_s=9.0)
    # Tiny changes well under 25% threshold
    slightly = event(miss_distance_km=10.1, collision_probability=1.05e-4, relative_velocity_km_s=9.1)
    result = compare(base, slightly)
    assert result["status"] == "stable"


# ── observation engine ──────────────────────────────────────────────────────

def test_missing_fields_give_high_priority():
    a = recommend(event(miss_distance_km=None))
    assert a["priority"] == "high"
    assert "miss_distance_km" in a["information_gap"]


def test_high_uncertainty_gives_high_priority():
    a = recommend(event(along_track_uncertainty_km=20.0))
    assert a["priority"] == "high"


def test_complete_good_data_gives_medium_priority():
    a = recommend(event(
        miss_distance_km=5.0, collision_probability=1e-5,
        radial_uncertainty_km=2.0, along_track_uncertainty_km=2.0, cross_track_uncertainty_km=2.0,
    ))
    assert a["priority"] == "medium"
