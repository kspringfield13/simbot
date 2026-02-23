export interface Room {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number];
  color: string;
  furniture: Furniture[];
}

export interface Furniture {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  interactable?: boolean;
}

export type TaskType =
  | 'cleaning'
  | 'vacuuming'
  | 'dishes'
  | 'laundry'
  | 'organizing'
  | 'cooking'
  | 'bed-making'
  | 'scrubbing'
  | 'sweeping'
  | 'grocery-list'
  | 'general';

export interface Task {
  id: string;
  command: string;
  targetRoom: string;
  targetPosition: [number, number, number];
  status: 'pending' | 'walking' | 'working' | 'completed';
  progress: number;
  description: string;
  taskType: TaskType;
  workDuration: number; // seconds
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'robot';
  text: string;
  timestamp: number;
}

export type RobotState = 'idle' | 'walking' | 'working';
export type AnimationType = TaskType;
