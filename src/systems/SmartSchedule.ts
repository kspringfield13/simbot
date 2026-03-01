import type { RoomId, TaskType, SimPeriod } from '../types';

// ── Types ────────────────────────────────────────────────

/** One observed event: a task was completed in a room at a certain sim-time */
export interface CleaningEvent {
  roomId: RoomId;
  taskType: TaskType;
  simMinutes: number;       // absolute sim-minutes
  timeOfDay: number;        // 0-1439 within the day
  source: 'user' | 'ai' | 'schedule';
  cleanlinessBeforeTask: number;
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

/** Full smart-schedule state persisted to localStorage */
export interface SmartScheduleData {
  events: CleaningEvent[];
  roomPatterns: Record<string, RoomPattern>;
  lastAnalyzedAt: number;       // sim-minutes when patterns were last recalculated
  userInteractionTimes: number[]; // timeOfDay values when user gave commands
  totalUserCommands: number;
  peakActivityHour: number;     // global peak hour across all rooms
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
  };
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

  return {
    ...data,
    roomPatterns,
    lastAnalyzedAt: currentSimMinutes,
    peakActivityHour,
  };
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

/** Confidence level based on amount of data collected */
export function getConfidenceLevel(data: SmartScheduleData): 'low' | 'medium' | 'high' {
  if (data.events.length >= 80) return 'high';
  if (data.events.length >= 20) return 'medium';
  return 'low';
}

export function getConfidencePercent(data: SmartScheduleData): number {
  return Math.min(100, Math.round((data.events.length / 80) * 100));
}
