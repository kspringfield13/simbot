// @ts-nocheck
// ── Neighborhood System ─────────────────────────────────────────
// Generates and manages neighboring houses on the street.

import type { Room, Wall, RobotId } from '../types';
import type { FloorPlanPreset, WaypointDef, DoorFrame } from '../config/floorPlans';
import type { FurniturePiece } from '../utils/furnitureRegistry';

// ── Types ────────────────────────────────────────────────────────

export interface NeighborHouse {
  id: string;
  name: string;            // "The Johnsons", "The Garcias", etc.
  style: HouseStyle;
  streetPosition: number;  // -1 = left, 0 = player, 1 = right, 2 = far right
  floorPlan: FloorPlanPreset;
  residents: NeighborResident[];
  visitingRobots: RobotId[];   // player robots currently visiting
  neighborRobotsHome: string[];  // neighbor robots at home
}

export interface NeighborResident {
  id: string;
  name: string;
  personality: 'friendly' | 'grumpy' | 'curious' | 'shy';
  color: string;
}

export interface HouseStyle {
  wallColor: string;
  roofColor: string;
  doorColor: string;
  trimColor: string;
  stories: 1 | 2;
  width: number;    // visual width on street
  hasGarage: boolean;
  hasChimney: boolean;
  hasPorch: boolean;
  fenceColor: string | null;
}

export interface VisitEvent {
  robotId: RobotId;
  houseId: string;
  startedAt: number;     // sim-minutes
  interaction: string;   // what they're doing
}

// ── House name pools ─────────────────────────────────────────────

const FAMILY_NAMES = [
  'The Johnsons', 'The Garcias', 'The Chens', 'The Patels',
  'The Williamses', 'The Kims', 'The Andersons', 'The Nguyens',
  'The Martinezes', 'The Robinsons', 'The Tanakas', 'The Muellers',
];

const RESIDENT_NAMES = [
  'Bolt', 'Gizmo', 'Pixel', 'Servo', 'Widget', 'Cog',
  'Ratchet', 'Sprocket', 'Diode', 'Circuit', 'Chip', 'Nano',
];

const PERSONALITIES: NeighborResident['personality'][] = ['friendly', 'grumpy', 'curious', 'shy'];

// ── Color palettes for house styles ──────────────────────────────

const WALL_COLORS = ['#e8dcc8', '#c4b8a0', '#d4c5a9', '#b8c4c8', '#c8b8b0', '#d0c8b8', '#a8b4a0', '#c0b0a0'];
const ROOF_COLORS = ['#5a4a3a', '#3a4a5a', '#6a3a3a', '#3a5a4a', '#4a4a5a', '#5a5a3a', '#4a3a4a', '#3a4a3a'];
const DOOR_COLORS = ['#8b4513', '#4a6741', '#4a5568', '#9b2335', '#2d5a7b', '#7a5230', '#5a3a6a', '#3a5a3a'];
const TRIM_COLORS = ['#f5f0e8', '#e0d8c8', '#d0c8b0', '#c8d0d8'];
const FENCE_COLORS = ['#f5f0e8', '#8b7355', '#5a5a5a', null];

// ── Random utilities ─────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Generate a random house style ────────────────────────────────

function generateHouseStyle(rng: () => number): HouseStyle {
  return {
    wallColor: pick(WALL_COLORS, rng),
    roofColor: pick(ROOF_COLORS, rng),
    doorColor: pick(DOOR_COLORS, rng),
    trimColor: pick(TRIM_COLORS, rng),
    stories: rng() > 0.6 ? 2 : 1,
    width: 14 + Math.floor(rng() * 8),
    hasGarage: rng() > 0.5,
    hasChimney: rng() > 0.4,
    hasPorch: rng() > 0.3,
    fenceColor: pick(FENCE_COLORS, rng),
  };
}

// ── Generate a simple floor plan for a neighbor house ────────────

const S = 2;

function generateNeighborFloorPlan(rng: () => number, houseId: string): FloorPlanPreset {
  const layouts = [generateSmallHouse, generateMediumHouse, generateLargeHouse];
  const layoutFn = pick(layouts, rng);
  return layoutFn(rng, houseId);
}

function generateSmallHouse(rng: () => number, houseId: string): FloorPlanPreset {
  const rooms: Room[] = [
    { id: 'living-room', name: 'Living Room', position: [-3 * S, 0, -4 * S], size: [6 * S, 6 * S], color: pick(['#4a4644', '#484846', '#464444'], rng), furniture: [] },
    { id: 'kitchen', name: 'Kitchen', position: [3 * S, 0, -4 * S], size: [6 * S, 6 * S], color: pick(['#484848', '#464646', '#4a4a48'], rng), furniture: [] },
    { id: 'bedroom', name: 'Bedroom', position: [0, 0, 3 * S], size: [8 * S, 6 * S], color: pick(['#444446', '#464448', '#484648'], rng), furniture: [] },
  ];

  const walls: Wall[] = [
    { start: [-6 * S, -7 * S], end: [6 * S, -7 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-6 * S, -7 * S], end: [-6 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [6 * S, -7 * S], end: [6 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-6 * S, 6 * S], end: [6 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [0, -7 * S], end: [0, -1.5 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-6 * S, 0], end: [-1 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
    { start: [1 * S, 0], end: [6 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  ];

  const waypoints: WaypointDef[] = [
    { id: 'living-center', pos: [-3 * S, -4 * S], connections: ['hall'] },
    { id: 'kitchen-center', pos: [3 * S, -4 * S], connections: ['hall'] },
    { id: 'hall', pos: [0, -1 * S], connections: ['living-center', 'kitchen-center', 'bedroom-center'] },
    { id: 'bedroom-center', pos: [0, 3 * S], connections: ['hall'] },
  ];

  return {
    id: `neighbor-${houseId}`,
    name: `Neighbor House`,
    description: 'A cozy small house',
    rooms,
    walls,
    furniture: [],
    waypoints,
    chargingStation: [4 * S, 0, 4 * S],
    windowSpots: [[-6 * S, 2, -4 * S], [6 * S, 2, -4 * S]],
    ceilings: [
      { pos: [0, 2.8 * S, -1 * S], size: [12 * S, 12 * S] },
    ],
    doorFrames: [
      { cx: 0, cz: -4 * S, alongZ: false, gapWidth: 2, h: 2.8 * S },
      { cx: 0, cz: 0, alongZ: false, gapWidth: 2, h: 2.8 * S },
    ],
    lights: [
      { position: [-3 * S, 2.6 * S, -4 * S], intensity: 0.6, color: '#fff5e0', distance: 12 },
      { position: [3 * S, 2.6 * S, -4 * S], intensity: 0.6, color: '#fff5e0', distance: 12 },
      { position: [0, 2.6 * S, 3 * S], intensity: 0.5, color: '#e8e0ff', distance: 12 },
    ],
  };
}

function generateMediumHouse(rng: () => number, houseId: string): FloorPlanPreset {
  const rooms: Room[] = [
    { id: 'living-room', name: 'Living Room', position: [-4 * S, 0, -5 * S], size: [8 * S, 6 * S], color: '#4a4644', furniture: [] },
    { id: 'kitchen', name: 'Kitchen', position: [4 * S, 0, -5 * S], size: [6 * S, 6 * S], color: '#484848', furniture: [] },
    { id: 'hallway', name: 'Hallway', position: [0, 0, -1 * S], size: [10 * S, 2 * S], color: '#454443', furniture: [] },
    { id: 'bedroom', name: 'Bedroom', position: [-3 * S, 0, 3 * S], size: [6 * S, 6 * S], color: '#444446', furniture: [] },
    { id: 'bathroom', name: 'Bathroom', position: [4 * S, 0, 3 * S], size: [4 * S, 6 * S], color: '#464848', furniture: [] },
  ];

  const walls: Wall[] = [
    { start: [-8 * S, -8 * S], end: [7 * S, -8 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-8 * S, -8 * S], end: [-8 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [7 * S, -8 * S], end: [7 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-8 * S, 6 * S], end: [7 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [0, -8 * S], end: [0, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-8 * S, -2 * S], end: [-1 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [1 * S, -2 * S], end: [7 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-8 * S, 0], end: [-1 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
    { start: [1 * S, 0], end: [2 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
    { start: [2 * S, 0], end: [2 * S, 6 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [3 * S, 0], end: [7 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  ];

  const waypoints: WaypointDef[] = [
    { id: 'living-center', pos: [-4 * S, -5 * S], connections: ['hall-w'] },
    { id: 'kitchen-center', pos: [4 * S, -5 * S], connections: ['hall-e'] },
    { id: 'hall-w', pos: [-3 * S, -1 * S], connections: ['living-center', 'bedroom-center', 'hall-e'] },
    { id: 'hall-e', pos: [3 * S, -1 * S], connections: ['kitchen-center', 'bathroom-center', 'hall-w'] },
    { id: 'bedroom-center', pos: [-3 * S, 3 * S], connections: ['hall-w'] },
    { id: 'bathroom-center', pos: [4 * S, 3 * S], connections: ['hall-e'] },
  ];

  return {
    id: `neighbor-${houseId}`,
    name: 'Neighbor House',
    description: 'A medium family house',
    rooms,
    walls,
    furniture: [],
    waypoints,
    chargingStation: [5 * S, 0, 4 * S],
    windowSpots: [[-8 * S, 2, -5 * S], [7 * S, 2, -5 * S], [-8 * S, 2, 3 * S]],
    ceilings: [{ pos: [0, 2.8 * S, -1 * S], size: [15 * S, 14 * S] }],
    doorFrames: [
      { cx: 0, cz: -5 * S, alongZ: false, gapWidth: 2, h: 2.8 * S },
      { cx: 0, cz: -1 * S, alongZ: false, gapWidth: 2, h: 2.8 * S },
    ],
    lights: [
      { position: [-4 * S, 2.6 * S, -5 * S], intensity: 0.6, color: '#fff5e0', distance: 14 },
      { position: [4 * S, 2.6 * S, -5 * S], intensity: 0.6, color: '#fff5e0', distance: 14 },
      { position: [-3 * S, 2.6 * S, 3 * S], intensity: 0.5, color: '#e8e0ff', distance: 12 },
      { position: [4 * S, 2.6 * S, 3 * S], intensity: 0.4, color: '#f0f5ff', distance: 10 },
    ],
  };
}

function generateLargeHouse(rng: () => number, houseId: string): FloorPlanPreset {
  const rooms: Room[] = [
    { id: 'living-room', name: 'Living Room', position: [-5 * S, 0, -6 * S], size: [10 * S, 8 * S], color: '#4a4644', furniture: [] },
    { id: 'kitchen', name: 'Kitchen', position: [5 * S, 0, -6 * S], size: [8 * S, 8 * S], color: '#484848', furniture: [] },
    { id: 'hallway', name: 'Hallway', position: [0, 0, -1 * S], size: [14 * S, 2 * S], color: '#454443', furniture: [] },
    { id: 'bedroom', name: 'Master Bedroom', position: [-5 * S, 0, 4 * S], size: [8 * S, 8 * S], color: '#444446', furniture: [] },
    { id: 'bedroom-2', name: 'Guest Bedroom', position: [5 * S, 0, 4 * S], size: [6 * S, 8 * S], color: '#464444', furniture: [] },
    { id: 'bathroom', name: 'Bathroom', position: [0, 0, 4 * S], size: [4 * S, 4 * S], color: '#464848', furniture: [] },
  ];

  const walls: Wall[] = [
    { start: [-10 * S, -10 * S], end: [9 * S, -10 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-10 * S, -10 * S], end: [-10 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [9 * S, -10 * S], end: [9 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [-10 * S, 8 * S], end: [9 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
    { start: [1 * S, -10 * S], end: [1 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-10 * S, -2 * S], end: [-1 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [1 * S, -2 * S], end: [9 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-10 * S, 0], end: [-1 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
    { start: [1 * S, 0], end: [2 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
    { start: [2 * S, 0], end: [2 * S, 8 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [-2 * S, 0], end: [-2 * S, 6 * S], height: 2.8 * S, thickness: 0.12 * S },
    { start: [3 * S, 0], end: [9 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  ];

  const waypoints: WaypointDef[] = [
    { id: 'living-center', pos: [-5 * S, -6 * S], connections: ['hall-w'] },
    { id: 'kitchen-center', pos: [5 * S, -6 * S], connections: ['hall-e'] },
    { id: 'hall-w', pos: [-4 * S, -1 * S], connections: ['living-center', 'bedroom-center', 'hall-e'] },
    { id: 'hall-e', pos: [4 * S, -1 * S], connections: ['kitchen-center', 'bedroom2-center', 'hall-w', 'bathroom-center'] },
    { id: 'bedroom-center', pos: [-5 * S, 4 * S], connections: ['hall-w'] },
    { id: 'bedroom2-center', pos: [5 * S, 4 * S], connections: ['hall-e'] },
    { id: 'bathroom-center', pos: [0, 4 * S], connections: ['hall-w', 'hall-e'] },
  ];

  return {
    id: `neighbor-${houseId}`,
    name: 'Neighbor House',
    description: 'A large family house',
    rooms,
    walls,
    furniture: [],
    waypoints,
    chargingStation: [7 * S, 0, 6 * S],
    windowSpots: [[-10 * S, 2, -6 * S], [9 * S, 2, -6 * S], [-10 * S, 2, 4 * S], [9 * S, 2, 4 * S]],
    ceilings: [{ pos: [0, 2.8 * S, 0], size: [19 * S, 18 * S] }],
    doorFrames: [
      { cx: 0, cz: -6 * S, alongZ: false, gapWidth: 2, h: 2.8 * S },
      { cx: 0, cz: -1 * S, alongZ: false, gapWidth: 2, h: 2.8 * S },
    ],
    lights: [
      { position: [-5 * S, 2.6 * S, -6 * S], intensity: 0.7, color: '#fff5e0', distance: 16 },
      { position: [5 * S, 2.6 * S, -6 * S], intensity: 0.6, color: '#fff5e0', distance: 14 },
      { position: [-5 * S, 2.6 * S, 4 * S], intensity: 0.5, color: '#e8e0ff', distance: 14 },
      { position: [5 * S, 2.6 * S, 4 * S], intensity: 0.5, color: '#e8e0ff', distance: 12 },
    ],
  };
}

// ── Generate neighbor residents ──────────────────────────────────

function generateResidents(rng: () => number, count: number): NeighborResident[] {
  const residents: NeighborResident[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = pick(RESIDENT_NAMES, rng);
    } while (usedNames.has(name));
    usedNames.add(name);

    const robotColors = ['#4fc3f7', '#e57373', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac'];
    residents.push({
      id: `resident-${name.toLowerCase()}`,
      name,
      personality: pick(PERSONALITIES, rng),
      color: pick(robotColors, rng),
    });
  }
  return residents;
}

// ── Main: generate the neighborhood ──────────────────────────────

export function generateNeighborhood(seed: number = 42): NeighborHouse[] {
  const rng = seededRandom(seed);
  const usedNames = new Set<string>();
  const houses: NeighborHouse[] = [];

  const positions = [-1, 1, 2]; // left, right, far right of player house

  for (let i = 0; i < 3; i++) {
    let familyName: string;
    do {
      familyName = pick(FAMILY_NAMES, rng);
    } while (usedNames.has(familyName));
    usedNames.add(familyName);

    const houseId = `house-${i}`;
    const residentCount = 1 + Math.floor(rng() * 2); // 1-2 robots

    houses.push({
      id: houseId,
      name: familyName,
      style: generateHouseStyle(rng),
      streetPosition: positions[i],
      floorPlan: generateNeighborFloorPlan(rng, houseId),
      residents: generateResidents(rng, residentCount),
      visitingRobots: [],
      neighborRobotsHome: [],
    });
  }

  // Randomly place some neighbor robots at home
  for (const house of houses) {
    house.neighborRobotsHome = house.residents.map((r) => r.id);
  }

  return houses;
}

// ── Visit interaction messages ───────────────────────────────────

const VISIT_INTERACTIONS = [
  'Chatting with neighbors',
  'Sharing repair tips',
  'Playing board games',
  'Helping with chores',
  'Trading spare parts',
  'Swapping recipes',
  'Comparing cleaning techniques',
  'Having a power nap together',
  'Showing off new upgrades',
  'Discussing the weather',
];

export function getRandomInteraction(rng?: () => number): string {
  if (rng) return pick(VISIT_INTERACTIONS, rng);
  return VISIT_INTERACTIONS[Math.floor(Math.random() * VISIT_INTERACTIONS.length)];
}
