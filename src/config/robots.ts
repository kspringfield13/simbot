import type { RobotConfig, RobotId, RobotInstanceState } from '../types';

export const ROBOT_CONFIGS: Record<RobotId, RobotConfig> = {
  sim: {
    id: 'sim',
    name: 'Sim',
    color: '#1a8cff',
    startPosition: [0, 0, -2],
    favoriteRoom: 'living-room',
    preferredRooms: ['living-room', 'hallway', 'kitchen'],
    curiosity: 0.8,
    warmth: 0.9,
    playfulness: 0.7,
    diligence: 0.75,
    sensitivity: 0.85,
    description: 'General home assistant',
  },
  chef: {
    id: 'chef',
    name: 'Chef',
    color: '#f59e0b',
    startPosition: [8, 0, -12],
    favoriteRoom: 'kitchen',
    preferredRooms: ['kitchen', 'living-room'],
    curiosity: 0.5,
    warmth: 0.8,
    playfulness: 0.6,
    diligence: 0.9,
    sensitivity: 0.6,
    description: 'Kitchen specialist',
  },
  sparkle: {
    id: 'sparkle',
    name: 'Sparkle',
    color: '#2dd4bf',
    startPosition: [8, 0, 8],
    favoriteRoom: 'bathroom',
    preferredRooms: ['bathroom', 'bedroom', 'laundry'],
    curiosity: 0.6,
    warmth: 0.7,
    playfulness: 0.5,
    diligence: 0.85,
    sensitivity: 0.9,
    description: 'Bathroom & bedroom specialist',
  },
};

export function createInitialRobotState(config: RobotConfig): RobotInstanceState {
  return {
    position: [...config.startPosition],
    target: null,
    state: 'idle',
    path: [],
    currentPathIndex: 0,
    currentAnimation: 'general',
    rotationY: 0,
    thought: `${config.name} online. Scanning home.`,
    mood: 'content',
    needs: { energy: 85, happiness: 70, social: 50, boredom: 10 },
  };
}

export function createAllRobotStates(): Record<RobotId, RobotInstanceState> {
  return {
    sim: createInitialRobotState(ROBOT_CONFIGS.sim),
    chef: createInitialRobotState(ROBOT_CONFIGS.chef),
    sparkle: createInitialRobotState(ROBOT_CONFIGS.sparkle),
  };
}
