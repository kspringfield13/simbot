import type { Room, RoomId, TaskTarget, TaskType, Wall } from '../types';

export const rooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    position: [-4, 0, -6],
    size: [8, 8],
    color: '#2c2822',
    furniture: [],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    position: [4, 0, -6],
    size: [8, 8],
    color: '#282c30',
    furniture: [],
  },
  {
    id: 'hallway',
    name: 'Hallway',
    position: [-2, 0, -1],
    size: [12, 2],
    color: '#262420',
    furniture: [],
  },
  {
    id: 'laundry',
    name: 'Laundry Closet',
    position: [5, 0, -1],
    size: [3, 2],
    color: '#262830',
    furniture: [],
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    position: [-4, 0, 4],
    size: [8, 8],
    color: '#22252a',
    furniture: [],
  },
  {
    id: 'bathroom',
    name: 'Master Bathroom',
    position: [4, 0, 4],
    size: [8, 8],
    color: '#282c30',
    furniture: [],
  },
];

export const walls: Wall[] = [
  { start: [-8, -10], end: [8, -10], height: 2.8, thickness: 0.15 },
  { start: [-8, -10], end: [-8, 8], height: 2.8, thickness: 0.15 },
  { start: [8, -10], end: [8, 8], height: 2.8, thickness: 0.15 },
  { start: [-8, 8], end: [8, 8], height: 2.8, thickness: 0.15 },

  { start: [-8, -2], end: [-3, -2], height: 2.8, thickness: 0.12 },
  { start: [3.5, -2], end: [8, -2], height: 2.8, thickness: 0.12 },

  { start: [3.5, -2], end: [3.5, 0], height: 2.8, thickness: 0.12 },
  { start: [6.5, -2], end: [6.5, 0], height: 2.8, thickness: 0.12 },

  { start: [-8, 0], end: [-2, 0], height: 2.8, thickness: 0.12 },
  { start: [-0.5, 0], end: [0, 0], height: 2.8, thickness: 0.12 },
  { start: [0, 0], end: [1.5, 0], height: 2.8, thickness: 0.12 },
  { start: [3, 0], end: [8, 0], height: 2.8, thickness: 0.12 },

  { start: [0, 0], end: [0, 8], height: 2.8, thickness: 0.12 },
];

export const roomTaskAnchors: Record<RoomId, [number, number, number][]> = {
  'living-room': [
    [-4, 0, -6],
    [-3.5, 0, -4.8],
    [-4, 0, -8.5],
  ],
  kitchen: [
    [6, 0, -9],
    [4, 0, -6],
    [4, 0, -9],
  ],
  hallway: [
    [-2, 0, -1],
    [0, 0, -1],
  ],
  laundry: [
    [5, 0, -1],
    [4.8, 0, -1.2],
  ],
  bedroom: [
    [-4, 0, 4],
    [-5, 0, 5.8],
    [-1.5, 0, 1.5],
  ],
  bathroom: [
    [4, 0, 4],
    [3, 0, 1.5],
    [6, 0, 6],
  ],
};

export const windowSpots: [number, number, number][] = [
  [-7.4, 0, -8.5],
  [7.4, 0, -8.5],
  [-7.4, 0, 6.8],
  [7.4, 0, 6.8],
];

export function getRoomCenter(roomId: RoomId): [number, number, number] {
  const room = rooms.find((entry) => entry.id === roomId);
  return room ? [room.position[0], 0, room.position[2]] : [0, 0, -1];
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
  return {
    roomId,
    position,
    description,
    taskType,
    workDuration,
    response,
    thought,
  };
}

export function findTaskTarget(command: string): TaskTarget | null {
  const cmd = command.toLowerCase();

  if (cmd.includes('dish') || (cmd.includes('wash') && cmd.includes('kitchen'))) {
    return toTarget(
      'kitchen',
      [6, 0, -9],
      'Washing dishes and resetting counters.',
      'dishes',
      24,
      'Routing to the sink for dish duty.',
      'Kitchen sink is calling me.',
    );
  }

  if (cmd.includes('cook') || cmd.includes('meal') || cmd.includes('dinner') || cmd.includes('breakfast')) {
    return toTarget(
      'kitchen',
      [4, 0, -9],
      'Preparing a meal in the kitchen.',
      'cooking',
      36,
      'On it. I will start cooking now.',
      'I should prep something warm.',
    );
  }

  if (cmd.includes('grocer') || cmd.includes('shopping list') || cmd.includes('inventory') || cmd.includes('fridge')) {
    return toTarget(
      'kitchen',
      [1.5, 0, -9],
      'Checking pantry and fridge stock.',
      'grocery-list',
      20,
      'Checking supplies and building a list.',
      'Let me audit pantry stock first.',
    );
  }

  if (cmd.includes('vacuum') || cmd.includes('hoover')) {
    if (cmd.includes('bedroom')) {
      return toTarget('bedroom', [-4, 0, 4], 'Vacuuming the bedroom.', 'vacuuming', 30, 'Vacuuming the bedroom.', 'Bedroom corners need a pass.');
    }

    if (cmd.includes('kitchen')) {
      return toTarget('kitchen', [4, 0, -6], 'Vacuuming the kitchen.', 'vacuuming', 30, 'Vacuuming kitchen floor.', 'Crumbs are building up in the kitchen.');
    }

    return toTarget('living-room', [-4, 0, -6], 'Vacuuming the living room.', 'vacuuming', 30, 'Vacuuming the living room.', 'Living room rug needs attention.');
  }

  if (cmd.includes('sweep') || cmd.includes('mop')) {
    return toTarget(
      'kitchen',
      [4, 0, -5],
      'Sweeping and mopping the kitchen floor.',
      'sweeping',
      22,
      'Sweeping the kitchen now.',
      'Kitchen walkway is getting gritty.',
    );
  }

  if (cmd.includes('bed') && (cmd.includes('make') || cmd.includes('tidy') || cmd.includes('fix'))) {
    return toTarget(
      'bedroom',
      [-5, 0, 5.5],
      'Making the bed and resetting pillows.',
      'bed-making',
      18,
      'Making the bed now.',
      'Master bed needs straightening.',
    );
  }

  if (cmd.includes('laundry') || cmd.includes('fold') || cmd.includes('clothes')) {
    return toTarget(
      'laundry',
      [5, 0, -1],
      'Sorting and folding laundry.',
      'laundry',
      28,
      'Heading to the laundry closet.',
      'Laundry stack is waiting for me.',
    );
  }

  if (cmd.includes('organize') || cmd.includes('desk') || (cmd.includes('tidy') && cmd.includes('room'))) {
    return toTarget(
      'bedroom',
      [-1.5, 0, 1.5],
      'Organizing personal items and desk area.',
      'organizing',
      24,
      'Organizing the room.',
      'Desk zone could be cleaner.',
    );
  }

  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('scrub') || cmd.includes('toilet')) {
    return toTarget(
      'bathroom',
      [4, 0, 4],
      'Deep-cleaning bathroom surfaces.',
      'scrubbing',
      30,
      'Scrubbing the bathroom now.',
      'Bathroom needs a scrub cycle.',
    );
  }

  if (cmd.includes('kitchen') && (cmd.includes('clean') || cmd.includes('wipe') || cmd.includes('tidy'))) {
    return toTarget(
      'kitchen',
      [4, 0, -6],
      'Cleaning kitchen surfaces and island.',
      'cleaning',
      24,
      'Cleaning the kitchen.',
      'Kitchen counters are a bit chaotic.',
    );
  }

  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv')) {
    return toTarget(
      'living-room',
      [-4, 0, -6],
      'Tidying the living room.',
      'cleaning',
      24,
      'Cleaning the living room.',
      'Living room needs a quick reset.',
    );
  }

  if (cmd.includes('bedroom')) {
    return toTarget(
      'bedroom',
      [-4, 0, 4],
      'Tidying the bedroom.',
      'cleaning',
      24,
      'Tidying the bedroom.',
      'Bedroom should be reset.',
    );
  }

  if (cmd.includes('clean') || cmd.includes('tidy')) {
    return toTarget(
      'living-room',
      [-4, 0, -6],
      'General cleanup sweep.',
      'cleaning',
      20,
      'Starting a general cleanup pass.',
      'I can start with a quick cleanup sweep.',
    );
  }

  return null;
}
