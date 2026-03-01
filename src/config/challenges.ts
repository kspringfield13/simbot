import type { RoomId, TaskType } from '../types';

export interface ChallengeDefinition {
  id: string;
  name: string;
  roomId: RoomId;
  description: string;
  tasks: { taskType: TaskType; command: string }[];
  /** Time thresholds in real seconds for star ratings (3-star, 2-star, 1-star) */
  starThresholds: [number, number, number];
  /** Coin reward per star earned */
  coinReward: number;
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'kitchen-blitz',
    name: 'Kitchen Blitz',
    roomId: 'kitchen',
    description: 'Wash dishes, sweep, and clean the kitchen before time runs out!',
    tasks: [
      { taskType: 'dishes', command: 'wash dishes' },
      { taskType: 'sweeping', command: 'sweep kitchen' },
      { taskType: 'cleaning', command: 'clean kitchen' },
    ],
    starThresholds: [60, 90, 120],
    coinReward: 15,
  },
  {
    id: 'bedroom-sprint',
    name: 'Bedroom Sprint',
    roomId: 'bedroom',
    description: 'Make the bed, organize the desk, and vacuum!',
    tasks: [
      { taskType: 'bed-making', command: 'make bed' },
      { taskType: 'organizing', command: 'organize desk' },
      { taskType: 'vacuuming', command: 'vacuum bedroom' },
    ],
    starThresholds: [60, 90, 120],
    coinReward: 15,
  },
  {
    id: 'living-room-rush',
    name: 'Living Room Rush',
    roomId: 'living-room',
    description: 'Vacuum and tidy the living room at top speed!',
    tasks: [
      { taskType: 'vacuuming', command: 'vacuum living room' },
      { taskType: 'cleaning', command: 'clean living room' },
    ],
    starThresholds: [45, 65, 90],
    coinReward: 10,
  },
  {
    id: 'bathroom-blitz',
    name: 'Bathroom Blitz',
    roomId: 'bathroom',
    description: 'Scrub the bathroom until it sparkles!',
    tasks: [
      { taskType: 'scrubbing', command: 'scrub bathroom' },
      { taskType: 'cleaning', command: 'clean bathroom' },
    ],
    starThresholds: [45, 65, 90],
    coinReward: 10,
  },
  {
    id: 'laundry-dash',
    name: 'Laundry Dash',
    roomId: 'laundry',
    description: 'Sort and fold all the laundry!',
    tasks: [
      { taskType: 'laundry', command: 'do laundry' },
      { taskType: 'organizing', command: 'organize laundry' },
    ],
    starThresholds: [40, 60, 80],
    coinReward: 10,
  },
  {
    id: 'yard-cleanup',
    name: 'Yard Cleanup',
    roomId: 'yard',
    description: 'Mow, weed, and water the garden!',
    tasks: [
      { taskType: 'mowing', command: 'mow lawn' },
      { taskType: 'weeding', command: 'pull weeds' },
      { taskType: 'watering', command: 'water plants' },
    ],
    starThresholds: [70, 100, 130],
    coinReward: 20,
  },
  {
    id: 'whole-house',
    name: 'Whole House Hustle',
    roomId: 'living-room',
    description: 'The ultimate challenge — clean every room!',
    tasks: [
      { taskType: 'dishes', command: 'wash dishes' },
      { taskType: 'vacuuming', command: 'vacuum living room' },
      { taskType: 'bed-making', command: 'make bed' },
      { taskType: 'scrubbing', command: 'scrub bathroom' },
      { taskType: 'laundry', command: 'do laundry' },
    ],
    starThresholds: [120, 180, 240],
    coinReward: 30,
  },
];

export function getChallengesForRoom(roomId: RoomId): ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.roomId === roomId);
}

export function getStarsForTime(challenge: ChallengeDefinition, timeSeconds: number): 1 | 2 | 3 {
  if (timeSeconds <= challenge.starThresholds[0]) return 3;
  if (timeSeconds <= challenge.starThresholds[1]) return 2;
  return 1;
}

// ── Best times localStorage ──────────────────────────

const BEST_TIMES_KEY = 'simbot-challenge-best-times';

export interface BestTime {
  challengeId: string;
  timeSeconds: number;
  stars: number;
  completedAt: number;
}

export function loadBestTimes(): Record<string, BestTime> {
  try {
    const stored = localStorage.getItem(BEST_TIMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveBestTime(best: BestTime) {
  try {
    const all = loadBestTimes();
    const existing = all[best.challengeId];
    if (!existing || best.timeSeconds < existing.timeSeconds) {
      all[best.challengeId] = best;
      localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(all));
    }
  } catch { /* ignore quota errors */ }
}
