// @ts-nocheck
import React, { useRef, useEffect, useState, useMemo } from "react";

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
}

// Global state ref to share between React components and R3F loop without context issues
const gameStateRef = {
  current: {
    phase: GamePhase.MENU,
    score: 1,
    potentialScore: 1, // Start with 1 potential
    distance: 0,
    maxDistance: BOSS_DISTANCE,
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

const RetrowaveFloor = () => {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(() => {
    if (gridRef.current) {
      // Create illusion of infinite movement by resetting Z
      const playerZ = gameStateRef.current.distance;
      gridRef.current.position.z = playerZ - (playerZ % 10);
    }
  });

  return (
    <>
      {/* Infinite Grid */}
      <gridHelper
        ref={gridRef}
        args={[400, 40, 0xff00ff, 0x440044]}
        position={[0, 0, 0]}
      />

      {/* Dark reflective plane below grid to catch reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -100]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#050110" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Sun on Horizon */}
      <group position={[0, 15, -BOSS_DISTANCE - 100]}>
        <mesh>
          <circleGeometry args={[40, 32]} />
          <meshBasicMaterial color="#ffaa00" toneMapped={false} />
        </mesh>
        {/* Sun Stripes (simulated with bars) */}
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[0, -10 + i * 4, 1]}>
            <planeGeometry args={[80, 2]} />
            <meshBasicMaterial color="#1a0b2e" />
          </mesh>
        ))}
      </group>
    </>
  );
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

      if (gs.distance <= gs.boss.z + 10) {
        gs.phase = GamePhase.BOSS_FIGHT;
        onPhaseChange(GamePhase.BOSS_FIGHT);

        gs.boss.isActive = true;

        // --- FIXED BOSS HP LOGIC ---
        // Calculate max HP based on the best possible run the player could have had.
        // We take 90% of the potential score to leave a 10% margin for error/challenge.
        const calculatedMaxHp = Math.floor(gs.potentialScore * 0.9);

        // Ensure boss has at least 50 HP so it's not instant win if potential is low
        gs.boss.maxHp = Math.max(50, calculatedMaxHp);
        gs.boss.currentHp = gs.boss.maxHp;

        console.log(
          `Boss HP Set: ${gs.boss.maxHp} (Potential Score: ${gs.potentialScore})`
        );

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
  const [gates, setGates] = useState<Gate[]>([]);

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
      <color attach="background" args={["#170b29"]} />
      <fog attach="fog" args={["#170b29", 60, 200]} />

      {/* Retrowave Lighting - Boosted intensity */}
      <ambientLight intensity={0.6} color="#4400ff" />
      <pointLight position={[10, 20, 10]} intensity={2} color="#00ffff" />
      <pointLight position={[-10, 5, -10]} intensity={2} color="#ff00ff" />
      <directionalLight position={[0, 10, -5]} intensity={1} color="#ffaa00" />

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

      <Crowd />
      <RetrowaveFloor />
      <BossMesh />

      {gates.map((gate) => (
        <GateMesh key={gate.id} gate={gate} />
      ))}

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
      laneX: 0,
      input: { left: false, right: false },
      gates: [],
      particles: [],
      boss: {
        name: "Yükleniyor...",
        taunt: "...",
        maxHp: 100,
        currentHp: 100,
        z: -BOSS_DISTANCE,
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
    const bossTaunts = ["Yolun Sonu!", "Sistem Hatası!", "Kaçış Yok!", "Game Over!"];

    const randomName = bossNames[Math.floor(Math.random() * bossNames.length)];
    const randomTaunt = bossTaunts[Math.floor(Math.random() * bossTaunts.length)];

    gameStateRef.current.boss.name = randomName;
    gameStateRef.current.boss.taunt = randomTaunt;
    props.onBossInfo({ ...gameStateRef.current.boss });
  };

  useEffect(() => {
    // @ts-ignore - expose startGame on window for debug/start button
    window.startGame = startGame;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") gameStateRef.current.input.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") gameStateRef.current.input.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") gameStateRef.current.input.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") gameStateRef.current.input.right = false;
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
        <GameScene {...props} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
