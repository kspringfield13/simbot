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

export interface Task {
  id: string;
  command: string;
  targetRoom: string;
  targetPosition: [number, number, number];
  status: 'pending' | 'walking' | 'working' | 'completed';
  progress: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'robot';
  text: string;
  timestamp: number;
}

export type RobotState = 'idle' | 'walking' | 'working';
