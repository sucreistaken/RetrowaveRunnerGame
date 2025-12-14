
export enum GamePhase {
  MENU = 'MENU',
  RUNNING = 'RUNNING',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum GateOperation {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE'
}

export interface Gate {
  id: number;
  z: number; // Position along the track
  x: number; // Left/Right position
  width: number;
  operation: GateOperation;
  value: number;
  color: string;
  hit: boolean; // Flag to mark if processed
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  offset: { x: number, z: number }; // Random offset from center of crowd
}

export interface Boss {
  name: string;
  taunt: string;
  maxHp: number;
  currentHp: number;
  z: number;
  isActive: boolean;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  potentialScore: number; // Track maximum possible score based on spawned gates
  distance: number; // Current player Z position (negative usually)
  maxDistance: number;
  laneX: number; // Current target X position
  gates: Gate[];
  particles: Particle[];
  boss: Boss;
  nextGateZ: number; // Position for the next gate to spawn
}
