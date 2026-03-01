import type { Room, Wall } from '../types';
import type { FurniturePiece } from '../utils/furnitureRegistry';
import { loadCustomFloorPlans } from '../utils/proceduralFloorPlan';

const PI = Math.PI;
const S = 2;

// ── Preset shape ────────────────────────────────────────────────

export interface FloorPlanPreset {
  id: string;
  name: string;
  description: string;
  rooms: Room[];
  walls: Wall[];
  furniture: FurniturePiece[];
  waypoints: WaypointDef[];
  chargingStation: [number, number, number];
  windowSpots: [number, number, number][];
  ceilings: { pos: [number, number, number]; size: [number, number] }[];
  doorFrames: DoorFrame[];
  lights: { position: [number, number, number]; intensity: number; color: string; distance: number }[];
}

export interface WaypointDef {
  id: string;
  pos: [number, number];
  connections: string[];
  pauseAtDoorway?: boolean;
}

export interface DoorFrame {
  cx: number;
  cz: number;
  alongZ: boolean;
  gapWidth: number;
  h: number;
}

// ── Helper ──────────────────────────────────────────────────────

function furn(
  id: string, name: string, roomId: string,
  pos: [number, number, number],
  models: FurniturePiece['models'],
  obstacleRadius: number,
): FurniturePiece {
  return { id, name, roomId, defaultPosition: pos, models, obstacleRadius, movable: true };
}

// ── HOUSE (current default) ─────────────────────────────────────

const houseRooms: Room[] = [
  { id: 'living-room', name: 'Living Room', position: [-4 * S, 0, -6 * S], size: [8 * S, 8 * S], color: '#4a4644', furniture: [] },
  { id: 'kitchen', name: 'Kitchen', position: [4 * S, 0, -6 * S], size: [8 * S, 8 * S], color: '#484848', furniture: [] },
  { id: 'hallway', name: 'Hallway', position: [-2 * S, 0, -1 * S], size: [12 * S, 2 * S], color: '#454443', furniture: [] },
  { id: 'laundry', name: 'Laundry Closet', position: [5 * S, 0, -1 * S], size: [3 * S, 2 * S], color: '#484646', furniture: [] },
  { id: 'bedroom', name: 'Master Bedroom', position: [-4 * S, 0, 4 * S], size: [8 * S, 8 * S], color: '#444446', furniture: [] },
  { id: 'bathroom', name: 'Master Bathroom', position: [4 * S, 0, 4 * S], size: [8 * S, 8 * S], color: '#464848', furniture: [] },
  { id: 'yard', name: 'Yard', position: [0, 0, 12 * S], size: [16 * S, 8 * S], color: '#3a5a32', furniture: [] },
];

const houseWalls: Wall[] = [
  { start: [-8 * S, -10 * S], end: [8 * S, -10 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, -10 * S], end: [-8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [8 * S, -10 * S], end: [8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, 8 * S], end: [-1 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [1 * S, 8 * S], end: [8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, -2 * S], end: [-3 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [3.5 * S, -2 * S], end: [8 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [3.5 * S, -2 * S], end: [3.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [6.5 * S, -2 * S], end: [6.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-8 * S, 0], end: [-2 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-0.5 * S, 0], end: [0, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [0, 0], end: [1.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [3 * S, 0], end: [8 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [0, 0], end: [0, 6.5 * S], height: 2.8 * S, thickness: 0.12 * S },
];

const houseFurniture: FurniturePiece[] = [
  furn('sofa', 'Sofa', 'living-room', [-14.5, 0, -12], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
  furn('coffee-table', 'Coffee Table', 'living-room', [-11.5, 0, -12], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('tv-stand', 'TV Stand', 'living-room', [-8, 0, -19], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
  furn('fridge', 'Fridge', 'kitchen', [3, 0, -19], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
  furn('stove', 'Stove', 'kitchen', [7, 0, -19], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
  furn('kitchen-sink', 'Kitchen Sink', 'kitchen', [11, 0, -19], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('laundry-station', 'Washer & Dryer', 'laundry', [10, 0, -3.2], [{ url: '/models/washer.glb', offset: [-1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }, { url: '/models/dryer.glb', offset: [1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 2),
  furn('bed', 'Bed', 'bedroom', [-8, 0, 14.5], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 3),
  furn('nightstand', 'Nightstand', 'bedroom', [-12.5, 0, 14.5], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
  furn('desk', 'Desk & Chair', 'bedroom', [-14.5, 0, 3], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
  furn('bathroom-sink', 'Bathroom Sink', 'bathroom', [6, 0, 1.2], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
  furn('shower', 'Shower', 'bathroom', [14, 0, 14], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
  furn('toilet', 'Toilet', 'bathroom', [1.5, 0, 8], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S }], 1),
];

const houseWaypoints: WaypointDef[] = [
  { id: 'living-center', pos: [-3.5 * S, -6 * S], connections: ['living-south', 'dining-area'] },
  { id: 'living-south', pos: [-3.5 * S, -3.5 * S], connections: ['living-center', 'hall-entry'] },
  { id: 'front-door', pos: [0, -9 * S], connections: ['dining-area'] },
  { id: 'dining-area', pos: [0, -6 * S], connections: ['living-center', 'kitchen-center', 'front-door'] },
  { id: 'kitchen-center', pos: [3.5 * S, -6 * S], connections: ['dining-area', 'kitchen-south'] },
  { id: 'kitchen-south', pos: [3.5 * S, -3.5 * S], connections: ['kitchen-center', 'hall-east'] },
  { id: 'hall-entry', pos: [-2 * S, -1 * S], connections: ['living-south', 'hall-center'], pauseAtDoorway: true },
  { id: 'hall-center', pos: [0, -1 * S], connections: ['hall-entry', 'hall-east', 'bedroom-door', 'bathroom-door'] },
  { id: 'hall-east', pos: [2 * S, -1 * S], connections: ['hall-center', 'kitchen-south', 'laundry-door'] },
  { id: 'laundry-door', pos: [3.5 * S, -1 * S], connections: ['hall-east', 'laundry-center'], pauseAtDoorway: true },
  { id: 'laundry-center', pos: [5 * S, -1 * S], connections: ['laundry-door'] },
  { id: 'bedroom-door', pos: [-1.2 * S, 0.5 * S], connections: ['hall-center', 'bedroom-center'], pauseAtDoorway: true },
  { id: 'bedroom-center', pos: [-4 * S, 4 * S], connections: ['bedroom-door', 'back-passage'] },
  { id: 'bathroom-door', pos: [2 * S, 0.5 * S], connections: ['hall-center', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [4 * S, 4 * S], connections: ['bathroom-door', 'back-passage'] },
  { id: 'back-passage', pos: [0, 7 * S], connections: ['bedroom-center', 'bathroom-center', 'yard-door'] },
  { id: 'yard-door', pos: [0, 8.5 * S], connections: ['back-passage', 'yard-center'], pauseAtDoorway: true },
  { id: 'yard-center', pos: [0, 12 * S], connections: ['yard-door', 'yard-west', 'yard-east'] },
  { id: 'yard-west', pos: [-4 * S, 12 * S], connections: ['yard-center'] },
  { id: 'yard-east', pos: [4 * S, 12 * S], connections: ['yard-center'] },
];

const houseDoorFrames: DoorFrame[] = [
  { cx: 0.25 * S, cz: -2 * S, alongZ: false, gapWidth: 6.0 * S, h: 2.4 * S },
  { cx: -1.25 * S, cz: 0, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
  { cx: 2.25 * S, cz: 0, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
  { cx: 3.5 * S, cz: -1 * S, alongZ: true, gapWidth: 1.0 * S, h: 2.3 * S },
  { cx: 0, cz: 8 * S, alongZ: false, gapWidth: 1.5 * S, h: 2.3 * S },
];

const houseCeilings = [
  { pos: [-4 * S, 2.8 * S, -6 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
  { pos: [4 * S, 2.8 * S, -6 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
  { pos: [-2 * S, 2.8 * S, -1 * S] as [number, number, number], size: [12 * S, 2 * S] as [number, number] },
  { pos: [5 * S, 2.8 * S, -1 * S] as [number, number, number], size: [3 * S, 2 * S] as [number, number] },
  { pos: [-4 * S, 2.8 * S, 4 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
  { pos: [4 * S, 2.8 * S, 4 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
];

const houseLights = [
  { position: [-8, 4.5, -12] as [number, number, number], intensity: 0.5, color: '#ffe8c0', distance: 18 },
  { position: [8, 4.5, -12] as [number, number, number], intensity: 0.6, color: '#fff5e0', distance: 18 },
  { position: [-8, 4.5, 8] as [number, number, number], intensity: 0.4, color: '#e8e0ff', distance: 18 },
  { position: [8, 4.5, 8] as [number, number, number], intensity: 0.5, color: '#f0f5ff', distance: 18 },
  { position: [0, 4.5, -2] as [number, number, number], intensity: 0.3, color: '#ffe0b0', distance: 12 },
  { position: [10, 4.5, -2] as [number, number, number], intensity: 0.3, color: '#fff5e0', distance: 8 },
  { position: [0, 6, 24] as [number, number, number], intensity: 0.3, color: '#fffbe0', distance: 28 },
];

const housePreset: FloorPlanPreset = {
  id: 'house',
  name: 'House',
  description: '6 rooms with hallway',
  rooms: houseRooms,
  walls: houseWalls,
  furniture: houseFurniture,
  waypoints: houseWaypoints,
  chargingStation: [-6, 0, -2],
  windowSpots: [[-7.4 * S, 0, -8.5 * S], [7.4 * S, 0, -8.5 * S], [-7.4 * S, 0, 6.8 * S], [7.4 * S, 0, 6.8 * S]],
  ceilings: houseCeilings,
  doorFrames: houseDoorFrames,
  lights: houseLights,
};

// ── APARTMENT (Studio → 3 rooms) ──────────────────────────────

const aptRooms: Room[] = [
  { id: 'living-room', name: 'Living Area', position: [-5 * S, 0, -3 * S], size: [10 * S, 10 * S], color: '#4a4644', furniture: [] },
  { id: 'kitchen', name: 'Kitchenette', position: [6 * S, 0, -5 * S], size: [4 * S, 6 * S], color: '#484848', furniture: [] },
  { id: 'bedroom', name: 'Bedroom', position: [6 * S, 0, 3 * S], size: [4 * S, 6 * S], color: '#444446', furniture: [] },
  { id: 'bathroom', name: 'Bathroom', position: [6 * S, 0, 9 * S], size: [4 * S, 4 * S], color: '#464848', furniture: [] },
];

const aptWalls: Wall[] = [
  // Outer
  { start: [-10 * S, -8 * S], end: [8 * S, -8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-10 * S, -8 * S], end: [-10 * S, 2 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [8 * S, -8 * S], end: [8 * S, 11 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-10 * S, 2 * S], end: [4 * S, 2 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [4 * S, 2 * S], end: [4 * S, 11 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [4 * S, 11 * S], end: [8 * S, 11 * S], height: 2.8 * S, thickness: 0.15 * S },
  // Kitchen/living divider
  { start: [0, -8 * S], end: [0, -3 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Kitchen/bedroom divider
  { start: [4 * S, 0], end: [8 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  // Bedroom/bathroom divider
  { start: [4 * S, 7 * S], end: [8 * S, 7 * S], height: 2.8 * S, thickness: 0.12 * S },
];

const aptFurniture: FurniturePiece[] = [
  furn('sofa', 'Sofa', 'living-room', [-15, 0, -5], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
  furn('coffee-table', 'Coffee Table', 'living-room', [-12, 0, -5], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('tv-stand', 'TV Stand', 'living-room', [-10, 0, -14], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
  furn('desk', 'Desk & Chair', 'living-room', [-17, 0, 0], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
  furn('fridge', 'Fridge', 'kitchen', [9, 0, -14], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
  furn('stove', 'Stove', 'kitchen', [13, 0, -14], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
  furn('kitchen-sink', 'Kitchen Sink', 'kitchen', [15, 0, -8], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, -PI / 2, 0], scale: 2.0 * S }], 1.5),
  furn('bed', 'Bed', 'bedroom', [12, 0, 5], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 3),
  furn('nightstand', 'Nightstand', 'bedroom', [12, 0, 1.5], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
  furn('bathroom-sink', 'Bathroom Sink', 'bathroom', [12, 0, 14.5], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
  furn('shower', 'Shower', 'bathroom', [15, 0, 20], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
  furn('toilet', 'Toilet', 'bathroom', [6, 0, 18], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S }], 1),
];

const aptWaypoints: WaypointDef[] = [
  { id: 'living-center', pos: [-5 * S, -3 * S], connections: ['living-east', 'living-south'] },
  { id: 'living-south', pos: [-5 * S, 0], connections: ['living-center'] },
  { id: 'living-east', pos: [0, -5 * S], connections: ['living-center', 'kitchen-center'] },
  { id: 'kitchen-center', pos: [6 * S, -5 * S], connections: ['living-east', 'bedroom-door'] },
  { id: 'bedroom-door', pos: [5 * S, 0.5 * S], connections: ['kitchen-center', 'bedroom-center', 'bathroom-door'], pauseAtDoorway: true },
  { id: 'bedroom-center', pos: [6 * S, 3 * S], connections: ['bedroom-door'] },
  { id: 'bathroom-door', pos: [5 * S, 7.5 * S], connections: ['bedroom-door', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [6 * S, 9 * S], connections: ['bathroom-door'] },
];

const aptDoorFrames: DoorFrame[] = [
  { cx: 0, cz: -5.5 * S, alongZ: true, gapWidth: 3 * S, h: 2.3 * S },
  { cx: 5.5 * S, cz: 0, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
  { cx: 5.5 * S, cz: 7 * S, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
];

const aptCeilings = [
  { pos: [-5 * S, 2.8 * S, -3 * S] as [number, number, number], size: [10 * S, 10 * S] as [number, number] },
  { pos: [6 * S, 2.8 * S, -5 * S] as [number, number, number], size: [4 * S, 6 * S] as [number, number] },
  { pos: [6 * S, 2.8 * S, 3 * S] as [number, number, number], size: [4 * S, 6 * S] as [number, number] },
  { pos: [6 * S, 2.8 * S, 9 * S] as [number, number, number], size: [4 * S, 4 * S] as [number, number] },
];

const aptLights = [
  { position: [-10, 4.5, -6] as [number, number, number], intensity: 0.6, color: '#ffe8c0', distance: 22 },
  { position: [12, 4.5, -10] as [number, number, number], intensity: 0.5, color: '#fff5e0', distance: 14 },
  { position: [12, 4.5, 6] as [number, number, number], intensity: 0.4, color: '#e8e0ff', distance: 14 },
  { position: [12, 4.5, 18] as [number, number, number], intensity: 0.4, color: '#f0f5ff', distance: 10 },
];

const apartmentPreset: FloorPlanPreset = {
  id: 'apartment',
  name: 'Apartment',
  description: 'Cozy studio, 4 rooms',
  rooms: aptRooms,
  walls: aptWalls,
  furniture: aptFurniture,
  waypoints: aptWaypoints,
  chargingStation: [-3, 0, 0],
  windowSpots: [[-9.4 * S, 0, -5 * S], [7.4 * S, 0, -5 * S]],
  ceilings: aptCeilings,
  doorFrames: aptDoorFrames,
  lights: aptLights,
};

// ── MANSION (8+ rooms) ──────────────────────────────────────────

const manRooms: Room[] = [
  // Ground floor left wing
  { id: 'living-room', name: 'Grand Living Room', position: [-9 * S, 0, -8 * S], size: [10 * S, 8 * S], color: '#4a4644', furniture: [] },
  { id: 'kitchen', name: 'Chef\'s Kitchen', position: [0, 0, -8 * S], size: [8 * S, 8 * S], color: '#484848', furniture: [] },
  { id: 'dining', name: 'Dining Room', position: [8 * S, 0, -8 * S], size: [6 * S, 8 * S], color: '#4a4843', furniture: [] },
  // Center hallway
  { id: 'hallway', name: 'Grand Hallway', position: [0, 0, -1.5 * S], size: [22 * S, 3 * S], color: '#454443', furniture: [] },
  { id: 'laundry', name: 'Utility Room', position: [10 * S, 0, -1.5 * S], size: [2 * S, 3 * S], color: '#484646', furniture: [] },
  // Ground floor right wing
  { id: 'bedroom', name: 'Master Suite', position: [-9 * S, 0, 5.5 * S], size: [10 * S, 8 * S], color: '#444446', furniture: [] },
  { id: 'bathroom', name: 'Master Bath', position: [0, 0, 5.5 * S], size: [8 * S, 8 * S], color: '#464848', furniture: [] },
  { id: 'study', name: 'Study', position: [8 * S, 0, 5.5 * S], size: [6 * S, 8 * S], color: '#464444', furniture: [] },
  { id: 'gym', name: 'Home Gym', position: [-9 * S, 0, 13 * S], size: [10 * S, 6 * S], color: '#434547', furniture: [] },
  { id: 'library', name: 'Library', position: [4 * S, 0, 13 * S], size: [14 * S, 6 * S], color: '#46443e', furniture: [] },
];

const manWalls: Wall[] = [
  // Outer perimeter
  { start: [-14 * S, -12 * S], end: [11 * S, -12 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-14 * S, -12 * S], end: [-14 * S, 16 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [11 * S, -12 * S], end: [11 * S, 16 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-14 * S, 16 * S], end: [11 * S, 16 * S], height: 2.8 * S, thickness: 0.15 * S },
  // Living/kitchen divider
  { start: [-4 * S, -12 * S], end: [-4 * S, -5 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Kitchen/dining divider
  { start: [4 * S, -12 * S], end: [4 * S, -5 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Top rooms → hallway (z = -4S) with gaps
  { start: [-14 * S, -4 * S], end: [-6 * S, -4 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-3 * S, -4 * S], end: [2 * S, -4 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [5 * S, -4 * S], end: [11 * S, -4 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Hallway bottom → lower rooms (z = 0) with gaps
  { start: [-14 * S, 0], end: [-6 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-3 * S, 0], end: [-1 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [1 * S, 0], end: [3 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [6 * S, 0], end: [9 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  // Utility room walls
  { start: [9 * S, -4 * S], end: [9 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  // Bedroom/bathroom divider
  { start: [-4 * S, 0], end: [-4 * S, 9.5 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Bathroom/study divider
  { start: [4 * S, 0], end: [4 * S, 9.5 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Middle wing → bottom wing (z = 9.5S)
  { start: [-14 * S, 9.5 * S], end: [-6 * S, 9.5 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-3 * S, 9.5 * S], end: [0 * S, 9.5 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [0, 9.5 * S], end: [0, 16 * S], height: 2.8 * S, thickness: 0.12 * S },  // gym/library divider portion
  { start: [3 * S, 9.5 * S], end: [11 * S, 9.5 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Gym/library divider (vertical)
  { start: [-4 * S, 9.5 * S], end: [-4 * S, 16 * S], height: 2.8 * S, thickness: 0.12 * S },
];

const manFurniture: FurniturePiece[] = [
  // Living room
  furn('sofa', 'Sofa', 'living-room', [-22, 0, -16], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
  furn('coffee-table', 'Coffee Table', 'living-room', [-18, 0, -16], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('tv-stand', 'TV Stand', 'living-room', [-18, 0, -22], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
  // Kitchen
  furn('fridge', 'Fridge', 'kitchen', [-2, 0, -22], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
  furn('stove', 'Stove', 'kitchen', [2, 0, -22], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
  furn('kitchen-sink', 'Kitchen Sink', 'kitchen', [6, 0, -22], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  // Utility
  furn('laundry-station', 'Washer & Dryer', 'laundry', [20, 0, -3], [{ url: '/models/washer.glb', offset: [-1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }, { url: '/models/dryer.glb', offset: [1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 2),
  // Bedroom
  furn('bed', 'Bed', 'bedroom', [-18, 0, 14], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 3),
  furn('nightstand', 'Nightstand', 'bedroom', [-23, 0, 14], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
  furn('desk', 'Desk & Chair', 'study', [18, 0, 4], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
  // Bathroom
  furn('bathroom-sink', 'Bathroom Sink', 'bathroom', [0, 0, 1.5], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
  furn('shower', 'Shower', 'bathroom', [6, 0, 16], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
  furn('toilet', 'Toilet', 'bathroom', [-6, 0, 8], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S }], 1),
];

const manWaypoints: WaypointDef[] = [
  // Top wing
  { id: 'living-center', pos: [-9 * S, -8 * S], connections: ['living-door'] },
  { id: 'living-door', pos: [-4.5 * S, -4.5 * S], connections: ['living-center', 'hall-west'], pauseAtDoorway: true },
  { id: 'kitchen-center', pos: [0, -8 * S], connections: ['kitchen-door'] },
  { id: 'kitchen-door', pos: [0, -4.5 * S], connections: ['kitchen-center', 'hall-center'], pauseAtDoorway: true },
  { id: 'dining-center', pos: [8 * S, -8 * S], connections: ['dining-door'] },
  { id: 'dining-door', pos: [7 * S, -4.5 * S], connections: ['dining-center', 'hall-east'], pauseAtDoorway: true },
  // Hallway
  { id: 'hall-west', pos: [-7 * S, -1.5 * S], connections: ['living-door', 'hall-center', 'bedroom-door'] },
  { id: 'hall-center', pos: [0, -1.5 * S], connections: ['kitchen-door', 'hall-west', 'hall-east', 'bathroom-door'] },
  { id: 'hall-east', pos: [7 * S, -1.5 * S], connections: ['dining-door', 'hall-center', 'laundry-door', 'study-door'] },
  { id: 'laundry-door', pos: [9.5 * S, -1.5 * S], connections: ['hall-east', 'laundry-center'], pauseAtDoorway: true },
  { id: 'laundry-center', pos: [10 * S, -1.5 * S], connections: ['laundry-door'] },
  // Middle wing
  { id: 'bedroom-door', pos: [-4.5 * S, 0.5 * S], connections: ['hall-west', 'bedroom-center'], pauseAtDoorway: true },
  { id: 'bedroom-center', pos: [-9 * S, 5.5 * S], connections: ['bedroom-door', 'gym-door'] },
  { id: 'bathroom-door', pos: [0, 0.5 * S], connections: ['hall-center', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [0, 5.5 * S], connections: ['bathroom-door'] },
  { id: 'study-door', pos: [5 * S, 0.5 * S], connections: ['hall-east', 'study-center'], pauseAtDoorway: true },
  { id: 'study-center', pos: [8 * S, 5.5 * S], connections: ['study-door', 'library-door'] },
  // Bottom wing
  { id: 'gym-door', pos: [-4.5 * S, 10 * S], connections: ['bedroom-center', 'gym-center'], pauseAtDoorway: true },
  { id: 'gym-center', pos: [-9 * S, 13 * S], connections: ['gym-door'] },
  { id: 'library-door', pos: [4.5 * S, 10 * S], connections: ['study-center', 'library-center'], pauseAtDoorway: true },
  { id: 'library-center', pos: [4 * S, 13 * S], connections: ['library-door'] },
];

const manDoorFrames: DoorFrame[] = [
  { cx: -4.5 * S, cz: -4 * S, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 0, cz: -4 * S, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 7 * S, cz: -4 * S, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: -4.5 * S, cz: 0, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 0, cz: 0, alongZ: false, gapWidth: 1.5 * S, h: 2.3 * S },
  { cx: 5 * S, cz: 0, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 9 * S, cz: -2 * S, alongZ: true, gapWidth: 1.5 * S, h: 2.3 * S },
  { cx: -4.5 * S, cz: 9.5 * S, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 1.5 * S, cz: 9.5 * S, alongZ: false, gapWidth: 2 * S, h: 2.3 * S },
];

const manCeilings = [
  { pos: [-9 * S, 2.8 * S, -8 * S] as [number, number, number], size: [10 * S, 8 * S] as [number, number] },
  { pos: [0, 2.8 * S, -8 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
  { pos: [8 * S, 2.8 * S, -8 * S] as [number, number, number], size: [6 * S, 8 * S] as [number, number] },
  { pos: [0, 2.8 * S, -1.5 * S] as [number, number, number], size: [22 * S, 3 * S] as [number, number] },
  { pos: [10 * S, 2.8 * S, -1.5 * S] as [number, number, number], size: [2 * S, 3 * S] as [number, number] },
  { pos: [-9 * S, 2.8 * S, 5.5 * S] as [number, number, number], size: [10 * S, 8 * S] as [number, number] },
  { pos: [0, 2.8 * S, 5.5 * S] as [number, number, number], size: [8 * S, 8 * S] as [number, number] },
  { pos: [8 * S, 2.8 * S, 5.5 * S] as [number, number, number], size: [6 * S, 8 * S] as [number, number] },
  { pos: [-9 * S, 2.8 * S, 13 * S] as [number, number, number], size: [10 * S, 6 * S] as [number, number] },
  { pos: [4 * S, 2.8 * S, 13 * S] as [number, number, number], size: [14 * S, 6 * S] as [number, number] },
];

const manLights = [
  { position: [-18, 4.5, -16] as [number, number, number], intensity: 0.5, color: '#ffe8c0', distance: 22 },
  { position: [0, 4.5, -16] as [number, number, number], intensity: 0.6, color: '#fff5e0', distance: 18 },
  { position: [16, 4.5, -16] as [number, number, number], intensity: 0.4, color: '#ffe8c0', distance: 14 },
  { position: [0, 4.5, -3] as [number, number, number], intensity: 0.3, color: '#ffe0b0', distance: 18 },
  { position: [-18, 4.5, 11] as [number, number, number], intensity: 0.4, color: '#e8e0ff', distance: 22 },
  { position: [0, 4.5, 11] as [number, number, number], intensity: 0.5, color: '#f0f5ff', distance: 18 },
  { position: [16, 4.5, 11] as [number, number, number], intensity: 0.4, color: '#ffe8c0', distance: 14 },
  { position: [-18, 4.5, 26] as [number, number, number], intensity: 0.4, color: '#ffe0b0', distance: 18 },
  { position: [8, 4.5, 26] as [number, number, number], intensity: 0.4, color: '#ffe8c0', distance: 22 },
];

const mansionPreset: FloorPlanPreset = {
  id: 'mansion',
  name: 'Mansion',
  description: '10 rooms, grand layout',
  rooms: manRooms,
  walls: manWalls,
  furniture: manFurniture,
  waypoints: manWaypoints,
  chargingStation: [-10, 0, -3],
  windowSpots: [
    [-13.4 * S, 0, -8 * S], [10.4 * S, 0, -8 * S],
    [-13.4 * S, 0, 5 * S], [10.4 * S, 0, 5 * S],
    [-13.4 * S, 0, 13 * S], [10.4 * S, 0, 13 * S],
  ],
  ceilings: manCeilings,
  doorFrames: manDoorFrames,
  lights: manLights,
};

// ── STUDIO (compact: 1 main room + kitchen + bathroom) ──────────

const studioRooms: Room[] = [
  { id: 'living-room', name: 'Main Room', position: [-3 * S, 0, -2 * S], size: [10 * S, 8 * S], color: '#4a4644', furniture: [] },
  { id: 'kitchen', name: 'Kitchen', position: [6 * S, 0, -4 * S], size: [4 * S, 4 * S], color: '#484848', furniture: [] },
  { id: 'bathroom', name: 'Bathroom', position: [6 * S, 0, 1 * S], size: [4 * S, 4 * S], color: '#464848', furniture: [] },
];

const studioWalls: Wall[] = [
  // Outer
  { start: [-8 * S, -6 * S], end: [8 * S, -6 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, -6 * S], end: [-8 * S, 3 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [8 * S, -6 * S], end: [8 * S, 3 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, 3 * S], end: [8 * S, 3 * S], height: 2.8 * S, thickness: 0.15 * S },
  // Living/kitchen divider
  { start: [4 * S, -6 * S], end: [4 * S, -3 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Kitchen/bathroom divider
  { start: [4 * S, -1 * S], end: [8 * S, -1 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Living/bathroom divider
  { start: [4 * S, -1 * S], end: [4 * S, 3 * S], height: 2.8 * S, thickness: 0.12 * S },
];

const studioFurniture: FurniturePiece[] = [
  furn('sofa', 'Sofa', 'living-room', [-12, 0, -4], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
  furn('coffee-table', 'Coffee Table', 'living-room', [-9, 0, -4], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('tv-stand', 'TV Stand', 'living-room', [-6, 0, -10], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
  furn('bed', 'Bed', 'living-room', [-3, 0, 3], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 3),
  furn('nightstand', 'Nightstand', 'living-room', [-7, 0, 3], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
  furn('desk', 'Desk & Chair', 'living-room', [-14, 0, 3], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
  furn('fridge', 'Fridge', 'kitchen', [10, 0, -10], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
  furn('stove', 'Stove', 'kitchen', [14, 0, -10], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
  furn('kitchen-sink', 'Kitchen Sink', 'kitchen', [15, 0, -6], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, -PI / 2, 0], scale: 2.0 * S }], 1.5),
  furn('bathroom-sink', 'Bathroom Sink', 'bathroom', [10, 0, -0.5], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
  furn('shower', 'Shower', 'bathroom', [14.5, 0, 4], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
  furn('toilet', 'Toilet', 'bathroom', [6, 0, 4], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S }], 1),
];

const studioWaypoints: WaypointDef[] = [
  { id: 'living-center', pos: [-3 * S, -2 * S], connections: ['living-east', 'living-south'] },
  { id: 'living-south', pos: [-3 * S, 1 * S], connections: ['living-center'] },
  { id: 'living-east', pos: [2 * S, -2 * S], connections: ['living-center', 'kitchen-door'] },
  { id: 'kitchen-door', pos: [4.5 * S, -4 * S], connections: ['living-east', 'kitchen-center'], pauseAtDoorway: true },
  { id: 'kitchen-center', pos: [6 * S, -4 * S], connections: ['kitchen-door', 'bathroom-door'] },
  { id: 'bathroom-door', pos: [5 * S, -1.5 * S], connections: ['kitchen-center', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [6 * S, 1 * S], connections: ['bathroom-door'] },
];

const studioDoorFrames: DoorFrame[] = [
  { cx: 4 * S, cz: -4.5 * S, alongZ: true, gapWidth: 2 * S, h: 2.3 * S },
  { cx: 5.5 * S, cz: -1 * S, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
];

const studioCeilings = [
  { pos: [-3 * S, 2.8 * S, -2 * S] as [number, number, number], size: [10 * S, 8 * S] as [number, number] },
  { pos: [6 * S, 2.8 * S, -4 * S] as [number, number, number], size: [4 * S, 4 * S] as [number, number] },
  { pos: [6 * S, 2.8 * S, 1 * S] as [number, number, number], size: [4 * S, 4 * S] as [number, number] },
];

const studioLights = [
  { position: [-6, 4.5, -4] as [number, number, number], intensity: 0.6, color: '#ffe8c0', distance: 20 },
  { position: [12, 4.5, -8] as [number, number, number], intensity: 0.5, color: '#fff5e0', distance: 10 },
  { position: [12, 4.5, 2] as [number, number, number], intensity: 0.4, color: '#f0f5ff', distance: 10 },
];

const studioPreset: FloorPlanPreset = {
  id: 'studio',
  name: 'Studio',
  description: 'Compact, 3 rooms',
  rooms: studioRooms,
  walls: studioWalls,
  furniture: studioFurniture,
  waypoints: studioWaypoints,
  chargingStation: [2, 0, 1],
  windowSpots: [[-7.4 * S, 0, -2 * S], [7.4 * S, 0, -4 * S]],
  ceilings: studioCeilings,
  doorFrames: studioDoorFrames,
  lights: studioLights,
};

// ── LOFT (open plan: one large space + bathroom) ─────────────────

const loftRooms: Room[] = [
  { id: 'living-room', name: 'Open Loft', position: [0, 0, -4 * S], size: [16 * S, 12 * S], color: '#4a4644', furniture: [] },
  { id: 'kitchen', name: 'Kitchen Area', position: [5 * S, 0, 4 * S], size: [6 * S, 4 * S], color: '#484848', furniture: [] },
  { id: 'bathroom', name: 'Bathroom', position: [-6 * S, 0, 4 * S], size: [4 * S, 4 * S], color: '#464848', furniture: [] },
];

const loftWalls: Wall[] = [
  // Outer perimeter
  { start: [-8 * S, -10 * S], end: [8 * S, -10 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, -10 * S], end: [-8 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [8 * S, -10 * S], end: [8 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, 6 * S], end: [8 * S, 6 * S], height: 2.8 * S, thickness: 0.15 * S },
  // Bathroom enclosure (only bathroom is walled off)
  { start: [-8 * S, 2 * S], end: [-4 * S, 2 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-4 * S, 2 * S], end: [-4 * S, 6 * S], height: 2.8 * S, thickness: 0.12 * S },
  // Kitchen half-wall (counter height, decorative)
  { start: [2 * S, 2 * S], end: [2 * S, 6 * S], height: 1.2 * S, thickness: 0.12 * S },
];

const loftFurniture: FurniturePiece[] = [
  // Living area (left side)
  furn('sofa', 'Sofa', 'living-room', [-12, 0, -8], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
  furn('coffee-table', 'Coffee Table', 'living-room', [-8, 0, -8], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  furn('tv-stand', 'TV Stand', 'living-room', [-10, 0, -18], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
  // Bedroom area (right side of open plan)
  furn('bed', 'Bed', 'living-room', [10, 0, -14], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 3),
  furn('nightstand', 'Nightstand', 'living-room', [10, 0, -18], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
  furn('desk', 'Desk & Chair', 'living-room', [14, 0, -4], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, -PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [-2, 0, 0], rotation: [0, PI / 2, 0], scale: 1.8 * S }], 1.5),
  // Kitchen area
  furn('fridge', 'Fridge', 'kitchen', [6, 0, 10], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
  furn('stove', 'Stove', 'kitchen', [10, 0, 10], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
  furn('kitchen-sink', 'Kitchen Sink', 'kitchen', [14, 0, 10], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
  // Bathroom
  furn('bathroom-sink', 'Bathroom Sink', 'bathroom', [-10, 0, 3], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
  furn('shower', 'Shower', 'bathroom', [-14, 0, 10], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
  furn('toilet', 'Toilet', 'bathroom', [-6, 0, 10], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.2 * S }], 1),
];

const loftWaypoints: WaypointDef[] = [
  { id: 'living-center', pos: [-3 * S, -4 * S], connections: ['living-east', 'living-south'] },
  { id: 'living-east', pos: [4 * S, -4 * S], connections: ['living-center'] },
  { id: 'living-south', pos: [-1 * S, 0], connections: ['living-center', 'kitchen-center', 'bathroom-door'] },
  { id: 'kitchen-center', pos: [5 * S, 4 * S], connections: ['living-south'] },
  { id: 'bathroom-door', pos: [-5 * S, 2.5 * S], connections: ['living-south', 'bathroom-center'], pauseAtDoorway: true },
  { id: 'bathroom-center', pos: [-6 * S, 4 * S], connections: ['bathroom-door'] },
];

const loftDoorFrames: DoorFrame[] = [
  { cx: -5.5 * S, cz: 2 * S, alongZ: false, gapWidth: 1.2 * S, h: 2.3 * S },
];

const loftCeilings = [
  { pos: [0, 2.8 * S, -4 * S] as [number, number, number], size: [16 * S, 12 * S] as [number, number] },
  { pos: [5 * S, 2.8 * S, 4 * S] as [number, number, number], size: [6 * S, 4 * S] as [number, number] },
  { pos: [-6 * S, 2.8 * S, 4 * S] as [number, number, number], size: [4 * S, 4 * S] as [number, number] },
];

const loftLights = [
  { position: [-10, 4.5, -8] as [number, number, number], intensity: 0.5, color: '#ffe8c0', distance: 22 },
  { position: [8, 4.5, -14] as [number, number, number], intensity: 0.4, color: '#e8e0ff', distance: 18 },
  { position: [0, 4.5, 0] as [number, number, number], intensity: 0.5, color: '#fff5e0', distance: 18 },
  { position: [10, 4.5, 8] as [number, number, number], intensity: 0.5, color: '#fff5e0', distance: 14 },
  { position: [-12, 4.5, 8] as [number, number, number], intensity: 0.4, color: '#f0f5ff', distance: 10 },
];

const loftPreset: FloorPlanPreset = {
  id: 'loft',
  name: 'Loft',
  description: 'Open plan, minimal walls',
  rooms: loftRooms,
  walls: loftWalls,
  furniture: loftFurniture,
  waypoints: loftWaypoints,
  chargingStation: [0, 0, 0],
  windowSpots: [
    [-7.4 * S, 0, -6 * S], [7.4 * S, 0, -6 * S],
    [-7.4 * S, 0, 4 * S], [7.4 * S, 0, 4 * S],
  ],
  ceilings: loftCeilings,
  doorFrames: loftDoorFrames,
  lights: loftLights,
};

// ── Exports ─────────────────────────────────────────────────────

export const FLOOR_PLAN_PRESETS: FloorPlanPreset[] = [
  studioPreset,
  apartmentPreset,
  housePreset,
  loftPreset,
  mansionPreset,
];

export function getAllFloorPlans(): FloorPlanPreset[] {
  return [...FLOOR_PLAN_PRESETS, ...loadCustomFloorPlans()];
}

export function getFloorPlan(id: string): FloorPlanPreset {
  return getAllFloorPlans().find((p) => p.id === id) ?? housePreset;
}

export const DEFAULT_FLOOR_PLAN_ID = 'house';

// ── localStorage persistence ────────────────────────────────────

const FLOOR_PLAN_STORAGE_KEY = 'simbot-floor-plan';

export function loadFloorPlanId(): string {
  try {
    return localStorage.getItem(FLOOR_PLAN_STORAGE_KEY) ?? DEFAULT_FLOOR_PLAN_ID;
  } catch {
    return DEFAULT_FLOOR_PLAN_ID;
  }
}

export function saveFloorPlanId(id: string) {
  try {
    localStorage.setItem(FLOOR_PLAN_STORAGE_KEY, id);
  } catch { /* ignore */ }
}
