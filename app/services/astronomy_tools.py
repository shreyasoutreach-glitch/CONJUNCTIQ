import os
import requests
import math
from typing import Any, Dict

def query_nasa_ads(query: str) -> Dict[str, Any]:
    api_token = os.environ.get("ADS_API_KEY")
    if not api_token:
        return {
            "status": "error",
            "message": "ADS credentials unavailable. NASA ADS tool requires ADS_API_KEY."
        }
    
    try:
        url = "https://api.adsabs.harvard.edu/v1/search/query"
        params = {
            "q": query,
            "fl": "title,author,year,abstract,bibcode",
            "rows": 3
        }
        headers = {"Authorization": f"Bearer {api_token}"}
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            return {
                "status": "error",
                "message": f"NASA ADS API returned status {resp.status_code}"
            }
            
        data = resp.json()
        docs = data.get("response", {}).get("docs", [])
        
        results = []
        for doc in docs:
            results.append({
                "title": doc.get("title", [""])[0],
                "authors": doc.get("author", [])[:3],
                "year": doc.get("year", "Unknown"),
                "abstract": doc.get("abstract", "No abstract available.")[:500] + "...",
                "bibcode": doc.get("bibcode", ""),
                "url": f"https://ui.adsabs.harvard.edu/abs/{doc.get('bibcode', '')}"
            })
            
        return {
            "status": "completed",
            "results": results
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def query_jpl_horizons(target: str) -> Dict[str, Any]:
    try:
        url = "https://ssd.jpl.nasa.gov/api/horizons.api"
        params = {
            "format": "json",
            "COMMAND": f"'{target}'",
            "OBJ_DATA": "YES",
            "MAKE_EPHEM": "YES",
            "EPHEM_TYPE": "VECTORS",
            "CENTER": "500@10",
            "START_TIME": "2026-01-01",
            "STOP_TIME": "2026-01-02",
            "STEP_SIZE": "1d",
        }
        resp = requests.get(url, params=params, timeout=10)
        
        if resp.status_code != 200:
            return {
                "status": "error",
                "message": f"JPL Horizons query failed with status {resp.status_code}"
            }
            
        data = resp.json()
        if "error" in data:
            return {
                "status": "error",
                "message": f"JPL Horizons error: {data['error']}"
            }
            
        result = data.get("result", "")
        # Extract basic info
        return {
            "status": "completed",
            "target": target,
            "raw_snippet": result[:800] + "...",
            "source": "JPL Solar System Dynamics"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"JPL Horizons query failed: {str(e)}"
        }

def query_simbad(identifier: str) -> Dict[str, Any]:
    try:
        # We can use the SESAME name resolver as a simple proxy for object data
        url = f"https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/S?{identifier}"
        resp = requests.get(url, timeout=10)
        
        if resp.status_code != 200:
            return {
                "status": "error",
                "message": f"SIMBAD query failed with status {resp.status_code}"
            }
        
        # Super simple XML parse or string search since we don't want heavy dependencies
        content = resp.text
        if "<oname>" not in content:
            return {
                "status": "error",
                "message": f"Identifier {identifier} not found in SIMBAD"
            }
            
        return {
            "status": "completed",
            "identifier": identifier,
            "source": "CDS Strasbourg",
            "raw_data": content[:500] + "..."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"SIMBAD query failed: {str(e)}"
        }

def run_orbital_simulation(params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        sma = float(params.get("semi_major_axis_km", 7000))
        ecc = float(params.get("eccentricity", 0.001))
        inc = float(params.get("inclination_deg", 98.0))
        mass = float(params.get("mass_kg", 500))
        area = float(params.get("area_m2", 2.5))
        cd = float(params.get("cd", 2.2))
        days = float(params.get("simulation_days", 30))
        
        # Extremely simplified J2-perturbed decay estimation
        # This is synthetic analytic data
        earth_mu = 398600.4418
        earth_radius = 6371.0
        alt = sma - earth_radius
        
        if alt < 100:
            return {"status": "error", "message": "Altitude too low for stable orbit model."}
            
        # Dummy decay rate calculation based on simplistic drag
        decay_rate_km_per_day = (area / mass) * cd * math.exp(-(alt - 400) / 50) * 10
        final_sma = sma - (decay_rate_km_per_day * days)
        
        return {
            "status": "completed",
            "initial_semi_major_axis_km": sma,
            "final_semi_major_axis_km": final_sma,
            "decay_km": sma - final_sma,
            "estimated_orbital_lifetime_days": (alt - 150) / (decay_rate_km_per_day + 1e-9) if decay_rate_km_per_day > 0 else 9999,
            "disclaimer": "Simulation output is an analytical/modeling estimate and is not spacecraft control or maneuver guidance."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Simulation failed: {str(e)}"
        }

TOOLS_REGISTRY = {
    "query_nasa_ads": {
        "name": "query_nasa_ads",
        "description": "Search NASA Astrophysics Data System (ADS) for astronomy and astrophysics literature.",
        "func": query_nasa_ads
    },
    "query_jpl_horizons": {
        "name": "query_jpl_horizons",
        "description": "Retrieve ephemeris information for solar-system objects (asteroids, comets) from JPL Horizons.",
        "func": query_jpl_horizons
    },
    "query_simbad": {
        "name": "query_simbad",
        "description": "Cross-reference and identify astronomical objects using the CDS SIMBAD database.",
        "func": query_simbad
    },
    "run_orbital_simulation": {
        "name": "run_orbital_simulation",
        "description": "Run a controlled physics simulation for orbital decay and parameters.",
        "func": run_orbital_simulation
    }
}
