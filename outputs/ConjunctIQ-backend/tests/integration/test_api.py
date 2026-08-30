from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health_and_validation():
    assert client.get('/api/health').status_code==200
    assert client.post('/api/ingest',json={"updates":[{"event_id":"bad"}]}).status_code==422
