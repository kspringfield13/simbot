import { create } from 'zustand';
import { createInitialRoomNeeds, decayRoomNeeds, boostRoomAfterTask } from '../systems/RoomState';
import { getSimPeriod } from '../systems/TimeSystem';
import { createAllRobotStates } from '../config/robots';
import type {
  CameraMode,
  ChatMessage,
  NavigationPoint,
  RobotId,
  RobotInstanceState,
  RobotMood,
  RobotNeeds,
  RobotState,
  RoomId,
  RoomNeedState,
  ScheduledTask,
  SimPeriod,
  Task,
  TaskType,
  VisitorEvent,
  WeatherType,
} from '../types';
import { ROBOT_IDS } from '../types';

export type SimSpeed = 0 | 1 | 10 | 60;

// ── Furniture localStorage persistence ──────────────────────────
const FURNITURE_STORAGE_KEY = 'simbot-furniture-positions';

function loadFurniturePositions(): Record<string, [number, number]> {
  try {
    const stored = localStorage.getItem(FURNITURE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveFurniturePositions(positions: Record<string, [number, number]>) {
  try {
    localStorage.setItem(FURNITURE_STORAGE_KEY, JSON.stringify(positions));
  } catch { /* ignore quota errors */ }
}

// ── Schedule localStorage persistence ──────────────────────────
const SCHEDULE_STORAGE_KEY = 'simbot-scheduled-tasks';

function loadScheduledTasks(): ScheduledTask[] {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveScheduledTasks(tasks: ScheduledTask[]) {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(tasks));
  } catch { /* ignore quota errors */ }
}

interface SimBotStore {
  // Multi-robot state
  robots: Record<RobotId, RobotInstanceState>;
  activeRobotId: RobotId;
  setActiveRobotId: (id: RobotId) => void;

  // Per-robot setters
  setRobotPosition: (robotId: RobotId, position: [number, number, number]) => void;
  setRobotTarget: (robotId: RobotId, target: [number, number, number] | null) => void;
  setRobotState: (robotId: RobotId, state: RobotState) => void;
  setRobotPath: (robotId: RobotId, path: NavigationPoint[]) => void;
  setCurrentPathIndex: (robotId: RobotId, index: number) => void;
  setCurrentAnimation: (robotId: RobotId, animation: TaskType) => void;
  setRobotRotationY: (robotId: RobotId, rotationY: number) => void;
  setRobotThought: (robotId: RobotId, thought: string) => void;
  setRobotMood: (robotId: RobotId, mood: RobotMood) => void;
  updateRobotNeeds: (robotId: RobotId, updates: Partial<RobotNeeds>) => void;
  setRobotBattery: (robotId: RobotId, battery: number) => void;
  setRobotCharging: (robotId: RobotId, isCharging: boolean) => void;

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
  clearQueuedAiTasks: (robotId?: RobotId) => void;
  clearActiveTaskState: (robotId: RobotId) => void;

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

  // Learning system — tracks task completions for speed improvement
  taskExperience: Partial<Record<TaskType, number>>;
  recordTaskCompletion: (taskType: TaskType) => void;

  // Audio
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;

  // Stats
  showStats: boolean;
  setShowStats: (show: boolean) => void;
  totalTasksCompleted: number;
  tasksByType: Partial<Record<TaskType, number>>;
  tasksByRoom: Partial<Record<RoomId, number>>;
  recordStats: (taskType: TaskType, roomId: RoomId) => void;

  // Emoji reactions
  currentEmoji: string | null;
  showEmoji: boolean;
  triggerEmoji: (emoji: string) => void;
  clearEmoji: () => void;

  // Screenshot
  screenshotMode: boolean;
  screenshotData: string | null;
  setScreenshotMode: (mode: boolean) => void;
  setScreenshotData: (data: string | null) => void;

  // Seasonal decorations
  seasonalDecorations: boolean;
  setSeasonalDecorations: (enabled: boolean) => void;

  // Visitor events
  visitorEvent: VisitorEvent | null;
  setVisitorEvent: (event: VisitorEvent | null) => void;
  visitorToast: string | null;
  setVisitorToast: (toast: string | null) => void;

  // Furniture rearrangement
  rearrangeMode: boolean;
  selectedFurnitureId: string | null;
  furniturePositions: Record<string, [number, number]>;
  setRearrangeMode: (mode: boolean) => void;
  selectFurniture: (id: string | null) => void;
  moveFurniture: (id: string, x: number, z: number) => void;
  resetFurnitureLayout: () => void;

  // Weather
  weather: WeatherType;
  setWeather: (weather: WeatherType) => void;

  // Schedule
  scheduledTasks: ScheduledTask[];
  showSchedulePanel: boolean;
  setShowSchedulePanel: (show: boolean) => void;
  addScheduledTask: (task: ScheduledTask) => void;
  removeScheduledTask: (id: string) => void;
  toggleScheduledTask: (id: string) => void;

  // Music
  musicEnabled: boolean;
  musicGenreLabel: string;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicGenreLabel: (label: string) => void;

  // Photo mode
  photoMode: boolean;
  photoFilter: 'normal' | 'warm' | 'cool' | 'noir' | 'dreamy';
  setPhotoMode: (mode: boolean) => void;
  setPhotoFilter: (filter: 'normal' | 'warm' | 'cool' | 'noir' | 'dreamy') => void;
}

const initialSimMinutes = (7 * 60) + 20;

function updateRobot(
  robots: Record<RobotId, RobotInstanceState>,
  robotId: RobotId,
  updates: Partial<RobotInstanceState>,
): Record<RobotId, RobotInstanceState> {
  return {
    ...robots,
    [robotId]: { ...robots[robotId], ...updates },
  };
}

export const useStore = create<SimBotStore>((set) => ({
  // Multi-robot
  robots: createAllRobotStates(),
  activeRobotId: 'sim',
  setActiveRobotId: (id) => set({ activeRobotId: id }),

  // Per-robot setters
  setRobotPosition: (robotId, position) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { position }),
  })),
  setRobotTarget: (robotId, target) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { target }),
  })),
  setRobotState: (robotId, state) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { state }),
  })),
  setRobotPath: (robotId, path) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { path, currentPathIndex: 0 }),
  })),
  setCurrentPathIndex: (robotId, index) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { currentPathIndex: index }),
  })),
  setCurrentAnimation: (robotId, animation) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { currentAnimation: animation }),
  })),
  setRobotRotationY: (robotId, rotationY) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { rotationY }),
  })),
  setRobotThought: (robotId, thought) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { thought }),
  })),
  setRobotMood: (robotId, mood) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { mood }),
  })),
  updateRobotNeeds: (robotId, updates) => set((s) => {
    const current = s.robots[robotId].needs;
    return {
      robots: updateRobot(s.robots, robotId, {
        needs: {
          energy: Math.max(0, Math.min(100, updates.energy ?? current.energy)),
          happiness: Math.max(0, Math.min(100, updates.happiness ?? current.happiness)),
          social: Math.max(0, Math.min(100, updates.social ?? current.social)),
          boredom: Math.max(0, Math.min(100, updates.boredom ?? current.boredom)),
        },
      }),
    };
  }),

  setRobotBattery: (robotId, battery) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { battery: Math.max(0, Math.min(100, battery)) }),
  })),
  setRobotCharging: (robotId, isCharging) => set((s) => ({
    robots: updateRobot(s.robots, robotId, { isCharging }),
  })),

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
    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    // Tick all robots' needs
    const updatedRobots = { ...state.robots };
    for (const id of ROBOT_IDS) {
      const r = updatedRobots[id];
      const n = r.needs;
      const isWorking = r.state === 'working';
      const isIdle = r.state === 'idle';

      // Weather happiness bonus: rain = cozy (+0.01/min), snow = excited (+0.02/min)
      const weatherHappinessBonus = state.weather === 'rainy' ? 0.01 : state.weather === 'snowy' ? 0.02 : 0;

      // Battery drain/charge rates (per sim-minute)
      // Working: -0.12, Walking: -0.06, Idle: -0.01, Charging: +0.5
      const batteryDelta = r.isCharging
        ? deltaSimMinutes * 0.5
        : isWorking ? -deltaSimMinutes * 0.12
        : isIdle ? -deltaSimMinutes * 0.01
        : -deltaSimMinutes * 0.06;

      updatedRobots[id] = {
        ...r,
        battery: clamp(r.battery + batteryDelta),
        needs: {
          energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 : isWorking ? -deltaSimMinutes * 0.08 : -deltaSimMinutes * 0.03)),
          happiness: clamp(n.happiness + (isWorking ? deltaSimMinutes * 0.02 : -deltaSimMinutes * 0.01) + deltaSimMinutes * weatherHappinessBonus),
          social: clamp(n.social - deltaSimMinutes * 0.02),
          boredom: clamp(n.boredom + (isIdle ? deltaSimMinutes * 0.06 : isWorking ? -deltaSimMinutes * 0.05 : -deltaSimMinutes * 0.02)),
        },
      };
    }

    return {
      simMinutes: nextSimMinutes,
      simPeriod: getSimPeriod(nextSimMinutes),
      roomNeeds: decayRoomNeeds(state.roomNeeds, deltaSimMinutes),
      robots: updatedRobots,
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
  clearQueuedAiTasks: (robotId) => set((state) => ({
    tasks: state.tasks.filter((task) => {
      if (task.source !== 'ai' || task.status !== 'queued') return true;
      if (robotId && task.assignedTo !== robotId) return true;
      return false;
    }),
  })),
  clearActiveTaskState: (robotId) => set((state) => ({
    tasks: state.tasks.filter((task) =>
      task.assignedTo !== robotId || task.status === 'completed'
    ),
    robots: updateRobot(state.robots, robotId, {
      path: [],
      currentPathIndex: 0,
      target: null,
      state: 'idle',
      currentAnimation: 'general',
    }),
  })),

  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  isListening: false,
  transcript: '',
  setListening: (listening) => set({ isListening: listening }),
  setTranscript: (transcript) => set({ transcript }),

  demoMode: false,
  setDemoMode: (enabled) => set({ demoMode: enabled }),
  overrideUntilSimMinute: 0,
  setOverrideUntil: (simMinute) => set({ overrideUntilSimMinute: simMinute }),

  // Learning system: robots get faster with practice
  taskExperience: {},
  recordTaskCompletion: (taskType) => set((state) => ({
    taskExperience: {
      ...state.taskExperience,
      [taskType]: (state.taskExperience[taskType] ?? 0) + 1,
    },
  })),

  // Audio
  soundMuted: false,
  setSoundMuted: (muted) => set({ soundMuted: muted }),

  // Stats
  showStats: false,
  setShowStats: (show) => set({ showStats: show }),
  totalTasksCompleted: 0,
  tasksByType: {},
  tasksByRoom: {},
  recordStats: (taskType, roomId) => set((state) => ({
    totalTasksCompleted: state.totalTasksCompleted + 1,
    tasksByType: { ...state.tasksByType, [taskType]: (state.tasksByType[taskType] ?? 0) + 1 },
    tasksByRoom: { ...state.tasksByRoom, [roomId]: (state.tasksByRoom[roomId] ?? 0) + 1 },
  })),

  // Emoji reactions
  currentEmoji: null,
  showEmoji: false,
  triggerEmoji: (emoji) => set({ currentEmoji: emoji, showEmoji: true }),
  clearEmoji: () => set({ currentEmoji: null, showEmoji: false }),

  // Screenshot
  screenshotMode: false,
  screenshotData: null,
  setScreenshotMode: (mode) => set({ screenshotMode: mode }),
  setScreenshotData: (data) => set({ screenshotData: data }),

  // Seasonal decorations
  seasonalDecorations: true,
  setSeasonalDecorations: (enabled) => set({ seasonalDecorations: enabled }),

  // Visitor events
  visitorEvent: null,
  setVisitorEvent: (event) => set({ visitorEvent: event }),
  visitorToast: null,
  setVisitorToast: (toast) => set({ visitorToast: toast }),

  // Furniture rearrangement
  rearrangeMode: false,
  selectedFurnitureId: null,
  furniturePositions: loadFurniturePositions(),
  setRearrangeMode: (mode) => set({ rearrangeMode: mode, selectedFurnitureId: null }),
  selectFurniture: (id) => set({ selectedFurnitureId: id }),
  moveFurniture: (id, x, z) => set((state) => {
    const newPositions = { ...state.furniturePositions, [id]: [x, z] as [number, number] };
    saveFurniturePositions(newPositions);
    return { furniturePositions: newPositions, selectedFurnitureId: null };
  }),
  resetFurnitureLayout: () => {
    saveFurniturePositions({});
    return set({ furniturePositions: {}, selectedFurnitureId: null });
  },

  // Weather
  weather: 'sunny',
  setWeather: (weather) => set({ weather }),

  // Schedule
  scheduledTasks: loadScheduledTasks(),
  showSchedulePanel: false,
  setShowSchedulePanel: (show) => set({ showSchedulePanel: show }),
  addScheduledTask: (task) => set((state) => {
    const next = [...state.scheduledTasks, task];
    saveScheduledTasks(next);
    return { scheduledTasks: next };
  }),
  removeScheduledTask: (id) => set((state) => {
    const next = state.scheduledTasks.filter((t) => t.id !== id);
    saveScheduledTasks(next);
    return { scheduledTasks: next };
  }),
  toggleScheduledTask: (id) => set((state) => {
    const next = state.scheduledTasks.map((t) =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    );
    saveScheduledTasks(next);
    return { scheduledTasks: next };
  }),

  // Music
  musicEnabled: false,
  musicGenreLabel: '',
  setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
  setMusicGenreLabel: (label) => set({ musicGenreLabel: label }),

  // Photo mode
  photoMode: false,
  photoFilter: 'normal',
  setPhotoMode: (mode) => set({ photoMode: mode, ...(mode ? {} : { photoFilter: 'normal' }) }),
  setPhotoFilter: (filter) => set({ photoFilter: filter }),
}));

// Each completion reduces duration by ~5%, capping at 30% faster
export function getTaskSpeedMultiplier(taskType: TaskType): number {
  const count = useStore.getState().taskExperience[taskType] ?? 0;
  return Math.max(0.7, 1 - count * 0.05);
}
