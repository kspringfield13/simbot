import { create } from 'zustand';
import { createInitialRoomNeeds, decayRoomNeeds, boostRoomAfterTask } from '../systems/RoomState';
import { getSimPeriod } from '../systems/TimeSystem';
import type {
  CameraMode,
  ChatMessage,
  NavigationPoint,
  RobotMood,
  RobotState,
  RoomId,
  RoomNeedState,
  SimPeriod,
  Task,
  TaskType,
} from '../types';

export type SimSpeed = 0 | 1 | 2 | 3;

interface SimBotStore {
  // Robot
  robotPosition: [number, number, number];
  robotTarget: [number, number, number] | null;
  robotState: RobotState;
  robotPath: NavigationPoint[];
  currentPathIndex: number;
  currentAnimation: TaskType;
  robotRotationY: number;
  robotThought: string;
  robotMood: RobotMood;
  setRobotPosition: (position: [number, number, number]) => void;
  setRobotTarget: (target: [number, number, number] | null) => void;
  setRobotState: (state: RobotState) => void;
  setRobotPath: (path: NavigationPoint[]) => void;
  setCurrentPathIndex: (index: number) => void;
  setCurrentAnimation: (animation: TaskType) => void;
  setRobotRotationY: (rotationY: number) => void;
  setRobotThought: (thought: string) => void;
  setRobotMood: (mood: RobotMood) => void;

  // Camera
  cameraMode: CameraMode;
  cameraSnapTarget: [number, number, number] | null;
  setCameraMode: (mode: CameraMode) => void;
  cycleCameraMode: () => void;
  requestCameraSnap: (target: [number, number, number]) => void;
  clearCameraSnap: () => void;

  // Sim time
  simMinutes: number;
  simSpeed: SimSpeed;
  simPeriod: SimPeriod;
  setSimSpeed: (speed: SimSpeed) => void;
  advanceTime: (deltaSeconds: number) => void;

  // Rooms
  roomNeeds: Record<RoomId, RoomNeedState>;
  selectedRoomId: RoomId | null;
  setSelectedRoomId: (roomId: RoomId | null) => void;
  applyRoomTaskResult: (roomId: RoomId, taskType: TaskType) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  clearQueuedAiTasks: () => void;
  clearActiveTaskState: () => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;

  // Voice
  isListening: boolean;
  transcript: string;
  setListening: (listening: boolean) => void;
  setTranscript: (transcript: string) => void;

  // Demo and overrides
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  overrideUntilSimMinute: number;
  setOverrideUntil: (simMinute: number) => void;
}

const initialSimMinutes = (7 * 60) + 20;

export const useStore = create<SimBotStore>((set) => ({
  robotPosition: [0, 0, -2],
  robotTarget: null,
  robotState: 'idle',
  robotPath: [],
  currentPathIndex: 0,
  currentAnimation: 'general',
  robotRotationY: 0,
  robotThought: 'Boot complete. Running ambient home scan.',
  robotMood: 'content',
  setRobotPosition: (position) => set({ robotPosition: position }),
  setRobotTarget: (target) => set({ robotTarget: target }),
  setRobotState: (state) => set({ robotState: state }),
  setRobotPath: (path) => set({ robotPath: path, currentPathIndex: 0 }),
  setCurrentPathIndex: (index) => set({ currentPathIndex: index }),
  setCurrentAnimation: (animation) => set({ currentAnimation: animation }),
  setRobotRotationY: (rotationY) => set({ robotRotationY: rotationY }),
  setRobotThought: (thought) => set({ robotThought: thought }),
  setRobotMood: (mood) => set({ robotMood: mood }),

  cameraMode: 'follow',
  cameraSnapTarget: null,
  setCameraMode: (mode) => set({ cameraMode: mode }),
  cycleCameraMode: () => set((state) => {
    const modes: CameraMode[] = ['overview', 'follow', 'pov'];
    const current = modes.indexOf(state.cameraMode);
    return { cameraMode: modes[(current + 1) % modes.length] };
  }),
  requestCameraSnap: (target) => set({ cameraSnapTarget: target }),
  clearCameraSnap: () => set({ cameraSnapTarget: null }),

  simMinutes: initialSimMinutes,
  simSpeed: 1,
  simPeriod: getSimPeriod(initialSimMinutes),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  advanceTime: (deltaSeconds) => set((state) => {
    if (state.simSpeed === 0 || deltaSeconds <= 0) {
      return {};
    }

    const deltaSimMinutes = deltaSeconds * state.simSpeed;
    const nextSimMinutes = state.simMinutes + deltaSimMinutes;

    return {
      simMinutes: nextSimMinutes,
      simPeriod: getSimPeriod(nextSimMinutes),
      roomNeeds: decayRoomNeeds(state.roomNeeds, deltaSimMinutes),
    };
  }),

  roomNeeds: createInitialRoomNeeds(),
  selectedRoomId: null,
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
  applyRoomTaskResult: (roomId, taskType) => set((state) => {
    const current = state.roomNeeds[roomId];
    if (!current) return {};

    return {
      roomNeeds: {
        ...state.roomNeeds,
        [roomId]: {
          ...boostRoomAfterTask(current, taskType),
          lastServicedAt: state.simMinutes,
        },
      },
    };
  }),

  tasks: [],
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task],
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  })),
  clearQueuedAiTasks: () => set((state) => ({
    tasks: state.tasks.filter((task) => !(task.source === 'ai' && task.status === 'queued')),
  })),
  clearActiveTaskState: () => set((state) => ({
    tasks: state.tasks.filter((task) => task.status === 'completed'),
    robotPath: [],
    currentPathIndex: 0,
    robotTarget: null,
    robotState: 'idle',
    currentAnimation: 'general',
  })),

  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  isListening: false,
  transcript: '',
  setListening: (listening) => set({ isListening: listening }),
  setTranscript: (transcript) => set({ transcript }),

  demoMode: false,
  setDemoMode: (enabled) => set({ demoMode: enabled }),
  overrideUntilSimMinute: initialSimMinutes,
  setOverrideUntil: (simMinute) => set({ overrideUntilSimMinute: simMinute }),
}));
