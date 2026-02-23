import { create } from 'zustand';
import type { Task, ChatMessage, RobotState, TaskType } from '../types';

export type CameraMode = 'overview' | 'third-person' | 'first-person';

interface SimBotStore {
  // Robot
  robotPosition: [number, number, number];
  robotTarget: [number, number, number] | null;
  robotState: RobotState;
  robotPath: [number, number, number][];
  currentPathIndex: number;
  currentAnimation: TaskType;
  robotRotationY: number;
  setRobotPosition: (pos: [number, number, number]) => void;
  setRobotTarget: (pos: [number, number, number] | null) => void;
  setRobotState: (state: RobotState) => void;
  setRobotPath: (path: [number, number, number][]) => void;
  setCurrentPathIndex: (i: number) => void;
  setCurrentAnimation: (a: TaskType) => void;
  setRobotRotationY: (r: number) => void;

  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  cycleCameraMode: () => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  // Voice
  isListening: boolean;
  setListening: (v: boolean) => void;
  transcript: string;
  setTranscript: (t: string) => void;

  // Demo
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
}

export const useStore = create<SimBotStore>((set) => ({
  robotPosition: [0, 0, 1], // start in hallway
  robotTarget: null,
  robotState: 'idle',
  robotPath: [],
  currentPathIndex: 0,
  currentAnimation: 'general',
  robotRotationY: 0,
  setRobotPosition: (pos) => set({ robotPosition: pos }),
  setRobotTarget: (pos) => set({ robotTarget: pos }),
  setRobotState: (state) => set({ robotState: state }),
  setRobotPath: (path) => set({ robotPath: path, currentPathIndex: 0 }),
  setCurrentPathIndex: (i) => set({ currentPathIndex: i }),
  setCurrentAnimation: (a) => set({ currentAnimation: a }),
  setRobotRotationY: (r) => set({ robotRotationY: r }),

  // Camera
  cameraMode: 'overview',
  setCameraMode: (mode) => set({ cameraMode: mode }),
  cycleCameraMode: () => set((s) => {
    const modes: CameraMode[] = ['overview', 'third-person', 'first-person'];
    const idx = modes.indexOf(s.cameraMode);
    return { cameraMode: modes[(idx + 1) % modes.length] };
  }),

  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  isListening: false,
  setListening: (v) => set({ isListening: v }),
  transcript: '',
  setTranscript: (t) => set({ transcript: t }),

  demoMode: false,
  setDemoMode: (v) => set({ demoMode: v }),
}));
