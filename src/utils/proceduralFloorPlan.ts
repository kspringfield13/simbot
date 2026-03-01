import type { Room, Wall } from '../types';
import type { FloorPlanPreset, WaypointDef, DoorFrame } from '../config/floorPlans';
import type { FurniturePiece } from './furnitureRegistry';

const S = 2;
const PI = Math.PI;
const WALL_H = 2.8 * S;
const OUTER_THICK = 0.15 * S;
const INNER_THICK = 0.12 * S;
const DOOR_GAP = 1.5 * S;
const DOOR_H = 2.3 * S;

// ── Room templates ──────────────────────────────────────────────

interface RoomTemplate {
  id: string;
  name: string;
  color: string;
  minW: number; maxW: number; // in S-units
  minD: number; maxD: number;
  required: boolean;
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  { id: 'living-room', name: 'Living Room', color: '#4a4644', minW: 6, maxW: 8, minD: 6, maxD: 8, required: true },
  { id: 'kitchen',     name: 'Kitchen',     color: '#484848', minW: 5, maxW: 8, minD: 5, maxD: 8, required: true },
  { id: 'bedroom',     name: 'Bedroom',     color: '#444446', minW: 5, maxW: 8, minD: 5, maxD: 8, required: true },
  { id: 'bathroom',    name: 'Bathroom',    color: '#464848', minW: 4, maxW: 6, minD: 4, maxD: 6, required: true },
  { id: 'laundry',     name: 'Laundry',     color: '#484646', minW: 3, maxW: 4, minD: 3, maxD: 4, required: false },
  { id: 'study',       name: 'Study',       color: '#464444', minW: 4, maxW: 6, minD: 4, maxD: 6, required: false },
  { id: 'dining',      name: 'Dining Room', color: '#4a4843', minW: 5, maxW: 7, minD: 5, maxD: 7, required: false },
  { id: 'gym',         name: 'Home Gym',    color: '#434547', minW: 5, maxW: 7, minD: 4, maxD: 6, required: false },
];

const LIGHT_COLORS = ['#ffe8c0', '#fff5e0', '#e8e0ff', '#f0f5ff', '#ffe0b0'];

// ── Helpers ─────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Furniture helper ────────────────────────────────────────────

function furn(
  id: string, name: string, roomId: string,
  pos: [number, number, number],
  models: FurniturePiece['models'],
  obstacleRadius: number,
): FurniturePiece {
  return { id, name, roomId, defaultPosition: pos, models, obstacleRadius, movable: true };
}

function roomFurniture(roomId: string, cx: number, cz: number, hw: number, hd: number): FurniturePiece[] {
  const pieces: FurniturePiece[] = [];
  switch (roomId) {
    case 'living-room':
      pieces.push(
        furn('sofa', 'Sofa', roomId, [cx - hw * 0.6, 0, cz], [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }], 2.5),
        furn('coffee-table', 'Coffee Table', roomId, [cx - hw * 0.2, 0, cz], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
        furn('tv-stand', 'TV Stand', roomId, [cx, 0, cz - hd * 0.8], [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 2),
      );
      break;
    case 'kitchen':
      pieces.push(
        furn('fridge', 'Fridge', roomId, [cx - hw * 0.5, 0, cz - hd * 0.8], [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 1.5),
        furn('stove', 'Stove', roomId, [cx, 0, cz - hd * 0.8], [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S }], 1.5),
        furn('kitchen-sink', 'Kitchen Sink', roomId, [cx + hw * 0.5, 0, cz - hd * 0.8], [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S }], 1.5),
      );
      break;
    case 'bedroom':
      pieces.push(
        furn('bed', 'Bed', roomId, [cx, 0, cz + hd * 0.4], [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 3),
        furn('nightstand', 'Nightstand', roomId, [cx - hw * 0.6, 0, cz + hd * 0.4], [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S }], 1),
        furn('desk', 'Desk & Chair', roomId, [cx + hw * 0.5, 0, cz - hd * 0.5], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
      );
      break;
    case 'bathroom':
      pieces.push(
        furn('bathroom-sink', 'Bathroom Sink', roomId, [cx - hw * 0.4, 0, cz - hd * 0.6], [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S }], 1),
        furn('shower', 'Shower', roomId, [cx + hw * 0.4, 0, cz + hd * 0.4], [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S }], 2),
        furn('toilet', 'Toilet', roomId, [cx - hw * 0.4, 0, cz + hd * 0.3], [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S }], 1),
      );
      break;
    case 'laundry':
      pieces.push(
        furn('laundry-station', 'Washer & Dryer', roomId, [cx, 0, cz], [{ url: '/models/washer.glb', offset: [-1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }, { url: '/models/dryer.glb', offset: [1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S }], 2),
      );
      break;
    case 'study':
      pieces.push(
        furn('desk', 'Desk & Chair', roomId, [cx, 0, cz], [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S }], 1.5),
      );
      break;
    case 'dining':
      pieces.push(
        furn('coffee-table', 'Dining Table', roomId, [cx, 0, cz], [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.5 * S }], 2),
      );
      break;
  }
  return pieces;
}

// ── Placement structures ────────────────────────────────────────

interface PlacedRoom {
  template: RoomTemplate;
  w: number;  // world-space width  (S-multiplied)
  d: number;  // world-space depth  (S-multiplied)
  cx: number; // center x
  cz: number; // center z
}

// ── Main generator ──────────────────────────────────────────────

export function generateRandomFloorPlan(): FloorPlanPreset {
  const roomCount = rand(4, 8);

  // Pick room templates
  const required = ROOM_TEMPLATES.filter((t) => t.required);
  const optional = shuffle(ROOM_TEMPLATES.filter((t) => !t.required));
  const templates = [...required, ...optional.slice(0, roomCount - required.length)];

  // Assign random sizes
  const sized = templates.map((t) => ({
    template: t,
    w: rand(t.minW, t.maxW) * S,
    d: rand(t.minD, t.maxD) * S,
  }));

  // Split into top row and bottom row
  const topCount = Math.ceil(sized.length / 2);
  const topRow = sized.slice(0, topCount);
  const bottomRow = sized.slice(topCount);

  // Hallway dimensions
  const hallwayD = 2 * S;
  const topTotalW = topRow.reduce((s, r) => s + r.w, 0);
  const bottomTotalW = bottomRow.reduce((s, r) => s + r.w, 0);
  const totalW = Math.max(topTotalW, bottomTotalW);
  const hallwayW = totalW;

  // Place rooms
  const placed: PlacedRoom[] = [];

  // Top row (negative z)
  let curX = -topTotalW / 2;
  const topCz = -(hallwayD / 2);
  for (const r of topRow) {
    const cx = curX + r.w / 2;
    const cz = topCz - r.d / 2;
    placed.push({ ...r, cx, cz });
    curX += r.w;
  }

  // Hallway
  const hallCx = 0;
  const hallCz = 0;

  // Bottom row (positive z)
  curX = -bottomTotalW / 2;
  const botCz = hallwayD / 2;
  for (const r of bottomRow) {
    const cx = curX + r.w / 2;
    const cz = botCz + r.d / 2;
    placed.push({ ...r, cx, cz });
    curX += r.w;
  }

  // ── Build rooms ───────────────────────────────────────────────
  const rooms: Room[] = placed.map((p) => ({
    id: p.template.id,
    name: p.template.name,
    position: [p.cx, 0, p.cz] as [number, number, number],
    size: [p.w, p.d] as [number, number],
    color: p.template.color,
    furniture: [],
  }));

  // Add hallway room
  rooms.push({
    id: 'hallway',
    name: 'Hallway',
    position: [hallCx, 0, hallCz],
    size: [hallwayW, hallwayD],
    color: '#454443',
    furniture: [],
  });

  // ── Build walls ───────────────────────────────────────────────
  const walls: Wall[] = [];

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of placed) {
    minX = Math.min(minX, p.cx - p.w / 2);
    maxX = Math.max(maxX, p.cx + p.w / 2);
    minZ = Math.min(minZ, p.cz - p.d / 2);
    maxZ = Math.max(maxZ, p.cz + p.d / 2);
  }
  // Include hallway
  minX = Math.min(minX, -hallwayW / 2);
  maxX = Math.max(maxX, hallwayW / 2);
  minZ = Math.min(minZ, -hallwayD / 2);
  maxZ = Math.max(maxZ, hallwayD / 2);

  // Outer walls
  walls.push(
    { start: [minX, minZ], end: [maxX, minZ], height: WALL_H, thickness: OUTER_THICK },
    { start: [minX, minZ], end: [minX, maxZ], height: WALL_H, thickness: OUTER_THICK },
    { start: [maxX, minZ], end: [maxX, maxZ], height: WALL_H, thickness: OUTER_THICK },
    { start: [minX, maxZ], end: [maxX, maxZ], height: WALL_H, thickness: OUTER_THICK },
  );

  // Hallway divider walls (top side: z = -hallwayD/2, bottom side: z = hallwayD/2)
  // With gaps for each room doorway
  const hallTopZ = -hallwayD / 2;
  const hallBotZ = hallwayD / 2;

  // Top hallway wall with gaps for top-row rooms
  buildWallWithGaps(walls, minX, maxX, hallTopZ, placed.slice(0, topRow.length));

  // Bottom hallway wall with gaps for bottom-row rooms
  buildWallWithGaps(walls, minX, maxX, hallBotZ, placed.slice(topRow.length));

  // Interior vertical walls between rooms in the same row
  for (let i = 0; i < topRow.length - 1; i++) {
    const p = placed[i];
    const wallX = p.cx + p.w / 2;
    walls.push({ start: [wallX, minZ], end: [wallX, hallTopZ], height: WALL_H, thickness: INNER_THICK });
  }
  for (let i = 0; i < bottomRow.length - 1; i++) {
    const p = placed[topRow.length + i];
    const wallX = p.cx + p.w / 2;
    walls.push({ start: [wallX, hallBotZ], end: [wallX, maxZ], height: WALL_H, thickness: INNER_THICK });
  }

  // ── Door frames ───────────────────────────────────────────────
  const doorFrames: DoorFrame[] = [];

  // Top row doors (opening into hallway at hallTopZ)
  for (let i = 0; i < topRow.length; i++) {
    const p = placed[i];
    doorFrames.push({ cx: p.cx, cz: hallTopZ, alongZ: false, gapWidth: DOOR_GAP, h: DOOR_H });
  }
  // Bottom row doors
  for (let i = 0; i < bottomRow.length; i++) {
    const p = placed[topRow.length + i];
    doorFrames.push({ cx: p.cx, cz: hallBotZ, alongZ: false, gapWidth: DOOR_GAP, h: DOOR_H });
  }

  // ── Waypoints ─────────────────────────────────────────────────
  const waypoints: WaypointDef[] = [];

  // Hallway waypoints
  const hallWpIds: string[] = [];
  // One waypoint at each room's door position along the hallway
  const allDoorWps: { roomIdx: number; doorWpId: string; centerWpId: string; side: 'top' | 'bottom' }[] = [];

  for (let i = 0; i < topRow.length; i++) {
    const p = placed[i];
    const doorId = `${p.template.id}-door`;
    const centerId = `${p.template.id}-center`;
    const hallPtId = `hall-${p.template.id}`;
    hallWpIds.push(hallPtId);
    waypoints.push({ id: hallPtId, pos: [p.cx, hallCz], connections: [doorId] });
    waypoints.push({ id: doorId, pos: [p.cx, hallTopZ + 0.5 * S], connections: [hallPtId, centerId], pauseAtDoorway: true });
    waypoints.push({ id: centerId, pos: [p.cx, p.cz], connections: [doorId] });
    allDoorWps.push({ roomIdx: i, doorWpId: doorId, centerWpId: centerId, side: 'top' });
  }
  for (let i = 0; i < bottomRow.length; i++) {
    const p = placed[topRow.length + i];
    const doorId = `${p.template.id}-door`;
    const centerId = `${p.template.id}-center`;
    const hallPtId = `hall-${p.template.id}`;
    hallWpIds.push(hallPtId);
    waypoints.push({ id: hallPtId, pos: [p.cx, hallCz], connections: [doorId] });
    waypoints.push({ id: doorId, pos: [p.cx, hallBotZ - 0.5 * S], connections: [hallPtId, centerId], pauseAtDoorway: true });
    waypoints.push({ id: centerId, pos: [p.cx, p.cz], connections: [doorId] });
    allDoorWps.push({ roomIdx: topRow.length + i, doorWpId: doorId, centerWpId: centerId, side: 'bottom' });
  }

  // Connect hallway waypoints to their neighbors
  for (let i = 0; i < hallWpIds.length; i++) {
    const wp = waypoints.find((w) => w.id === hallWpIds[i])!;
    if (i > 0) wp.connections.push(hallWpIds[i - 1]);
    if (i < hallWpIds.length - 1) wp.connections.push(hallWpIds[i + 1]);
  }

  // ── Furniture ─────────────────────────────────────────────────
  const furniture: FurniturePiece[] = [];
  for (const p of placed) {
    const hw = p.w / 2;
    const hd = p.d / 2;
    furniture.push(...roomFurniture(p.template.id, p.cx, p.cz, hw, hd));
  }

  // ── Ceilings ──────────────────────────────────────────────────
  const ceilings = [
    ...placed.map((p) => ({
      pos: [p.cx, WALL_H, p.cz] as [number, number, number],
      size: [p.w, p.d] as [number, number],
    })),
    { pos: [hallCx, WALL_H, hallCz] as [number, number, number], size: [hallwayW, hallwayD] as [number, number] },
  ];

  // ── Lights ────────────────────────────────────────────────────
  const lights = placed.map((p, i) => ({
    position: [p.cx, 4.5, p.cz] as [number, number, number],
    intensity: 0.4 + Math.random() * 0.2,
    color: LIGHT_COLORS[i % LIGHT_COLORS.length],
    distance: Math.max(p.w, p.d) + 4,
  }));
  // Hallway light
  lights.push({
    position: [hallCx, 4.5, hallCz] as [number, number, number],
    intensity: 0.3,
    color: '#ffe0b0',
    distance: hallwayW * 0.6,
  });

  // ── Window spots ──────────────────────────────────────────────
  const windowSpots: [number, number, number][] = [
    [minX + 0.6 * S, 0, (minZ + hallTopZ) / 2],
    [maxX - 0.6 * S, 0, (minZ + hallTopZ) / 2],
  ];
  if (bottomRow.length > 0) {
    windowSpots.push(
      [minX + 0.6 * S, 0, (maxZ + hallBotZ) / 2],
      [maxX - 0.6 * S, 0, (maxZ + hallBotZ) / 2],
    );
  }

  // ── Charging station ──────────────────────────────────────────
  const chargingStation: [number, number, number] = [minX + 2, 0, hallCz];

  const id = `random-${Date.now()}`;

  return {
    id,
    name: 'Random Layout',
    description: `${rooms.length} rooms, procedural`,
    rooms,
    walls,
    furniture,
    waypoints,
    chargingStation,
    windowSpots,
    ceilings,
    doorFrames,
    lights,
  };
}

// ── Wall builder with door gaps ─────────────────────────────────

function buildWallWithGaps(
  walls: Wall[],
  startX: number,
  endX: number,
  z: number,
  placedRow: PlacedRoom[],
) {
  // Build wall segments along the z line, with gaps at each room's center
  const gaps: { center: number; halfGap: number }[] = placedRow.map((p) => ({
    center: p.cx,
    halfGap: DOOR_GAP / 2,
  }));

  // Sort gaps by center x
  gaps.sort((a, b) => a.center - b.center);

  let x = startX;
  for (const gap of gaps) {
    const gapStart = gap.center - gap.halfGap;
    const gapEnd = gap.center + gap.halfGap;
    if (x < gapStart) {
      walls.push({ start: [x, z], end: [gapStart, z], height: WALL_H, thickness: INNER_THICK });
    }
    x = gapEnd;
  }
  if (x < endX) {
    walls.push({ start: [x, z], end: [endX, z], height: WALL_H, thickness: INNER_THICK });
  }
}

// ── localStorage for custom generated floor plans ───────────────

const CUSTOM_PLANS_KEY = 'simbot-custom-floor-plans';

export function loadCustomFloorPlans(): FloorPlanPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FloorPlanPreset[];
  } catch {
    return [];
  }
}

export function saveCustomFloorPlan(plan: FloorPlanPreset) {
  try {
    const existing = loadCustomFloorPlans();
    // Keep only last 5 custom plans
    const updated = [...existing, plan].slice(-5);
    localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function deleteCustomFloorPlan(id: string) {
  try {
    const existing = loadCustomFloorPlans();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}
