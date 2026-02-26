import type { Room, RoomId, TaskTarget, TaskType, Wall } from '../types';

// Scale factor: 2x from original layout. Robot at 0.22 scale = ~0.83 units.
// Rooms are now 16x16 units, walls 5.6 tall. Robot is roughly 1/7 wall height = realistic.
const S = 2;

export const rooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    position: [-4 * S, 0, -6 * S],
    size: [8 * S, 8 * S],
    color: '#2c2822',
    furniture: [],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    position: [4 * S, 0, -6 * S],
    size: [8 * S, 8 * S],
    color: '#282c30',
    furniture: [],
  },
  {
    id: 'hallway',
    name: 'Hallway',
    position: [-2 * S, 0, -1 * S],
    size: [12 * S, 2 * S],
    color: '#262420',
    furniture: [],
  },
  {
    id: 'laundry',
    name: 'Laundry Closet',
    position: [5 * S, 0, -1 * S],
    size: [3 * S, 2 * S],
    color: '#262830',
    furniture: [],
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    position: [-4 * S, 0, 4 * S],
    size: [8 * S, 8 * S],
    color: '#22252a',
    furniture: [],
  },
  {
    id: 'bathroom',
    name: 'Master Bathroom',
    position: [4 * S, 0, 4 * S],
    size: [8 * S, 8 * S],
    color: '#282c30',
    furniture: [],
  },
];

export const walls: Wall[] = [
  // Outer walls
  { start: [-8 * S, -10 * S], end: [8 * S, -10 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, -10 * S], end: [-8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [8 * S, -10 * S], end: [8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },
  { start: [-8 * S, 8 * S], end: [8 * S, 8 * S], height: 2.8 * S, thickness: 0.15 * S },

  // Great room → hallway (z = -2*S), wide opening
  { start: [-8 * S, -2 * S], end: [-3 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },
  { start: [3.5 * S, -2 * S], end: [8 * S, -2 * S], height: 2.8 * S, thickness: 0.12 * S },

  // Laundry closet walls
  { start: [3.5 * S, -2 * S], end: [3.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [6.5 * S, -2 * S], end: [6.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },

  // Hallway → bedrooms (z = 0)
  { start: [-8 * S, 0], end: [-2 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [-0.5 * S, 0], end: [0, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [0, 0], end: [1.5 * S, 0], height: 2.8 * S, thickness: 0.12 * S },
  { start: [3 * S, 0], end: [8 * S, 0], height: 2.8 * S, thickness: 0.12 * S },

  // Center divider
  { start: [0, 0], end: [0, 8 * S], height: 2.8 * S, thickness: 0.12 * S },
];

export const roomTaskAnchors: Record<RoomId, [number, number, number][]> = {
  'living-room': [
    [-4 * S, 0, -6 * S],
    [-3.5 * S, 0, -4.8 * S],
    [-4 * S, 0, -8.5 * S],
  ],
  kitchen: [
    [3.5 * S, 0, -7 * S],
    [3.5 * S, 0, -5 * S],
    [5 * S, 0, -6 * S],
  ],
  hallway: [
    [-2 * S, 0, -1 * S],
    [0, 0, -1 * S],
  ],
  laundry: [
    [5 * S, 0, -1 * S],
    [4.8 * S, 0, -1.2 * S],
  ],
  bedroom: [
    [-4 * S, 0, 4 * S],
    [-5 * S, 0, 5.8 * S],
    [-1.5 * S, 0, 1.5 * S],
  ],
  bathroom: [
    [4 * S, 0, 4 * S],
    [3 * S, 0, 1.5 * S],
    [6 * S, 0, 6 * S],
  ],
};

export const windowSpots: [number, number, number][] = [
  [-7.4 * S, 0, -8.5 * S],
  [7.4 * S, 0, -8.5 * S],
  [-7.4 * S, 0, 6.8 * S],
  [7.4 * S, 0, 6.8 * S],
];

export function getRoomCenter(roomId: RoomId): [number, number, number] {
  const room = rooms.find((entry) => entry.id === roomId);
  return room ? [room.position[0], 0, room.position[2]] : [0, 0, -1 * S];
}

export function getRoomFromPoint(x: number, z: number): RoomId | null {
  const found = rooms.find((room) => {
    const halfW = room.size[0] / 2;
    const halfD = room.size[1] / 2;
    return x >= room.position[0] - halfW
      && x <= room.position[0] + halfW
      && z >= room.position[2] - halfD
      && z <= room.position[2] + halfD;
  });
  return found?.id ?? null;
}

function toTarget(
  roomId: RoomId,
  position: [number, number, number],
  description: string,
  taskType: TaskType,
  workDuration: number,
  response: string,
  thought: string,
): TaskTarget {
  return { roomId, position, description, taskType, workDuration, response, thought };
}

export function findTaskTarget(command: string): TaskTarget | null {
  const cmd = command.toLowerCase();

  if (cmd.includes('dish') || (cmd.includes('wash') && cmd.includes('kitchen')))
    return toTarget('kitchen', [6 * S, 0, -9 * S], 'Washing dishes.', 'dishes', 24, 'Routing to sink.', 'Kitchen sink calling.');
  if (cmd.includes('cook') || cmd.includes('meal') || cmd.includes('dinner') || cmd.includes('breakfast'))
    return toTarget('kitchen', [4 * S, 0, -9 * S], 'Preparing a meal.', 'cooking', 36, 'Starting to cook.', 'Time to prep something.');
  if (cmd.includes('grocer') || cmd.includes('fridge'))
    return toTarget('kitchen', [1.5 * S, 0, -9 * S], 'Checking pantry.', 'grocery-list', 20, 'Checking supplies.', 'Auditing pantry.');
  if (cmd.includes('vacuum')) {
    if (cmd.includes('bedroom')) return toTarget('bedroom', [-4 * S, 0, 4 * S], 'Vacuuming bedroom.', 'vacuuming', 30, 'Vacuuming bedroom.', 'Bedroom needs a pass.');
    if (cmd.includes('kitchen')) return toTarget('kitchen', [4 * S, 0, -6 * S], 'Vacuuming kitchen.', 'vacuuming', 30, 'Vacuuming kitchen.', 'Kitchen crumbs.');
    return toTarget('living-room', [-4 * S, 0, -6 * S], 'Vacuuming living room.', 'vacuuming', 30, 'Vacuuming living room.', 'Living room rug.');
  }
  if (cmd.includes('sweep') || cmd.includes('mop'))
    return toTarget('kitchen', [4 * S, 0, -5 * S], 'Sweeping kitchen.', 'sweeping', 22, 'Sweeping now.', 'Kitchen getting gritty.');
  if (cmd.includes('bed') && (cmd.includes('make') || cmd.includes('tidy')))
    return toTarget('bedroom', [-5 * S, 0, 5.5 * S], 'Making the bed.', 'bed-making', 18, 'Making the bed.', 'Bed needs straightening.');
  if (cmd.includes('laundry') || cmd.includes('fold'))
    return toTarget('laundry', [5 * S, 0, -1 * S], 'Sorting laundry.', 'laundry', 28, 'Heading to laundry.', 'Laundry stack waiting.');
  if (cmd.includes('organize') || cmd.includes('desk'))
    return toTarget('bedroom', [-1.5 * S, 0, 1.5 * S], 'Organizing desk.', 'organizing', 24, 'Organizing.', 'Desk needs cleanup.');
  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('scrub') || cmd.includes('toilet'))
    return toTarget('bathroom', [4 * S, 0, 4 * S], 'Cleaning bathroom.', 'scrubbing', 30, 'Scrubbing bathroom.', 'Bathroom needs scrub.');
  if (cmd.includes('kitchen') && (cmd.includes('clean') || cmd.includes('wipe')))
    return toTarget('kitchen', [4 * S, 0, -6 * S], 'Cleaning kitchen.', 'cleaning', 24, 'Cleaning kitchen.', 'Kitchen counters.');
  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv'))
    return toTarget('living-room', [-4 * S, 0, -6 * S], 'Tidying living room.', 'cleaning', 24, 'Cleaning living room.', 'Living room reset.');
  if (cmd.includes('bedroom'))
    return toTarget('bedroom', [-4 * S, 0, 4 * S], 'Tidying bedroom.', 'cleaning', 24, 'Tidying bedroom.', 'Bedroom reset.');
  if (cmd.includes('clean') || cmd.includes('tidy'))
    return toTarget('living-room', [-4 * S, 0, -6 * S], 'General cleanup.', 'cleaning', 20, 'Starting cleanup.', 'Quick sweep.');
  return null;
}
