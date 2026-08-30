import urllib.request
import json
import time

questions = [
    ("A", "what can you do?"),
    ("B", "what is JPL Horizons?"),
    ("C", "where is asteroid Apophis?"),
    ("D", "what is Sirius?"),
    ("E", "find papers about orbital debris mitigation"),
    ("F", "simulate orbital decay for a satellite at 400 km altitude"),
    ("G", "what objects are in space?")
]

url = 'http://127.0.0.1:8001/api/research/chat'

for label, q in questions:
    req = urllib.request.Request(
        url,
        data=json.dumps({'messages': [{'role': 'user', 'content': q}]}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as f:
            res = json.loads(f.read().decode('utf-8'))
            print(f"[{label}] Q: {q}")
            print(f"    Ans: {res['answer'][:100]}...")
            if 'tool_calls' in res and len(res['tool_calls']) > 0:
                print(f"    Tools Executed: {[tc['tool'] for tc in res['tool_calls']]}")
            print("-" * 40)
    except Exception as e:
        print(f"[{label}] ERROR: {e}")
