"""
AI provider layer — supports IBM Granite (via watsonx.ai), OpenAI-compatible
endpoints, and a deterministic mock for offline/demo use.

Architecture:
    get_provider(name) → LLMProvider
    provider.briefing(audience, event, assessment, evidence, changes, observation, context)
    provider.chat(question, event, assessment, evidence, changes, observation, context)

The mock always works without credentials.
Granite requires CONJUNCTIQ_LLM_API_KEY + CONJUNCTIQ_WATSONX_URL + CONJUNCTIQ_WATSONX_PROJECT_ID.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from app.schemas import Assessment, UpdateInput
from app.core.config import settings

log = logging.getLogger(__name__)

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
_SYSTEM = (
    "You are ConjunctIQ Analysis Assistant, an expert orbital conjunction analyst. "
    "You are embedded in ConjunctIQ, a decision-support system. "
    "You provide grounded, evidence-based analysis of spacecraft conjunction events. "
    "You speak clearly and precisely. "
    "You never claim to predict a collision — you assess attention and information quality. "
    "You always acknowledge uncertainty. "
    "You never give maneuver recommendations or spacecraft commands. "
    "When given deterministic assessment data, you explain it clearly. "
    "When asked conversational questions (e.g. 'hello', 'what can you do'), respond helpfully. "
    "Keep responses concise and factual unless depth is asked for."
)

# ─── BASE ─────────────────────────────────────────────────────────────────────

class LLMProvider:
    name: str = "base"

    def briefing(
        self,
        audience: str,
        event: UpdateInput,
        assessment: Assessment,
        evidence: list,
        changes: dict,
        observation: dict,
        context: list[dict],
    ) -> dict[str, Any]:
        raise NotImplementedError

    def chat(
        self,
        question: str,
        event: UpdateInput,
        assessment: Assessment,
        evidence: list,
        changes: dict,
        observation: dict,
        context: list[dict],
    ) -> dict[str, Any]:
        # Default: reuse briefing with the question injected
        return self.briefing(
            audience="analyst",
            event=event,
            assessment=assessment,
            evidence=evidence,
            changes=changes,
            observation=observation,
            context=context,
        )


# ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

def _build_context_block(
    audience: str,
    event: UpdateInput,
    assessment: Assessment,
    evidence: list,
    changes: dict,
    observation: dict,
) -> str:
    """Build a compact text block that grounds the LLM response in real data."""
    prob_str = (
        f"{event.collision_probability:.3e}" if event.collision_probability is not None else "not reported"
    )
    miss_str = (
        f"{event.miss_distance_km} km" if event.miss_distance_km is not None else "not reported"
    )
    vel_str = (
        f"{event.relative_velocity_km_s} km/s" if event.relative_velocity_km_s is not None else "not reported"
    )
    unc_vals = [
        v for v in (
            event.radial_uncertainty_km,
            event.along_track_uncertainty_km,
            event.cross_track_uncertainty_km,
        )
        if v is not None
    ]
    unc_str = f"max {max(unc_vals)} km" if unc_vals else "not reported"

    factor_lines = "\n".join(
        f"  - {f['factor'].replace('_', ' ')}: +{f['points']} pts — {f['explanation']}"
        for f in assessment.factors
    )

    change_status = changes.get("status", "unknown")
    change_lines = ""
    for c in changes.get("changes", []):
        if c.get("significance") == "high":
            change_lines += f"  - {c['field']}: {c.get('previous')} → {c.get('current')} ({c.get('direction', '')})\n"

    return f"""
=== CONJUNCTION EVENT CONTEXT ===
Event ID: {event.event_id}
Primary Object: {event.primary_object_id}
Secondary Object: {event.secondary_object_id}
TCA: {event.time_of_closest_approach.isoformat()}
Update #{event.update_number}
Data Source: {event.data_source or "not specified"}

=== DETERMINISTIC ASSESSMENT ===
Score: {assessment.score}/100
Classification: {assessment.classification}
{factor_lines}

=== KEY METRICS ===
Miss Distance: {miss_str}
Collision Probability: {prob_str}
Relative Velocity: {vel_str}
Max Positional Uncertainty: {unc_str}

=== TREND ANALYSIS ===
Status: {change_status}
{change_lines}

=== NEXT OBSERVATION ===
Priority: {observation.get('priority', 'unknown')}
Information Gap: {observation.get('information_gap', 'unknown')}
Suggestion: {observation.get('suggestion', 'none')}

=== AUDIENCE ===
{audience}

=== DISCLAIMERS ===
This is decision support only. Not a maneuver recommendation.
Not a collision probability prediction. Scores are attention weights.
""".strip()


# ─── GRANITE (IBM WATSONX.AI) ─────────────────────────────────────────────────

class GraniteProvider(LLMProvider):
    """IBM Granite via watsonx.ai ModelInference."""

    name = "granite"

    def __init__(self, api_key: str, url: str, project_id: str, model_id: str):
        self.api_key = api_key
        self.url = url
        self.project_id = project_id
        self.model_id = model_id
        self._model = None

    def _get_model(self):
        if self._model is not None:
            return self._model
        try:
            from ibm_watsonx_ai import Credentials
            from ibm_watsonx_ai.foundation_models import ModelInference

            creds = Credentials(api_key=self.api_key, url=self.url)
            self._model = ModelInference(
                model_id=self.model_id,
                credentials=creds,
                project_id=self.project_id,
                params={
                    "max_new_tokens": 512,
                    "temperature": 0.3,
                    "repetition_penalty": 1.1,
                },
            )
            log.info("Granite model initialised: %s", self.model_id)
        except Exception as exc:
            log.error("Failed to init Granite model: %s", exc)
            raise
        return self._model

    def _call(self, prompt: str) -> str:
        model = self._get_model()
        resp = model.generate_text(prompt=prompt)
        return resp.strip() if isinstance(resp, str) else str(resp)

    def briefing(self, audience, event, assessment, evidence, changes, observation, context) -> dict:
        ctx = _build_context_block(audience, event, assessment, evidence, changes, observation)
        docs = "\n".join(f"[{d['title']}] {d['content']}" for d in context)
        audience_guide = {
            "operator": "Provide a concise technical briefing for a spacecraft operator. Focus on what needs attention and why.",
            "analyst": "Provide a detailed analytical briefing. Include trend analysis, data quality, and recommended information priorities.",
            "public": "Explain this conjunction event in plain language without jargon. Use analogies where helpful. Do not alarm unnecessarily.",
        }.get(audience, "Provide a balanced briefing.")

        prompt = f"""{_SYSTEM}

{ctx}

=== KNOWLEDGE CONTEXT ===
{docs}

=== TASK ===
{audience_guide}

Write a briefing for the {audience} audience. Structure:
1. Observed facts (what the data shows)
2. Assessment interpretation (what the score means)
3. Trend and context (how this compares to earlier updates)
4. What to watch next

Keep it grounded in the data above. Do not speculate beyond what the data supports.
"""
        try:
            text = self._call(prompt)
            return {
                "status": "granite",
                "provider": self.model_id,
                "audience": audience,
                "content": text,
                "observed_facts": f"Update {event.update_number}: miss distance {event.miss_distance_km} km, probability {event.collision_probability}.",
                "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
                "interpretation": text,
                "uncertainty": assessment.disclaimer,
                "grounding": [d["title"] for d in context],
            }
        except Exception as exc:
            log.error("Granite briefing failed: %s", exc)
            return _fallback_briefing(audience, event, assessment, evidence, changes, observation, context, error=str(exc))

    def chat(self, question, event, assessment, evidence, changes, observation, context) -> dict:
        ctx = _build_context_block("analyst", event, assessment, evidence, changes, observation)
        docs = "\n".join(f"[{d['title']}] {d['content']}" for d in context)

        prompt = f"""{_SYSTEM}

{ctx}

=== KNOWLEDGE CONTEXT ===
{docs}

=== USER QUESTION ===
{question}

Answer the question directly and concisely. If the question is conversational (e.g. greetings), respond naturally but briefly steer toward the conjunction data you have. Stay grounded in the event data above.
"""
        try:
            text = self._call(prompt)
            return {
                "status": "granite",
                "provider": self.model_id,
                "question": question,
                "answer": text,
                "observed_facts": text,
                "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
                "interpretation": text,
                "uncertainty": assessment.disclaimer,
                "grounding": [d["title"] for d in context],
            }
        except Exception as exc:
            log.error("Granite chat failed: %s", exc)
            fb = _fallback_briefing("analyst", event, assessment, evidence, changes, observation, context, error=str(exc))
            fb["question"] = question
            return fb


# ─── OPENAI-COMPATIBLE ────────────────────────────────────────────────────────

class OpenAICompatibleProvider(LLMProvider):
    """Works with any OpenAI-compatible endpoint (OpenAI, Ollama, etc.)."""

    name = "openai_compatible"

    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    def _call(self, messages: list[dict]) -> str:
        import httpx

        resp = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={"model": self.model, "messages": messages, "max_tokens": 512, "temperature": 0.3},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()

    def briefing(self, audience, event, assessment, evidence, changes, observation, context) -> dict:
        ctx = _build_context_block(audience, event, assessment, evidence, changes, observation)
        docs = "\n".join(f"[{d['title']}] {d['content']}" for d in context)
        try:
            text = self._call([
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": f"{ctx}\n\nKnowledge:\n{docs}\n\nWrite a briefing for audience: {audience}."},
            ])
            return {
                "status": "openai_compatible",
                "provider": self.model,
                "audience": audience,
                "content": text,
                "observed_facts": f"Update {event.update_number}: miss distance {event.miss_distance_km} km.",
                "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
                "interpretation": text,
                "uncertainty": assessment.disclaimer,
                "grounding": [d["title"] for d in context],
            }
        except Exception as exc:
            log.error("OpenAI-compatible briefing failed: %s", exc)
            return _fallback_briefing(audience, event, assessment, evidence, changes, observation, context, error=str(exc))

    def chat(self, question, event, assessment, evidence, changes, observation, context) -> dict:
        ctx = _build_context_block("analyst", event, assessment, evidence, changes, observation)
        docs = "\n".join(f"[{d['title']}] {d['content']}" for d in context)
        try:
            text = self._call([
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": f"{ctx}\n\nKnowledge:\n{docs}\n\nQuestion: {question}"},
            ])
            return {
                "status": "openai_compatible",
                "question": question,
                "answer": text,
                "observed_facts": text,
                "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
                "interpretation": text,
                "uncertainty": assessment.disclaimer,
                "grounding": [d["title"] for d in context],
            }
        except Exception as exc:
            log.error("OpenAI-compatible chat failed: %s", exc)
            fb = _fallback_briefing("analyst", event, assessment, evidence, changes, observation, context, error=str(exc))
            fb["question"] = question
            return fb


# ─── DETERMINISTIC MOCK ───────────────────────────────────────────────────────

def _fallback_briefing(audience, event, assessment, evidence, changes, observation, context, error=None) -> dict:
    """Deterministic rule-based fallback — always available even without AI credentials."""
    facts = (
        f"Update {event.update_number} reports miss distance "
        f"{event.miss_distance_km if event.miss_distance_km is not None else 'unknown'} km "
        f"and collision probability "
        f"{event.collision_probability if event.collision_probability is not None else 'not reported'}."
    )
    trend = changes.get("status", "unknown")
    suggestion = observation.get("suggestion", "")
    interpretation = (
        f"Status trend is {trend}. {suggestion} "
        f"Score {assessment.score}/100 — {assessment.classification}."
    )
    result = {
        "status": "mock",
        "audience": audience,
        "observed_facts": facts,
        "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
        "interpretation": interpretation,
        "uncertainty": assessment.disclaimer,
        "grounding": [d["title"] for d in context],
    }
    if error:
        result["ai_error"] = error
        result["status"] = "mock_fallback"
    return result


class MockProvider(LLMProvider):
    """
    Deterministic offline assistant.

    This is intentionally more conversational than the original fallback:
    it answers common operator questions from the actual event/assessment data
    instead of returning the same generic trend sentence for every question.
    """

    name = "mock"

    def briefing(self, audience, event, assessment, evidence, changes, observation, context) -> dict:
        return _fallback_briefing(
            audience, event, assessment, evidence, changes, observation, context
        )

    @staticmethod
    def _fmt(value, suffix=""):
        if value is None:
            return "not reported"
        return f"{value}{suffix}"

    def chat(self, question, event, assessment, evidence, changes, observation, context) -> dict:
        q = question.lower().strip()

        miss = self._fmt(event.miss_distance_km, " km")
        prob = (
            f"{event.collision_probability:.3e}"
            if event.collision_probability is not None
            else "not reported"
        )
        velocity = self._fmt(event.relative_velocity_km_s, " km/s")

        uncertainty_values = [
            v for v in (
                event.radial_uncertainty_km,
                event.along_track_uncertainty_km,
                event.cross_track_uncertainty_km,
            )
            if v is not None
        ]
        uncertainty = (
            f"{max(uncertainty_values):g} km maximum component"
            if uncertainty_values else "not reported"
        )

        trend = changes.get("status", "unknown")
        suggestion = observation.get("suggestion", "No next-observation suggestion is available.")
        info_gap = observation.get("information_gap", "No information gap is recorded.")

        # Evidence is deterministic backend output. Surface the actual factors
        # rather than inventing an explanation.
        factor_text = ", ".join(
            f"{f.get('factor', 'unknown').replace('_', ' ')} (+{f.get('points', 0)} pts)"
            for f in assessment.factors
        ) or "no contributing factors reported"

        high_changes = [
            c for c in changes.get("changes", [])
            if c.get("significance") == "high"
        ]

        # Conversational questions
        if q in {"hello", "hi", "hey", "howdy", "who are you"} or q.startswith("what can you do"):
            answer = (
                f"I'm the ConjunctIQ Analysis Assistant for event {event.event_id}. "
                f"I can explain this event's score, miss distance, collision probability, "
                f"uncertainty, trend, evidence, and next information priority. "
                f"Current assessment: {assessment.classification}, {assessment.score}/100."
            )

        elif any(x in q for x in ("why", "critical", "flagged", "score", "attention")):
            answer = (
                f"This event has an attention score of {assessment.score}/100 and is classified "
                f"as {assessment.classification}. The deterministic assessment factors are: "
                f"{factor_text}. "
                f"That score is an attention/triage weight, not a prediction that a collision will occur."
            )

        elif any(x in q for x in ("miss distance", "miss", "distance", "how close", "close is")):
            answer = (
                f"The reported miss distance is {miss}. "
                f"That is the closest-approach separation represented by this update. "
                f"The assessment should be interpreted together with uncertainty and the other "
                f"contributing factors, rather than from distance alone."
            )

        elif any(x in q for x in ("probability", "collision probability", "chance", "risk")):
            answer = (
                f"The reported collision probability is {prob}. "
                f"ConjunctIQ does not treat that number as a guaranteed outcome or as a prediction. "
                f"The current deterministic attention classification is {assessment.classification} "
                f"with a score of {assessment.score}/100."
            )

        elif any(x in q for x in ("uncertainty", "uncertain", "error", "confidence")):
            answer = (
                f"The reported maximum positional-uncertainty component is {uncertainty}. "
                f"The three components are radial={self._fmt(event.radial_uncertainty_km, ' km')}, "
                f"along-track={self._fmt(event.along_track_uncertainty_km, ' km')}, and "
                f"cross-track={self._fmt(event.cross_track_uncertainty_km, ' km')}. "
                f"The current information gap is: {info_gap}"
            )

        elif any(x in q for x in ("velocity", "speed", "relative velocity")):
            answer = f"The reported relative velocity at the conjunction is {velocity}."

        elif any(x in q for x in ("tca", "closest approach", "when", "time")):
            answer = (
                f"The time of closest approach (TCA) for the current update is "
                f"{event.time_of_closest_approach.isoformat()}. "
                f"This is update #{event.update_number} for {event.event_id}."
            )

        elif any(x in q for x in ("changed", "change", "trend", "escalat", "worse", "better")):
            if high_changes:
                changes_text = "; ".join(
                    f"{c.get('field', 'field').replace('_', ' ')} changed from "
                    f"{c.get('previous')} to {c.get('current')} ({c.get('direction', 'changed')})"
                    for c in high_changes
                )
                answer = (
                    f"The trend status is {trend}. High-significance changes recorded by the "
                    f"backend are: {changes_text}. "
                    f"This is why the event may require renewed attention."
                )
            else:
                answer = (
                    f"The current trend status is {trend}. "
                    f"No high-significance changes are recorded in the available change analysis."
                )

        elif any(x in q for x in ("next", "investigate", "investigation", "observe", "observation", "missing", "information")):
            answer = (
                f"The next information priority is to address this gap: {info_gap} "
                f"The backend's suggested next observation is: {suggestion}"
            )

        elif any(x in q for x in ("object", "satellite", "spacecraft")):
            answer = (
                f"This conjunction involves {event.primary_object_id} and "
                f"{event.secondary_object_id}. "
                f"The current update is #{event.update_number}, sourced from "
                f"{event.data_source or 'an unspecified data source'}."
            )

        elif any(x in q for x in ("summary", "summarize", "overview", "tell me about")):
            answer = (
                f"Event {event.event_id}: {event.primary_object_id} ↔ {event.secondary_object_id}. "
                f"TCA {event.time_of_closest_approach.isoformat()}; miss distance {miss}; "
                f"collision probability {prob}; relative velocity {velocity}. "
                f"Assessment is {assessment.classification} at {assessment.score}/100, "
                f"with trend status {trend}. Next information priority: {info_gap}."
            )

        else:
            # Do not pretend to understand an arbitrary question. Give the user
            # useful event context and explicitly offer the supported topics.
            answer = (
                f"I can answer that only if it can be grounded in this event's available data. "
                f"For {event.event_id}, the key facts are miss distance {miss}, collision "
                f"probability {prob}, relative velocity {velocity}, and assessment "
                f"{assessment.classification} ({assessment.score}/100). "
                f"You can ask me specifically about the score, why it was flagged, miss distance, "
                f"probability, uncertainty, TCA, changes/trend, or what to investigate next."
            )

        return {
            "status": "mock",
            "question": question,
            "answer": answer,
            "observed_facts": answer,
            "calculated_assessment": f"{assessment.classification} (score {assessment.score}/100).",
            "interpretation": answer,
            "uncertainty": assessment.disclaimer,
            "grounding": [d["title"] for d in context],
        }


class UnavailableProvider(LLMProvider):
    name = "unavailable"

    def briefing(self, *args, **kwargs) -> dict:
        return {
            "status": "unavailable",
            "message": "AI provider is unavailable; deterministic assessment remains available.",
        }

    def chat(self, question, *args, **kwargs) -> dict:
        return {
            "status": "unavailable",
            "question": question,
            "answer": "AI provider is unavailable. Deterministic assessment data is available on the Overview tab.",
            "message": "AI provider is unavailable; deterministic assessment remains available.",
        }


# ─── FACTORY ─────────────────────────────────────────────────────────────────

def get_provider(name: str = "mock") -> LLMProvider:
    """Return the configured AI provider.

    The mock provider is always available and requires no credentials.
    If a real provider is requested but its credentials are missing,
    fall back safely to the mock provider.
    """
    name = (name or "mock").strip().lower()

    if name == "granite":
        if not settings.llm_api_key or not settings.watsonx_project_id:
            log.warning(
                "Granite requested but CONJUNCTIQ_LLM_API_KEY or "
                "CONJUNCTIQ_WATSONX_PROJECT_ID is not set; "
                "falling back to mock provider."
            )
            return MockProvider()
        return GraniteProvider(
            api_key=settings.llm_api_key,
            watsonx_url=settings.watsonx_url,
            project_id=settings.watsonx_project_id,
            model_id=settings.watsonx_model_id,
        )

    if name == "openai_compatible":
        if not settings.llm_api_key:
            log.warning(
                "OpenAI-compatible provider requested but "
                "CONJUNCTIQ_LLM_API_KEY is not set; "
                "falling back to mock provider."
            )
            return MockProvider()
        return OpenAICompatibleProvider(
            api_key=settings.llm_api_key,
            base_url=settings.openai_base_url,
            model=settings.openai_model,
        )

    if name == "mock":
        return MockProvider()

    log.warning(
        "Unknown AI provider '%s'; falling back to mock provider.",
        name,
    )
    return MockProvider() 
