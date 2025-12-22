// @ts-nocheck
import React, { useRef, useEffect, useState, useMemo } from "react";
// import Road from "./Road";
import Landscape from "./Landscape";

// Minimal, permissive JSX intrinsic elements to silence editor errors in this file
// (avoids adding project-level declaration files)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Text,
  Box,
  Sphere,
  Cylinder,
  Environment,
  Float,
  Stars,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import {
  GamePhase,
  GameState,
  GateOperation,
  Gate,
  Particle,
  Boss,
} from "../types";
import {
  TRACK_WIDTH,
  PLAYER_SPEED,
  STEER_SPEED,
  BOSS_DISTANCE,
  GATE_SPAWN_INTERVAL,
  LANE_WIDTH,
  CROWD_SPREAD,
  CROWD_RADIUS,
} from "../constants";

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onBossInfo: (boss: Boss) => void;
  orientation?: "auto" | "portrait" | "landscape";

}

// Global state ref to share between React components and R3F loop without context issues
const gameStateRef = {
  current: {
    phase: GamePhase.MENU,
    score: 1,
    potentialScore: 1, // Start with 1 potential
    distance: 0,
    maxDistance: BOSS_DISTANCE,
    sunZ: -BOSS_DISTANCE - 100,
    laneX: 0,
    input: { left: false, right: false },
    gates: [] as Gate[],
    particles: [] as Particle[],
    boss: {
      name: "Yükleniyor...",
      taunt: "...",
      maxHp: 100,
      currentHp: 100,
      z: -BOSS_DISTANCE,
      isActive: false,
    },
    nextGateZ: -30, // Start spawning gates at -30
  },
};

// --- 3D Components ---

type RunnerProps = {
  position: [number, number, number];
  color: string;
  animOffset: number;
  key?: React.Key;
};

const Runner: React.FC<RunnerProps> = ({ position, color, animOffset }) => {
  const mesh = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (mesh.current) {
      // Bobbing animation for running
      const t = state.clock.getElapsedTime() * 15 + animOffset;
      mesh.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.2;

      // Lean forward slightly
      mesh.current.rotation.x = 0.3;
    }
  });

  return (
    <group ref={mesh} position={[position[0], 0, position[2]]}>
      {/* Body - Neon Cyan */}
      <Cylinder
        args={[CROWD_RADIUS, CROWD_RADIUS * 0.8, 0.8, 8]}
        position={[0, 0.4, 0]}
      >
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </Cylinder>
      {/* Head */}
      <Box
        args={[CROWD_RADIUS * 1.8, CROWD_RADIUS * 1.5, CROWD_RADIUS * 1.8]}
        position={[0, 0.9, 0]}
      >
        <meshStandardMaterial
          color="#00ffff"
          emissive="#0088ff"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={1}
          toneMapped={false}
        />
      </Box>
    </group>
  );
};

const Crowd = () => {
  const group = useRef<THREE.Group>(null);
  const [visibleParticles, setVisibleParticles] = useState<Particle[]>([]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const gs = gameStateRef.current;

    // Smoothly move entire group to lane
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      gs.laneX,
      delta * 10
    );
    // Move forward
    group.current.position.z = gs.distance;

    // Sync particle count for rendering if it changed
    if (visibleParticles.length !== gs.particles.length) {
      setVisibleParticles([...gs.particles]);
    }
  });

  return (
    <group ref={group}>
      {visibleParticles.map((p) => (
        <Runner
          key={p.id}
          position={[p.offset.x, 0, p.offset.z]}
          color="#0ea5e9"
          animOffset={p.id * 10}
        />
      ))}
    </group>
  );
};

type GateMeshProps = { gate: Gate; key?: React.Key };
const GateMesh: React.FC<GateMeshProps> = ({ gate }) => {
  const [opStr, valStr] = useMemo(() => {
    let s = "";
    switch (gate.operation) {
      case GateOperation.ADD:
        s = "+";
        break;
      case GateOperation.SUBTRACT:
        s = "-";
        break;
      case GateOperation.MULTIPLY:
        s = "x";
        break;
      case GateOperation.DIVIDE:
        s = "÷";
        break;
    }
    return [s, gate.value.toString()];
  }, [gate]);

  const neonColor = useMemo(() => {
    // Overwrite standard colors with Neon versions
    return gate.color === "#ef4444" ? "#ff0055" : "#00ff99";
  }, [gate.color]);

  return (
    <group position={[gate.x, 1.5, gate.z]}>
      {/* Energy Field - Solid translucent neon instead of complex glass */}
      <Box args={[gate.width - 0.2, 3, 0.05]}>
        <meshStandardMaterial
          color={neonColor}
          transparent
          opacity={0.3}
          emissive={neonColor}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </Box>

      {/* Neon Frame - Solid Box borders */}
      <Box args={[gate.width, 3.2, 0.1]} position={[0, 0, -0.05]}>
        {/* Using a hollow box trick or just backplate? Let's use simple borders */}
      </Box>

      {/* Top Border */}
      <Box args={[gate.width, 0.2, 0.2]} position={[0, 1.5, 0]}>
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Box>
      {/* Bottom Border */}
      <Box args={[gate.width, 0.2, 0.2]} position={[0, -1.5, 0]}>
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Box>
      {/* Left Border */}
      <Box args={[0.2, 3.2, 0.2]} position={[-gate.width / 2, 0, 0]}>
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Box>
      {/* Right Border */}
      <Box args={[0.2, 3.2, 0.2]} position={[gate.width / 2, 0, 0]}>
        <meshStandardMaterial
          color={neonColor}
          emissive={neonColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Box>

      {/* Floating Text - Using default font to ensure visibility */}
      <Text
        position={[0, 0, 0.2]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor={neonColor}
      >
        {opStr}
        {valStr}
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Text>
    </group>
  );
};

const BossMesh = () => {
  const bossRef = useRef<THREE.Group>(null);
  const [bossData, setBossData] = useState<Boss>(gameStateRef.current.boss);

  useFrame((state) => {
    const gs = gameStateRef.current;

    if (
      gs.boss.isActive !== bossData.isActive ||
      gs.boss.name !== bossData.name
    ) {
      setBossData({ ...gs.boss });
    }

    if (bossRef.current && gs.boss.isActive) {
      bossRef.current.position.z = gs.boss.z;
      bossRef.current.rotation.y += 0.01;
      bossRef.current.rotation.z =
        Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      bossRef.current.position.y =
        2 + Math.sin(state.clock.getElapsedTime()) * 0.5;
    }
  });

  if (!bossData.isActive && gameStateRef.current.phase !== GamePhase.BOSS_FIGHT)
    return null;

  return (
    <group ref={bossRef} position={[0, 0, bossData.z]}>
      {/* Central Core */}
      <Box args={[3, 3, 3]}>
        <meshStandardMaterial color="#220022" roughness={0.1} metalness={0.9} />
      </Box>
      {/* Wireframe Cage */}
      <Box args={[3.5, 3.5, 3.5]}>
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
          wireframe
          toneMapped={false}
        />
      </Box>

      {/* Glowing Eyes */}
      <Box args={[0.8, 0.2, 0.2]} position={[-0.8, 0.5, 1.6]}>
        <meshBasicMaterial color="#ff0000" toneMapped={false} />
      </Box>
      <Box args={[0.8, 0.2, 0.2]} position={[0.8, 0.5, 1.6]}>
        <meshBasicMaterial color="#ff0000" toneMapped={false} />
      </Box>

      {/* Name Tag */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <Text
          position={[0, 4, 0]}
          fontSize={1.2}
          color="#ff00ff"
          anchorX="center"
          anchorY="bottom"
        >
          {bossData.name}
          <meshBasicMaterial color="#ff00ff" toneMapped={false} />
        </Text>
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.6}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
        >
          {Math.floor(gameStateRef.current.boss.currentHp)} HP
        </Text>
      </Float>
    </group>
  );
};

const RetroRoad = ({
  width = 14,
  length = 520,
  dashCount = 34,
}: {
  width?: number;
  length?: number;
  dashCount?: number;
}) => {
  // Yol sabit dünyada; kamera/oyuncu ilerledikçe “akıyormuş” gibi görünür.
  // Bu projede dünya z’si zaten ilerliyor (distance azalıyor), o yüzden road’u merkeze koymak yeterli.

  const dashRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!dashRef.current) return;

    const startZ = -20;
    const endZ = -length + 40;
    const dz = (startZ - endZ) / dashCount;

    for (let i = 0; i < dashCount; i++) {
      const z = startZ - i * dz;
      dummy.position.set(0, 0.115, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      dashRef.current.setMatrixAt(i, dummy.matrix);
    }
    dashRef.current.instanceMatrix.needsUpdate = true;
  }, [dashCount, length, dummy]);

  return (
    <group>
      {/* Asfalt */}
      <mesh position={[0, 0.08, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color="#070711"
          roughness={0.95}
          metalness={0.05}
          emissive="#000000"
        />
      </mesh>

      {/* Neon kenar çizgileri */}
      <mesh
        position={[-width / 2 + 0.25, 0.11, -length / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.22, length]} />
        <meshBasicMaterial color="#ff3bd4" toneMapped={false} />
      </mesh>
      <mesh
        position={[+width / 2 - 0.25, 0.11, -length / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.22, length]} />
        <meshBasicMaterial color="#ffb000" toneMapped={false} />
      </mesh>

      {/* Ortadaki kesik çizgi (instanced) */}
      <instancedMesh
        ref={dashRef}
        args={[undefined as any, undefined as any, dashCount]}
      >
        <planeGeometry args={[0.22, 2.6]} />
        <meshBasicMaterial color="#ffe17a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

const HorizonSun = () => {
  const sunRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!sunRef.current) return;

    const gs = gameStateRef.current;

    // Güneş dünya koordinatında SABİT: hep sunZ’de
    sunRef.current.position.set(0, 16, gs.sunZ);
  });

  return (
    <group ref={sunRef}>
      <mesh>
        <circleGeometry args={[40, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          toneMapped={false}
          fog={false}
          
        />
      </mesh>

      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[0, -10 + i * 4, 0.2]}>
          <planeGeometry args={[80, 2]} />
          <meshBasicMaterial
            color="#1a0b2e"
            toneMapped={false}
            fog={false}
            
          />
        </mesh>
      ))}
    </group>
  );
};



// const WireframeValley = () => {
//   const leftGeo = useMemo(() => {
//     const g = new THREE.PlaneGeometry(520, 140, 90, 26);
//     const pos = g.attributes.position as THREE.BufferAttribute;

//     // "dağ" hissi: sadece Y'yi dalgalandır, alt kısım daha düz kalsın
//     for (let i = 0; i < pos.count; i++) {
//       const x = pos.getX(i);
//       const y = pos.getY(i);

//       // alt kısım (y < 0) daha sakin
//       const strength = THREE.MathUtils.clamp((y + 70) / 140, 0, 1);

//       const n =
//         Math.sin(x * 0.06) * 8 +
//         Math.sin((x + y) * 0.035) * 10 +
//         Math.sin(y * 0.09) * 6;

//       pos.setY(i, y + n * strength);
//     }
//     pos.needsUpdate = true;
//     g.computeVertexNormals();
//     return g;
//   }, []);

//   const rightGeo = useMemo(() => leftGeo.clone(), [leftGeo]);

//   // Kamera dibini boş bırakmak için vadinin başlangıcını ileri alıyoruz
//   const startZ = -320; // vadinin başladığı yer
//   const wallX = TRACK_WIDTH / 2 + 18;

//   return (
//     <group>
//       {/* SOL DAĞ */}
//       <mesh
//         geometry={leftGeo}
//         position={[-wallX, 38, startZ]}
//         rotation={[0, Math.PI / 2.25, 0]}
//       >
//         <meshStandardMaterial
//           color="#05050f"
//           emissive="#2b00ff"
//           emissiveIntensity={1.0}
//           wireframe
//           toneMapped={false}
//         />
//       </mesh>

//       {/* SAĞ DAĞ */}
//       <mesh
//         geometry={rightGeo}
//         position={[+wallX, 38, startZ]}
//         rotation={[0, -Math.PI / 2.25, 0]}
//       >
//         <meshStandardMaterial
//           color="#05050f"
//           emissive="#00c8ff"
//           emissiveIntensity={0.95}
//           wireframe
//           toneMapped={false}
//         />
//       </mesh>
//     </group>
//   );
// };

const PalmAvenue = ({
  perSide = 44,
  spacing = 16,
}: {
  perSide?: number;
  spacing?: number;
}) => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);

  const totalPalms = perSide * 2;
  const leavesPerPalm = 7; // 6-9 arası güzel
  const totalLeaves = totalPalms * leavesPerPalm;

  const zRef = useRef<Float32Array>();
  const jitterRef = useRef<Float32Array>();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    zRef.current = new Float32Array(perSide);
    jitterRef.current = new Float32Array(perSide);
    for (let i = 0; i < perSide; i++) {
      zRef.current[i] = -30 - i * spacing;
      jitterRef.current[i] = (Math.random() - 0.5) * 3.0;
    }
  }, [perSide, spacing]);

  useFrame(({ clock }) => {
    const gs = gameStateRef.current;
    if (
      !trunkRef.current ||
      !leafRef.current ||
      !zRef.current ||
      !jitterRef.current
    )
      return;

    const t = clock.getElapsedTime();
    const recycleLen = perSide * spacing;
    const playerZ = gs.distance;

    for (let i = 0; i < perSide; i++) {
      if (zRef.current[i] > playerZ + 30) zRef.current[i] -= recycleLen;
    }

    // --- TRUNKS ---
    for (let i = 0; i < totalPalms; i++) {
      const side = i < perSide ? -1 : 1;
      const idx = i % perSide;

      const xBase = side * (TRACK_WIDTH / 2 + 8.5);
      const x = xBase + jitterRef.current[idx];
      const z = zRef.current[idx];

      // küçük “sway” (çok az)
      const sway = Math.sin(t * 1.2 + idx * 0.7) * 0.06 * side;

      dummy.position.set(x, 3.2, z);
      dummy.rotation.set(0, side * 0.12, sway);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
    }
    trunkRef.current.instanceMatrix.needsUpdate = true;

    // --- LEAVES (billboard-ish planes) ---
    let leafInstance = 0;
    for (let i = 0; i < totalPalms; i++) {
      const side = i < perSide ? -1 : 1;
      const idx = i % perSide;

      const xBase = side * (TRACK_WIDTH / 2 + 8.5);
      const x = xBase + jitterRef.current[idx];
      const z = zRef.current[idx];

      const sway = Math.sin(t * 1.2 + idx * 0.7) * 0.12; // yaprak biraz daha hareketli
      const topY = 7.2;

      for (let k = 0; k < leavesPerPalm; k++) {
        const ang = (k / leavesPerPalm) * Math.PI * 2;

        // yapraklar yukarıdan dışa doğru açılsın
        dummy.position.set(x, topY, z);
        dummy.scale.set(1.0, 1.0, 1.0);

        // yaprak yönü: Y etrafında dön + X ile aşağı doğru eğ
        const rotY = ang + side * 0.15;
        const rotX = -0.9 + Math.sin(ang) * 0.15; // genel eğim
        const rotZ = sway * (0.6 + k * 0.05);

        dummy.rotation.set(rotX, rotY, rotZ);
        dummy.updateMatrix();

        leafRef.current.setMatrixAt(leafInstance++, dummy.matrix);
      }
    }
    leafRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Trunk: daha palmiye gibi (taper) */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined as any, undefined as any, totalPalms]}
      >
        {/* topRadius, bottomRadius, height */}
        <cylinderGeometry args={[0.22, 0.48, 6.8, 8]} />
        <meshStandardMaterial
          color="#12051b"
          emissive="#ff00ff"
          emissiveIntensity={0.18}
          roughness={0.75}
          metalness={0.05}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Leaves: ince plane “fan” */}
      <instancedMesh
        ref={leafRef}
        args={[undefined as any, undefined as any, totalLeaves]}
      >
        {/* width, height */}
        <planeGeometry args={[4.8, 1.25]} />
        <meshStandardMaterial
          color="#001a14"
          emissive="#00ffd0"
          emissiveIntensity={1.15}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          roughness={0.25}
          metalness={0.05}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

const CameraController = ({ orientation = "auto" }: { orientation?: "auto" | "portrait" | "landscape" }) => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;

    const mode =
      orientation === "auto"
        ? aspect > 1
          ? "landscape"
          : "portrait"
        : orientation;

    if (mode === "landscape") {
      camera.fov = 70;
      camera.position.set(0, 7.5, 18);
    } else {
      camera.fov = 60;
      camera.position.set(0, 6, 14);
    }

    camera.updateProjectionMatrix();
  }, [size, camera, orientation]);

  return null;
};


const GameController = ({
  onScoreChange,
  onPhaseChange,
  onBossInfo,
}: GameCanvasProps) => {
  const { camera } = useThree();
  const internalScore = useRef(1);

  useFrame((state, delta) => {
    const gs = gameStateRef.current;

    if (gs.phase === GamePhase.RUNNING) {
      gs.distance -= PLAYER_SPEED * delta;

      if (gs.input.left) gs.laneX -= STEER_SPEED * delta;
      if (gs.input.right) gs.laneX += STEER_SPEED * delta;

      const maxOffset = TRACK_WIDTH / 2 - 1.5;
      gs.laneX = Math.max(-maxOffset, Math.min(maxOffset, gs.laneX));

      camera.position.z = gs.distance + 12;
      camera.position.y = 6;
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        gs.laneX / 3,
        delta * 3
      );
      camera.lookAt(0, 2, gs.distance - 20); // Look slightly up towards horizon

      if (gs.distance <= gs.sunZ + 35) {
        gs.phase = GamePhase.BOSS_FIGHT;
        onPhaseChange(GamePhase.BOSS_FIGHT);

        gs.boss.isActive = true;
        gs.boss.z = gs.sunZ;

        const calculatedMaxHp = Math.floor(gs.potentialScore * 0.9);
        gs.boss.maxHp = Math.max(50, calculatedMaxHp);
        gs.boss.currentHp = gs.boss.maxHp;

        onBossInfo({ ...gs.boss });
      }

      // Continuous Gate Spawning logic (Horizon method)
      // Spawn gates up to 150 units ahead of the player
      const spawnHorizon = gs.distance - 150;

      // Stop spawning if we are close to boss
      if (gs.nextGateZ > gs.boss.z + 50) {
        while (gs.nextGateZ > spawnHorizon) {
          spawnGates(gs.nextGateZ);
          gs.nextGateZ -= GATE_SPAWN_INTERVAL;
        }
      }

      gs.gates.forEach((gate) => {
        if (gate.hit) return;
        if (gs.distance < gate.z + 1 && gs.distance > gate.z - 1) {
          const crowdLeft = gs.laneX - 1.5;
          const crowdRight = gs.laneX + 1.5;
          const gateLeft = gate.x - gate.width / 2;
          const gateRight = gate.x + gate.width / 2;

          if (crowdRight > gateLeft && crowdLeft < gateRight) {
            gate.hit = true;
            applyGate(gate, onScoreChange, onPhaseChange);
          }
        }
      });
    } else if (gs.phase === GamePhase.BOSS_FIGHT) {
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z,
        gs.distance + 15,
        delta
      );
      camera.lookAt(0, 3, gs.boss.z);

      if (gs.score > 0 && Math.random() < 0.1) {
        gs.score--;
        gs.boss.currentHp -= 1;

        internalScore.current = gs.score;
        onScoreChange(gs.score);
        syncParticles(gs.score);

        if (gs.boss.currentHp <= 0) {
          gs.phase = GamePhase.VICTORY;
          onPhaseChange(GamePhase.VICTORY);
        } else if (gs.score <= 0) {
          gs.phase = GamePhase.GAME_OVER;
          onPhaseChange(GamePhase.GAME_OVER);
        }

        onBossInfo({ ...gs.boss });
      }
    }
  });

  return null;
};

// --- Helpers ---

// Helper to calculate outcome of a gate without applying it
const calculateGateOutcome = (
  currentScore: number,
  op: GateOperation,
  val: number
): number => {
  switch (op) {
    case GateOperation.ADD:
      return currentScore + val;
    case GateOperation.SUBTRACT:
      return Math.max(0, currentScore - val);
    case GateOperation.MULTIPLY:
      return currentScore * val;
    case GateOperation.DIVIDE:
      return Math.floor(currentScore / val);
    default:
      return currentScore;
  }
};

const spawnGates = (z: number) => {
  const isBad = Math.random() > 0.6;
  let operation: GateOperation;
  let value: number;
  let color: string;

  if (isBad) {
    if (Math.random() > 0.5) {
      operation = GateOperation.SUBTRACT;
      value = Math.floor(Math.random() * 20) + 10;
      color = "#ef4444";
    } else {
      operation = GateOperation.DIVIDE;
      value = 2;
      color = "#ef4444";
    }
  } else {
    if (Math.random() > 0.5) {
      operation = GateOperation.ADD;
      value = Math.floor(Math.random() * 30) + 10;
      color = "#22c55e";
    } else {
      operation = GateOperation.MULTIPLY;
      value = 2;
      color = "#3b82f6";
    }
  }

  const gateLeft: Gate = {
    id: Math.random(),
    z: z,
    x: -LANE_WIDTH / 2 - 1,
    width: LANE_WIDTH,
    operation,
    value,
    color,
    hit: false,
  };

  let op2 = GateOperation.ADD;
  let val2 = 5;
  let col2 = "#22c55e";

  if (isBad) {
    op2 = GateOperation.ADD;
    val2 = 10;
    col2 = "#22c55e";
  } else {
    op2 = GateOperation.SUBTRACT;
    val2 = 10;
    col2 = "#ef4444";
  }

  const gateRight: Gate = {
    id: Math.random(),
    z: z,
    x: LANE_WIDTH / 2 + 1,
    width: LANE_WIDTH,
    operation: op2,
    value: val2,
    color: col2,
    hit: false,
  };

  gameStateRef.current.gates.push(gateLeft, gateRight);

  // --- CALCULATE POTENTIAL SCORE ---
  // Assume the player picks the better of the two gates
  const currentPotential = gameStateRef.current.potentialScore;

  const outcomeLeft = calculateGateOutcome(
    currentPotential,
    gateLeft.operation,
    gateLeft.value
  );
  const outcomeRight = calculateGateOutcome(
    currentPotential,
    gateRight.operation,
    gateRight.value
  );

  // Update potential score to the maximum possible outcome
  gameStateRef.current.potentialScore = Math.max(outcomeLeft, outcomeRight);
};

const applyGate = (
  gate: Gate,
  onScoreChange: Function,
  onPhaseChange: Function
) => {
  let sc = gameStateRef.current.score;
  switch (gate.operation) {
    case GateOperation.ADD:
      sc += gate.value;
      break;
    case GateOperation.SUBTRACT:
      sc -= gate.value;
      break;
    case GateOperation.MULTIPLY:
      sc *= gate.value;
      break;
    case GateOperation.DIVIDE:
      sc = Math.floor(sc / gate.value);
      break;
  }

  if (sc < 0) sc = 0;
  gameStateRef.current.score = sc;
  syncParticles(sc);
  onScoreChange(sc);

  if (sc === 0) {
    gameStateRef.current.phase = GamePhase.GAME_OVER;
    onPhaseChange(GamePhase.GAME_OVER);
  }
};

const syncParticles = (count: number) => {
  const currentLen = gameStateRef.current.particles.length;
  const displayCount = Math.min(count, 100);

  if (displayCount > currentLen) {
    for (let i = 0; i < displayCount - currentLen; i++) {
      gameStateRef.current.particles.push({
        id: Math.random(),
        x: 0,
        y: 0,
        z: 0,
        offset: {
          x: (Math.random() - 0.5) * CROWD_SPREAD * 2,
          z: (Math.random() - 0.5) * CROWD_SPREAD * 2,
        },
      });
    }
  } else if (displayCount < currentLen) {
    gameStateRef.current.particles.splice(displayCount);
  }
};

const GameScene: React.FC<GameCanvasProps> = ({
  onScoreChange,
  onPhaseChange,
  onBossInfo,
}) => {
  const { gl } = useThree();
useEffect(() => {
  gl.localClippingEnabled = true;
}, [gl]);

  const [gates, setGates] = useState<Gate[]>([]);

  const gs = gameStateRef.current;

  // RUNNING’de ak, diğer fazlarda dur
  const scrollSpeed = gs.phase === GamePhase.RUNNING ? 1.0 : 0.0;

  useFrame(() => {
    // Keep gates that are not hit and within a reasonable distance behind the player
    const liveGates = gameStateRef.current.gates.filter(
      (g) => !g.hit && g.z < gameStateRef.current.distance + 20
    );

    // Improved comparison to trigger re-render more reliably
    const hasChanged =
      liveGates.length !== gates.length ||
      liveGates.some((g, i) => g.id !== gates[i]?.id);

    if (hasChanged) {
      setGates([...liveGates]);
    }
  });

  return (
    <>
      <color attach="background" args={["#0b0618"]} />
      <fog attach="fog" args={["#0b0618", 55, 230]} />

      {/* Retrowave Lighting - Boosted intensity */}
      <ambientLight intensity={0.55} color="#2b0b5a" />
      <pointLight position={[12, 18, 8]} intensity={2.2} color="#00ffff" />
      <pointLight position={[-12, 8, -12]} intensity={2.4} color="#ff00ff" />
      <directionalLight
        position={[0, 12, -6]}
        intensity={0.9}
        color="#ffb000"
      />

      {/* Background Ambience */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <GameController
        onScoreChange={onScoreChange}
        onPhaseChange={onPhaseChange}
        onBossInfo={onBossInfo}
      />

      {/* <WireframeValley /> */}
      <PalmAvenue perSide={42} spacing={17} />

      <Crowd />
      
      <BossMesh />

      {gates.map((gate) => (
        <GateMesh key={gate.id} gate={gate} />
      ))}

      {/* Landscape world-space sabit */}
<Landscape speed={scrollSpeed} />
<RetroRoad width={14} length={1400} dashCount={90} />


{/* Road’u sadece shader ile akıtacağız */}
<group scale={[3.5, 1, 3.0]} position={[0, 0, gameStateRef.current.distance - 12]}>
  {/* <Road speed={scrollSpeed} /> */}
</group>

      <HorizonSun />

      <Sparkles
        count={50}
        scale={12}
        size={6}
        speed={0.4}
        opacity={0.5}
        color="#00ffff"
        position={[0, 2, gameStateRef.current.distance - 10]}
      />
    </>
  );
};

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const startGame = () => {
    gameStateRef.current = {
      phase: GamePhase.RUNNING,
      score: 1,
      potentialScore: 1,
      distance: 0,
      maxDistance: BOSS_DISTANCE,
      sunZ: -BOSS_DISTANCE - 100,
      laneX: 0,
      input: { left: false, right: false },
      gates: [],
      particles: [],
      boss: {
        name: "Yükleniyor...",
        taunt: "...",
        maxHp: 100,
        currentHp: 100,
        z: -BOSS_DISTANCE - 100,
        isActive: false,
      },
      nextGateZ: -30,
    };
    syncParticles(1);
    props.onPhaseChange(GamePhase.RUNNING);
    props.onScoreChange(1);

    const bossNames = [
      "MEGA BYTE",
      "CYBER LORD",
      "PIXEL KING",
      "GLITCH MASTER",
    ];
    const bossTaunts = [
      "Yolun Sonu!",
      "Sistem Hatası!",
      "Kaçış Yok!",
      "Game Over!",
    ];

    const randomName = bossNames[Math.floor(Math.random() * bossNames.length)];
    const randomTaunt =
      bossTaunts[Math.floor(Math.random() * bossTaunts.length)];

    gameStateRef.current.boss.name = randomName;
    gameStateRef.current.boss.taunt = randomTaunt;
    gameStateRef.current.boss.z = gameStateRef.current.sunZ;
    props.onBossInfo({ ...gameStateRef.current.boss });
  };

  useEffect(() => {
    // @ts-ignore - expose startGame on window for debug/start button
    window.startGame = startGame;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft")
        gameStateRef.current.input.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight")
        gameStateRef.current.input.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft")
        gameStateRef.current.input.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight")
        gameStateRef.current.input.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    syncParticles(1);
    return () => {
      // @ts-ignore
      delete window.startGame;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      className="w-full h-full bg-[#170b29] outline-none cursor-crosshair"
      tabIndex={0}
      onTouchStart={(e) => {
        const touchX = e.touches[0].clientX;
        if (touchX < window.innerWidth / 2) {
          gameStateRef.current.input.left = true;
          gameStateRef.current.input.right = false;
        } else {
          gameStateRef.current.input.right = true;
          gameStateRef.current.input.left = false;
        }
      }}
      onTouchEnd={() => {
        gameStateRef.current.input.left = false;
        gameStateRef.current.input.right = false;
      }}
    >
      <Canvas shadows camera={{ position: [0, 6, 12], fov: 60 }}>
        <CameraController orientation={props.orientation} />
        <GameScene {...props} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
