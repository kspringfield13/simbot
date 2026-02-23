import type { Room, TaskType } from '../types';

// ============================
// MODERN OPEN FLOOR PLAN
// ============================
// Layout (top-down, z increases downward):
//
//  ┌─────────────────────────┐
//  │                         │
//  │   LIVING    │  KITCHEN  │  z: -5 to 0
//  │   ROOM      │           │
//  │             │           │
//  ├─────┬───────┴───────────┤
//  │     │    HALLWAY        │  z: 0 to 2
//  ├─────┴──┬────────────────┤
//  │        │                │
//  │ BEDROOM│   BATHROOM     │  z: 2 to 7
//  │        │                │
//  └────────┴────────────────┘
//
// Open concept: Living + Kitchen share a wide opening (no wall between them above z=-2)
// x: -7 to 7, z: -5 to 7

export const rooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    position: [-3.5, 0, -2.5],
    size: [7, 5],
    color: '#2c2822', // warm dark wood tone
    furniture: [], // GLB models only
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    position: [3.5, 0, -2.5],
    size: [7, 5],
    color: '#282c30', // cool slate
    furniture: [],
  },
  {
    id: 'hallway',
    name: 'Hallway',
    position: [0, 0, 1],
    size: [14, 2],
    color: '#262420', // neutral
    furniture: [],
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    position: [-3.5, 0, 4.5],
    size: [7, 5],
    color: '#22252a', // muted blue-gray
    furniture: [],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    position: [3.5, 0, 4.5],
    size: [7, 5],
    color: '#282c30', // clean slate
    furniture: [],
  },
];

export interface Wall {
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
}

export const walls: Wall[] = [
  // === OUTER WALLS ===
  // Top wall (north)
  { start: [-7, -5], end: [7, -5], height: 2.8, thickness: 0.15 },
  // Left wall
  { start: [-7, -5], end: [-7, 7], height: 2.8, thickness: 0.15 },
  // Right wall
  { start: [7, -5], end: [7, 7], height: 2.8, thickness: 0.15 },
  // Bottom wall (south)
  { start: [-7, 7], end: [7, 7], height: 2.8, thickness: 0.15 },

  // === INTERIOR WALLS ===
  // Living/Kitchen divider — partial wall from back to z=-2 (open concept, opening from z=-2 to z=0)
  { start: [0, -5], end: [0, -2], height: 2.8, thickness: 0.12 },

  // North rooms to hallway — wall at z=0 with gaps for doorways
  { start: [-7, 0], end: [-2, 0], height: 2.8, thickness: 0.12 }, // left section
  { start: [2, 0], end: [7, 0], height: 2.8, thickness: 0.12 },   // right section
  // Gap from x=-2 to x=2 = wide hallway opening (open concept feel)

  // Hallway to south rooms — wall at z=2 with doorway gaps
  { start: [-7, 2], end: [-1.5, 2], height: 2.8, thickness: 0.12 }, // left (bedroom side)
  { start: [1.5, 2], end: [7, 2], height: 2.8, thickness: 0.12 },   // right (bathroom side)
  // Gaps: x=-1.5 to 0 = bedroom door, x=0 to 1.5 = bathroom door

  // Bedroom/Bathroom divider
  { start: [0, 2], end: [0, 7], height: 2.8, thickness: 0.12 },
];

export const getRoomCenter = (roomId: string): [number, number, number] => {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return [0, 0, 1];
  return [room.position[0], 0, room.position[2]];
};

interface TaskTarget {
  roomId: string;
  position: [number, number, number];
  description: string;
  taskType: TaskType;
  workDuration: number;
  response: string;
}

export const findTaskTarget = (command: string): TaskTarget | null => {
  const cmd = command.toLowerCase();

  // Dishes
  if (cmd.includes('dish') || cmd.includes('wash') && cmd.includes('kitchen')) {
    return { roomId: 'kitchen', position: [5.5, 0, -3.5], description: 'Washing the dishes...', taskType: 'dishes', workDuration: 25, response: "I'll head to the sink and get these dishes sparkling clean!" };
  }
  // Cooking
  if (cmd.includes('cook') || cmd.includes('food') || cmd.includes('meal') || cmd.includes('dinner') || cmd.includes('breakfast') || cmd.includes('lunch')) {
    return { roomId: 'kitchen', position: [4, 0, -4], description: 'Cooking at the stove...', taskType: 'cooking', workDuration: 45, response: "Time to cook! Heading to the stove." };
  }
  // Grocery list
  if (cmd.includes('grocer') || cmd.includes('shopping list') || cmd.includes('inventory') || cmd.includes('fridge')) {
    return { roomId: 'kitchen', position: [2, 0, -4], description: 'Checking the fridge and making a list...', taskType: 'grocery-list', workDuration: 20, response: "Let me check what we have and make a grocery list." };
  }
  // Kitchen cleaning
  if (cmd.includes('kitchen') && (cmd.includes('clean') || cmd.includes('wipe') || cmd.includes('tidy'))) {
    return { roomId: 'kitchen', position: [4, 0, -2.5], description: 'Wiping down kitchen surfaces...', taskType: 'cleaning', workDuration: 30, response: "On my way to clean the kitchen — counters, island, the works!" };
  }
  // Vacuuming
  if (cmd.includes('vacuum') || cmd.includes('hoover')) {
    const room = cmd.includes('bedroom') ? 'bedroom' : cmd.includes('kitchen') ? 'kitchen' : 'living-room';
    const pos: [number, number, number] = room === 'bedroom' ? [-3.5, 0, 4.5] : room === 'kitchen' ? [3.5, 0, -2.5] : [-3.5, 0, -2.5];
    return { roomId: room, position: pos, description: `Vacuuming the ${room.replace('-', ' ')}...`, taskType: 'vacuuming', workDuration: 35, response: `Grabbing the vacuum — heading to the ${room.replace('-', ' ')}!` };
  }
  // Sweeping
  if (cmd.includes('sweep') || cmd.includes('mop')) {
    return { roomId: 'kitchen', position: [3.5, 0, -2.5], description: 'Sweeping the kitchen floor...', taskType: 'sweeping', workDuration: 25, response: "I'll sweep the kitchen floor nice and clean." };
  }
  // Make the bed
  if (cmd.includes('bed') && (cmd.includes('make') || cmd.includes('fix') || cmd.includes('tidy'))) {
    return { roomId: 'bedroom', position: [-4, 0, 5.5], description: 'Making the bed — sheets, pillows, the whole deal...', taskType: 'bed-making', workDuration: 20, response: "On it! Making the bed nice and neat." };
  }
  // Laundry
  if (cmd.includes('laundry') || cmd.includes('clothes') || cmd.includes('fold')) {
    return { roomId: 'bedroom', position: [-6, 0, 3], description: 'Sorting and folding laundry...', taskType: 'laundry', workDuration: 30, response: "Time for laundry duty — sorting and folding!" };
  }
  // Organize desk
  if (cmd.includes('organize') || cmd.includes('desk') || cmd.includes('tidy') && cmd.includes('room')) {
    return { roomId: 'bedroom', position: [-1.5, 0, 3.5], description: 'Organizing the desk — papers, cables, everything...', taskType: 'organizing', workDuration: 25, response: "Let me organize that desk for you." };
  }
  // Bathroom cleaning
  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('scrub') || cmd.includes('toilet')) {
    return { roomId: 'bathroom', position: [3.5, 0, 5], description: 'Scrubbing the bathroom...', taskType: 'scrubbing', workDuration: 30, response: "Heading to the bathroom — time for a deep scrub!" };
  }
  // Living room cleaning
  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv') || (cmd.includes('clean') && !cmd.includes('kitchen') && !cmd.includes('bath'))) {
    return { roomId: 'living-room', position: [-3.5, 0, -2.5], description: 'Cleaning up the living room...', taskType: 'cleaning', workDuration: 25, response: "I'll tidy up the living room!" };
  }
  // Bedroom general
  if (cmd.includes('bedroom')) {
    return { roomId: 'bedroom', position: [-3.5, 0, 4.5], description: 'Tidying the bedroom...', taskType: 'cleaning', workDuration: 25, response: "Heading to the bedroom to tidy up!" };
  }
  // Default
  return { roomId: 'living-room', position: [0, 0, 1], description: 'Looking around for something to do...', taskType: 'general', workDuration: 15, response: "I'll take a look around and see what needs doing!" };
};
