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
        self.provider = get_provider("research")

    def _generate(self, messages: List[Dict[str, str]]) -> str:
        if isinstance(self.provider, MockProvider):
            if not messages:
                return "This is an orbital conjunction research system. I can search literature, query JPL Horizons or SIMBAD, and run orbital simulations."
                
            last_msg = messages[-1]["content"]
            
            if "TOOL RESULT:" in last_msg or "ERROR:" in last_msg:
                prev_content = messages[-2]["content"] if len(messages) >= 2 else ""
                if "query_jpl_horizons" in prev_content:
                    target = "The object"
                    if "Apophis" in prev_content or "apophis" in prev_content.lower():
                        target = "Apophis"
                    return f"Based on the retrieved JPL Horizons data, {target} is a near-Earth asteroid actively monitored by NASA's CNEOS."
                elif "query_simbad" in prev_content:
                    return "According to the SIMBAD database, Sirius is a well-known binary star system (Sirius A and B) located in the constellation Canis Major. It is the brightest star in Earth's night sky."
                elif "query_nasa_ads" in prev_content:
                    return "The NASA ADS literature search confirms that recent research heavily focuses on active orbital debris mitigation, including atmospheric drag sails, laser ablation, and robotic capture technologies."
                return "Based on the retrieved tool data, this is a simulated synthesis of the research."
            
            last_msg_lower = last_msg.lower()
            
            # General Knowledge Tests
            if "what are query jpl horizons" in last_msg_lower or "what is jpl horizons" in last_msg_lower:
                return "JPL Horizons is an online solar system data and ephemeris computation service that provides access to key physical and orbital data for solar system objects."
            if "what objects are in space" in last_msg_lower:
                return "Space contains planets, moons, asteroids, comets, stars, and artificial satellites, as well as vast amounts of cosmic dust and plasma."
            if "what is an asteroid" in last_msg_lower:
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
            if "explain astrophysics" in last_msg_lower:
                return "Astrophysics is a branch of space science that applies the laws of physics and chemistry to explain the birth, life and death of stars, planets, galaxies, nebulae and other objects in the universe."
            
            # Tool Triggers
            if "debris" in last_msg_lower or "nasa" in last_msg_lower or "papers" in last_msg_lower or "research" in last_msg_lower:
                return json.dumps({"tool": "query_nasa_ads", "args": {"query": "orbital debris mitigation"}})
            if "apophis" in last_msg_lower:
                return json.dumps({"tool": "query_jpl_horizons", "args": {"target": "Apophis"}})
            if "eros" in last_msg_lower or "asteroid" in last_msg_lower:
                return json.dumps({"tool": "query_jpl_horizons", "args": {"target": "433 Eros"}})
            if "sirius" in last_msg_lower or "simbad" in last_msg_lower:
                return json.dumps({"tool": "query_simbad", "args": {"identifier": "Sirius"}})
            if "simulate" in last_msg_lower or "simulation" in last_msg_lower:
                return json.dumps({"tool": "run_orbital_simulation", "args": {"semi_major_axis_km": 6778, "eccentricity": 0.001, "inclination_deg": 51.6, "mass_kg": 420000, "area_m2": 1000, "cd": 2.2, "simulation_days": 30}})
            
            return "This is an orbital conjunction research system. I can search literature, query JPL Horizons or SIMBAD, and run orbital simulations."

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



