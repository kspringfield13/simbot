import type { TaskType, RobotId } from '../types';

export interface StoryObjective {
  id: string;
  description: string;
  type: 'tasks' | 'emergencies' | 'upgrades' | 'coins' | 'rooms' | 'time' | 'robots';
  target: number;
  taskTypes?: TaskType[];
  robotIds?: RobotId[];
}

export interface StoryChapter {
  id: string;
  number: number;
  title: string;
  emoji: string;
  narrativeIntro: string;
  narrativeOutro: string;
  objectives: StoryObjective[];
  reward: number;
  unlockRequirement?: string; // chapter id that must be completed first
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'ch1-awakening',
    number: 1,
    title: 'The Awakening',
    emoji: '🤖',
    narrativeIntro:
      'A soft hum fills the room as Sim\'s optical sensors flicker to life for the first time. The house is quiet — dust lingers on every surface, dishes pile in the sink, and the garden has been neglected for months. The previous owners left in a hurry, and now it\'s up to Sim to restore this house to its former glory. But first… one room at a time.',
    narrativeOutro:
      'The living room gleams under Sim\'s careful attention. For the first time, the house feels alive again. Sim pauses, sensors detecting a faint signal from the kitchen — there\'s more work to be done, but something tells Sim this is just the beginning of a much bigger journey.',
    objectives: [
      { id: 'ch1-obj1', description: 'Complete 5 cleaning tasks', type: 'tasks', target: 5, taskTypes: ['cleaning', 'vacuuming', 'scrubbing'] },
      { id: 'ch1-obj2', description: 'Complete 3 kitchen tasks', type: 'tasks', target: 3, taskTypes: ['dishes', 'cooking'] },
      { id: 'ch1-obj3', description: 'Earn 50 coins', type: 'coins', target: 50 },
    ],
    reward: 75,
  },
  {
    id: 'ch2-rising-storm',
    number: 2,
    title: 'The Rising Storm',
    emoji: '⛈️',
    narrativeIntro:
      'Dark clouds gather on the horizon. The weather system warns of incoming storms, and the house\'s old pipes are groaning under pressure. Sim receives an urgent memo from the Home Management System: "Multiple systems critical. Immediate action required." The robots must work together to keep the house running through the chaos.',
    narrativeOutro:
      'The storm passes, leaving the house battered but standing. Sim surveys the damage — a few leaky pipes, some scattered debris — but nothing that can\'t be fixed. More importantly, Sim has learned that emergencies don\'t wait for perfect conditions. Being ready is everything.',
    objectives: [
      { id: 'ch2-obj1', description: 'Handle 3 emergency events', type: 'emergencies', target: 3 },
      { id: 'ch2-obj2', description: 'Complete 8 tasks total', type: 'tasks', target: 8 },
      { id: 'ch2-obj3', description: 'Keep all robots above 30% battery', type: 'robots', target: 30 },
    ],
    reward: 100,
    unlockRequirement: 'ch1-awakening',
  },
  {
    id: 'ch3-growing-pains',
    number: 3,
    title: 'Growing Pains',
    emoji: '🌱',
    narrativeIntro:
      'Spring arrives and with it, new possibilities. The garden is calling — weeds have overtaken the flower beds, and the lawn is a wilderness. But Sim has bigger dreams: upgrading the house with smart devices and unlocking new capabilities. The Home Management System hints at a shop with powerful upgrades. Time to invest in the future.',
    narrativeOutro:
      'The garden blooms with new life, and the house hums with upgraded systems. Sim feels… different. Stronger. The upgrades aren\'t just tools — they\'re extensions of what Sim can become. A notification chimes: "New robot units available for deployment." The household is growing.',
    objectives: [
      { id: 'ch3-obj1', description: 'Complete 5 garden tasks', type: 'tasks', target: 5, taskTypes: ['watering', 'weeding', 'mowing'] },
      { id: 'ch3-obj2', description: 'Purchase 2 upgrades from the shop', type: 'upgrades', target: 2 },
      { id: 'ch3-obj3', description: 'Earn 150 coins', type: 'coins', target: 150 },
    ],
    reward: 125,
    unlockRequirement: 'ch2-rising-storm',
  },
  {
    id: 'ch4-full-house',
    number: 4,
    title: 'Full House',
    emoji: '🏠',
    narrativeIntro:
      'The house has never been busier. With multiple robots now online, coordination becomes the real challenge. Chef specializes in the kitchen, Sparkle takes pride in spotless rooms, and Sim oversees it all. But managing a team isn\'t easy — scheduling conflicts arise, batteries drain at the worst moments, and everyone has their own personality quirks to navigate.',
    narrativeOutro:
      'Like a well-oiled machine, the robots have found their rhythm. Each one knows their strengths, and together they accomplish what none could alone. Sim feels a warm glow in their circuits — is this what pride feels like? The house has become a home, and the robots have become a family.',
    objectives: [
      { id: 'ch4-obj1', description: 'Complete 15 tasks across all robots', type: 'tasks', target: 15 },
      { id: 'ch4-obj2', description: 'Use all 3 robots for tasks', type: 'robots', target: 3 },
      { id: 'ch4-obj3', description: 'Earn 300 coins total', type: 'coins', target: 300 },
      { id: 'ch4-obj4', description: 'Purchase 4 upgrades total', type: 'upgrades', target: 4 },
    ],
    reward: 150,
    unlockRequirement: 'ch3-growing-pains',
  },
  {
    id: 'ch5-masterbot',
    number: 5,
    title: 'The Master Bot',
    emoji: '👑',
    narrativeIntro:
      'A golden notification appears on every screen in the house: "MASTER BOT CERTIFICATION — Final Assessment." The Home Management System has been watching, recording, analyzing. Now comes the ultimate test. To earn the legendary Master Bot title, every system must run at peak performance. Every room spotless. Every robot at their best. This is what all the training has been leading to.',
    narrativeOutro:
      'The house shines from top to bottom. Every surface gleams, every system hums in perfect harmony. A golden badge appears on Sim\'s display: "MASTER BOT CERTIFIED." But as Sim looks out at the perfect house, a new thought forms — mastery isn\'t the end. It\'s just the beginning of a new chapter. The adventure continues…',
    objectives: [
      { id: 'ch5-obj1', description: 'Complete 25 tasks total', type: 'tasks', target: 25 },
      { id: 'ch5-obj2', description: 'Handle 5 emergency events', type: 'emergencies', target: 5 },
      { id: 'ch5-obj3', description: 'Earn 500 coins total', type: 'coins', target: 500 },
      { id: 'ch5-obj4', description: 'Purchase 6 upgrades total', type: 'upgrades', target: 6 },
    ],
    reward: 250,
    unlockRequirement: 'ch4-full-house',
  },
];
