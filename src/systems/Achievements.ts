import type { RoomId, TaskType } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalTasksCompleted: number;
  tasksByType: Partial<Record<TaskType, number>>;
  tasksByRoom: Partial<Record<RoomId, number>>;
  simMinutes: number;
}

export const achievements: Achievement[] = [
  {
    id: 'first-task',
    title: 'First Steps',
    description: 'Complete your first task',
    emoji: '🎯',
    check: (s) => s.totalTasksCompleted >= 1,
  },
  {
    id: 'ten-tasks',
    title: 'Getting Busy',
    description: 'Complete 10 tasks',
    emoji: '⚡',
    check: (s) => s.totalTasksCompleted >= 10,
  },
  {
    id: 'twenty-five-tasks',
    title: 'Workaholic',
    description: 'Complete 25 tasks',
    emoji: '🔥',
    check: (s) => s.totalTasksCompleted >= 25,
  },
  {
    id: 'fifty-tasks',
    title: 'Unstoppable',
    description: 'Complete 50 tasks',
    emoji: '💎',
    check: (s) => s.totalTasksCompleted >= 50,
  },
  {
    id: 'all-rooms',
    title: 'Full Coverage',
    description: 'Clean every room at least once',
    emoji: '🏠',
    check: (s) => {
      const allRooms: RoomId[] = ['living-room', 'kitchen', 'hallway', 'laundry', 'bedroom', 'bathroom'];
      return allRooms.every((r) => (s.tasksByRoom[r] ?? 0) >= 1);
    },
  },
  {
    id: 'kitchen-master',
    title: 'Kitchen Master',
    description: 'Complete 10 kitchen tasks',
    emoji: '👨‍🍳',
    check: (s) => (s.tasksByRoom['kitchen'] ?? 0) >= 10,
  },
  {
    id: 'dish-duty',
    title: 'Dish Duty',
    description: 'Do dishes 5 times',
    emoji: '🍽️',
    check: (s) => (s.tasksByType['dishes'] ?? 0) >= 5,
  },
  {
    id: 'clean-freak',
    title: 'Clean Freak',
    description: 'Scrub 5 times',
    emoji: '🧽',
    check: (s) => (s.tasksByType['scrubbing'] ?? 0) >= 5,
  },
  {
    id: 'marathon',
    title: 'Marathon Day',
    description: 'Reach 24 sim hours (1440 minutes)',
    emoji: '🕐',
    check: (s) => s.simMinutes >= 1440,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 5 tasks before noon',
    emoji: '🌅',
    check: (s) => s.totalTasksCompleted >= 5 && s.simMinutes < 720,
  },
];

export function getUnlockedAchievements(stats: AchievementStats): Achievement[] {
  return achievements.filter((a) => a.check(stats));
}
