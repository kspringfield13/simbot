import { create } from 'zustand';
import type { Task, ChatMessage, RobotState } from '../types';

interface SimBotStore {
  // Robot
  robotPosition: [number, number, number];
  robotTarget: [number, number, number] | null;
  robotState: RobotState;
  setRobotPosition: (pos: [number, number, number]) => void;
  setRobotTarget: (pos: [number, number, number] | null) => void;
  setRobotState: (state: RobotState) => void;

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
  robotPosition: [0, 0, 0],
  robotTarget: null,
  robotState: 'idle',
  setRobotPosition: (pos) => set({ robotPosition: pos }),
  setRobotTarget: (pos) => set({ robotTarget: pos }),
  setRobotState: (state) => set({ robotState: state }),

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
