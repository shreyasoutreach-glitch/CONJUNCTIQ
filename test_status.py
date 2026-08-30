import urllib.request
import json
print("STATUS:")
req = urllib.request.Request('http://127.0.0.1:8001/api/status')
with urllib.request.urlopen(req) as f:
    print(json.loads(f.read().decode('utf-8')))
print("\nEVENTS:")
req = urllib.request.Request('http://127.0.0.1:8001/api/events')
with urllib.request.urlopen(req) as f:
    print(len(json.loads(f.read().decode('utf-8'))))
