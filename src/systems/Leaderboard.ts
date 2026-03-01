import type { RobotId, TaskType } from '../types';
import { ROBOT_IDS } from '../types';

// ── Types ──────────────────────────────────────────────────────────

export interface RobotSessionStats {
  tasksCompleted: number;
  tasksByType: Partial<Record<TaskType, number>>;
  avgCleanliness: number;        // rolling average maintained cleanliness (0-100)
  cleanlinessReadings: number;   // number of readings taken (for running avg)
  totalCleanTime: number;        // sim-minutes spent working
  startedAt: number;             // real timestamp
}

export interface SessionRecord {
  id: string;
  startedAt: number;             // real timestamp
  endedAt: number;               // real timestamp
  simMinutesPlayed: number;
  robotStats: Record<RobotId, RobotSessionStats>;
  overallScore: number;
}

export interface RobotAllTimeStats {
  totalTasksCompleted: number;
  totalSessions: number;
  bestSessionScore: number;
  bestSessionId: string;
  avgCleanliness: number;
  cleanlinessReadings: number;
  fastestTaskTime: number;       // shortest workDuration completed
  tasksByType: Partial<Record<TaskType, number>>;
}

export interface LeaderboardData {
  sessions: SessionRecord[];
  allTime: Record<RobotId, RobotAllTimeStats>;
  overallBestScore: number;
  overallBestSessionId: string;
}

// ── localStorage helpers ───────────────────────────────────────────

const STORAGE_KEY = 'simbot-leaderboard';

function defaultRobotAllTime(): RobotAllTimeStats {
  return {
    totalTasksCompleted: 0,
    totalSessions: 0,
    bestSessionScore: 0,
    bestSessionId: '',
    avgCleanliness: 0,
    cleanlinessReadings: 0,
    fastestTaskTime: Infinity,
    tasksByType: {},
  };
}

function defaultLeaderboard(): LeaderboardData {
  return {
    sessions: [],
    allTime: {
      sim: defaultRobotAllTime(),
      chef: defaultRobotAllTime(),
      sparkle: defaultRobotAllTime(),
    },
    overallBestScore: 0,
    overallBestSessionId: '',
  };
}

export function loadLeaderboard(): LeaderboardData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultLeaderboard();
    const parsed = JSON.parse(stored);
    // Ensure all robots exist
    for (const rid of ROBOT_IDS) {
      if (!parsed.allTime[rid]) parsed.allTime[rid] = defaultRobotAllTime();
    }
    return parsed;
  } catch {
    return defaultLeaderboard();
  }
}

export function saveLeaderboard(data: LeaderboardData) {
  try {
    // Keep only last 50 sessions to avoid storage bloat
    const trimmed = {
      ...data,
      sessions: data.sessions.slice(-50),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}

// ── Session tracking (in-memory, flushed on save) ──────────────────

export function createSessionStats(): Record<RobotId, RobotSessionStats> {
  const now = Date.now();
  const stats: Partial<Record<RobotId, RobotSessionStats>> = {};
  for (const rid of ROBOT_IDS) {
    stats[rid] = {
      tasksCompleted: 0,
      tasksByType: {},
      avgCleanliness: 0,
      cleanlinessReadings: 0,
      totalCleanTime: 0,
      startedAt: now,
    };
  }
  return stats as Record<RobotId, RobotSessionStats>;
}

export function recordRobotTask(
  stats: Record<RobotId, RobotSessionStats>,
  robotId: RobotId,
  taskType: TaskType,
  workDuration: number,
): Record<RobotId, RobotSessionStats> {
  const rs = stats[robotId];
  return {
    ...stats,
    [robotId]: {
      ...rs,
      tasksCompleted: rs.tasksCompleted + 1,
      tasksByType: {
        ...rs.tasksByType,
        [taskType]: (rs.tasksByType[taskType] ?? 0) + 1,
      },
      totalCleanTime: rs.totalCleanTime + workDuration,
    },
  };
}

export function recordCleanlinessReading(
  stats: Record<RobotId, RobotSessionStats>,
  avgCleanliness: number,
): Record<RobotId, RobotSessionStats> {
  const next: Record<string, RobotSessionStats> = {};
  for (const rid of ROBOT_IDS) {
    const rs = stats[rid];
    const n = rs.cleanlinessReadings + 1;
    next[rid] = {
      ...rs,
      avgCleanliness: rs.avgCleanliness + (avgCleanliness - rs.avgCleanliness) / n,
      cleanlinessReadings: n,
    };
  }
  return next as Record<RobotId, RobotSessionStats>;
}

// ── Scoring ────────────────────────────────────────────────────────

export function computeRobotScore(stats: RobotSessionStats): number {
  // Tasks completed: 10pts each
  const taskScore = stats.tasksCompleted * 10;
  // Cleanliness bonus: up to 50pts for maintaining 100% avg
  const cleanBonus = Math.round((stats.avgCleanliness / 100) * 50);
  // Variety bonus: 5pts per unique task type
  const variety = Object.keys(stats.tasksByType).length * 5;
  return taskScore + cleanBonus + variety;
}

export function computeSessionScore(robotStats: Record<RobotId, RobotSessionStats>): number {
  let total = 0;
  for (const rid of ROBOT_IDS) {
    total += computeRobotScore(robotStats[rid]);
  }
  return total;
}

// ── Flush session to leaderboard ───────────────────────────────────

export function saveSession(
  robotStats: Record<RobotId, RobotSessionStats>,
  simMinutesPlayed: number,
): LeaderboardData {
  const lb = loadLeaderboard();
  const score = computeSessionScore(robotStats);
  const sessionId = `session-${Date.now()}`;

  const session: SessionRecord = {
    id: sessionId,
    startedAt: robotStats.sim.startedAt,
    endedAt: Date.now(),
    simMinutesPlayed,
    robotStats,
    overallScore: score,
  };

  lb.sessions.push(session);

  // Update all-time stats per robot
  for (const rid of ROBOT_IDS) {
    const rs = robotStats[rid];
    const at = lb.allTime[rid];
    at.totalTasksCompleted += rs.tasksCompleted;
    at.totalSessions += 1;

    const robotScore = computeRobotScore(rs);
    if (robotScore > at.bestSessionScore) {
      at.bestSessionScore = robotScore;
      at.bestSessionId = sessionId;
    }

    // Running average cleanliness
    if (rs.cleanlinessReadings > 0) {
      const totalReadings = at.cleanlinessReadings + rs.cleanlinessReadings;
      at.avgCleanliness =
        (at.avgCleanliness * at.cleanlinessReadings + rs.avgCleanliness * rs.cleanlinessReadings) /
        totalReadings;
      at.cleanlinessReadings = totalReadings;
    }

    // Merge task types
    for (const [tt, count] of Object.entries(rs.tasksByType)) {
      at.tasksByType[tt as TaskType] = (at.tasksByType[tt as TaskType] ?? 0) + (count ?? 0);
    }

    // Fastest task (stored per-robot as avg work duration)
    if (rs.tasksCompleted > 0) {
      const avgTime = rs.totalCleanTime / rs.tasksCompleted;
      if (avgTime < at.fastestTaskTime || at.fastestTaskTime === Infinity) {
        at.fastestTaskTime = avgTime;
      }
    }
  }

  // Overall best
  if (score > lb.overallBestScore) {
    lb.overallBestScore = score;
    lb.overallBestSessionId = sessionId;
  }

  saveLeaderboard(lb);
  return lb;
}

// ── Rank helpers ───────────────────────────────────────────────────

export function getRobotRankings(lb: LeaderboardData): { robotId: RobotId; score: number }[] {
  return ROBOT_IDS
    .map((rid) => ({ robotId: rid, score: lb.allTime[rid].totalTasksCompleted }))
    .sort((a, b) => b.score - a.score);
}
