import urllib.request
import json
req = urllib.request.Request(
    'http://127.0.0.1:8001/api/events/DEMO-003/simulate',
    data=json.dumps({'radial_uncertainty_km': 6, 'along_track_uncertainty_km': 14, 'cross_track_uncertainty_km': 3}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as f:
    print(json.loads(f.read().decode('utf-8')))
