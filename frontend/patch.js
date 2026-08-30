import fs from 'fs';

let content = fs.readFileSync('src/scene/OrbitalScene.tsx', 'utf8');

// 1. EARTH_RADIUS
content = content.replace(/const EARTH_RADIUS = 2;/, 'const EARTH_RADIUS = 2.4;');

// 2. Earth function
const earthRegex = /function Earth\(\) \{[\s\S]*?return \([\s\S]*?<group>[\s\S]*?<mesh ref=\{meshRef\}>[\s\S]*?<\/mesh>\s*<\/group>\s*\);\s*\}/;

const newEarth = unction Earth() {
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
};

content = content.replace(earthRegex, newEarth);

// 3. Conjunction Marker
content = content.replace(/color="#7700ff"/g, 'color="#ff3333"');
content = content.replace(/>TCA</g, '>CONJUNCTION<');

// 4. Tracked Object Labels
content = content.replace(/\{label\}/, '{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{label}</span>');
content = content.replace(/\{label\}/, '{isPrimary ? "PRIMARY OBJECT" : "SECONDARY OBJECT"}<br/><span style={{ fontSize: "10px", color: "#fff" }}>{label}</span>');

fs.writeFileSync('src/scene/OrbitalScene.tsx', content);
console.log("Replaced successfully!");
