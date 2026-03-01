import type { RoomId, RobotId, TaskType, SimPeriod } from '../types';

// ── Types ────────────────────────────────────────────────

/** One observed event: a task was completed in a room at a certain sim-time */
export interface CleaningEvent {
  roomId: RoomId;
  taskType: TaskType;
  simMinutes: number;       // absolute sim-minutes
  timeOfDay: number;        // 0-1439 within the day
  source: 'user' | 'ai' | 'schedule';
  cleanlinessBeforeTask: number;
  robotId?: RobotId;        // which robot performed the task
  workDuration?: number;    // how long the task took
}

/** Aggregated pattern for a single room */
export interface RoomPattern {
  roomId: string;
  /** Average cleanliness when a user manually triggers a task (lower = dirtier before user intervenes) */
  avgDirtinessAtUserAction: number;
  /** How many user interactions this room has received */
  userInteractionCount: number;
  /** Total task count (all sources) */
  totalTaskCount: number;
  /** Per-hour interaction frequency (24 buckets, 0=midnight) */
  hourlyActivity: number[];
  /** Peak hour (0-23) when user interacts most */
  peakHour: number;
  /** Average decay rate observed (how fast it gets dirty per sim-hour) */
  avgDirtyRate: number;
  /** Predicted optimal cleaning time (minutes within day, 0-1439) */
  optimalCleanTime: number;
  /** Top task types for this room */
  topTasks: { taskType: string; count: number }[];
}

/** Tracks how efficiently each robot performs each task type */
export interface RobotEfficiency {
  robotId: string;
  taskType: string;
  completionCount: number;
  avgWorkDuration: number;       // average sim-time per task
  totalWorkDuration: number;
}

/** A natural-language insight derived from pattern analysis */
export interface AIInsight {
  id: string;
  category: 'room' | 'timing' | 'robot' | 'efficiency' | 'trend';
  text: string;
  importance: number;            // 0-1, higher = more important
  generatedAt: number;           // sim-minutes when generated
}

/** Full smart-schedule state persisted to localStorage */
export interface SmartScheduleData {
  events: CleaningEvent[];
  roomPatterns: Record<string, RoomPattern>;
  lastAnalyzedAt: number;       // sim-minutes when patterns were last recalculated
  userInteractionTimes: number[]; // timeOfDay values when user gave commands
  totalUserCommands: number;
  peakActivityHour: number;     // global peak hour across all rooms
  robotEfficiency: Record<string, RobotEfficiency[]>; // keyed by robotId
  insights: AIInsight[];        // AI-generated natural language insights
}

// ── Constants ────────────────────────────────────────────

const STORAGE_KEY = 'simbot-smart-schedule';
const MAX_EVENTS = 500;         // rolling window of events to keep
const ANALYSIS_INTERVAL = 60;   // recalculate patterns every 60 sim-minutes

// ── Persistence ──────────────────────────────────────────

export function loadSmartScheduleData(): SmartScheduleData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return createEmptyData();
}

export function saveSmartScheduleData(data: SmartScheduleData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function createEmptyData(): SmartScheduleData {
  return {
    events: [],
    roomPatterns: {},
    lastAnalyzedAt: 0,
    userInteractionTimes: [],
    totalUserCommands: 0,
    peakActivityHour: 9,
    robotEfficiency: {},
    insights: [],
  };
}

export function loadSmartScheduleDataSafe(): SmartScheduleData {
  const data = loadSmartScheduleData();
  // Backfill new fields for existing saves
  if (!data.robotEfficiency) data.robotEfficiency = {};
  if (!data.insights) data.insights = [];
  return data;
}

// ── Recording ────────────────────────────────────────────

export function recordCleaningEvent(
  data: SmartScheduleData,
  event: CleaningEvent,
): SmartScheduleData {
  const events = [...data.events, event];
  // Keep rolling window
  const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;

  const userInteractionTimes = event.source === 'user'
    ? [...data.userInteractionTimes, event.timeOfDay]
    : data.userInteractionTimes;

  const totalUserCommands = event.source === 'user'
    ? data.totalUserCommands + 1
    : data.totalUserCommands;

  return {
    ...data,
    events: trimmed,
    userInteractionTimes: userInteractionTimes.slice(-200),
    totalUserCommands,
  };
}

// ── Analysis ─────────────────────────────────────────────

export function shouldReanalyze(data: SmartScheduleData, currentSimMinutes: number): boolean {
  return currentSimMinutes - data.lastAnalyzedAt >= ANALYSIS_INTERVAL;
}

export function analyzePatterns(data: SmartScheduleData, currentSimMinutes: number): SmartScheduleData {
  const roomMap = new Map<string, CleaningEvent[]>();

  for (const ev of data.events) {
    const list = roomMap.get(ev.roomId) ?? [];
    list.push(ev);
    roomMap.set(ev.roomId, list);
  }

  const roomPatterns: Record<string, RoomPattern> = {};

  for (const [roomId, events] of roomMap) {
    const hourlyActivity = new Array(24).fill(0);
    let userDirtinessSum = 0;
    let userCount = 0;
    const taskCounts: Record<string, number> = {};
    const cleanlinessReadings: number[] = [];

    for (const ev of events) {
      const hour = Math.floor(ev.timeOfDay / 60);
      hourlyActivity[hour]++;

      if (ev.source === 'user') {
        userDirtinessSum += (100 - ev.cleanlinessBeforeTask);
        userCount++;
      }

      taskCounts[ev.taskType] = (taskCounts[ev.taskType] ?? 0) + 1;
      cleanlinessReadings.push(ev.cleanlinessBeforeTask);
    }

    // Find peak hour for this room
    let peakHour = 9;
    let peakCount = 0;
    for (let h = 0; h < 24; h++) {
      if (hourlyActivity[h] > peakCount) {
        peakCount = hourlyActivity[h];
        peakHour = h;
      }
    }

    // Calculate average dirty rate from cleanliness readings
    const avgCleanliness = cleanlinessReadings.length > 0
      ? cleanlinessReadings.reduce((a, b) => a + b, 0) / cleanlinessReadings.length
      : 75;
    const avgDirtyRate = Math.max(0.05, (100 - avgCleanliness) / 6); // per sim-hour approximation

    // Optimal clean time: slightly before the peak hour so rooms are clean when activity is highest
    const optimalHour = (peakHour - 1 + 24) % 24;
    const optimalCleanTime = optimalHour * 60 + 30; // middle of the hour

    // Top tasks
    const topTasks = Object.entries(taskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([taskType, count]) => ({ taskType, count }));

    roomPatterns[roomId] = {
      roomId,
      avgDirtinessAtUserAction: userCount > 0 ? userDirtinessSum / userCount : 0,
      userInteractionCount: userCount,
      totalTaskCount: events.length,
      hourlyActivity,
      peakHour,
      avgDirtyRate,
      optimalCleanTime,
      topTasks,
    };
  }

  // Global peak activity hour
  const globalHourly = new Array(24).fill(0);
  for (const t of data.userInteractionTimes) {
    const hour = Math.floor(t / 60);
    globalHourly[hour]++;
  }
  let peakActivityHour = 9;
  let peakMax = 0;
  for (let h = 0; h < 24; h++) {
    if (globalHourly[h] > peakMax) {
      peakMax = globalHourly[h];
      peakActivityHour = h;
    }
  }

  // Build robot efficiency from events that have robotId
  const robotEffMap: Record<string, Record<string, { total: number; count: number }>> = {};
  for (const ev of data.events) {
    if (!ev.robotId || !ev.workDuration) continue;
    if (!robotEffMap[ev.robotId]) robotEffMap[ev.robotId] = {};
    const existing = robotEffMap[ev.robotId][ev.taskType] ?? { total: 0, count: 0 };
    existing.total += ev.workDuration;
    existing.count += 1;
    robotEffMap[ev.robotId][ev.taskType] = existing;
  }

  const robotEfficiency: Record<string, RobotEfficiency[]> = { ...data.robotEfficiency };
  for (const [robotId, tasks] of Object.entries(robotEffMap)) {
    robotEfficiency[robotId] = Object.entries(tasks).map(([taskType, { total, count }]) => ({
      robotId,
      taskType,
      completionCount: count,
      avgWorkDuration: total / count,
      totalWorkDuration: total,
    }));
  }

  const withPatterns: SmartScheduleData = {
    ...data,
    roomPatterns,
    lastAnalyzedAt: currentSimMinutes,
    peakActivityHour,
    robotEfficiency,
  };

  // Generate insights from the updated patterns
  withPatterns.insights = generateInsights(withPatterns, currentSimMinutes);

  return withPatterns;
}

// ── Helpers for UI ───────────────────────────────────────

export function formatTimeOfDay(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getPeriodLabel(hour: number): SimPeriod {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/** Sort rooms by urgency — highest dirty rate / lowest cleanliness first */
export function getRoomPriority(
  patterns: Record<string, RoomPattern>,
): RoomPattern[] {
  return Object.values(patterns)
    .sort((a, b) => b.avgDirtyRate - a.avgDirtyRate);
}

// ── Auto-schedule helpers ───────────────────────────────

/** Map a (roomId, taskType) pair back to a natural-language command string */
const TASK_COMMAND_MAP: Record<string, Record<string, string>> = {
  kitchen: {
    dishes: 'wash dishes',
    cooking: 'cook meal',
    'grocery-list': 'check groceries',
    sweeping: 'sweep kitchen',
    cleaning: 'clean kitchen',
    vacuuming: 'vacuum kitchen',
  },
  'living-room': {
    cleaning: 'clean living room',
    vacuuming: 'vacuum living room',
  },
  bedroom: {
    'bed-making': 'make bed',
    organizing: 'organize desk',
    cleaning: 'tidy bedroom',
    vacuuming: 'vacuum bedroom',
  },
  bathroom: {
    scrubbing: 'scrub bathroom',
    cleaning: 'clean bathroom',
  },
  laundry: {
    laundry: 'do laundry',
    cleaning: 'clean laundry room',
  },
  hallway: {
    cleaning: 'clean hallway',
    vacuuming: 'vacuum hallway',
  },
  yard: {
    mowing: 'mow lawn',
    watering: 'water plants',
    'leaf-blowing': 'blow leaves',
    weeding: 'pull weeds',
    cleaning: 'tidy yard',
  },
  'f2-bedroom': {
    'bed-making': 'make upstairs bed',
    cleaning: 'clean upstairs bedroom',
  },
  'f2-office': {
    organizing: 'organize office',
    cleaning: 'clean office',
  },
  'f2-balcony': {
    sweeping: 'sweep balcony',
    cleaning: 'clean balcony',
  },
};

export function taskToCommand(roomId: string, taskType: string): string | null {
  return TASK_COMMAND_MAP[roomId]?.[taskType] ?? null;
}

/** Entry for an auto-scheduled cleaning run */
export interface AutoScheduleEntry {
  roomId: string;
  taskType: string;
  command: string;
  optimalTime: number; // minutes within day (0-1439)
}

/** Get the list of auto-schedule entries derived from learned patterns */
export function getAutoScheduleEntries(data: SmartScheduleData): AutoScheduleEntry[] {
  const entries: AutoScheduleEntry[] = [];
  for (const pattern of Object.values(data.roomPatterns)) {
    if (pattern.totalTaskCount < 3) continue; // need some data before auto-scheduling
    const topTask = pattern.topTasks[0];
    if (!topTask) continue;
    const command = taskToCommand(pattern.roomId, topTask.taskType);
    if (!command) continue;
    entries.push({
      roomId: pattern.roomId,
      taskType: topTask.taskType,
      command,
      optimalTime: pattern.optimalCleanTime,
    });
  }
  return entries.sort((a, b) => a.optimalTime - b.optimalTime);
}

/** Confidence level based on amount of data collected */
export function getConfidenceLevel(data: SmartScheduleData): 'low' | 'medium' | 'high' {
  if (data.events.length >= 80) return 'high';
  if (data.events.length >= 20) return 'medium';
  return 'low';
}

export function getConfidencePercent(data: SmartScheduleData): number {
  return Math.min(100, Math.round((data.events.length / 80) * 100));
}

// ── Robot Efficiency Tracking ───────────────────────────

export function recordRobotEfficiency(
  data: SmartScheduleData,
  robotId: string,
  taskType: string,
  workDuration: number,
): SmartScheduleData {
  const robotEntries = [...(data.robotEfficiency[robotId] ?? [])];
  const existingIdx = robotEntries.findIndex((e) => e.taskType === taskType);

  if (existingIdx >= 0) {
    const existing = robotEntries[existingIdx];
    const newCount = existing.completionCount + 1;
    const newTotal = existing.totalWorkDuration + workDuration;
    robotEntries[existingIdx] = {
      ...existing,
      completionCount: newCount,
      totalWorkDuration: newTotal,
      avgWorkDuration: newTotal / newCount,
    };
  } else {
    robotEntries.push({
      robotId,
      taskType,
      completionCount: 1,
      avgWorkDuration: workDuration,
      totalWorkDuration: workDuration,
    });
  }

  return {
    ...data,
    robotEfficiency: {
      ...data.robotEfficiency,
      [robotId]: robotEntries,
    },
  };
}

/** Get best robot for a given task type based on efficiency data */
export function getBestRobotForTask(
  data: SmartScheduleData,
  taskType: string,
): { robotId: string; avgDuration: number } | null {
  let best: { robotId: string; avgDuration: number } | null = null;

  for (const [robotId, entries] of Object.entries(data.robotEfficiency)) {
    const entry = entries.find((e) => e.taskType === taskType);
    if (entry && entry.completionCount >= 2) {
      if (!best || entry.avgWorkDuration < best.avgDuration) {
        best = { robotId, avgDuration: entry.avgWorkDuration };
      }
    }
  }

  return best;
}

// ── AI Insight Generation ───────────────────────────────

const ROOM_LABELS: Record<string, string> = {
  'living-room': 'Living Room',
  kitchen: 'Kitchen',
  hallway: 'Hallway',
  laundry: 'Laundry Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  yard: 'Yard',
  'f2-bedroom': 'Upstairs Bedroom',
  'f2-office': 'Office',
  'f2-balcony': 'Balcony',
};

const ROBOT_LABELS: Record<string, string> = {
  sim: 'Sim',
  chef: 'Chef',
  sparkle: 'Sparkle',
};

const TASK_LABELS: Record<string, string> = {
  cleaning: 'cleaning',
  vacuuming: 'vacuuming',
  dishes: 'dishes',
  laundry: 'laundry',
  organizing: 'organizing',
  cooking: 'cooking',
  'bed-making': 'bed making',
  scrubbing: 'scrubbing',
  sweeping: 'sweeping',
  mowing: 'mowing',
  watering: 'watering',
  'leaf-blowing': 'leaf blowing',
  weeding: 'weeding',
};

export function generateInsights(data: SmartScheduleData, currentSimMinutes: number): AIInsight[] {
  const insights: AIInsight[] = [];
  const patterns = Object.values(data.roomPatterns);
  if (patterns.length === 0) return insights;

  // 1. Dirtiest room insight
  const sortedByDirt = [...patterns].sort((a, b) => b.avgDirtyRate - a.avgDirtyRate);
  if (sortedByDirt.length > 0 && sortedByDirt[0].avgDirtyRate > 1) {
    const room = sortedByDirt[0];
    const label = ROOM_LABELS[room.roomId] ?? room.roomId;
    insights.push({
      id: 'dirtiest-room',
      category: 'room',
      text: `${label} gets dirty fastest (${room.avgDirtyRate.toFixed(1)}/hr) — schedule more frequent cleaning here.`,
      importance: 0.9,
      generatedAt: currentSimMinutes,
    });
  }

  // 2. Cleanest room (least maintenance needed)
  if (sortedByDirt.length > 1) {
    const cleanest = sortedByDirt[sortedByDirt.length - 1];
    const label = ROOM_LABELS[cleanest.roomId] ?? cleanest.roomId;
    if (cleanest.avgDirtyRate < 2) {
      insights.push({
        id: 'cleanest-room',
        category: 'room',
        text: `${label} stays clean longest — only needs occasional attention.`,
        importance: 0.3,
        generatedAt: currentSimMinutes,
      });
    }
  }

  // 3. Peak activity time insight
  if (data.totalUserCommands >= 5) {
    const peakLabel = getPeriodLabel(data.peakActivityHour);
    insights.push({
      id: 'peak-activity',
      category: 'timing',
      text: `You're most active in the ${peakLabel} (around ${String(data.peakActivityHour).padStart(2, '0')}:00). Robots now pre-clean before this time.`,
      importance: 0.8,
      generatedAt: currentSimMinutes,
    });
  }

  // 4. Robot specialization insights
  for (const [robotId, entries] of Object.entries(data.robotEfficiency)) {
    if (entries.length === 0) continue;
    const sorted = [...entries].sort((a, b) => b.completionCount - a.completionCount);
    const top = sorted[0];
    if (top.completionCount >= 3) {
      const robotName = ROBOT_LABELS[robotId] ?? robotId;
      const taskLabel = TASK_LABELS[top.taskType] ?? top.taskType;
      insights.push({
        id: `robot-specialty-${robotId}`,
        category: 'robot',
        text: `${robotName} specializes in ${taskLabel} (${top.completionCount} completions, avg ${top.avgWorkDuration.toFixed(0)}s).`,
        importance: 0.6,
        generatedAt: currentSimMinutes,
      });
    }
  }

  // 5. Efficiency comparison — find task types done by multiple robots
  const taskRobotMap = new Map<string, { robotId: string; avg: number; count: number }[]>();
  for (const [robotId, entries] of Object.entries(data.robotEfficiency)) {
    for (const entry of entries) {
      if (entry.completionCount < 2) continue;
      const list = taskRobotMap.get(entry.taskType) ?? [];
      list.push({ robotId, avg: entry.avgWorkDuration, count: entry.completionCount });
      taskRobotMap.set(entry.taskType, list);
    }
  }
  for (const [taskType, robots] of taskRobotMap) {
    if (robots.length < 2) continue;
    const sorted = robots.sort((a, b) => a.avg - b.avg);
    const fastest = sorted[0];
    const slowest = sorted[sorted.length - 1];
    const diff = ((slowest.avg - fastest.avg) / slowest.avg) * 100;
    if (diff > 15) {
      const fastName = ROBOT_LABELS[fastest.robotId] ?? fastest.robotId;
      const taskLabel = TASK_LABELS[taskType] ?? taskType;
      insights.push({
        id: `efficiency-${taskType}`,
        category: 'efficiency',
        text: `${fastName} is ${Math.round(diff)}% faster at ${taskLabel} than other robots.`,
        importance: 0.7,
        generatedAt: currentSimMinutes,
      });
    }
  }

  // 6. Scheduling pattern — rooms needing pre-peak cleaning
  const preCleanRooms = patterns.filter((p) => p.totalTaskCount >= 5 && p.userInteractionCount >= 2);
  if (preCleanRooms.length > 0) {
    const count = preCleanRooms.length;
    insights.push({
      id: 'auto-schedule-coverage',
      category: 'trend',
      text: `AI has learned optimal schedules for ${count} room${count > 1 ? 's' : ''}. Tasks auto-trigger before peak usage.`,
      importance: 0.5,
      generatedAt: currentSimMinutes,
    });
  }

  // 7. User intervention pattern — rooms where user frequently intervenes manually
  const highInterventionRooms = patterns.filter(
    (p) => p.userInteractionCount >= 3 && p.avgDirtinessAtUserAction > 30,
  );
  for (const room of highInterventionRooms.slice(0, 2)) {
    const label = ROOM_LABELS[room.roomId] ?? room.roomId;
    insights.push({
      id: `intervention-${room.roomId}`,
      category: 'trend',
      text: `You often clean ${label} manually when it's ${Math.round(room.avgDirtinessAtUserAction)}% dirty — AI is adjusting to clean earlier.`,
      importance: 0.65,
      generatedAt: currentSimMinutes,
    });
  }

  return insights.sort((a, b) => b.importance - a.importance);
}
