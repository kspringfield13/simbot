import type { Room } from '../types';

export const rooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    position: [-4, 0, -3],
    size: [7, 6],
    color: '#1a1a2e',
    furniture: [
      { id: 'couch', name: 'Couch', position: [-5.5, 0.4, -4.5], size: [2.5, 0.8, 1], color: '#4a6fa5' },
      { id: 'coffee-table', name: 'Coffee Table', position: [-4, 0.25, -3], size: [1.2, 0.5, 0.7], color: '#8b6914' },
      { id: 'tv-stand', name: 'TV Stand', position: [-4, 0.3, -5.5], size: [2, 0.6, 0.4], color: '#2d2d44' },
      { id: 'tv', name: 'TV', position: [-4, 1.2, -5.7], size: [1.8, 1, 0.08], color: '#0a0a0a', interactable: true },
      { id: 'bookshelf', name: 'Bookshelf', position: [-7, 0.8, -3], size: [0.4, 1.6, 1.5], color: '#5c3a1e' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    position: [4, 0, -3],
    size: [6, 6],
    color: '#16213e',
    furniture: [
      { id: 'counter', name: 'Counter', position: [5.5, 0.5, -5.5], size: [3, 1, 0.6], color: '#e0e0e0' },
      { id: 'fridge', name: 'Fridge', position: [6.5, 0.9, -5.5], size: [0.8, 1.8, 0.7], color: '#c0c0c0', interactable: true },
      { id: 'stove', name: 'Stove', position: [4, 0.5, -5.5], size: [0.7, 1, 0.6], color: '#333', interactable: true },
      { id: 'sink', name: 'Sink', position: [5, 0.5, -5.5], size: [0.6, 1, 0.5], color: '#aaa', interactable: true },
      { id: 'table', name: 'Dining Table', position: [3.5, 0.4, -2], size: [1.5, 0.8, 1], color: '#8b6914' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    position: [-4, 0, 4],
    size: [7, 6],
    color: '#1a1a2e',
    furniture: [
      { id: 'bed', name: 'Bed', position: [-5, 0.35, 5], size: [2, 0.7, 2.5], color: '#4a3f6b', interactable: true },
      { id: 'nightstand', name: 'Nightstand', position: [-3.5, 0.3, 5.5], size: [0.5, 0.6, 0.5], color: '#5c3a1e' },
      { id: 'dresser', name: 'Dresser', position: [-7, 0.5, 3.5], size: [0.5, 1, 1.5], color: '#5c3a1e', interactable: true },
      { id: 'desk', name: 'Desk', position: [-3, 0.4, 3], size: [1.5, 0.8, 0.7], color: '#2d2d44', interactable: true },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    position: [4, 0, 4],
    size: [5, 5],
    color: '#0f3460',
    furniture: [
      { id: 'bathtub', name: 'Bathtub', position: [5.5, 0.35, 5.5], size: [1.8, 0.7, 0.9], color: '#e0e0e0', interactable: true },
      { id: 'toilet', name: 'Toilet', position: [3.5, 0.3, 5.5], size: [0.5, 0.6, 0.5], color: '#f0f0f0' },
      { id: 'bath-sink', name: 'Sink', position: [4.5, 0.5, 3], size: [0.5, 1, 0.4], color: '#e0e0e0', interactable: true },
    ],
  },
];

export const getRoomCenter = (roomId: string): [number, number, number] => {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return [0, 0, 0];
  return [room.position[0], 0, room.position[2]];
};

export const findTaskTarget = (command: string): { roomId: string; position: [number, number, number]; description: string } | null => {
  const cmd = command.toLowerCase();
  
  if (cmd.includes('kitchen') || cmd.includes('cook') || cmd.includes('dishes') || cmd.includes('food')) {
    return { roomId: 'kitchen', position: [5, 0, -4], description: 'Working in the kitchen...' };
  }
  if (cmd.includes('bed') || cmd.includes('bedroom') || cmd.includes('sleep')) {
    return { roomId: 'bedroom', position: [-5, 0, 4.5], description: 'Tidying the bedroom...' };
  }
  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('toilet')) {
    return { roomId: 'bathroom', position: [4.5, 0, 4.5], description: 'Cleaning the bathroom...' };
  }
  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv') || cmd.includes('clean')) {
    return { roomId: 'living-room', position: [-4, 0, -3], description: 'Cleaning the living room...' };
  }
  if (cmd.includes('organize') || cmd.includes('tidy') || cmd.includes('desk')) {
    return { roomId: 'bedroom', position: [-3, 0, 3], description: 'Organizing the desk area...' };
  }

  return { roomId: 'living-room', position: [0, 0, 0], description: 'Looking around for something to do...' };
};
