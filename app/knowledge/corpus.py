DOCUMENTS=[
 {"title":"Conjunction basics","content":"A conjunction is a predicted close approach between two orbiting objects. It is an assessment event, not proof of a collision."},
 {"title":"TCA and miss distance","content":"Time of closest approach (TCA) is when the predicted separation is smallest. Miss distance is the predicted separation at that time."},
 {"title":"Uncertainty and tracking","content":"Orbital uncertainty describes limits in positional knowledge. New tracking can refine estimates, but this prototype does not task sensors or plan maneuvers."},
]
def retrieve(question: str, limit=2):
    words=set(question.lower().split())
    def _score(d):
        title_words=set(d['title'].lower().split())
        content_words=set(d['content'].lower().split())
        # Title matches count double to surface clearly relevant documents
        return 2*len(words & title_words) + len(words & content_words)
    ranked=sorted(DOCUMENTS,key=_score,reverse=True)
    return ranked[:limit]
