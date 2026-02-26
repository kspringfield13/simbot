export type RoomId =
  | 'living-room'
  | 'kitchen'
  | 'hallway'
  | 'laundry'
  | 'bedroom'
  | 'bathroom';

export interface Room {
  id: RoomId;
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

export interface Wall {
  start: [number, number];
  end: [number, number];
  height: number;
  thickness: number;
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

export type TaskStatus = 'queued' | 'walking' | 'working' | 'completed';
export type TaskSource = 'user' | 'ai' | 'demo';

export interface Task {
  id: string;
  command: string;
  source: TaskSource;
  targetRoom: RoomId;
  targetPosition: [number, number, number];
  status: TaskStatus;
  progress: number;
  description: string;
  taskType: TaskType;
  workDuration: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'robot';
  text: string;
  timestamp: number;
}

export type RobotState = 'idle' | 'walking' | 'working';
export type RobotMood = 'content' | 'focused' | 'curious' | 'routine' | 'tired' | 'lonely' | 'bored' | 'happy';
export type RobotTheme = 'blue' | 'red' | 'green' | 'gold';

export interface RobotNeeds {
  energy: number;     // 0-100: depletes with tasks, recharges when idle/charging
  happiness: number;  // 0-100: increases with variety, social, completing tasks
  social: number;     // 0-100: increases with user interaction, decays over time
  boredom: number;    // 0-100: increases when idle too long, decreases with tasks
}
export type CameraMode = 'overview' | 'follow' | 'pov';
export type SimPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface RoomNeedState {
  cleanliness: number;
  tidiness: number;
  routine: number;
  decayCleanliness: number;
  decayTidiness: number;
  lastServicedAt: number;
}

export interface NavigationPoint {
  id: string;
  position: [number, number, number];
  pauseAtDoorway?: boolean;
}

export interface TaskTarget {
  roomId: RoomId;
  position: [number, number, number];
  description: string;
  taskType: TaskType;
  workDuration: number;
  response: string;
  thought: string;
}
