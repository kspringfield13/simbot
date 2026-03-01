import type { Room, RoomId, TaskTarget, TaskType, Wall } from '../types';
import { getFloorPlan } from '../config/floorPlans';
import { useStore } from '../stores/useStore';

// Scale factor: 2x from original layout.
const S = 2;

// ── Dynamic getters that read the active floor plan ─────────────

export function getActiveRooms(): Room[] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).rooms;
}

export function getActiveWalls(): Wall[] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).walls;
}

export function getActiveWindowSpots(): [number, number, number][] {
  const id = useStore.getState().floorPlanId;
  return getFloorPlan(id).windowSpots;
}

// ── Static default exports (for backward compat) ────────────────
// These resolve to the *house* preset at import time and are used
// only in contexts where the store may not yet exist (e.g. wall editor grid).

export const rooms = getFloorPlan('house').rooms;
export const walls = getFloorPlan('house').walls;
export const windowSpots = getFloorPlan('house').windowSpots;

// ── Effective rooms (merges editor overrides) ───────────────────

export function getEffectiveRooms(
  overrides: Record<string, { name?: string; color?: string; position?: [number, number, number]; size?: [number, number] }>,
  addedRooms: Room[],
  deletedRoomIds: string[],
  floorPlanId?: string,
): Room[] {
  const baseRooms = floorPlanId ? getFloorPlan(floorPlanId).rooms : getActiveRooms();
  const base = baseRooms.filter((r) => !deletedRoomIds.includes(r.id));
  const all = [...base, ...addedRooms];
  return all.map((r) => {
    const o = overrides[r.id];
    if (!o) return r;
    return {
      ...r,
      name: o.name ?? r.name,
      color: o.color ?? r.color,
      position: o.position ?? r.position,
      size: o.size ?? r.size,
    };
  });
}

// ── Room task anchors (computed from room centers) ───────────────

export function getRoomTaskAnchors(): Record<RoomId, [number, number, number][]> {
  const activeRooms = getActiveRooms();
  const anchors: Record<RoomId, [number, number, number][]> = {};
  for (const room of activeRooms) {
    const [cx, cy, cz] = room.position;
    const hw = room.size[0] / 4;
    const hd = room.size[1] / 4;
    anchors[room.id] = [
      [cx, cy, cz],
      [cx - hw, cy, cz - hd],
      [cx + hw, cy, cz + hd],
    ];
  }
  return anchors;
}

export const roomTaskAnchors = getRoomTaskAnchors();

// ── Wall editor grid (stays the same, generic) ──────────────────

export const WALL_GRID_X = [-16, -8, 0, 8, 16];
export const WALL_GRID_Z = [-20, -12, -4, 0, 8, 16];

export interface WallSlot {
  key: string;
  start: [number, number];
  end: [number, number];
  isPerimeter: boolean;
}

export const wallSlots: WallSlot[] = (() => {
  const slots: WallSlot[] = [];
  for (const z of WALL_GRID_Z) {
    for (let i = 0; i < WALL_GRID_X.length - 1; i++) {
      slots.push({
        key: `h:${WALL_GRID_X[i]}:${z}`,
        start: [WALL_GRID_X[i], z],
        end: [WALL_GRID_X[i + 1], z],
        isPerimeter: z === WALL_GRID_Z[0] || z === WALL_GRID_Z[WALL_GRID_Z.length - 1],
      });
    }
  }
  for (const x of WALL_GRID_X) {
    for (let i = 0; i < WALL_GRID_Z.length - 1; i++) {
      slots.push({
        key: `v:${x}:${WALL_GRID_Z[i]}`,
        start: [x, WALL_GRID_Z[i]],
        end: [x, WALL_GRID_Z[i + 1]],
        isPerimeter: x === WALL_GRID_X[0] || x === WALL_GRID_X[WALL_GRID_X.length - 1],
      });
    }
  }
  return slots;
})();

export const DEFAULT_ACTIVE_WALLS: string[] = [
  'h:-16:-4', 'h:8:-4',
  'v:8:-4',
  'h:-16:0', 'h:0:0', 'h:8:0',
  'v:0:0', 'v:0:8',
];

// ── Helpers ─────────────────────────────────────────────────────

export function getRoomCenter(roomId: RoomId): [number, number, number] {
  const activeRooms = getActiveRooms();
  const room = activeRooms.find((entry) => entry.id === roomId);
  return room ? [room.position[0], room.position[1], room.position[2]] : [0, 0, -1 * S];
}

export function getRoomFromPoint(x: number, z: number): RoomId | null {
  const activeRooms = getActiveRooms();
  const found = activeRooms.find((room) => {
    const halfW = room.size[0] / 2;
    const halfD = room.size[1] / 2;
    return x >= room.position[0] - halfW
      && x <= room.position[0] + halfW
      && z >= room.position[2] - halfD
      && z <= room.position[2] + halfD;
  });
  return found?.id ?? null;
}

// ── Task target lookup ──────────────────────────────────────────

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

/** Get a task position inside the given room, offset from center. */
function roomPos(roomId: RoomId, dx = 0, dz = 0): [number, number, number] {
  const [cx, cy, cz] = getRoomCenter(roomId);
  return [cx + dx, cy, cz + dz];
}

export function findTaskTarget(command: string): TaskTarget | null {
  const cmd = command.toLowerCase();
  const activeRooms = getActiveRooms();
  const hasRoom = (id: string) => activeRooms.some((r) => r.id === id);

  if (cmd.includes('dish') || (cmd.includes('wash') && cmd.includes('kitchen')))
    return hasRoom('kitchen') ? toTarget('kitchen', roomPos('kitchen', 2, 2), 'Washing dishes.', 'dishes', 24, 'Routing to sink.', 'Kitchen sink calling.') : null;
  if (cmd.includes('cook') || cmd.includes('meal') || cmd.includes('dinner') || cmd.includes('breakfast'))
    return hasRoom('kitchen') ? toTarget('kitchen', roomPos('kitchen', -1, 2), 'Preparing a meal.', 'cooking', 36, 'Starting to cook.', 'Time to prep something.') : null;
  if (cmd.includes('grocer') || cmd.includes('fridge'))
    return hasRoom('kitchen') ? toTarget('kitchen', roomPos('kitchen', -3, 2), 'Checking pantry.', 'grocery-list', 20, 'Checking supplies.', 'Auditing pantry.') : null;
  if (cmd.includes('vacuum')) {
    if (cmd.includes('bedroom') && hasRoom('bedroom')) return toTarget('bedroom', roomPos('bedroom'), 'Vacuuming bedroom.', 'vacuuming', 30, 'Vacuuming bedroom.', 'Bedroom needs a pass.');
    if (cmd.includes('kitchen') && hasRoom('kitchen')) return toTarget('kitchen', roomPos('kitchen'), 'Vacuuming kitchen.', 'vacuuming', 30, 'Vacuuming kitchen.', 'Kitchen crumbs.');
    return hasRoom('living-room') ? toTarget('living-room', roomPos('living-room'), 'Vacuuming living room.', 'vacuuming', 30, 'Vacuuming living room.', 'Living room rug.') : null;
  }
  if (cmd.includes('sweep') || cmd.includes('mop'))
    return hasRoom('kitchen') ? toTarget('kitchen', roomPos('kitchen', 0, 1), 'Sweeping kitchen.', 'sweeping', 22, 'Sweeping now.', 'Kitchen getting gritty.') : null;
  if (cmd.includes('bed') && (cmd.includes('make') || cmd.includes('tidy')))
    return hasRoom('bedroom') ? toTarget('bedroom', roomPos('bedroom', -1, 1.5), 'Making the bed.', 'bed-making', 18, 'Making the bed.', 'Bed needs straightening.') : null;
  if (cmd.includes('laundry') || cmd.includes('fold'))
    return hasRoom('laundry') ? toTarget('laundry', roomPos('laundry'), 'Sorting laundry.', 'laundry', 28, 'Heading to laundry.', 'Laundry stack waiting.') : null;
  if (cmd.includes('organize') || cmd.includes('desk'))
    return hasRoom('bedroom') ? toTarget('bedroom', roomPos('bedroom', 2, -2), 'Organizing desk.', 'organizing', 24, 'Organizing.', 'Desk needs cleanup.') : null;
  if (cmd.includes('bath') || cmd.includes('shower') || cmd.includes('scrub') || cmd.includes('toilet'))
    return hasRoom('bathroom') ? toTarget('bathroom', roomPos('bathroom'), 'Cleaning bathroom.', 'scrubbing', 30, 'Scrubbing bathroom.', 'Bathroom needs scrub.') : null;
  if (cmd.includes('kitchen') && (cmd.includes('clean') || cmd.includes('wipe')))
    return hasRoom('kitchen') ? toTarget('kitchen', roomPos('kitchen'), 'Cleaning kitchen.', 'cleaning', 24, 'Cleaning kitchen.', 'Kitchen counters.') : null;
  if (cmd.includes('living') || cmd.includes('couch') || cmd.includes('tv'))
    return hasRoom('living-room') ? toTarget('living-room', roomPos('living-room'), 'Tidying living room.', 'cleaning', 24, 'Cleaning living room.', 'Living room reset.') : null;
  if (cmd.includes('bedroom'))
    return hasRoom('bedroom') ? toTarget('bedroom', roomPos('bedroom'), 'Tidying bedroom.', 'cleaning', 24, 'Tidying bedroom.', 'Bedroom reset.') : null;
  // ── Outdoor / Yard tasks ──────────────────────────────────
  if (cmd.includes('mow') || cmd.includes('lawn'))
    return hasRoom('yard') ? toTarget('yard', roomPos('yard', -2, 0), 'Mowing the lawn.', 'mowing', 35, 'Heading outside to mow.', 'Lawn is getting long.') : null;
  if (cmd.includes('water') && (cmd.includes('plant') || cmd.includes('garden') || cmd.includes('flower') || cmd.includes('yard')))
    return hasRoom('yard') ? toTarget('yard', roomPos('yard', 2, -1), 'Watering the plants.', 'watering', 25, 'Watering the garden.', 'Plants look thirsty.') : null;
  if (cmd.includes('leaf') || cmd.includes('blow') || cmd.includes('rake'))
    return hasRoom('yard') ? toTarget('yard', roomPos('yard', 0, 2), 'Blowing leaves.', 'leaf-blowing', 28, 'Clearing the leaves.', 'Leaves are piling up.') : null;
  if (cmd.includes('weed') || cmd.includes('pull'))
    return hasRoom('yard') ? toTarget('yard', roomPos('yard', -1, -2), 'Pulling weeds.', 'weeding', 30, 'Weeding the garden.', 'Weeds are sprouting.') : null;
  if (cmd.includes('yard') || cmd.includes('garden') || cmd.includes('outside') || cmd.includes('outdoor') || cmd.includes('porch'))
    return hasRoom('yard') ? toTarget('yard', roomPos('yard'), 'Tidying the yard.', 'cleaning', 26, 'Heading to the yard.', 'Yard needs attention.') : null;

  // ── Second floor tasks ──────────────────────────────────
  if (cmd.includes('upstairs') && cmd.includes('bed'))
    return hasRoom('f2-bedroom') ? toTarget('f2-bedroom', roomPos('f2-bedroom', -1, 1.5), 'Making the upstairs bed.', 'bed-making', 18, 'Heading upstairs.', 'Upstairs bed needs attention.') : null;
  if (cmd.includes('office') || cmd.includes('paperwork') || cmd.includes('filing'))
    return hasRoom('f2-office') ? toTarget('f2-office', roomPos('f2-office', 2, -1), 'Organizing the office.', 'organizing', 24, 'Heading to office.', 'Office needs tidying.') : null;
  if (cmd.includes('balcony') || cmd.includes('terrace') || cmd.includes('patio'))
    return hasRoom('f2-balcony') ? toTarget('f2-balcony', roomPos('f2-balcony'), 'Sweeping the balcony.', 'sweeping', 22, 'Going to balcony.', 'Balcony needs a sweep.') : null;

  if (cmd.includes('clean') || cmd.includes('tidy'))
    return hasRoom('living-room') ? toTarget('living-room', roomPos('living-room'), 'General cleanup.', 'cleaning', 20, 'Starting cleanup.', 'Quick sweep.') : null;
  return null;
}
