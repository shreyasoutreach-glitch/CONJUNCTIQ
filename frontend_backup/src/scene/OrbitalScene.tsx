import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { EventListItem, EventDetail } from "../api/types";

const EARTH_RADIUS = 2;

// ── Procedural Earth texture — dark, scientific ──────────────────────────────
function createEarthTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Deep ocean base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, "#06122a");
  oceanGrad.addColorStop(0.5, "#081a38");
  oceanGrad.addColorStop(1, "#06122a");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Procedural continents — dark green/grey, illuminated edges
  const landmasses = [
    { x: 120, y: 120, w: 180, h: 140, color: "#1a2e1a" },
    { x: 350, y: 100, w: 120, h: 200, color: "#1e321e" },
    { x: 520, y: 150, w: 200, h: 180, color: "#1a2e1a" },
    { x: 780, y: 130, w: 140, h: 100, color: "#1e321e" },
    { x: 200, y: 300, w: 100, h: 120, color: "#1a2e1a" },
    { x: 600, y: 320, w: 160, h: 100, color: "#1e321e" },
    { x: 850, y: 280, w: 120, h: 140, color: "#1a2e1a" },
  ];

  for (const lm of landmasses) {
    ctx.fillStyle = lm.color;
    ctx.beginPath();
    ctx.ellipse(lm.x + lm.w / 2, lm.y + lm.h / 2, lm.w / 2, lm.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = lm.w / 2 + (Math.random() - 0.5) * 40;
      const ry = lm.h / 2 + (Math.random() - 0.5) * 40;
      ctx.beginPath();
      ctx.ellipse(
        lm.x + lm.w / 2 + Math.cos(angle) * rx * 0.3,
        lm.y + lm.h / 2 + Math.sin(angle) * ry * 0.3,
        rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Polar ice — subtle
  ctx.fillStyle = "rgba(180, 200, 220, 0.5)";
  ctx.fillRect(0, 0, 1024, 24);
  ctx.fillRect(0, 488, 1024, 24);

  // Grid lines — scientific overlay
  ctx.strokeStyle = "rgba(61, 196, 224, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 1024; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
  }
  for (let i = 0; i < 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
  }

  // Noise
  const imgData = ctx.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
    imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
    imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// ── Earth ────────────────────────────────────────────────────────────────────
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthTexture = useMemo(() => createEarthTexture(), []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.025;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.9}
          metalness={0.05}
          emissive="#081528"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Atmospheric rim — subtle */}
      <mesh scale={1.025}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#3a7ab0" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#2a5080" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const points = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  const starTexture = useMemo(() => createStarTexture(), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={3000}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={starTexture}
        size={0.35}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

// ── Orbital path ──────────────────────────────────────────────────────────────
function OrbitPath({ inclination, radius, color, opacity = 0.25 }: {
  inclination: number;
  radius: number;
  color: string;
  opacity?: number;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group rotation={[inclination, 0, 0]}>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </line>
    </group>
  );
}

// ── Tracked object with label ─────────────────────────────────────────────────
function TrackedObject({
  position,
  color,
  label,
  isPrimary,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  isPrimary?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.008;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <mesh scale={2.5}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      {isPrimary && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.11, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html distanceFactor={8} position={[0, 0.12, 0]} center>
        <div style={{
          fontSize: "8px",
          fontFamily: "var(--font-mono, monospace)",
          color: color,
          whiteSpace: "nowrap",
          textShadow: "0 0 4px rgba(0,0,0,0.9)",
          pointerEvents: "none",
          opacity: 0.85,
          letterSpacing: "0.04em",
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── Conjunction marker — pulsing ──────────────────────────────────────────────
function ConjunctionMarker({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const scale = 1 + Math.sin(t * 2.5) * 0.2;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#d44747" transparent opacity={0.5} />
      </mesh>
      <mesh scale={2.2}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#d44747" transparent opacity={0.1} />
      </mesh>
      <Html distanceFactor={10} position={[0, 0.14, 0]} center>
        <div style={{
          fontSize: "8px",
          fontFamily: "monospace",
          color: "#d44747",
          whiteSpace: "nowrap",
          textShadow: "0 0 4px rgba(0,0,0,0.9)",
          pointerEvents: "none",
          letterSpacing: "0.06em",
          fontWeight: 700,
        }}>
          TCA
        </div>
      </Html>
    </group>
  );
}

// ── Distance line between objects ─────────────────────────────────────────────
function DistanceLine({ pos1, pos2 }: { pos1: [number, number, number]; pos2: [number, number, number] }) {
  const geometry = useMemo(() => {
    const pts = [new THREE.Vector3(...pos1), new THREE.Vector3(...pos2)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [pos1, pos2]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineDashedMaterial
        color="#4a5468"
        transparent
        opacity={0.3}
        dashSize={0.08}
        gapSize={0.06}
      />
    </line>
  );
}

// ── Camera controller ──────────────────────────────────────────────────────────
function CameraController({ targetPosition }: { targetPosition: [number, number, number] }) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const target = new THREE.Vector3(...targetPosition);
    currentTarget.current.lerp(target, 0.05);
    camera.lookAt(currentTarget.current);

    const t = performance.now() * 0.00008;
    const dist = camera.position.length();
    camera.position.x = Math.cos(t) * dist;
    camera.position.z = Math.sin(t) * dist;
  });

  return null;
}

// ── Deterministic hash ─────────────────────────────────────────────────────────
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Scene ──────────────────────────────────────────────────────────────────────
interface SceneProps {
  selectedEvent: EventListItem | null;
  eventDetail: EventDetail | null;
}

function Scene({ selectedEvent, eventDetail }: SceneProps) {
  const orbitParams = useMemo(() => {
    if (!selectedEvent) return null;
    const h1 = hashString(selectedEvent.event.primary_object_id);
    const h2 = hashString(selectedEvent.event.secondary_object_id);
    const h3 = hashString(selectedEvent.event.event_id);

    const inc1 = (h1 % 180) * (Math.PI / 180) * 0.5;
    const inc2 = (h2 % 180) * (Math.PI / 180) * 0.5;
    const radius1 = EARTH_RADIUS * (1.12 + (h1 % 30) / 100);
    const radius2 = EARTH_RADIUS * (1.12 + (h2 % 30) / 100);
    const phase1 = (h3 % 360) * (Math.PI / 180);
    const phase2 = phase1 + 0.15;

    const pos1: [number, number, number] = [
      Math.cos(phase1) * radius1,
      Math.sin(phase1) * radius1 * Math.sin(inc1),
      Math.sin(phase1) * radius1 * Math.cos(inc1),
    ];
    const pos2: [number, number, number] = [
      Math.cos(phase2) * radius2,
      Math.sin(phase2) * radius2 * Math.sin(inc2),
      Math.sin(phase2) * radius2 * Math.cos(inc2),
    ];

    const conjPos: [number, number, number] = [
      (pos1[0] + pos2[0]) / 2,
      (pos1[1] + pos2[1]) / 2,
      (pos1[2] + pos2[2]) / 2,
    ];

    return { inc1, inc2, radius1, radius2, pos1, pos2, conjPos };
  }, [selectedEvent]);

  const cameraTarget: [number, number, number] = orbitParams
    ? orbitParams.conjPos
    : [0, 0, 0];

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 3, 5]} intensity={1.0} color="#fff5e0" />
      <directionalLight position={[-5, -2, -3]} intensity={0.25} color="#3a6a8a" />

      <Earth />
      <Stars />

      {orbitParams && (
        <>
          <OrbitPath inclination={orbitParams.inc1} radius={orbitParams.radius1} color="#3dc4e0" opacity={0.2} />
          <OrbitPath inclination={orbitParams.inc2} radius={orbitParams.radius2} color="#e8a547" opacity={0.2} />

          <TrackedObject
            position={orbitParams.pos1}
            color="#3dc4e0"
            label={selectedEvent?.event.primary_object_id || ""}
            isPrimary
          />
          <TrackedObject
            position={orbitParams.pos2}
            color="#e8a547"
            label={selectedEvent?.event.secondary_object_id || ""}
          />

          <DistanceLine pos1={orbitParams.pos1} pos2={orbitParams.pos2} />
          <ConjunctionMarker position={orbitParams.conjPos} />
        </>
      )}

      <CameraController targetPosition={cameraTarget} />
    </>
  );
}

export default function OrbitalScene({
  selectedEvent,
  eventDetail,
}: {
  selectedEvent: EventListItem | null;
  eventDetail: EventDetail | null;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 6], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#05070b" }}
      dpr={[1, 2]}
    >
      <Scene selectedEvent={selectedEvent} eventDetail={eventDetail} />
    </Canvas>
  );
}
