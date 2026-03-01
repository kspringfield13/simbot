import { getActiveRooms, getRoomTaskAnchors } from '../utils/homeLayout';
import { findClearPosition } from './ObstacleMap';
import type { RoomId, RoomNeedState, SimPeriod, TaskType } from '../types';

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const baseDecayByRoom: Record<RoomId, { cleanliness: number; tidiness: number }> = {
  'living-room': { cleanliness: 0.1, tidiness: 0.12 },
  kitchen: { cleanliness: 0.16, tidiness: 0.14 },
  hallway: { cleanliness: 0.08, tidiness: 0.09 },
  laundry: { cleanliness: 0.09, tidiness: 0.1 },
  bedroom: { cleanliness: 0.07, tidiness: 0.1 },
  bathroom: { cleanliness: 0.14, tidiness: 0.11 },
  yard: { cleanliness: 0.12, tidiness: 0.14 },
};

export function createInitialRoomNeeds(): Record<RoomId, RoomNeedState> {
  const rooms = getActiveRooms();
  return rooms.reduce((acc, room) => {
    const decay = baseDecayByRoom[room.id] ?? { cleanliness: 0.1, tidiness: 0.1 };
    acc[room.id] = {
      cleanliness: 78 + Math.random() * 15,
      tidiness: 76 + Math.random() * 16,
      routine: 70 + Math.random() * 18,
      decayCleanliness: decay.cleanliness,
      decayTidiness: decay.tidiness,
      lastServicedAt: 0,
    };

    return acc;
  }, {} as Record<RoomId, RoomNeedState>);
}

export function decayRoomNeeds(
  current: Record<RoomId, RoomNeedState>,
  deltaSimMinutes: number,
): Record<RoomId, RoomNeedState> {
  if (deltaSimMinutes <= 0) return current;

  const next = { ...current };

  for (const roomId of Object.keys(next) as RoomId[]) {
    const existing = next[roomId];

    next[roomId] = {
      ...existing,
      cleanliness: clampPercent(existing.cleanliness - existing.decayCleanliness * deltaSimMinutes),
      tidiness: clampPercent(existing.tidiness - existing.decayTidiness * deltaSimMinutes),
      routine: clampPercent(existing.routine - 0.035 * deltaSimMinutes),
    };
  }

  return next;
}

export function boostRoomAfterTask(
  roomState: RoomNeedState,
  taskType: TaskType,
): RoomNeedState {
  const boosts: Partial<Record<TaskType, { cleanliness: number; tidiness: number; routine: number }>> = {
    cleaning: { cleanliness: 24, tidiness: 20, routine: 14 },
    vacuuming: { cleanliness: 20, tidiness: 12, routine: 12 },
    dishes: { cleanliness: 26, tidiness: 18, routine: 16 },
    laundry: { cleanliness: 10, tidiness: 28, routine: 20 },
    organizing: { cleanliness: 9, tidiness: 26, routine: 18 },
    cooking: { cleanliness: 8, tidiness: 12, routine: 16 },
    'bed-making': { cleanliness: 8, tidiness: 24, routine: 22 },
    scrubbing: { cleanliness: 30, tidiness: 16, routine: 14 },
    sweeping: { cleanliness: 22, tidiness: 14, routine: 14 },
    'grocery-list': { cleanliness: 2, tidiness: 8, routine: 12 },
    general: { cleanliness: 8, tidiness: 8, routine: 8 },
    seasonal: { cleanliness: 12, tidiness: 14, routine: 18 },
    mowing: { cleanliness: 22, tidiness: 24, routine: 18 },
    watering: { cleanliness: 14, tidiness: 18, routine: 20 },
    'leaf-blowing': { cleanliness: 26, tidiness: 20, routine: 16 },
    weeding: { cleanliness: 18, tidiness: 22, routine: 18 },
  };

  const boost = boosts[taskType] ?? boosts.general;

  return {
    ...roomState,
    cleanliness: clampPercent(roomState.cleanliness + (boost?.cleanliness ?? 10)),
    tidiness: clampPercent(roomState.tidiness + (boost?.tidiness ?? 10)),
    routine: clampPercent(roomState.routine + (boost?.routine ?? 10)),
  };
}

function getRoutineBias(period: SimPeriod, roomId: RoomId): number {
  if (period === 'morning') {
    if (roomId === 'kitchen') return 14;
    if (roomId === 'bedroom') return 8;
    if (roomId === 'living-room') return 6;
    if (roomId === 'yard') return 8;
  }

  if (period === 'afternoon') {
    if (roomId === 'laundry') return 14;
    if (roomId === 'living-room') return 10;
    if (roomId === 'hallway') return 6;
    if (roomId === 'yard') return 12;
  }

  if (period === 'evening') {
    if (roomId === 'kitchen') return 10;
    if (roomId === 'bathroom') return 10;
    if (roomId === 'bedroom') return 8;
  }

  if (period === 'night') {
    if (roomId === 'hallway') return 4;
  }

  return 0;
}

export function scoreRoomAttention(
  roomId: RoomId,
  roomState: RoomNeedState,
  period: SimPeriod,
  robotPosition?: [number, number, number],
): number {
  const dirtiness = 100 - roomState.cleanliness;
  const clutter = 100 - roomState.tidiness;
  const routineNeed = 100 - roomState.routine;

  let score = (dirtiness * 0.48) + (clutter * 0.32) + (routineNeed * 0.2) + getRoutineBias(period, roomId);

  // Proximity bonus: prefer nearby rooms when scores are close
  if (robotPosition) {
    const room = getActiveRooms().find((r) => r.id === roomId);
    if (room) {
      const dx = robotPosition[0] - room.position[0];
      const dz = robotPosition[2] - room.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Up to 6 bonus points for being very close, fading over ~10 units
      score += Math.max(0, 6 - dist * 0.6);
    }
  }

  return score;
}

export function roomOutlineColor(cleanliness: number): string {
  if (cleanliness >= 74) return '#4ade80';
  if (cleanliness >= 45) return '#facc15';
  return '#f87171';
}

export function roomAttentionLabel(cleanliness: number): string {
  if (cleanliness >= 74) return 'Clean';
  if (cleanliness >= 45) return 'Needs Attention';
  return 'Dirty';
}

interface AutonomousTaskPreset {
  taskType: TaskType;
  workDuration: number;
  description: string;
  thought: string;
}

function pickPreset(roomId: RoomId, period: SimPeriod): AutonomousTaskPreset {
  if (roomId === 'kitchen') {
    if (period === 'morning') return { taskType: 'dishes', workDuration: 24, description: 'Resetting kitchen dishes and counters.', thought: 'Hmm, kitchen looks messy...' };
    if (period === 'evening') return { taskType: 'sweeping', workDuration: 22, description: 'Sweeping high-traffic kitchen floor.', thought: 'Evening cleanup in the kitchen first.' };
    return { taskType: 'cleaning', workDuration: 22, description: 'Wiping down kitchen surfaces.', thought: 'Kitchen needs a quick cleanup pass.' };
  }

  if (roomId === 'living-room') {
    if (period === 'afternoon') return { taskType: 'vacuuming', workDuration: 28, description: 'Vacuuming living room floor and rug.', thought: 'Living room traffic is building dust.' };
    return { taskType: 'cleaning', workDuration: 24, description: 'Tidying the living room area.', thought: 'I should tidy up the living room.' };
  }

  if (roomId === 'bedroom') {
    if (period === 'morning') return { taskType: 'bed-making', workDuration: 18, description: 'Making and tidying the bed.', thought: 'Morning routine says make the bed.' };
    if (period === 'afternoon') return { taskType: 'organizing', workDuration: 22, description: 'Organizing bedroom desk and surfaces.', thought: 'Desk area needs organizing.' };
    return { taskType: 'cleaning', workDuration: 20, description: 'Evening reset for the bedroom.', thought: 'I should prep the bedroom for wind-down.' };
  }

  if (roomId === 'bathroom') {
    if (period === 'evening') return { taskType: 'scrubbing', workDuration: 30, description: 'Deep scrubbing bathroom fixtures.', thought: 'Bathroom would benefit from a scrub.' };
    return { taskType: 'cleaning', workDuration: 22, description: 'Refreshing bathroom surfaces.', thought: 'Bathroom touch-up is due.' };
  }

  if (roomId === 'laundry') {
    return { taskType: 'laundry', workDuration: 26, description: 'Folding and sorting laundry.', thought: 'Laundry closet could use a pass.' };
  }

  if (roomId === 'yard') {
    if (period === 'morning') return { taskType: 'watering', workDuration: 25, description: 'Watering the garden plants.', thought: 'Morning is the best time to water.' };
    if (period === 'afternoon') return { taskType: 'mowing', workDuration: 35, description: 'Mowing the lawn.', thought: 'The grass is getting tall out there.' };
    if (period === 'evening') return { taskType: 'weeding', workDuration: 30, description: 'Pulling weeds from garden beds.', thought: 'Weeds are creeping in again.' };
    return { taskType: 'leaf-blowing', workDuration: 28, description: 'Clearing leaves from the yard.', thought: 'Leaves are scattered everywhere.' };
  }

  return { taskType: 'sweeping', workDuration: 18, description: 'Sweeping and resetting hallway.', thought: 'I should keep the hallway tidy.' };
}

export function buildAutonomousTask(roomId: RoomId, period: SimPeriod): {
  taskType: TaskType;
  workDuration: number;
  description: string;
  thought: string;
  position: [number, number, number];
} {
  const preset = pickPreset(roomId, period);
  const anchors = getRoomTaskAnchors()[roomId];
  const raw = anchors[Math.floor(Math.random() * anchors.length)] ?? [0, 0, -1];
  
  // Ensure target position is clear of obstacles
  const [cx, cz] = findClearPosition(raw[0], raw[2], 0.8);
  
  return {
    ...preset,
    position: [cx, 0, cz] as [number, number, number],
  };
}
