"""
NASA/JPL CNEOS Close-Approach Data API integration.

Public endpoint (no auth required for DEMO_KEY rate limits):
  https://ssd-api.jpl.nasa.gov/cad.api

Provides real upcoming close approaches of near-Earth asteroids and comets.
This service returns *asteroid/comet* close approaches to Earth, not
satellite-satellite conjunctions.  We expose it as a separate, clearly-labelled
data stream: "NASA/JPL Real Approaches" — not merged with the synthetic demo data.

API docs: https://ssd-api.jpl.nasa.gov/doc/cad.html
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

log = logging.getLogger(__name__)

# ─── IN-PROCESS CACHE ─────────────────────────────────────────────────────────
_cache: dict[str, Any] = {}


def _cached(key: str, ttl: int, fn):
    """Simple TTL cache."""
    now = time.monotonic()
    entry = _cache.get(key)
    if entry and (now - entry["ts"]) < ttl:
        return entry["data"]
    data = fn()
    _cache[key] = {"ts": now, "data": data}
    return data


# ─── CNEOS FETCH ─────────────────────────────────────────────────────────────

def _fetch_cneos_raw(limit: int = 20, dist_max: str = "0.05") -> dict:
    """Fetch raw CNEOS close-approach data from JPL."""
    import httpx

    url = "https://ssd-api.jpl.nasa.gov/cad.api"
    params = {
        "limit": limit,
        "dist-max": dist_max,        # max dist in AU
        "sort": "date",
        "fullname": "true",
    }
    resp = httpx.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


# ─── FIELD MAPPING ───────────────────────────────────────────────────────────
# CAD API fields (v1.1):
# des, orbit_id, jd, cd, dist, dist_min, dist_max, v_rel, v_inf, t_sigma_f, h
_FIELD_IDX: dict[str, int] = {}


def _build_field_idx(fields: list[str]) -> dict[str, int]:
    return {f: i for i, f in enumerate(fields)}


def _au_to_km(au_str: str | None) -> float | None:
    if au_str is None:
        return None
    try:
        # 1 AU = 149_597_870.7 km
        return float(au_str) * 149_597_870.7
    except (ValueError, TypeError):
        return None


def _parse_cneos_row(row: list, idx: dict) -> dict:
    """Convert a raw CNEOS row into a normalised dict."""
    def g(field: str):
        i = idx.get(field)
        return row[i] if i is not None else None

    dist_km = _au_to_km(g("dist"))
    dist_min_km = _au_to_km(g("dist_min"))
    dist_max_km = _au_to_km(g("dist_max"))
    v_rel_raw = g("v_rel")
    v_rel = float(v_rel_raw) if v_rel_raw else None

    cd_str = g("cd")                  # e.g. "2026-Aug-31 16:17"
    try:
        tca = datetime.strptime(cd_str, "%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
    except Exception:
        tca = None

    des = g("des") or "UNKNOWN"
    orbit_id = g("orbit_id") or "0"

    # t_sigma_f: time-of-closest-approach uncertainty, e.g. "< 00:01" or "1:23"
    t_sigma_raw = g("t_sigma_f") or ""
    unc_flag = "high" if ">" in t_sigma_raw or "d" in t_sigma_raw else "low"

    return {
        "event_id": f"NASA-{des.replace(' ', '_')}-{orbit_id}",
        "designation": des,
        "orbit_solution_id": orbit_id,
        "tca": tca.isoformat() if tca else None,
        "tca_raw": cd_str,
        "miss_distance_km": round(dist_km, 1) if dist_km else None,
        "miss_distance_min_km": round(dist_min_km, 1) if dist_min_km else None,
        "miss_distance_max_km": round(dist_max_km, 1) if dist_max_km else None,
        "relative_velocity_km_s": round(v_rel, 2) if v_rel else None,
        "time_sigma": t_sigma_raw.strip(),
        "uncertainty_flag": unc_flag,
        "h_magnitude": g("h"),
        "data_source": "NASA/JPL CNEOS",
        "provenance": "real",
    }


# ─── PUBLIC API ───────────────────────────────────────────────────────────────

def get_upcoming_approaches(limit: int = 20, dist_max_au: float = 0.05, ttl: int = 3600) -> list[dict]:
    """
    Return a list of upcoming NASA/JPL close approaches.

    Always returns a list (empty list on error — never raises to callers).
    Results are cached for `ttl` seconds.
    """
    from app.core.config import settings
    if not settings.cneos_enabled:
        return []

    cache_key = f"cneos:{limit}:{dist_max_au}"
    try:
        raw = _cached(cache_key, ttl, lambda: _fetch_cneos_raw(limit=limit, dist_max=str(dist_max_au)))
    except Exception as exc:
        log.warning("CNEOS fetch failed: %s", exc)
        return []

    fields = raw.get("fields", [])
    idx = _build_field_idx(fields)
    rows = raw.get("data", [])
    results = []
    for row in rows:
        try:
            results.append(_parse_cneos_row(row, idx))
        except Exception as exc:
            log.debug("CNEOS row parse error: %s", exc)
    return results


def get_approach_by_designation(designation: str, ttl: int = 3600) -> dict | None:
    """
    Look up a single object by designation from the cached approach list.
    Returns None if not found or on error.
    """
    approaches = get_upcoming_approaches(ttl=ttl)
    designation_lower = designation.lower()
    for a in approaches:
        if a.get("designation", "").lower() == designation_lower:
            return a
    return None


def cneos_status() -> dict:
    """
    Return a status block describing the CNEOS integration state.
    Used by the /api/status endpoint.
    """
    from app.core.config import settings
    if not settings.cneos_enabled:
        return {"enabled": False, "status": "disabled", "source": "NASA/JPL CNEOS"}
    try:
        approaches = get_upcoming_approaches(limit=1)
        return {
            "enabled": True,
            "status": "online",
            "source": "NASA/JPL CNEOS Close-Approach Data API",
            "url": "https://ssd-api.jpl.nasa.gov/cad.api",
            "provenance": "real",
            "approaches_available": len(approaches) > 0,
        }
    except Exception as exc:
        return {
            "enabled": True,
            "status": "error",
            "error": str(exc),
            "source": "NASA/JPL CNEOS",
        }
