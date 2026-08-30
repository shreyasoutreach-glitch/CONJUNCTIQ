from app.schemas import Assessment, UpdateInput
class LLMProvider:
    def briefing(self, audience, event, assessment, evidence, changes, observation, context): raise NotImplementedError
class MockProvider(LLMProvider):
    def briefing(self,audience,event,assessment,evidence,changes,observation,context):
        facts=f"Update {event.update_number} reports miss distance {event.miss_distance_km} km and collision probability {event.collision_probability}."
        return {"status":"mock","audience":audience,"observed_facts":facts,"calculated_assessment":f"{assessment.classification} (score {assessment.score}/100).","interpretation":f"{changes['status'].capitalize()} based on available update comparison. {observation['suggestion']}","uncertainty":assessment.disclaimer,"grounding":[x['title'] for x in context]}
class UnavailableProvider(LLMProvider):
    def briefing(self,*args,**kwargs): return {"status":"unavailable","message":"AI provider is unavailable; deterministic assessment remains available."}
def get_provider(name="mock"): return MockProvider() if name=="mock" else UnavailableProvider()
