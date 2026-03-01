import type { EvolutionStage, RobotEvolution, RobotId, TaskType } from '../types';

// ── Stage thresholds (cumulative tasks completed) ──────────────
const STAGE_THRESHOLDS: { stage: EvolutionStage; tasks: number }[] = [
  { stage: 'legend', tasks: 200 },
  { stage: 'master', tasks: 100 },
  { stage: 'expert', tasks: 40 },
  { stage: 'apprentice', tasks: 10 },
  { stage: 'novice', tasks: 0 },
];

export function getStageForTasks(totalTasks: number): EvolutionStage {
  for (const { stage, tasks } of STAGE_THRESHOLDS) {
    if (totalTasks >= tasks) return stage;
  }
  return 'novice';
}

export function getStageIndex(stage: EvolutionStage): number {
  const order: EvolutionStage[] = ['novice', 'apprentice', 'expert', 'master', 'legend'];
  return order.indexOf(stage);
}

export function getNextStageThreshold(stage: EvolutionStage): number | null {
  const order: EvolutionStage[] = ['novice', 'apprentice', 'expert', 'master', 'legend'];
  const idx = order.indexOf(stage);
  if (idx >= order.length - 1) return null; // already legend
  const next = order[idx + 1];
  return STAGE_THRESHOLDS.find((t) => t.stage === next)?.tasks ?? null;
}

export function getStageLabel(stage: EvolutionStage): string {
  const labels: Record<EvolutionStage, string> = {
    novice: 'Novice',
    apprentice: 'Apprentice',
    expert: 'Expert',
    master: 'Master',
    legend: 'Legend',
  };
  return labels[stage];
}

export function getStageColor(stage: EvolutionStage): string {
  const colors: Record<EvolutionStage, string> = {
    novice: '#94a3b8',      // slate-400
    apprentice: '#22d3ee',   // cyan-400
    expert: '#a78bfa',       // violet-400
    master: '#f59e0b',       // amber-500
    legend: '#ef4444',       // red-500
  };
  return colors[stage];
}

/** Get the dominant task type (the one the robot has done most) */
export function getDominantTask(specialty: Partial<Record<TaskType, number>>): TaskType | null {
  let max = 0;
  let dominant: TaskType | null = null;
  for (const [task, count] of Object.entries(specialty)) {
    if ((count ?? 0) > max) {
      max = count ?? 0;
      dominant = task as TaskType;
    }
  }
  return dominant;
}

// ── Visual evolution parameters ──────────────────────────────
export interface EvolutionVisuals {
  emissiveIntensity: number;   // glow strength 0.2 → 0.8
  scaleMult: number;           // subtle size increase 1.0 → 1.08
  colorShift: [number, number, number]; // HSL shift per stage
  wearOpacity: number;         // scratch/wear overlay opacity 0→0.3
  glowPulseSpeed: number;      // pulse frequency 0→2
}

export function getEvolutionVisuals(evo: RobotEvolution): EvolutionVisuals {
  const idx = getStageIndex(evo.stage);
  // Each stage adds more visual intensity
  return {
    emissiveIntensity: 0.2 + idx * 0.15,
    scaleMult: 1.0 + idx * 0.02,
    colorShift: [
      idx * 0.03,    // hue shift
      idx * 0.05,    // saturation boost
      idx * 0.04,    // lightness boost
    ],
    wearOpacity: Math.min(0.3, evo.totalTasksCompleted * 0.002),
    glowPulseSpeed: idx >= 3 ? 1.5 + (idx - 3) * 0.5 : 0,
  };
}

// ── localStorage persistence ──────────────────────────────
const EVOLUTION_STORAGE_KEY = 'simbot-evolution';

export function createInitialEvolution(): RobotEvolution {
  return {
    totalTasksCompleted: 0,
    totalWorkTime: 0,
    taskSpecialty: {},
    firstActiveAt: 0,
    lastActiveAt: 0,
    stage: 'novice',
    stageUnlockedAt: { novice: 0, apprentice: null, expert: null, master: null, legend: null },
  };
}

export function createAllEvolutions(): Record<RobotId, RobotEvolution> {
  return {
    sim: createInitialEvolution(),
    chef: createInitialEvolution(),
    sparkle: createInitialEvolution(),
  };
}

export function loadEvolutionData(): Record<RobotId, RobotEvolution> {
  try {
    const stored = localStorage.getItem(EVOLUTION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createAllEvolutions(), ...parsed };
    }
    return createAllEvolutions();
  } catch {
    return createAllEvolutions();
  }
}

export function saveEvolutionData(data: Record<RobotId, RobotEvolution>) {
  try {
    localStorage.setItem(EVOLUTION_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

/** Record a task completion and return updated evolution (+ whether stage changed) */
export function recordEvolutionTask(
  evo: RobotEvolution,
  taskType: TaskType,
  workDuration: number,
  simMinutes: number,
): { evolution: RobotEvolution; stageChanged: boolean } {
  const newSpecialty = { ...evo.taskSpecialty };
  newSpecialty[taskType] = (newSpecialty[taskType] ?? 0) + 1;

  const newTotal = evo.totalTasksCompleted + 1;
  const newWorkTime = evo.totalWorkTime + workDuration;
  const newStage = getStageForTasks(newTotal);
  const stageChanged = newStage !== evo.stage;

  const newStageUnlockedAt = { ...evo.stageUnlockedAt };
  if (stageChanged && newStageUnlockedAt[newStage] === null) {
    newStageUnlockedAt[newStage] = simMinutes;
  }

  return {
    evolution: {
      totalTasksCompleted: newTotal,
      totalWorkTime: newWorkTime,
      taskSpecialty: newSpecialty,
      firstActiveAt: evo.firstActiveAt || simMinutes,
      lastActiveAt: simMinutes,
      stage: newStage,
      stageUnlockedAt: newStageUnlockedAt,
    },
    stageChanged,
  };
}
