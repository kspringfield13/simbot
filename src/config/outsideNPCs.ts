import type { SimPeriod } from '../types';

const S = 2;

// ── NPC archetypes ─────────────────────────────────────────

export interface NPCArchetype {
  id: string;
  name: string;
  bodyColor: string;
  legColor: string;
  headColor: string;
  /** Optional accessory rendered on the NPC */
  accessory?: 'mailbag' | 'dog' | 'pizza-box' | 'briefcase' | 'phone';
  /** Which sim periods this NPC can appear in */
  periods: SimPeriod[];
  /** Relative spawn weight (higher = more common) */
  weight: number;
  /** Walk speed multiplier (1 = normal) */
  speed: number;
}

export const NPC_ARCHETYPES: NPCArchetype[] = [
  // Morning NPCs
  {
    id: 'mailman',
    name: 'Mail Carrier',
    bodyColor: '#2a4d8f',
    legColor: '#1e3a6b',
    headColor: '#e8c4a0',
    accessory: 'mailbag',
    periods: ['morning'],
    weight: 3,
    speed: 0.8,
  },
  {
    id: 'jogger-m',
    name: 'Morning Jogger',
    bodyColor: '#e04040',
    legColor: '#333333',
    headColor: '#d4a574',
    periods: ['morning'],
    weight: 4,
    speed: 1.6,
  },
  {
    id: 'dog-walker-am',
    name: 'Dog Walker',
    bodyColor: '#6b8e5a',
    legColor: '#4a5a3c',
    headColor: '#e8c4a0',
    accessory: 'dog',
    periods: ['morning', 'afternoon'],
    weight: 3,
    speed: 0.7,
  },

  // Afternoon NPCs
  {
    id: 'neighbor',
    name: 'Neighbor',
    bodyColor: '#c06030',
    legColor: '#5a4a3a',
    headColor: '#d4a574',
    periods: ['afternoon'],
    weight: 4,
    speed: 0.6,
  },
  {
    id: 'delivery-driver',
    name: 'Delivery Driver',
    bodyColor: '#8B6914',
    legColor: '#3a3a3a',
    headColor: '#e8c4a0',
    accessory: 'briefcase',
    periods: ['afternoon'],
    weight: 3,
    speed: 1.0,
  },
  {
    id: 'phone-walker',
    name: 'Phone Walker',
    bodyColor: '#7060a0',
    legColor: '#3a3a50',
    headColor: '#d4a574',
    accessory: 'phone',
    periods: ['afternoon', 'evening'],
    weight: 3,
    speed: 0.5,
  },

  // Evening NPCs
  {
    id: 'jogger-e',
    name: 'Evening Jogger',
    bodyColor: '#f0a030',
    legColor: '#333333',
    headColor: '#e8c4a0',
    periods: ['evening'],
    weight: 3,
    speed: 1.5,
  },
  {
    id: 'pizza-delivery',
    name: 'Pizza Delivery',
    bodyColor: '#cc2020',
    legColor: '#2a2a2a',
    headColor: '#d4a574',
    accessory: 'pizza-box',
    periods: ['evening'],
    weight: 2,
    speed: 1.1,
  },
  {
    id: 'dog-walker-pm',
    name: 'Evening Dog Walker',
    bodyColor: '#506080',
    legColor: '#3a3a4a',
    headColor: '#e8c4a0',
    accessory: 'dog',
    periods: ['evening'],
    weight: 3,
    speed: 0.65,
  },
];

// ── Walking paths outside the house ────────────────────────

export interface WalkPath {
  id: string;
  /** Sequence of [x, y, z] positions the NPC walks through */
  points: [number, number, number][];
}

// House exterior walls: west x=-16, east x=16, north z=-20, south z=16
// Sidewalks placed ~3 units outside walls

export const WALK_PATHS: WalkPath[] = [
  // West sidewalk (visible through living room windows) — north to south
  {
    id: 'west-sidewalk-s',
    points: [
      [-10 * S, 0, -14 * S],
      [-10 * S, 0, -8 * S],
      [-10 * S, 0, -2 * S],
      [-10 * S, 0, 4 * S],
      [-10 * S, 0, 12 * S],
    ],
  },
  // West sidewalk — south to north
  {
    id: 'west-sidewalk-n',
    points: [
      [-10 * S, 0, 12 * S],
      [-10 * S, 0, 4 * S],
      [-10 * S, 0, -2 * S],
      [-10 * S, 0, -8 * S],
      [-10 * S, 0, -14 * S],
    ],
  },
  // North street (visible through kitchen windows) — west to east
  {
    id: 'north-street-e',
    points: [
      [-14 * S, 0, -12 * S],
      [-6 * S, 0, -12 * S],
      [2 * S, 0, -12 * S],
      [10 * S, 0, -12 * S],
      [14 * S, 0, -12 * S],
    ],
  },
  // North street — east to west
  {
    id: 'north-street-w',
    points: [
      [14 * S, 0, -12 * S],
      [10 * S, 0, -12 * S],
      [2 * S, 0, -12 * S],
      [-6 * S, 0, -12 * S],
      [-14 * S, 0, -12 * S],
    ],
  },
  // East sidewalk (visible through kitchen/bathroom east windows) — north to south
  {
    id: 'east-sidewalk-s',
    points: [
      [10 * S, 0, -14 * S],
      [10 * S, 0, -8 * S],
      [10 * S, 0, -2 * S],
      [10 * S, 0, 4 * S],
      [10 * S, 0, 12 * S],
    ],
  },
  // East sidewalk — south to north
  {
    id: 'east-sidewalk-n',
    points: [
      [10 * S, 0, 12 * S],
      [10 * S, 0, 4 * S],
      [10 * S, 0, -2 * S],
      [10 * S, 0, -8 * S],
      [10 * S, 0, -14 * S],
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────

/** Pick NPCs available for the current sim period */
export function getArchetypesForPeriod(period: SimPeriod): NPCArchetype[] {
  return NPC_ARCHETYPES.filter((a) => a.periods.includes(period));
}

/** Weighted random pick from an archetype list */
export function pickWeightedArchetype(archetypes: NPCArchetype[]): NPCArchetype {
  const totalWeight = archetypes.reduce((sum, a) => sum + a.weight, 0);
  let r = Math.random() * totalWeight;
  for (const a of archetypes) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return archetypes[archetypes.length - 1];
}

/** Pick a random walk path */
export function pickRandomPath(): WalkPath {
  return WALK_PATHS[Math.floor(Math.random() * WALK_PATHS.length)];
}
