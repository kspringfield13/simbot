// ── Robot Crafting System ──────────────────────────────────
// Players combine parts (heads, bodies, arms, legs) into custom robots.
// Each part has stat bonuses. Assembled robots can be "deployed" to
// apply their combined bonuses globally (stacks with shop upgrades).

export type PartSlot = 'head' | 'body' | 'arms' | 'legs';

export interface RobotPart {
  id: string;
  name: string;
  slot: PartSlot;
  cost: number;
  speedBonus: number;      // 0-1 fractional bonus (e.g. 0.05 = 5% faster)
  batteryBonus: number;    // 0-1 fractional bonus (e.g. 0.10 = 10% less drain)
  efficiencyBonus: number; // 0-1 fractional bonus (e.g. 0.08 = 8% less energy)
  description: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface CustomRobot {
  id: string;
  name: string;
  headId: string;
  bodyId: string;
  armsId: string;
  legsId: string;
  createdAt: number;
  deployed: boolean;
}

export const ROBOT_PARTS: RobotPart[] = [
  // ── Heads ────────────────────────────────────
  { id: 'head-scanner',   name: 'Scanner Dome',     slot: 'head', cost: 20,  speedBonus: 0.03, batteryBonus: 0.02, efficiencyBonus: 0.05, description: 'Enhanced sensors for faster task detection', rarity: 'common' },
  { id: 'head-antenna',   name: 'Antenna Array',    slot: 'head', cost: 35,  speedBonus: 0.05, batteryBonus: 0.03, efficiencyBonus: 0.02, description: 'Wide-band comms for coordinated cleaning', rarity: 'common' },
  { id: 'head-visor',     name: 'Tactical Visor',   slot: 'head', cost: 60,  speedBonus: 0.08, batteryBonus: 0.04, efficiencyBonus: 0.06, description: 'AR overlay plans the optimal route', rarity: 'rare' },
  { id: 'head-quantum',   name: 'Quantum Cortex',   slot: 'head', cost: 120, speedBonus: 0.12, batteryBonus: 0.06, efficiencyBonus: 0.10, description: 'Quantum processor predicts messes before they happen', rarity: 'epic' },

  // ── Bodies ───────────────────────────────────
  { id: 'body-compact',   name: 'Compact Chassis',  slot: 'body', cost: 25,  speedBonus: 0.05, batteryBonus: 0.02, efficiencyBonus: 0.03, description: 'Lightweight frame for nimble movement', rarity: 'common' },
  { id: 'body-tank',      name: 'Tank Frame',       slot: 'body', cost: 40,  speedBonus: 0.02, batteryBonus: 0.08, efficiencyBonus: 0.04, description: 'Heavy-duty body with massive battery reserves', rarity: 'common' },
  { id: 'body-stealth',   name: 'Stealth Shell',    slot: 'body', cost: 70,  speedBonus: 0.06, batteryBonus: 0.06, efficiencyBonus: 0.08, description: 'Whisper-quiet operation, ultra-efficient', rarity: 'rare' },
  { id: 'body-titan',     name: 'Titan Core',       slot: 'body', cost: 130, speedBonus: 0.10, batteryBonus: 0.10, efficiencyBonus: 0.10, description: 'Top-tier chassis — balanced perfection', rarity: 'epic' },

  // ── Arms ─────────────────────────────────────
  { id: 'arms-grabber',   name: 'Grabber Claws',    slot: 'arms', cost: 15,  speedBonus: 0.02, batteryBonus: 0.01, efficiencyBonus: 0.05, description: 'Quick-grip pincers for picking up items', rarity: 'common' },
  { id: 'arms-multi',     name: 'Multi-Tool Arms',  slot: 'arms', cost: 35,  speedBonus: 0.04, batteryBonus: 0.03, efficiencyBonus: 0.06, description: 'Swiss-army style attachments for any task', rarity: 'common' },
  { id: 'arms-hydraulic', name: 'Hydraulic Arms',   slot: 'arms', cost: 65,  speedBonus: 0.06, batteryBonus: 0.05, efficiencyBonus: 0.08, description: 'Power-assisted lifting and scrubbing', rarity: 'rare' },
  { id: 'arms-nano',      name: 'Nano Tentacles',   slot: 'arms', cost: 110, speedBonus: 0.10, batteryBonus: 0.07, efficiencyBonus: 0.12, description: 'Microscopic tendrils clean at the atomic level', rarity: 'epic' },

  // ── Legs ─────────────────────────────────────
  { id: 'legs-wheels',    name: 'Roller Wheels',    slot: 'legs', cost: 18,  speedBonus: 0.06, batteryBonus: 0.02, efficiencyBonus: 0.02, description: 'Smooth rolling for flat surfaces', rarity: 'common' },
  { id: 'legs-treads',    name: 'All-Terrain Treads', slot: 'legs', cost: 38,  speedBonus: 0.04, batteryBonus: 0.06, efficiencyBonus: 0.03, description: 'Handles any floor type with ease', rarity: 'common' },
  { id: 'legs-spring',    name: 'Spring Stilts',    slot: 'legs', cost: 68,  speedBonus: 0.10, batteryBonus: 0.04, efficiencyBonus: 0.05, description: 'Bouncy legs for rapid traversal', rarity: 'rare' },
  { id: 'legs-hover',     name: 'Hover Pads',       slot: 'legs', cost: 125, speedBonus: 0.14, batteryBonus: 0.08, efficiencyBonus: 0.08, description: 'Frictionless hovering — ultimate speed', rarity: 'epic' },
];

/** Get a part by ID */
export function getPartById(id: string): RobotPart | undefined {
  return ROBOT_PARTS.find((p) => p.id === id);
}

/** Get all parts for a specific slot */
export function getPartsForSlot(slot: PartSlot): RobotPart[] {
  return ROBOT_PARTS.filter((p) => p.slot === slot);
}

/** Calculate combined stats for a set of parts */
export function calculateRobotStats(partIds: string[]): {
  speedBonus: number;
  batteryBonus: number;
  efficiencyBonus: number;
} {
  let speedBonus = 0;
  let batteryBonus = 0;
  let efficiencyBonus = 0;

  for (const id of partIds) {
    const part = getPartById(id);
    if (part) {
      speedBonus += part.speedBonus;
      batteryBonus += part.batteryBonus;
      efficiencyBonus += part.efficiencyBonus;
    }
  }

  return { speedBonus, batteryBonus, efficiencyBonus };
}

/** Get stat bonuses from the currently deployed custom robot, if any */
export function getDeployedRobotBonuses(customRobots: CustomRobot[]): {
  speedBonus: number;
  batteryBonus: number;
  efficiencyBonus: number;
} {
  const deployed = customRobots.find((r) => r.deployed);
  if (!deployed) return { speedBonus: 0, batteryBonus: 0, efficiencyBonus: 0 };
  return calculateRobotStats([deployed.headId, deployed.bodyId, deployed.armsId, deployed.legsId]);
}

const RARITY_COLOR: Record<RobotPart['rarity'], string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#a78bfa',
};

export function getRarityColor(rarity: RobotPart['rarity']): string {
  return RARITY_COLOR[rarity];
}
