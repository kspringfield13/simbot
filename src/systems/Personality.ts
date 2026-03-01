import type { PersonalityTrait, RobotId, RobotPersonalityData, RoomId, TaskType } from '../types';
import { ROBOT_IDS } from '../types';

// ── localStorage persistence ──────────────────────────────
const STORAGE_KEY = 'simbot-personality';

export function loadPersonalities(): Record<RobotId, RobotPersonalityData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new robots
      const result = createEmptyPersonalities();
      for (const id of ROBOT_IDS) {
        if (parsed[id]) {
          result[id] = {
            taskCounts: parsed[id].taskCounts ?? {},
            roomTimeMins: parsed[id].roomTimeMins ?? {},
            totalTasksDone: parsed[id].totalTasksDone ?? 0,
          };
        }
      }
      return result;
    }
  } catch { /* ignore */ }
  return createEmptyPersonalities();
}

export function savePersonalities(data: Record<RobotId, RobotPersonalityData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

export function createEmptyPersonalities(): Record<RobotId, RobotPersonalityData> {
  return Object.fromEntries(
    ROBOT_IDS.map((id) => [id, { taskCounts: {}, roomTimeMins: {}, totalTasksDone: 0 }]),
  ) as Record<RobotId, RobotPersonalityData>;
}

// ── Record a task completion ──────────────────────────────
export function recordPersonalityTask(
  personalities: Record<RobotId, RobotPersonalityData>,
  robotId: RobotId,
  taskType: TaskType,
): Record<RobotId, RobotPersonalityData> {
  const current = personalities[robotId];
  return {
    ...personalities,
    [robotId]: {
      ...current,
      taskCounts: {
        ...current.taskCounts,
        [taskType]: (current.taskCounts[taskType] ?? 0) + 1,
      },
      totalTasksDone: current.totalTasksDone + 1,
    },
  };
}

// ── Record time spent in a room ──────────────────────────
export function recordRoomTime(
  personalities: Record<RobotId, RobotPersonalityData>,
  robotId: RobotId,
  roomId: RoomId,
  minutes: number,
): Record<RobotId, RobotPersonalityData> {
  const current = personalities[robotId];
  return {
    ...personalities,
    [robotId]: {
      ...current,
      roomTimeMins: {
        ...current.roomTimeMins,
        [roomId]: (current.roomTimeMins[roomId] ?? 0) + minutes,
      },
    },
  };
}

// ── Room labels for display ──────────────────────────────
const ROOM_NAMES: Record<string, string> = {
  'living-room': 'Living Room',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  laundry: 'Laundry',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
};

const TASK_NAMES: Record<string, string> = {
  cleaning: 'cleaning',
  vacuuming: 'vacuuming',
  dishes: 'doing dishes',
  laundry: 'laundry',
  organizing: 'organizing',
  cooking: 'cooking',
  'bed-making': 'making beds',
  scrubbing: 'scrubbing',
  sweeping: 'sweeping',
  'grocery-list': 'grocery lists',
  seasonal: 'seasonal tasks',
};

// ── Derive personality traits from data ──────────────────
export function getPersonalityTraits(data: RobotPersonalityData): PersonalityTrait[] {
  const traits: PersonalityTrait[] = [];

  // Need at least 3 total tasks to start developing preferences
  if (data.totalTasksDone < 3) return traits;

  // Task preferences — find tasks done significantly more than average
  const taskEntries = Object.entries(data.taskCounts) as [TaskType, number][];
  if (taskEntries.length > 0) {
    const totalTasks = taskEntries.reduce((s, [, c]) => s + c, 0);
    const avgPerType = totalTasks / taskEntries.length;

    for (const [taskType, count] of taskEntries) {
      if (count < 2) continue; // need at least 2 of this type
      const ratio = count / Math.max(1, avgPerType);
      // Strength based on how much above average, capped at 1
      const strength = Math.min(1, (ratio - 1) * 0.5 + (count / 20));
      if (strength >= 0.15) {
        const verb = TASK_NAMES[taskType] ?? taskType;
        const label = strength >= 0.7 ? `Loves ${verb}` : strength >= 0.4 ? `Enjoys ${verb}` : `Likes ${verb}`;
        traits.push({ label, type: 'task', key: taskType, strength });
      }
    }
  }

  // Room preferences — find rooms with significantly more time
  const roomEntries = Object.entries(data.roomTimeMins) as [string, number][];
  if (roomEntries.length > 0) {
    const totalTime = roomEntries.reduce((s, [, t]) => s + t, 0);
    const avgPerRoom = totalTime / roomEntries.length;

    for (const [roomId, time] of roomEntries) {
      if (time < 5) continue; // need at least 5 mins
      const ratio = time / Math.max(1, avgPerRoom);
      const strength = Math.min(1, (ratio - 1) * 0.4 + (time / 200));
      if (strength >= 0.15) {
        const roomName = ROOM_NAMES[roomId] ?? roomId;
        const label = strength >= 0.7 ? `Lives in ${roomName}` : strength >= 0.4 ? `Prefers ${roomName}` : `Frequents ${roomName}`;
        traits.push({ label, type: 'room', key: roomId, strength });
      }
    }
  }

  // Sort by strength descending, limit to top 5
  traits.sort((a, b) => b.strength - a.strength);
  return traits.slice(0, 5);
}

// ── Task scoring bonus (small bias) ──────────────────────
// Returns 0-6 bonus points for preferred tasks
export function getTaskPreferenceBonus(data: RobotPersonalityData, taskType: TaskType): number {
  if (data.totalTasksDone < 3) return 0;
  const count = data.taskCounts[taskType] ?? 0;
  if (count < 2) return 0;

  const entries = Object.entries(data.taskCounts) as [TaskType, number][];
  const totalTasks = entries.reduce((s, [, c]) => s + c, 0);
  const avgPerType = totalTasks / Math.max(1, entries.length);
  const ratio = count / Math.max(1, avgPerType);

  // Up to 6 bonus points for strongly preferred tasks
  return Math.min(6, Math.max(0, (ratio - 1) * 3));
}

// ── Room scoring bonus (small bias) ──────────────────────
// Returns 0-5 bonus points for preferred rooms
export function getRoomPreferenceBonus(data: RobotPersonalityData, roomId: RoomId): number {
  const time = data.roomTimeMins[roomId] ?? 0;
  if (time < 5) return 0;

  const entries = Object.entries(data.roomTimeMins) as [string, number][];
  const totalTime = entries.reduce((s, [, t]) => s + t, 0);
  const avgPerRoom = totalTime / Math.max(1, entries.length);
  const ratio = time / Math.max(1, avgPerRoom);

  // Up to 5 bonus points for preferred rooms
  return Math.min(5, Math.max(0, (ratio - 1) * 2.5));
}
