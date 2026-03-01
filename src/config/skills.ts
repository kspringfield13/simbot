import type { SkillDefinition, SkillSpecialization, TaskType } from '../types';

// ── Skill tree definitions ──────────────────────────────────
// Three specialization tracks, each with 5 skills in a tree layout:
//     [Root]          row 0
//       |
//     [Tier 2]        row 1
//    /       \
// [Left]   [Right]    row 2
//   |
// [Master]            row 3

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // ── Chef Mastery (amber) ──────────────────────
  {
    id: 'kitchen-helper',
    name: 'Kitchen Helper',
    description: 'Basic kitchen familiarity',
    specialization: 'chef',
    requiredTaskTypes: ['cooking', 'dishes'],
    requiredCount: 5,
    prerequisiteId: null,
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['cooking'],
    row: 0,
    col: 0,
  },
  {
    id: 'sous-chef',
    name: 'Sous Chef',
    description: 'Comfortable with kitchen routines',
    specialization: 'chef',
    requiredTaskTypes: ['cooking', 'dishes'],
    requiredCount: 15,
    prerequisiteId: 'kitchen-helper',
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['cooking', 'dishes'],
    row: 1,
    col: 0,
  },
  {
    id: 'head-chef',
    name: 'Head Chef',
    description: 'Master of meals and meal prep',
    specialization: 'chef',
    requiredTaskTypes: ['cooking'],
    requiredCount: 25,
    prerequisiteId: 'sous-chef',
    speedBonus: 0.15,
    qualityBonus: 0.10,
    affectedTasks: ['cooking', 'grocery-list'],
    row: 2,
    col: 0,
  },
  {
    id: 'dish-master',
    name: 'Dish Master',
    description: 'Lightning-fast dishwashing',
    specialization: 'chef',
    requiredTaskTypes: ['dishes'],
    requiredCount: 20,
    prerequisiteId: 'sous-chef',
    speedBonus: 0.15,
    qualityBonus: 0,
    affectedTasks: ['dishes'],
    row: 2,
    col: 1,
  },
  {
    id: 'chef-mastery',
    name: 'Chef Mastery',
    description: 'Ultimate kitchen expertise',
    specialization: 'chef',
    requiredTaskTypes: ['cooking', 'dishes', 'grocery-list'],
    requiredCount: 40,
    prerequisiteId: 'head-chef',
    speedBonus: 0.20,
    qualityBonus: 0.15,
    affectedTasks: ['cooking', 'dishes', 'grocery-list'],
    row: 3,
    col: 0,
  },

  // ── Cleaning Expert (emerald) ──────────────────
  {
    id: 'tidy-bot',
    name: 'Tidy Bot',
    description: 'Knows the basics of tidying up',
    specialization: 'cleaning',
    requiredTaskTypes: ['cleaning', 'sweeping'],
    requiredCount: 5,
    prerequisiteId: null,
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['cleaning', 'sweeping'],
    row: 0,
    col: 0,
  },
  {
    id: 'clean-machine',
    name: 'Clean Machine',
    description: 'Efficient at multi-surface cleaning',
    specialization: 'cleaning',
    requiredTaskTypes: ['cleaning', 'sweeping', 'scrubbing'],
    requiredCount: 15,
    prerequisiteId: 'tidy-bot',
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['cleaning', 'sweeping', 'scrubbing'],
    row: 1,
    col: 0,
  },
  {
    id: 'spotless',
    name: 'Spotless',
    description: 'Deep cleaning specialist',
    specialization: 'cleaning',
    requiredTaskTypes: ['cleaning', 'scrubbing'],
    requiredCount: 25,
    prerequisiteId: 'clean-machine',
    speedBonus: 0.15,
    qualityBonus: 0.10,
    affectedTasks: ['cleaning', 'scrubbing', 'sweeping'],
    row: 2,
    col: 0,
  },
  {
    id: 'vacuum-pro',
    name: 'Vacuum Pro',
    description: 'Vacuuming virtuoso',
    specialization: 'cleaning',
    requiredTaskTypes: ['vacuuming'],
    requiredCount: 20,
    prerequisiteId: 'clean-machine',
    speedBonus: 0.15,
    qualityBonus: 0,
    affectedTasks: ['vacuuming'],
    row: 2,
    col: 1,
  },
  {
    id: 'cleaning-expert',
    name: 'Cleaning Expert',
    description: 'Ultimate cleaning mastery',
    specialization: 'cleaning',
    requiredTaskTypes: ['cleaning', 'sweeping', 'scrubbing', 'vacuuming'],
    requiredCount: 40,
    prerequisiteId: 'spotless',
    speedBonus: 0.20,
    qualityBonus: 0.15,
    affectedTasks: ['cleaning', 'sweeping', 'scrubbing', 'vacuuming'],
    row: 3,
    col: 0,
  },

  // ── Handyman (sky blue) ──────────────────────
  {
    id: 'helper-bot',
    name: 'Helper Bot',
    description: 'Handy around the house',
    specialization: 'handyman',
    requiredTaskTypes: ['organizing', 'bed-making'],
    requiredCount: 5,
    prerequisiteId: null,
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['organizing', 'bed-making'],
    row: 0,
    col: 0,
  },
  {
    id: 'skilled-worker',
    name: 'Skilled Worker',
    description: 'Reliable at household chores',
    specialization: 'handyman',
    requiredTaskTypes: ['organizing', 'bed-making', 'laundry'],
    requiredCount: 15,
    prerequisiteId: 'helper-bot',
    speedBonus: 0.10,
    qualityBonus: 0,
    affectedTasks: ['organizing', 'bed-making', 'laundry'],
    row: 1,
    col: 0,
  },
  {
    id: 'yard-master',
    name: 'Yard Master',
    description: 'Green thumb for outdoor work',
    specialization: 'handyman',
    requiredTaskTypes: ['mowing', 'watering', 'weeding', 'leaf-blowing'],
    requiredCount: 20,
    prerequisiteId: 'skilled-worker',
    speedBonus: 0.15,
    qualityBonus: 0.10,
    affectedTasks: ['mowing', 'watering', 'weeding', 'leaf-blowing'],
    row: 2,
    col: 0,
  },
  {
    id: 'fix-it-all',
    name: 'Fix-It All',
    description: 'Master of laundry and beds',
    specialization: 'handyman',
    requiredTaskTypes: ['laundry', 'bed-making'],
    requiredCount: 20,
    prerequisiteId: 'skilled-worker',
    speedBonus: 0.15,
    qualityBonus: 0,
    affectedTasks: ['laundry', 'bed-making'],
    row: 2,
    col: 1,
  },
  {
    id: 'handyman-pro',
    name: 'Handyman Pro',
    description: 'Jack of all trades, master of many',
    specialization: 'handyman',
    requiredTaskTypes: ['organizing', 'bed-making', 'laundry', 'mowing', 'watering', 'weeding', 'leaf-blowing'],
    requiredCount: 40,
    prerequisiteId: 'yard-master',
    speedBonus: 0.10,
    qualityBonus: 0.10,
    affectedTasks: ['organizing', 'bed-making', 'laundry', 'mowing', 'watering', 'weeding', 'leaf-blowing', 'cleaning', 'vacuuming', 'cooking', 'dishes'],
    row: 3,
    col: 0,
  },
];

export const SPECIALIZATION_META: Record<SkillSpecialization, { name: string; color: string; icon: string }> = {
  chef: { name: 'Chef Mastery', color: '#f59e0b', icon: '🍳' },
  cleaning: { name: 'Cleaning Expert', color: '#10b981', icon: '✨' },
  handyman: { name: 'Handyman', color: '#3b82f6', icon: '🔧' },
};

/** Check if a robot can unlock a skill based on their task counts and current unlocks */
export function canUnlockSkill(
  skill: SkillDefinition,
  unlockedSkills: string[],
  taskCounts: Partial<Record<TaskType, number>>,
): boolean {
  if (unlockedSkills.includes(skill.id)) return false;
  if (skill.prerequisiteId && !unlockedSkills.includes(skill.prerequisiteId)) return false;
  const total = skill.requiredTaskTypes.reduce(
    (sum, tt) => sum + (taskCounts[tt] ?? 0),
    0,
  );
  return total >= skill.requiredCount;
}

/** Get the task count progress toward a skill (current / required) */
export function getSkillProgress(
  skill: SkillDefinition,
  taskCounts: Partial<Record<TaskType, number>>,
): { current: number; required: number } {
  const current = skill.requiredTaskTypes.reduce(
    (sum, tt) => sum + (taskCounts[tt] ?? 0),
    0,
  );
  return { current: Math.min(current, skill.requiredCount), required: skill.requiredCount };
}

/** Calculate combined speed bonus from all unlocked skills for a given task type */
export function getSkillSpeedBonus(
  unlockedSkills: string[],
  taskType: TaskType,
): number {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);
    if (skill && skill.affectedTasks.includes(taskType)) {
      bonus += skill.speedBonus;
    }
  }
  return bonus;
}

/** Calculate combined quality bonus from all unlocked skills for a given task type */
export function getSkillQualityBonus(
  unlockedSkills: string[],
  taskType: TaskType,
): number {
  let bonus = 0;
  for (const skillId of unlockedSkills) {
    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);
    if (skill && skill.affectedTasks.includes(taskType)) {
      bonus += skill.qualityBonus;
    }
  }
  return bonus;
}

/** Get skills for a specific specialization */
export function getSkillsBySpecialization(spec: SkillSpecialization): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter((s) => s.specialization === spec);
}
