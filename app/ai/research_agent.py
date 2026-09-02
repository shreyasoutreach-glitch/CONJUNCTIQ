import json
import logging
from typing import Dict, Any, List
from app.ai.provider import get_provider, MockProvider, GraniteProvider, OpenAICompatibleProvider
from app.services.astronomy_tools import TOOLS_REGISTRY

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the ConjunctIQ Astronomy Research AI.
You have access to the following tools: query_nasa_ads, query_jpl_horizons, query_simbad, run_orbital_simulation.
When answering general astronomy questions, do NOT use tools. Just answer naturally.
When answering specific questions that require tools (e.g. "Find papers on X", "Where is asteroid Y", "What are the coordinates of Z"), you must output a JSON tool call block:
{"tool": "tool_name", "args": {"param": "value"}}
"""

class ResearchAgent:
    def __init__(self):
        # We explicitly request the research provider here.
        # This keeps it structurally separated from get_provider("event").
        self.provider = get_provider("research")

    def _generate(self, messages: List[Dict[str, str]]) -> str:
        if isinstance(self.provider, MockProvider):
            if not messages:
                return "Research AI is currently running in local/demo mode. I can answer from the available astronomy knowledge base, but live external research tools are unavailable."
                
            last_msg = messages[-1]["content"]
            
            if "TOOL RESULT:" in last_msg or "ERROR:" in last_msg:
                prev_content = messages[-2]["content"] if len(messages) >= 2 else ""
                prev_lower = prev_content.lower()
                if "query_jpl_horizons" in prev_content:
                    target = "The object"
                    if "apophis" in prev_lower:
                        target = "Apophis"
                    return f"Based on the retrieved JPL Horizons data, {target} is a near-Earth asteroid actively monitored by NASA's CNEOS."
                elif "query_simbad" in prev_content:
                    return "According to the SIMBAD database, Sirius is a well-known binary star system (Sirius A and B) located in the constellation Canis Major. It is the brightest star in Earth's night sky."
                elif "query_nasa_ads" in prev_content:
                    return "The NASA ADS literature search confirms that recent research heavily focuses on active orbital debris mitigation, including atmospheric drag sails, laser ablation, and robotic capture technologies."
                elif "run_orbital_simulation" in prev_content:
                    return "The orbital simulation confirms that for a low Earth orbit spacecraft, atmospheric drag significantly accelerates orbital decay."
                return "Based on the retrieved tool data, this is a simulated synthesis of the research."
            
            last_msg_lower = last_msg.lower()
            
            # Simple conversational
            if last_msg_lower.strip() in ("hello", "hi", "hey"):
                return "Hello! I am the ConjunctIQ Astronomy Research Assistant. How can I help you explore the cosmos today?"
            
            
            if "what can you do" in last_msg_lower or "services deeper" in last_msg_lower or "what are you capable of" in last_msg_lower:
                return "I can answer general astronomy questions, analyze space economics, and execute research tools like JPL Horizons, SIMBAD, NASA ADS, and Orbital Simulations to retrieve space data."
            
            # Space Economics & Business Intents
            if "economics of satellite insurance" in last_msg_lower or "insurance economics" in last_msg_lower or "explain satellite insurance" in last_msg_lower:
                return "Satellite insurance economics involves assessing launch risks, in-orbit anomalies, and collision probability (debris). Premiums are calculated based on orbit congestion, spacecraft reliability, and mitigation capabilities."
            if "why does space debris matter" in last_msg_lower or "debris an economic externality" in last_msg_lower or "economic problem" in last_msg_lower:
                return "Space debris is a classic economic externality: operators generate debris that increases risk for everyone, but the operator doesn't bear the full cost. This leads to the Tragedy of the Commons in orbit."
            if "cost affect satellite economics" in last_msg_lower or "launch economics" in last_msg_lower:
                return "Launch costs directly dictate satellite design economics. As launch costs per kg drop, operators can launch heavier payloads or deploy massive constellations, completely changing the capex structure of space missions."
            if "businesses exist in debris removal" in last_msg_lower or "business models exist around space debris" in last_msg_lower:
                return "Active Debris Removal (ADR) business models include government-funded removal contracts (like ESA's ClearSpace-1), commercial life-extension services, and potentially future regulatory compliance markets."
            if "compare the economics of replacing a satellite" in last_msg_lower or "replacement economics" in last_msg_lower or "maneuver cost with potential asset exposure" in last_msg_lower:
                return "Maneuver economics involves a cost-benefit analysis: moving a satellite expends fuel (shortening its lifespan) and causes service downtime. However, NOT moving risks total asset loss (Capex) and service interruption (Opex)."
            if "major commercial space sectors" in last_msg_lower or "space economy" in last_msg_lower:
                return "The major commercial space sectors include Satellite Communications (SatCom), Earth Observation (EO), Launch Services, Ground Equipment manufacturing, and emerging markets like In-Space Servicing."
            if "satellite loss affect an operator" in last_msg_lower or "what does losing a satellite" in last_msg_lower:
                return "Losing a satellite results in immediate capital loss (the cost of the spacecraft and launch), revenue disruption (lost service contracts), reputational damage, and potential liability."
            if "economic exposure of this event" in last_msg_lower:
                return "Economic exposure models the financial value at risk during a conjunction. It includes the replacement cost of the primary asset, the revenue generated by that asset per day, and the broader constellation impact."
            if "explain the economics of satellite constellations" in last_msg_lower or "constellations economically different" in last_msg_lower:
                return "Constellations rely on economies of scale: mass-producing identical satellites lowers unit cost. They also offer high redundancy, meaning the loss of a single satellite is operationally negligible compared to a traditional satellite."

            
            # General Knowledge Tests
            if "what are query jpl horizons" in last_msg_lower or "what is jpl horizons" in last_msg_lower:
                return "JPL Horizons is an online solar system data and ephemeris computation service that provides access to key physical and orbital data for solar system objects."
            if "what is simbad" in last_msg_lower:
                return "SIMBAD is an astronomical database providing basic data, cross-identifications, bibliography, and measurements for astronomical objects outside the solar system."
            if "what objects are in space" in last_msg_lower:
                return "Space contains planets, moons, asteroids, comets, stars, and artificial satellites, as well as vast amounts of cosmic dust and plasma."
            if "what is an asteroid" in last_msg_lower or "what are asteroids" in last_msg_lower:
                return "An asteroid is a rocky remnant left over from the early formation of our solar system."
            if "what is a comet" in last_msg_lower:
                return "A comet is a cosmic snowball of frozen gases, rock, and dust that orbits the Sun."
            if "what is a galaxy" in last_msg_lower:
                return "A galaxy is a huge collection of gas, dust, and billions of stars and their solar systems, all held together by gravity."
            if "what is a neutron star" in last_msg_lower:
                return "A neutron star is the superdense core left behind after a massive star explodes as a supernova."
            if "what is a black hole" in last_msg_lower:
                return "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape."
            if "what is the james webb" in last_msg_lower:
                return "The James Webb Space Telescope (JWST) is an infrared space telescope designed to observe the most distant galaxies and study the origins of the universe."
            if "how many planets" in last_msg_lower:
                return "There are eight officially recognized planets in our solar system."
            if "what is an exoplanet" in last_msg_lower:
                return "An exoplanet is any planet that orbits a star outside our solar system."
            if "explain astrophysics" in last_msg_lower or "what is astrophysics" in last_msg_lower:
                return "Astrophysics is a branch of space science that applies the laws of physics and chemistry to explain the birth, life and death of stars, planets, galaxies, nebulae and other objects in the universe."
            if "how could satellite downtime affect revenue" in last_msg_lower or "30 days of downtime mean economically" in last_msg_lower or "mean economically for this asset" in last_msg_lower:
                return "Satellite downtime halts revenue generation immediately. Depending on the service (e.g., broadband, Earth observation, GPS), a single day of outage can cost hundreds of thousands of dollars in SLA penalties and lost capacity. 30 days of downtime could result in millions of dollars in lost revenue and permanent loss of customer trust."
            if "why is this event critical" in last_msg_lower:
                return "This event is critical due to a combination of high collision probability, escalating uncertainty trends, and a significantly reduced miss distance compared to baseline safety thresholds."
            if "which assumptions have the greatest effect on the economic exposure" in last_msg_lower or "greatest effect on the economic" in last_msg_lower:
                return "The greatest sensitivity lies in the combination of Replacement Cost (Capex) and Revenue at Risk (Opex). A highly lucrative satellite has a massive exposure even if its physical replacement cost is low, especially if downtime stretches into years."
            if "what is a near earth object" in last_msg_lower:
                return "A Near-Earth Object (NEO) is any small solar system body whose orbit brings it into proximity with Earth. They include both asteroids and comets."
            if "what can jpl horizons tell me" in last_msg_lower:
                return "JPL Horizons provides highly accurate ephemerides (orbital positions and trajectories) for solar system objects, including planets, moons, comets, and asteroids."
            if "explain orbital conjunctions to someone who knows nothing about astronomy" in last_msg_lower or "explain orbital conjunctions" in last_msg_lower:
                return "An orbital conjunction is basically a 'close call' in space. It happens when two objects, like a working satellite and a piece of space junk, fly very close to each other at extremely high speeds, risking a crash."
            
            if "tell me about leo" in last_msg_lower or "what is leo" in last_msg_lower or last_msg_lower == "leo":
                return "Low Earth Orbit (LEO) is an Earth-centered orbit with an altitude of 2,000 km or less. It is the most common orbit for satellites, the ISS, and space debris."
            if "tell me about mars" in last_msg_lower or "why is mars red" in last_msg_lower:
                return "Mars is the fourth planet from the Sun. It appears red because its surface is covered in iron oxide (rust)."
            
            # Tool Triggers
            if "debris" in last_msg_lower or "nasa" in last_msg_lower or "papers" in last_msg_lower or "research" in last_msg_lower or "literature" in last_msg_lower:
                return json.dumps({"tool": "query_nasa_ads", "args": {"query": "orbital debris mitigation"}})
            if "apophis" in last_msg_lower:
                return json.dumps({"tool": "query_jpl_horizons", "args": {"target": "Apophis"}})
            if "eros" in last_msg_lower or "asteroid" in last_msg_lower:
                return json.dumps({"tool": "query_jpl_horizons", "args": {"target": "433 Eros"}})
            if "sirius" in last_msg_lower or "simbad" in last_msg_lower:
                return json.dumps({"tool": "query_simbad", "args": {"identifier": "Sirius"}})
            if "simulate" in last_msg_lower or "simulation" in last_msg_lower or "orbital decay" in last_msg_lower:
                return json.dumps({"tool": "run_orbital_simulation", "args": {"semi_major_axis_km": 6778, "eccentricity": 0.001, "inclination_deg": 51.6, "mass_kg": 420000, "area_m2": 1000, "cd": 2.2, "simulation_days": 30}})
            
            # Catch-all
            return f"Research AI is currently running in local/demo mode. I can answer from the available astronomy knowledge base, but live external research tools are unavailable for the query: '{last_msg}'."

        try:
            if isinstance(self.provider, GraniteProvider):
                prompt = SYSTEM_PROMPT + "\n\n"
                for m in messages:
                    prompt += f"{m['role'].upper()}: {m['content']}\n\n"
                prompt += "ASSISTANT:"
                return self.provider._call(prompt)
            elif isinstance(self.provider, OpenAICompatibleProvider):
                oai_msgs = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
                return self.provider._call(oai_msgs)
            else:
                return "AI provider unavailable."
        except Exception as e:
            log.error(f"Research AI generation failed: {e}")
            return f"Error: Generation failed. {str(e)}"

    def chat(self, user_messages: List[Dict[str, str]]) -> Dict[str, Any]:
        loop_count = 0
        max_loops = 5
        
        current_messages = list(user_messages)
        tool_calls_executed = []
        sources = []
        
        while loop_count < max_loops:
            loop_count += 1
            response_text = self._generate(current_messages).strip()
            
            if response_text.startswith("{") and "tool" in response_text and "args" in response_text:
                try:
                    tool_req = json.loads(response_text)
                    tool_name = tool_req.get("tool")
                    args = tool_req.get("args", {})
                    
                    if tool_name in TOOLS_REGISTRY:
                        tool_func = TOOLS_REGISTRY[tool_name]["func"]
                        try:
                            result = tool_func(**args)
                        except Exception as e:
                            result = {"status": "error", "message": str(e)}
                            
                        tool_calls_executed.append({
                            "tool": tool_name,
                            "status": "completed",
                            "input": args,
                            "result_summary": str(result)[:500] + "..."
                        })
                        
                        if isinstance(result, dict):
                            if "url" in result:
                                sources.append({"name": "NASA ADS", "url": result["url"]})
                            elif "results" in result and isinstance(result["results"], list):
                                for r in result["results"]:
                                    if isinstance(r, dict) and "url" in r:
                                        sources.append({"name": r.get("title", "NASA ADS"), "url": r["url"]})
                            if "source" in result:
                                sources.append({"name": result["source"]})
                            
                        current_messages.append({
                            "role": "assistant",
                            "content": response_text
                        })
                        current_messages.append({
                            "role": "user",
                            "content": f"TOOL RESULT: {json.dumps(result)}"
                        })
                        continue
                    else:
                        current_messages.append({
                            "role": "assistant",
                            "content": response_text
                        })
                        current_messages.append({
                            "role": "user",
                            "content": f"ERROR: Tool {tool_name} not found."
                        })
                        continue
                except json.JSONDecodeError:
                    pass
            
            unique_sources = []
            seen = set()
            for s in sources:
                ident = s.get("url", s.get("name"))
                if ident not in seen:
                    seen.add(ident)
                    unique_sources.append(s)

            return {
                "answer": response_text,
                "tool_calls": tool_calls_executed,
                "sources": unique_sources,
                "agent_status": "completed"
            }
            
        return {
            "answer": "Agent reached maximum tool iterations. Final answer not generated.",
            "tool_calls": tool_calls_executed,
            "sources": sources,
            "agent_status": "interrupted"
        }

