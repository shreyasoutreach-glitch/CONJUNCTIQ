import urllib.request
import json
req = urllib.request.Request(
    'http://127.0.0.1:8001/api/events/DEMO-003/chat',
    data=json.dumps({'question': 'Why is this event critical?'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as f:
    print(json.loads(f.read().decode('utf-8')))
