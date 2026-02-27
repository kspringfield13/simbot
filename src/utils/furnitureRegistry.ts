import type { RoomId } from '../types';

const PI = Math.PI;
const S = 2;

export interface FurnitureModel {
  url: string;
  offset: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface FurniturePiece {
  id: string;
  name: string;
  roomId: RoomId;
  defaultPosition: [number, number, number];
  models: FurnitureModel[];
  obstacleRadius: number;
  movable: boolean;
}

export const FURNITURE_PIECES: FurniturePiece[] = [
  // ── LIVING ROOM ──────────────────────────────────────────────
  {
    id: 'sofa',
    name: 'Sofa',
    roomId: 'living-room',
    defaultPosition: [-14.5, 0, -12],
    models: [
      { url: '/models/sofa-long.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 2.5,
    movable: true,
  },
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    roomId: 'living-room',
    defaultPosition: [-11.5, 0, -12],
    models: [
      { url: '/models/coffee-table.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 1.5,
    movable: true,
  },
  {
    id: 'tv-stand',
    name: 'TV Stand',
    roomId: 'living-room',
    defaultPosition: [-8, 0, -19],
    models: [
      { url: '/models/tv-stand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S },
      { url: '/models/tv.glb', offset: [0, 1.3, 0], rotation: [0, 0, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 2,
    movable: true,
  },

  // ── KITCHEN ──────────────────────────────────────────────────
  {
    id: 'fridge',
    name: 'Fridge',
    roomId: 'kitchen',
    defaultPosition: [3, 0, -19],
    models: [
      { url: '/models/fridge.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 1.5,
    movable: true,
  },
  {
    id: 'stove',
    name: 'Stove',
    roomId: 'kitchen',
    defaultPosition: [7, 0, -19],
    models: [
      { url: '/models/stove-electric.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S },
      { url: '/models/range-hood.glb', offset: [0, 3.6, -0.3], rotation: [0, 0, 0], scale: 1.8 * S },
    ],
    obstacleRadius: 1.5,
    movable: true,
  },
  {
    id: 'kitchen-sink',
    name: 'Kitchen Sink',
    roomId: 'kitchen',
    defaultPosition: [11, 0, -19],
    models: [
      { url: '/models/kitchen-sink.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 1.5,
    movable: true,
  },

  // ── LAUNDRY ──────────────────────────────────────────────────
  {
    id: 'laundry-station',
    name: 'Washer & Dryer',
    roomId: 'laundry',
    defaultPosition: [10, 0, -3.2],
    models: [
      { url: '/models/washer.glb', offset: [-1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S },
      { url: '/models/dryer.glb', offset: [1.5, 0, 0], rotation: [0, PI, 0], scale: 2.0 * S },
    ],
    obstacleRadius: 2,
    movable: true,
  },

  // ── BEDROOM ──────────────────────────────────────────────────
  {
    id: 'bed',
    name: 'Bed',
    roomId: 'bedroom',
    defaultPosition: [-8, 0, 14.5],
    models: [
      { url: '/models/bed.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S },
    ],
    obstacleRadius: 3,
    movable: true,
  },
  {
    id: 'nightstand',
    name: 'Nightstand',
    roomId: 'bedroom',
    defaultPosition: [-12.5, 0, 14.5],
    models: [
      { url: '/models/nightstand.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.8 * S },
    ],
    obstacleRadius: 1,
    movable: true,
  },
  {
    id: 'desk',
    name: 'Desk & Chair',
    roomId: 'bedroom',
    defaultPosition: [-14.5, 0, 3],
    models: [
      { url: '/models/desk.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 2.0 * S },
      { url: '/models/desk-chair.glb', offset: [2, 0, 0], rotation: [0, -PI / 2, 0], scale: 1.8 * S },
    ],
    obstacleRadius: 1.5,
    movable: true,
  },

  // ── BATHROOM ─────────────────────────────────────────────────
  {
    id: 'bathroom-sink',
    name: 'Bathroom Sink',
    roomId: 'bathroom',
    defaultPosition: [6, 0, 1.2],
    models: [
      { url: '/models/bathroom-sink.glb', offset: [0, 0, 0], rotation: [0, PI, 0], scale: 1.8 * S },
    ],
    obstacleRadius: 1,
    movable: true,
  },
  {
    id: 'shower',
    name: 'Shower',
    roomId: 'bathroom',
    defaultPosition: [14, 0, 14],
    models: [
      { url: '/models/shower-round.glb', offset: [0, 0, 0], rotation: [0, 0, 0], scale: 1.9 * S },
    ],
    obstacleRadius: 2,
    movable: true,
  },
  {
    id: 'toilet',
    name: 'Toilet',
    roomId: 'bathroom',
    defaultPosition: [1.5, 0, 8],
    models: [
      { url: '/models/toilet.glb', offset: [0, 0, 0], rotation: [0, PI / 2, 0], scale: 1.2 * S },
    ],
    obstacleRadius: 1,
    movable: true,
  },
];

export function getFurniturePiece(id: string): FurniturePiece | undefined {
  return FURNITURE_PIECES.find((p) => p.id === id);
}
