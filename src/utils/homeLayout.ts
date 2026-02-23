import type { Room } from '../types';

// Realistic home floor plan - ranch style layout
// All positions in world units, roughly 1 unit = 1 meter
export const rooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    position: [-3, 0, -2],
    size: [6, 5],
    color: '#2a2520',
    furniture: [
      { id: 'couch', name: 'L-Shaped Couch', position: [-4.5, 0.35, -3], size: [2.8, 0.7, 1.0], color: '#5a6a7a' },
      { id: 'couch-side', name: 'Couch Side', position: [-3, 0.35, -3.8], size: [1.0, 0.7, 1.6], color: '#5a6a7a' },
      { id: 'coffee-table', name: 'Coffee Table', position: [-3.5, 0.22, -1.5], size: [1.2, 0.44, 0.6], color: '#3a3028' },
      { id: 'tv-stand', name: 'TV Console', position: [-3.5, 0.25, 0.3], size: [2.0, 0.5, 0.4], color: '#282018' },
      { id: 'tv', name: 'TV', position: [-3.5, 0.9, 0.35], size: [1.6, 0.9, 0.05], color: '#111', interactable: true },
      { id: 'rug', name: 'Area Rug', position: [-3.5, 0.01, -1.5], size: [3.5, 0.02, 2.5], color: '#4a3a30' },
      { id: 'lamp', name: 'Floor Lamp', position: [-5.5, 0.7, -0.5], size: [0.15, 1.4, 0.15], color: '#c0a060' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    position: [4, 0, -2],
    size: [5, 5],
    color: '#252830',
    furniture: [
      { id: 'counter-l', name: 'Counter', position: [5.5, 0.45, -4], size: [3.0, 0.9, 0.6], color: '#d0ccc0' },
      { id: 'counter-side', name: 'Counter Side', position: [6.3, 0.45, -2.5], size: [0.6, 0.9, 2.5], color: '#d0ccc0' },
      { id: 'upper-cabinets', name: 'Upper Cabinets', position: [5.5, 1.6, -4.2], size: [3.0, 0.6, 0.35], color: '#e8e0d0' },
      { id: 'fridge', name: 'Refrigerator', position: [2.5, 0.9, -4], size: [0.85, 1.8, 0.75], color: '#c8c8c8', interactable: true },
      { id: 'stove', name: 'Stove', position: [4.5, 0.45, -4], size: [0.75, 0.9, 0.6], color: '#444', interactable: true },
      { id: 'sink', name: 'Sink', position: [5.8, 0.5, -4], size: [0.65, 0.9, 0.5], color: '#bbb', interactable: true },
      { id: 'island', name: 'Kitchen Island', position: [4.2, 0.45, -1.5], size: [2.0, 0.9, 0.8], color: '#d0ccc0' },
      { id: 'stool1', name: 'Bar Stool', position: [3.5, 0.35, -0.8], size: [0.35, 0.7, 0.35], color: '#333' },
      { id: 'stool2', name: 'Bar Stool', position: [4.2, 0.35, -0.8], size: [0.35, 0.7, 0.35], color: '#333' },
      { id: 'stool3', name: 'Bar Stool', position: [4.9, 0.35, -0.8], size: [0.35, 0.7, 0.35], color: '#333' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    position: [-3, 0, 5],
    size: [6, 5],
    color: '#22252a',
    furniture: [
      { id: 'bed', name: 'Queen Bed', position: [-4, 0.3, 6], size: [2.0, 0.6, 2.4], color: '#e8e0d0', interactable: true },
      { id: 'headboard', name: 'Headboard', position: [-4, 0.7, 7.1], size: [2.0, 0.8, 0.1], color: '#3a3028' },
      { id: 'mattress', name: 'Mattress Top', position: [-4, 0.55, 6], size: [1.9, 0.15, 2.3], color: '#f5f0e8' },
      { id: 'pillow1', name: 'Pillow', position: [-4.4, 0.65, 6.8], size: [0.5, 0.12, 0.35], color: '#fff' },
      { id: 'pillow2', name: 'Pillow', position: [-3.6, 0.65, 6.8], size: [0.5, 0.12, 0.35], color: '#fff' },
      { id: 'nightstand-l', name: 'Nightstand', position: [-5.3, 0.25, 6.5], size: [0.5, 0.5, 0.45], color: '#3a3028' },
      { id: 'nightstand-r', name: 'Nightstand', position: [-2.7, 0.25, 6.5], size: [0.5, 0.5, 0.45], color: '#3a3028' },
      { id: 'dresser', name: 'Dresser', position: [-5.5, 0.4, 4], size: [0.5, 0.8, 1.2], color: '#3a3028', interactable: true },
      { id: 'desk', name: 'Desk', position: [-1.5, 0.38, 4], size: [1.2, 0.76, 0.6], color: '#2d2820', interactable: true },
      { id: 'desk-chair', name: 'Chair', position: [-1.5, 0.3, 3.3], size: [0.5, 0.6, 0.5], color: '#333' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    position: [4, 0, 5],
    size: [4, 4],
    color: '#282c30',
    furniture: [
      { id: 'bathtub', name: 'Bathtub', position: [5.3, 0.3, 6.5], size: [1.6, 0.6, 0.75], color: '#f0f0f0', interactable: true },
      { id: 'toilet', name: 'Toilet', position: [3, 0.25, 6.5], size: [0.4, 0.5, 0.55], color: '#f5f5f5' },
      { id: 'vanity', name: 'Vanity', position: [4, 0.4, 3.8], size: [1.4, 0.8, 0.5], color: '#e8e0d0', interactable: true },
      { id: 'mirror', name: 'Mirror', position: [4, 1.3, 3.55], size: [1.0, 0.8, 0.04], color: '#a8c8e8' },
      { id: 'bath-mat', name: 'Bath Mat', position: [4.5, 0.01, 5.5], size: [0.8, 0.02, 0.5], color: '#5a7a6a' },
    ],
  },
  {
    id: 'hallway',
    name: 'Hallway',
    position: [0.5, 0, 1.5],
    size: [2, 4],
    color: '#262420',
    furniture: [],
  },
];

// Wall definitions for the home
export interface Wall {
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
  hasDoor?: boolean;
  doorPosition?: number; // 0-1 along wall
}

export const walls: Wall[] = [
  // Outer walls - Living Room
  { start: [-6, -4.5], end: [0, -4.5], height: 2.8, thickness: 0.15 }, // north
  { start: [-6, -4.5], end: [-6, 0.5], height: 2.8, thickness: 0.15 }, // west
  { start: [-6, 0.5], end: [0, 0.5], height: 2.8, thickness: 0.15 },   // south

  // Outer walls - Kitchen
  { start: [1.5, -4.5], end: [6.7, -4.5], height: 2.8, thickness: 0.15 }, // north
  { start: [6.7, -4.5], end: [6.7, 0.5], height: 2.8, thickness: 0.15 }, // east
  { start: [1.5, 0.5], end: [6.7, 0.5], height: 2.8, thickness: 0.15 },  // south

  // Divider between living room and kitchen
  { start: [0, -4.5], end: [0, -2], height: 2.8, thickness: 0.15 },
  { start: [1.5, -2], end: [1.5, 0.5], height: 2.8, thickness: 0.15 },

  // Outer walls - Bedroom
  { start: [-6, 2.5], end: [-6, 7.5], height: 2.8, thickness: 0.15 }, // west
  { start: [-6, 7.5], end: [0, 7.5], height: 2.8, thickness: 0.15 },  // south
  { start: [0, 2.5], end: [0, 5], height: 2.8, thickness: 0.15 },     // east wall segment

  // Outer walls - Bathroom
  { start: [2, 3], end: [6.2, 3], height: 2.8, thickness: 0.15 },     // north
  { start: [6.2, 3], end: [6.2, 7], height: 2.8, thickness: 0.15 },   // east
  { start: [2, 7], end: [6.2, 7], height: 2.8, thickness: 0.15 },     // south
  { start: [2, 3], end: [2, 5.5], height: 2.8, thickness: 0.15 },     // west segment

  // Hallway walls
  { start: [0, 0.5], end: [0, 2.5], height: 2.8, thickness: 0.15 },
  { start: [1.5, 0.5], end: [1.5, 3], height: 2.8, thickness: 0.15 },
];

export const getRoomCenter = (roomId: string): [number, number, number] => {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return [0, 0, 0];
  return [room.position[0], 0, room.position[2]];
};

export const findTaskTarget = (command: string): { roomId: string; position: [number, number, number]; description: string } | null => {
  const cmd = command.toLowerCase();

  if (cmd.includes('kitchen') || cmd.includes('cook') || cmd.includes('dishes') || cmd.includes('food')) {
    return { roomId: 'kitchen', position: [4.5, 0, -2.5], description: 'Working in the kitchen...' };
  }
  if (cmd.includes('bed') || cmd.includes('bedroom') || cmd.includes('sleep')) {
    return { roomId: 'bedroom', position: [-4, 0, 5.5], description: 'Tidying the bedroom...' };
  }
  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('toilet')) {
    return { roomId: 'bathroom', position: [4, 0, 5.5], description: 'Cleaning the bathroom...' };
  }
  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv') || cmd.includes('clean')) {
    return { roomId: 'living-room', position: [-3.5, 0, -2], description: 'Cleaning the living room...' };
  }
  if (cmd.includes('organize') || cmd.includes('tidy') || cmd.includes('desk')) {
    return { roomId: 'bedroom', position: [-1.5, 0, 4], description: 'Organizing the desk area...' };
  }

  return { roomId: 'living-room', position: [0.5, 0, 1.5], description: 'Looking around for something to do...' };
};
