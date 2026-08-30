import re

with open('src/scene/OrbitalScene.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Radius
content = re.sub(r'const EARTH_RADIUS = 2;', 'const EARTH_RADIUS = 2.4;', content)

# 2. Earth
earth_regex = r'function Earth\(\) \{.*?return \([\s\S]*?<group>\s*<mesh ref=\{meshRef\}>[\s\S]*?<\/mesh>\s*<\/group>\s*\);\s*\}'
new_earth = """function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const earthTexture = useMemo(() => createEarthTexture(), []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.9}
          metalness={0.05}
          emissive="#081528"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.02, 32, 32]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}"""
content = re.sub(earth_regex, new_earth, content, flags=re.DOTALL)

# 3. Conjunction Marker
content = content.replace('color="#7700ff"', 'color="#ff3333"')
content = content.replace('>TCA<', '>CONJUNCTION<')

# 4. Labels
content = content.replace('{label}', '{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{label}</span>')

with open('src/scene/OrbitalScene.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
