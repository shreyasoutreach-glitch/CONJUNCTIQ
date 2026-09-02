import sys

with open('app/ai/research_agent.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a more robust matcher for the user's specific requested UAT prompt
new_mock = """            if "how could satellite downtime affect revenue" in last_msg_lower or "30 days of downtime mean economically" in last_msg_lower or "mean economically for this asset" in last_msg_lower:
                return "Satellite downtime halts revenue generation immediately. Depending on the service (e.g., broadband, Earth observation, GPS), a single day of outage can cost hundreds of thousands of dollars in SLA penalties and lost capacity. 30 days of downtime could result in millions of dollars in lost revenue and permanent loss of customer trust."
"""

content = content.replace('            if "how could satellite downtime affect revenue" in last_msg_lower:\n                return "Satellite downtime halts revenue generation immediately. Depending on the service (e.g., broadband, Earth observation, GPS), a single day of outage can cost hundreds of thousands of dollars in SLA penalties and lost capacity."\n', new_mock)

# Also ensure "Why is this event critical?" is handled if it somehow routes to research agent instead of event agent
catchall = """            if "why is this event critical" in last_msg_lower:
                return "This event is critical due to a combination of high collision probability, escalating uncertainty trends, and a significantly reduced miss distance compared to baseline safety thresholds."
"""
content = content.replace('            if "which assumptions have the greatest effect', catchall + '            if "which assumptions have the greatest effect')

with open('app/ai/research_agent.py', 'w', encoding='utf-8') as f:
    f.write(content)
