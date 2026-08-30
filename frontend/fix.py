import re

with open('src/scene/OrbitalScene.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_string = '{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{label}</span></span>'
good_string = '{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{label}</span>'

content = content.replace(bad_string, good_string)

with open('src/scene/OrbitalScene.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
