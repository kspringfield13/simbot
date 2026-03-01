// ── Community Sharing System ──────────────────────────────────
// Export/import floor plans and robot builds as shareable base64 URLs.
// Saves user's shared creations to localStorage.

import type { FloorPlanPreset } from '../config/floorPlans';
import type { CustomRobot } from '../config/crafting';

export type ShareableType = 'floor-plan' | 'robot-build';

export interface ShareableContent {
  type: ShareableType;
  version: 1;
  name: string;
  createdAt: string;
  data: FloorPlanPreset | CustomRobot;
}

export interface SharedCreation {
  id: string;
  type: ShareableType;
  name: string;
  sharedAt: string;
  content: ShareableContent;
}

const SHARED_CREATIONS_KEY = 'simbot-shared-creations';

// ── Encode / Decode ──────────────────────────────────────────

export function encodeShareable(content: ShareableContent): string {
  const json = JSON.stringify(content);
  // Use TextEncoder for proper UTF-8 → base64
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeShareable(encoded: string): ShareableContent | null {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (!parsed.type || !parsed.data || parsed.version !== 1) return null;
    return parsed as ShareableContent;
  } catch {
    return null;
  }
}

// ── URL helpers ──────────────────────────────────────────────

export function createShareUrl(content: ShareableContent): string {
  const encoded = encodeShareable(content);
  const base = window.location.origin + window.location.pathname;
  return `${base}?share=${encoded}`;
}

export function getShareFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

export function clearShareFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, '', url.toString());
}

// ── Export helpers ────────────────────────────────────────────

export function exportFloorPlan(plan: FloorPlanPreset): ShareableContent {
  return {
    type: 'floor-plan',
    version: 1,
    name: plan.name,
    createdAt: new Date().toISOString(),
    data: plan,
  };
}

export function exportRobotBuild(robot: CustomRobot): ShareableContent {
  return {
    type: 'robot-build',
    version: 1,
    name: robot.name,
    createdAt: new Date().toISOString(),
    data: robot,
  };
}

// ── localStorage persistence ─────────────────────────────────

export function loadSharedCreations(): SharedCreation[] {
  try {
    const raw = localStorage.getItem(SHARED_CREATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SharedCreation[];
  } catch {
    return [];
  }
}

export function saveSharedCreation(creation: SharedCreation) {
  try {
    const existing = loadSharedCreations();
    // Prevent duplicates by id
    const filtered = existing.filter((c) => c.id !== creation.id);
    // Keep last 20
    const updated = [...filtered, creation].slice(-20);
    localStorage.setItem(SHARED_CREATIONS_KEY, JSON.stringify(updated));
  } catch { /* ignore quota */ }
}

export function deleteSharedCreation(id: string) {
  try {
    const existing = loadSharedCreations();
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(SHARED_CREATIONS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

// ── Built-in gallery examples ────────────────────────────────

export const GALLERY_FLOOR_PLANS: { name: string; description: string; content: ShareableContent }[] = [
  {
    name: 'Cozy Cottage',
    description: 'A warm 4-room cottage with open kitchen',
    content: {
      type: 'floor-plan',
      version: 1,
      name: 'Cozy Cottage',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        id: 'gallery-cottage',
        name: 'Cozy Cottage',
        description: 'Warm cottage, 4 rooms',
        rooms: [
          { id: 'living-room', name: 'Living Room', position: [-5, 0, -4], size: [10, 8], color: '#5a4e3c', furniture: [] },
          { id: 'kitchen', name: 'Kitchen', position: [5, 0, -4], size: [6, 8], color: '#4a4538', furniture: [] },
          { id: 'bedroom', name: 'Bedroom', position: [-5, 0, 5], size: [10, 6], color: '#3e3c48', furniture: [] },
          { id: 'bathroom', name: 'Bathroom', position: [5, 0, 5], size: [6, 6], color: '#3c4848', furniture: [] },
        ],
        walls: [
          { start: [-10, -8], end: [8, -8], height: 5.6, thickness: 0.3 },
          { start: [-10, -8], end: [-10, 8], height: 5.6, thickness: 0.3 },
          { start: [8, -8], end: [8, 8], height: 5.6, thickness: 0.3 },
          { start: [-10, 8], end: [8, 8], height: 5.6, thickness: 0.3 },
          { start: [2, -8], end: [2, -1], height: 5.6, thickness: 0.24 },
          { start: [-10, 1], end: [-2, 1], height: 5.6, thickness: 0.24 },
          { start: [0.5, 1], end: [8, 1], height: 5.6, thickness: 0.24 },
          { start: [2, 1], end: [2, 8], height: 5.6, thickness: 0.24 },
        ],
        furniture: [
          { id: 'sofa', name: 'Sofa', roomId: 'living-room', defaultPosition: [-8, 0, -4], models: [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, 1.57, 0], scale: 4 }], obstacleRadius: 2.5, movable: true },
          { id: 'coffee-table', name: 'Coffee Table', roomId: 'living-room', defaultPosition: [-5, 0, -4], models: [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }], obstacleRadius: 1.5, movable: true },
          { id: 'tv-stand', name: 'TV Stand', roomId: 'living-room', defaultPosition: [-5, 0, -7], models: [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 4 }], obstacleRadius: 2, movable: true },
          { id: 'fridge', name: 'Fridge', roomId: 'kitchen', defaultPosition: [4, 0, -7], models: [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 4 }], obstacleRadius: 1.5, movable: true },
          { id: 'stove', name: 'Stove', roomId: 'kitchen', defaultPosition: [6, 0, -7], models: [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 3.6 }], obstacleRadius: 1.5, movable: true },
          { id: 'bed', name: 'Bed', roomId: 'bedroom', defaultPosition: [-5, 0, 7], models: [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 3.6 }], obstacleRadius: 3, movable: true },
          { id: 'bathroom-sink', name: 'Bathroom Sink', roomId: 'bathroom', defaultPosition: [5, 0, 2.5], models: [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 3.6 }], obstacleRadius: 1, movable: true },
          { id: 'shower', name: 'Shower', roomId: 'bathroom', defaultPosition: [7, 0, 7], models: [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 3.8 }], obstacleRadius: 2, movable: true },
          { id: 'toilet', name: 'Toilet', roomId: 'bathroom', defaultPosition: [3.5, 0, 6], models: [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, 1.57, 0], scale: 2.4 }], obstacleRadius: 1, movable: true },
        ],
        waypoints: [
          { id: 'living-center', pos: [-5, -4], connections: ['hall-entry'] },
          { id: 'hall-entry', pos: [-1, 0], connections: ['living-center', 'kitchen-center', 'bedroom-door', 'bathroom-door'] },
          { id: 'kitchen-center', pos: [5, -4], connections: ['hall-entry'] },
          { id: 'bedroom-door', pos: [-3, 1.5], connections: ['hall-entry', 'bedroom-center'], pauseAtDoorway: true },
          { id: 'bedroom-center', pos: [-5, 5], connections: ['bedroom-door'] },
          { id: 'bathroom-door', pos: [3, 1.5], connections: ['hall-entry', 'bathroom-center'], pauseAtDoorway: true },
          { id: 'bathroom-center', pos: [5, 5], connections: ['bathroom-door'] },
        ],
        chargingStation: [-8, 0, 0],
        windowSpots: [[-9.4, 0, -4], [7.4, 0, -4]],
        ceilings: [
          { pos: [-5, 5.6, -4], size: [10, 8] },
          { pos: [5, 5.6, -4], size: [6, 8] },
          { pos: [-5, 5.6, 5], size: [10, 6] },
          { pos: [5, 5.6, 5], size: [6, 6] },
        ],
        doorFrames: [
          { cx: -1, cz: 1, alongZ: false, gapWidth: 2, h: 4.6 },
          { cx: 3, cz: 1, alongZ: false, gapWidth: 1.2, h: 4.6 },
        ],
        lights: [
          { position: [-5, 4.5, -4], intensity: 0.5, color: '#ffe8c0', distance: 16 },
          { position: [5, 4.5, -4], intensity: 0.6, color: '#fff5e0', distance: 12 },
          { position: [-5, 4.5, 5], intensity: 0.4, color: '#e8e0ff', distance: 14 },
          { position: [5, 4.5, 5], intensity: 0.4, color: '#f0f5ff', distance: 12 },
        ],
      } as FloorPlanPreset,
    },
  },
  {
    name: 'Modern Penthouse',
    description: 'Sleek open-plan penthouse with gym',
    content: {
      type: 'floor-plan',
      version: 1,
      name: 'Modern Penthouse',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        id: 'gallery-penthouse',
        name: 'Modern Penthouse',
        description: 'Sleek penthouse, 5 rooms',
        rooms: [
          { id: 'living-room', name: 'Grand Lounge', position: [-6, 0, -6], size: [12, 10], color: '#3a3a3a', furniture: [] },
          { id: 'kitchen', name: 'Chef Kitchen', position: [6, 0, -6], size: [8, 10], color: '#383838', furniture: [] },
          { id: 'bedroom', name: 'Master Suite', position: [-6, 0, 6], size: [12, 8], color: '#363640', furniture: [] },
          { id: 'bathroom', name: 'Spa Bath', position: [6, 0, 4], size: [8, 4], color: '#364040', furniture: [] },
          { id: 'gym', name: 'Fitness Room', position: [6, 0, 9], size: [8, 4], color: '#343638', furniture: [] },
        ],
        walls: [
          { start: [-12, -11], end: [10, -11], height: 5.6, thickness: 0.3 },
          { start: [-12, -11], end: [-12, 10], height: 5.6, thickness: 0.3 },
          { start: [10, -11], end: [10, 11], height: 5.6, thickness: 0.3 },
          { start: [-12, 10], end: [0, 10], height: 5.6, thickness: 0.3 },
          { start: [0, 10], end: [0, 11], height: 5.6, thickness: 0.24 },
          { start: [0, 11], end: [10, 11], height: 5.6, thickness: 0.3 },
          { start: [0, -11], end: [0, -2], height: 5.6, thickness: 0.24 },
          { start: [-12, 1], end: [-2, 1], height: 5.6, thickness: 0.24 },
          { start: [1, 1], end: [10, 1], height: 5.6, thickness: 0.24 },
          { start: [2, 1], end: [2, 7], height: 5.6, thickness: 0.24 },
          { start: [2, 7], end: [10, 7], height: 5.6, thickness: 0.24 },
        ],
        furniture: [
          { id: 'sofa', name: 'Sofa', roomId: 'living-room', defaultPosition: [-10, 0, -6], models: [{ url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, 1.57, 0], scale: 4 }], obstacleRadius: 2.5, movable: true },
          { id: 'coffee-table', name: 'Coffee Table', roomId: 'living-room', defaultPosition: [-7, 0, -6], models: [{ url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }], obstacleRadius: 1.5, movable: true },
          { id: 'tv-stand', name: 'TV Stand', roomId: 'living-room', defaultPosition: [-6, 0, -10], models: [{ url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }, { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 4 }], obstacleRadius: 2, movable: true },
          { id: 'fridge', name: 'Fridge', roomId: 'kitchen', defaultPosition: [4, 0, -10], models: [{ url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 4 }], obstacleRadius: 1.5, movable: true },
          { id: 'stove', name: 'Stove', roomId: 'kitchen', defaultPosition: [7, 0, -10], models: [{ url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 4 }, { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 3.6 }], obstacleRadius: 1.5, movable: true },
          { id: 'kitchen-sink', name: 'Kitchen Sink', roomId: 'kitchen', defaultPosition: [9, 0, -6], models: [{ url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, -1.57, 0], scale: 4 }], obstacleRadius: 1.5, movable: true },
          { id: 'bed', name: 'Bed', roomId: 'bedroom', defaultPosition: [-6, 0, 8], models: [{ url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 3.6 }], obstacleRadius: 3, movable: true },
          { id: 'nightstand', name: 'Nightstand', roomId: 'bedroom', defaultPosition: [-10, 0, 8], models: [{ url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 3.6 }], obstacleRadius: 1, movable: true },
          { id: 'desk', name: 'Desk & Chair', roomId: 'bedroom', defaultPosition: [-10, 0, 3], models: [{ url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, 1.57, 0], scale: 4 }, { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -1.57, 0], scale: 3.6 }], obstacleRadius: 1.5, movable: true },
          { id: 'bathroom-sink', name: 'Bathroom Sink', roomId: 'bathroom', defaultPosition: [5, 0, 2], models: [{ url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, 3.14, 0], scale: 3.6 }], obstacleRadius: 1, movable: true },
          { id: 'shower', name: 'Shower', roomId: 'bathroom', defaultPosition: [9, 0, 5], models: [{ url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 3.8 }], obstacleRadius: 2, movable: true },
          { id: 'toilet', name: 'Toilet', roomId: 'bathroom', defaultPosition: [3, 0, 5], models: [{ url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, 1.57, 0], scale: 2.4 }], obstacleRadius: 1, movable: true },
        ],
        waypoints: [
          { id: 'living-center', pos: [-6, -6], connections: ['hall-center'] },
          { id: 'hall-center', pos: [0, 0], connections: ['living-center', 'kitchen-center', 'bedroom-door', 'bathroom-door'] },
          { id: 'kitchen-center', pos: [6, -6], connections: ['hall-center'] },
          { id: 'bedroom-door', pos: [-1, 1.5], connections: ['hall-center', 'bedroom-center'], pauseAtDoorway: true },
          { id: 'bedroom-center', pos: [-6, 6], connections: ['bedroom-door'] },
          { id: 'bathroom-door', pos: [4, 1.5], connections: ['hall-center', 'bathroom-center'], pauseAtDoorway: true },
          { id: 'bathroom-center', pos: [6, 4], connections: ['bathroom-door', 'gym-center'] },
          { id: 'gym-center', pos: [6, 9], connections: ['bathroom-center'] },
        ],
        chargingStation: [-10, 0, 0],
        windowSpots: [[-11.4, 0, -6], [9.4, 0, -6], [-11.4, 0, 6], [9.4, 0, 6]],
        ceilings: [
          { pos: [-6, 5.6, -6], size: [12, 10] },
          { pos: [6, 5.6, -6], size: [8, 10] },
          { pos: [-6, 5.6, 6], size: [12, 8] },
          { pos: [6, 5.6, 4], size: [8, 4] },
          { pos: [6, 5.6, 9], size: [8, 4] },
        ],
        doorFrames: [
          { cx: 0, cz: -6, alongZ: true, gapWidth: 3, h: 4.6 },
          { cx: -0.5, cz: 1, alongZ: false, gapWidth: 2, h: 4.6 },
          { cx: 4, cz: 1, alongZ: false, gapWidth: 1.5, h: 4.6 },
          { cx: 6, cz: 7, alongZ: false, gapWidth: 1.5, h: 4.6 },
        ],
        lights: [
          { position: [-6, 4.5, -6], intensity: 0.5, color: '#ffe8c0', distance: 18 },
          { position: [6, 4.5, -6], intensity: 0.6, color: '#fff5e0', distance: 16 },
          { position: [-6, 4.5, 6], intensity: 0.4, color: '#e8e0ff', distance: 16 },
          { position: [6, 4.5, 4], intensity: 0.4, color: '#f0f5ff', distance: 10 },
          { position: [6, 4.5, 9], intensity: 0.4, color: '#ffe0b0', distance: 10 },
        ],
      } as FloorPlanPreset,
    },
  },
];

export const GALLERY_ROBOT_BUILDS: { name: string; description: string; content: ShareableContent }[] = [
  {
    name: 'Speed Demon',
    description: 'Max speed build: Quantum Cortex + Compact Chassis + Nano Tentacles + Hover Pads',
    content: {
      type: 'robot-build',
      version: 1,
      name: 'Speed Demon',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        id: 'gallery-speed-demon',
        name: 'Speed Demon',
        headId: 'head-quantum',
        bodyId: 'body-compact',
        armsId: 'arms-nano',
        legsId: 'legs-hover',
        createdAt: Date.now(),
        deployed: false,
      } as CustomRobot,
    },
  },
  {
    name: 'Tank Bot',
    description: 'Max battery build: Antenna Array + Tank Frame + Hydraulic Arms + All-Terrain Treads',
    content: {
      type: 'robot-build',
      version: 1,
      name: 'Tank Bot',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        id: 'gallery-tank-bot',
        name: 'Tank Bot',
        headId: 'head-antenna',
        bodyId: 'body-tank',
        armsId: 'arms-hydraulic',
        legsId: 'legs-treads',
        createdAt: Date.now(),
        deployed: false,
      } as CustomRobot,
    },
  },
  {
    name: 'Efficiency Expert',
    description: 'Max efficiency: Tactical Visor + Stealth Shell + Multi-Tool Arms + Spring Stilts',
    content: {
      type: 'robot-build',
      version: 1,
      name: 'Efficiency Expert',
      createdAt: '2025-01-01T00:00:00Z',
      data: {
        id: 'gallery-efficiency',
        name: 'Efficiency Expert',
        headId: 'head-visor',
        bodyId: 'body-stealth',
        armsId: 'arms-multi',
        legsId: 'legs-spring',
        createdAt: Date.now(),
        deployed: false,
      } as CustomRobot,
    },
  },
];
