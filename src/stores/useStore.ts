import { create } from 'zustand';
import { createInitialRoomNeeds, decayRoomNeeds, boostRoomAfterTask } from '../systems/RoomState';
import { getSimPeriod } from '../systems/TimeSystem';
import { createAllRobotStates } from '../config/robots';
import { DEFAULT_ACTIVE_WALLS } from '../utils/homeLayout';
import { getBatteryDrainMultiplier, getEnergyMultiplier } from '../config/shop';
import type { CustomRobot } from '../config/crafting';
import { getDeployedRobotBonuses } from '../config/crafting';
import { loadFloorPlanId, saveFloorPlanId } from '../config/floorPlans';
import { getComfortMultiplier } from '../config/devices';
import type { RoomDecoration } from '../config/decorations';
import {
  createSessionStats,
  recordRobotTask,
  recordCleanlinessReading,
  saveSession,
  loadLeaderboard,
  type LeaderboardData,
  type RobotSessionStats,
} from '../systems/Leaderboard';
import {
  loadPersonalities,
  savePersonalities,
  recordPersonalityTask,
  recordRoomTime,
} from '../systems/Personality';
import type {
  ActiveChat,
  CameraMode,
  ChatMessage,
  DeviceState,
  DiaryEntry,
  FriendshipPair,
  HomeEvent,
  HomeEventHistoryEntry,
  NavigationPoint,
  Room,
  RobotId,
  RobotInstanceState,
  RobotMood,
  RobotNeeds,
  RobotPersonalityData,
  RobotState,
  RoomId,
  RoomNeedState,
  ScheduledTask,
  Season,
  SimPeriod,
  Task,
  TaskType,
  TimelapseEvent,
  TimelapsePlaybackState,
  VisitorEvent,
  WeatherType,
} from '../types';
import { ROBOT_IDS } from '../types';
import { getSeasonForDay } from '../config/seasons';
import { DEVICES } from '../config/devices';

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

// ── Room layout localStorage persistence ──────────────────────────
const ROOM_LAYOUT_KEY = 'simbot-room-layout';

interface RoomLayoutData {
  overrides: Record<string, { name?: string; color?: string; position?: [number, number, number]; size?: [number, number] }>;
  addedRooms: Room[];
  deletedRoomIds: string[];
}

function loadRoomLayout(): RoomLayoutData {
  try {
    const stored = localStorage.getItem(ROOM_LAYOUT_KEY);
    return stored ? JSON.parse(stored) : { overrides: {}, addedRooms: [], deletedRoomIds: [] };
  } catch {
    return { overrides: {}, addedRooms: [], deletedRoomIds: [] };
  }
}

function saveRoomLayout(data: RoomLayoutData) {
  try {
    localStorage.setItem(ROOM_LAYOUT_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Wall editor localStorage persistence ──────────────────────────
const WALL_EDITOR_KEY = 'simbot-custom-walls';

function loadCustomWalls(): string[] | null {
  try {
    const stored = localStorage.getItem(WALL_EDITOR_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveCustomWalls(w: string[] | null) {
  try {
    if (w === null) localStorage.removeItem(WALL_EDITOR_KEY);
    else localStorage.setItem(WALL_EDITOR_KEY, JSON.stringify(w));
  } catch { /* ignore quota errors */ }
}

// ── Shop localStorage persistence ──────────────────────────
const SHOP_STORAGE_KEY = 'simbot-shop';

interface ShopData {
  coins: number;
  purchasedUpgrades: string[];
  robotColors: Partial<Record<RobotId, string>>;
}

function loadShopData(): ShopData {
  try {
    const stored = localStorage.getItem(SHOP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { coins: 0, purchasedUpgrades: [], robotColors: {} };
  } catch {
    return { coins: 0, purchasedUpgrades: [], robotColors: {} };
  }
}

function saveShopData(data: ShopData) {
  try {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Crafting localStorage persistence ──────────────────────────
const CRAFTING_STORAGE_KEY = 'simbot-crafting';

interface CraftingData {
  ownedParts: string[];
  customRobots: CustomRobot[];
}

function loadCraftingData(): CraftingData {
  try {
    const stored = localStorage.getItem(CRAFTING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { ownedParts: [], customRobots: [] };
  } catch {
    return { ownedParts: [], customRobots: [] };
  }
}

function saveCraftingData(data: CraftingData) {
  try {
    localStorage.setItem(CRAFTING_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Device localStorage persistence ──────────────────────────
const DEVICE_STORAGE_KEY = 'simbot-devices';

function createInitialDeviceStates(): Record<string, DeviceState> {
  const states: Record<string, DeviceState> = {};
  for (const d of DEVICES) {
    if (d.type === 'thermostat') {
      states[d.id] = { on: true, temperature: 72 };
    } else {
      states[d.id] = { on: false };
    }
  }
  return states;
}

function loadDeviceStates(): Record<string, DeviceState> {
  try {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to pick up newly added devices
      return { ...createInitialDeviceStates(), ...parsed };
    }
    return createInitialDeviceStates();
  } catch {
    return createInitialDeviceStates();
  }
}

function saveDeviceStates(states: Record<string, DeviceState>) {
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(states));
  } catch { /* ignore quota errors */ }
}

// ── Friendship localStorage persistence ──────────────────────────
const FRIENDSHIP_STORAGE_KEY = 'simbot-friendships';

function createInitialFriendships(): Record<string, FriendshipPair> {
  return {
    'chef-sim': { key: 'chef-sim', robotA: 'chef', robotB: 'sim', level: 10, totalChats: 0, lastChatAt: 0 },
    'chef-sparkle': { key: 'chef-sparkle', robotA: 'chef', robotB: 'sparkle', level: 10, totalChats: 0, lastChatAt: 0 },
    'sim-sparkle': { key: 'sim-sparkle', robotA: 'sim', robotB: 'sparkle', level: 10, totalChats: 0, lastChatAt: 0 },
  };
}

function loadFriendships(): Record<string, FriendshipPair> {
  try {
    const stored = localStorage.getItem(FRIENDSHIP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createInitialFriendships(), ...parsed };
    }
    return createInitialFriendships();
  } catch {
    return createInitialFriendships();
  }
}

function saveFriendships(data: Record<string, FriendshipPair>) {
  try {
    localStorage.setItem(FRIENDSHIP_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Room decoration localStorage persistence ──────────────────────────
const DECORATION_STORAGE_KEY = 'simbot-room-decorations';

function loadRoomDecorations(): Record<string, RoomDecoration> {
  try {
    const stored = localStorage.getItem(DECORATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveRoomDecorations(data: Record<string, RoomDecoration>) {
  try {
    localStorage.setItem(DECORATION_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

const initialShopData = loadShopData();
const initialCraftingData = loadCraftingData();

const initialRoomLayout = loadRoomLayout();

export type NotificationType = 'info' | 'warning' | 'success' | 'achievement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: number;
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

  // Room/wall editor
  editMode: boolean;
  editSelectedRoomId: string | null;
  setEditMode: (mode: boolean) => void;
  setEditSelectedRoomId: (id: string | null) => void;
  customWalls: string[] | null;
  toggleWall: (key: string) => void;
  resetWalls: () => void;

  // Room layout editor
  roomLayout: RoomLayoutData;
  updateRoomBounds: (id: string, position: [number, number, number], size: [number, number]) => void;
  addNewRoom: () => void;
  deleteEditRoom: (id: string) => void;
  resetRoomLayout: () => void;

  // Spectator mode
  isSpectating: boolean;
  spectatorLive: boolean;
  spectatorViewerCount: number;

  // Shop / economy
  coins: number;
  purchasedUpgrades: string[];
  robotColors: Partial<Record<RobotId, string>>;
  showShop: boolean;
  setShowShop: (show: boolean) => void;
  addCoins: (amount: number) => void;
  purchaseUpgrade: (id: string, cost: number) => boolean;
  purchaseColor: (robotId: RobotId, colorHex: string, cost: number) => boolean;

  // Smart home devices
  deviceStates: Record<string, DeviceState>;
  showDevicePanel: boolean;
  setShowDevicePanel: (show: boolean) => void;
  toggleDevice: (deviceId: string) => void;
  setDeviceTemperature: (deviceId: string, temp: number) => void;
  setDeviceOn: (deviceId: string, on: boolean) => void;

  // Seasonal events
  currentSeason: Season;
  seasonToast: string | null;
  setCurrentSeason: (season: Season) => void;
  setSeasonToast: (toast: string | null) => void;

  // Diary
  diaryEntries: Record<RobotId, DiaryEntry[]>;
  diaryDay: number; // sim day when diary was last active (for reset)
  showDiary: boolean;
  setShowDiary: (show: boolean) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  resetDiary: (day: number) => void;

  // Floor plan presets
  floorPlanId: string;
  showFloorPlanSelector: boolean;
  setShowFloorPlanSelector: (show: boolean) => void;
  setFloorPlan: (id: string) => void;

  // Leaderboard
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  sessionStats: Record<RobotId, RobotSessionStats>;
  leaderboardData: LeaderboardData;
  recordRobotTaskCompletion: (robotId: RobotId, taskType: TaskType, workDuration: number) => void;
  sampleCleanliness: (avgCleanliness: number) => void;
  flushSession: (simMinutesPlayed: number) => void;

  // Personality
  showPersonality: boolean;
  setShowPersonality: (show: boolean) => void;
  personalities: Record<RobotId, RobotPersonalityData>;
  recordPersonalityTaskCompletion: (robotId: RobotId, taskType: TaskType) => void;
  recordPersonalityRoomTime: (robotId: RobotId, roomId: RoomId, minutes: number) => void;

  // Home events
  activeHomeEvent: HomeEvent | null;
  homeEventHistory: HomeEventHistoryEntry[];
  setActiveHomeEvent: (event: HomeEvent | null) => void;
  updateHomeEvent: (updates: Partial<HomeEvent>) => void;
  resolveHomeEvent: (entry: HomeEventHistoryEntry) => void;

  // Robot social / friendships
  friendships: Record<string, FriendshipPair>;
  activeChats: ActiveChat[];
  showSocial: boolean;
  setShowSocial: (show: boolean) => void;
  updateFriendship: (key: string, levelDelta: number, simMinutes: number) => void;
  startChat: (chat: ActiveChat) => void;
  advanceChatLine: (robotA: RobotId, robotB: RobotId) => void;
  endChat: (robotA: RobotId, robotB: RobotId) => void;

  // Crafting workshop
  showCrafting: boolean;
  setShowCrafting: (show: boolean) => void;
  ownedParts: string[];
  customRobots: CustomRobot[];
  purchasePart: (partId: string, cost: number) => boolean;
  buildCustomRobot: (name: string, headId: string, bodyId: string, armsId: string, legsId: string) => void;
  deployCustomRobot: (robotId: string) => void;
  deleteCustomRobot: (robotId: string) => void;

  // Timelapse replay
  timelapseEvents: TimelapseEvent[];
  timelapsePlayback: TimelapsePlaybackState | null;
  showTimelapse: boolean;
  setShowTimelapse: (show: boolean) => void;
  pushTimelapseEvent: (event: TimelapseEvent) => void;
  startTimelapsePlayback: () => void;
  stopTimelapsePlayback: () => void;
  setTimelapsePlaybackPlaying: (playing: boolean) => void;
  setTimelapsePlaybackSpeed: (speed: 30 | 60 | 120) => void;
  setTimelapsePlaybackTime: (simMinutes: number) => void;

  // Task timeline
  showTimeline: boolean;
  setShowTimeline: (show: boolean) => void;

  // Room decoration
  decorateMode: boolean;
  decorateSelectedRoomId: string | null;
  roomDecorations: Record<string, RoomDecoration>;
  setDecorateMode: (mode: boolean) => void;
  setDecorateSelectedRoomId: (id: string | null) => void;
  setRoomDecoration: (roomId: string, decoration: Partial<RoomDecoration>) => void;
  resetRoomDecorations: () => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
}

const initialSimMinutes = (7 * 60) + 20;
const initialDay = Math.floor(initialSimMinutes / 1440) + 1;

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
    const craftBonuses = getDeployedRobotBonuses(state.customRobots);
    for (const id of ROBOT_IDS) {
      const r = updatedRobots[id];
      const n = r.needs;
      const isWorking = r.state === 'working';
      const isIdle = r.state === 'idle';

      // Weather happiness bonus: rain = cozy (+0.01/min), snow = excited (+0.02/min)
      const weatherHappinessBonus = state.weather === 'rainy' ? 0.01 : state.weather === 'snowy' ? 0.02 : 0;

      // Battery drain/charge rates (per sim-minute), modified by shop upgrades + crafting
      const battDrainMult = getBatteryDrainMultiplier(state.purchasedUpgrades, craftBonuses.batteryBonus);
      const batteryDelta = r.isCharging
        ? deltaSimMinutes * 0.5
        : isWorking ? -deltaSimMinutes * 0.12 * battDrainMult
        : isIdle ? -deltaSimMinutes * 0.01 * battDrainMult
        : -deltaSimMinutes * 0.06 * battDrainMult;

      const energyMult = getEnergyMultiplier(state.purchasedUpgrades, craftBonuses.efficiencyBonus);

      // Thermostat comfort affects happiness
      const thermoDevice = state.deviceStates['thermostat'];
      const thermoTemp = thermoDevice?.on ? (thermoDevice.temperature ?? 72) : 72;
      const comfortMult = getComfortMultiplier(thermoTemp);
      const comfortPenalty = comfortMult < 1 ? -deltaSimMinutes * 0.005 * (1 - comfortMult) : 0;

      updatedRobots[id] = {
        ...r,
        battery: clamp(r.battery + batteryDelta),
        needs: {
          energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 : isWorking ? -deltaSimMinutes * 0.08 * energyMult : -deltaSimMinutes * 0.03)),
          happiness: clamp(n.happiness + (isWorking ? deltaSimMinutes * 0.02 : -deltaSimMinutes * 0.01) + deltaSimMinutes * weatherHappinessBonus + comfortPenalty),
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

  // Room/wall editor
  editMode: false,
  editSelectedRoomId: null,
  setEditMode: (mode) => set((state) => {
    if (mode) {
      if (state.customWalls === null) {
        const walls = [...DEFAULT_ACTIVE_WALLS];
        saveCustomWalls(walls);
        return { editMode: true, customWalls: walls, rearrangeMode: false };
      }
      return { editMode: true, rearrangeMode: false };
    }
    return { editMode: false, editSelectedRoomId: null };
  }),
  setEditSelectedRoomId: (id) => set({ editSelectedRoomId: id }),
  customWalls: loadCustomWalls(),
  toggleWall: (key) => set((state) => {
    const current = state.customWalls ?? [...DEFAULT_ACTIVE_WALLS];
    const wallSet = new Set(current);
    if (wallSet.has(key)) {
      wallSet.delete(key);
    } else {
      wallSet.add(key);
    }
    const next = Array.from(wallSet);
    saveCustomWalls(next);
    return { customWalls: next };
  }),
  resetWalls: () => {
    saveCustomWalls(null);
    set({ customWalls: null, editMode: false, editSelectedRoomId: null });
  },

  // Room layout editor
  roomLayout: initialRoomLayout,
  updateRoomBounds: (id, position, size) => set((state) => {
    const isAdded = state.roomLayout.addedRooms.some((r) => r.id === id);
    if (isAdded) {
      const addedRooms = state.roomLayout.addedRooms.map((r) =>
        r.id === id ? { ...r, position, size } : r,
      );
      const next = { ...state.roomLayout, addedRooms };
      saveRoomLayout(next);
      return { roomLayout: next };
    }
    const overrides = { ...state.roomLayout.overrides };
    overrides[id] = { ...overrides[id], position, size };
    const next = { ...state.roomLayout, overrides };
    saveRoomLayout(next);
    return { roomLayout: next };
  }),
  addNewRoom: () => set((state) => {
    const id = `room-${Date.now()}`;
    const newRoom: Room = {
      id,
      name: `Room ${state.roomLayout.addedRooms.length + 1}`,
      position: [0, 0, 0],
      size: [8, 8],
      color: '#4a4a4a',
      furniture: [],
    };
    const next = { ...state.roomLayout, addedRooms: [...state.roomLayout.addedRooms, newRoom] };
    saveRoomLayout(next);
    return { roomLayout: next, editSelectedRoomId: id };
  }),
  deleteEditRoom: (id) => set((state) => {
    const isAdded = state.roomLayout.addedRooms.some((r) => r.id === id);
    let next: RoomLayoutData;
    if (isAdded) {
      next = { ...state.roomLayout, addedRooms: state.roomLayout.addedRooms.filter((r) => r.id !== id) };
    } else {
      next = { ...state.roomLayout, deletedRoomIds: [...state.roomLayout.deletedRoomIds, id] };
    }
    const overrides = { ...next.overrides };
    delete overrides[id];
    next = { ...next, overrides };
    saveRoomLayout(next);
    return { roomLayout: next, editSelectedRoomId: null };
  }),
  resetRoomLayout: () => {
    const defaultLayout: RoomLayoutData = { overrides: {}, addedRooms: [], deletedRoomIds: [] };
    saveRoomLayout(defaultLayout);
    set({ roomLayout: defaultLayout, editSelectedRoomId: null });
  },

  // Spectator mode
  isSpectating: false,
  spectatorLive: false,
  spectatorViewerCount: 0,

  // Shop / economy
  coins: initialShopData.coins,
  purchasedUpgrades: initialShopData.purchasedUpgrades,
  robotColors: initialShopData.robotColors,
  showShop: false,
  setShowShop: (show) => set({ showShop: show }),
  addCoins: (amount) => set((state) => {
    const next = { coins: state.coins + amount, purchasedUpgrades: state.purchasedUpgrades, robotColors: state.robotColors };
    saveShopData(next);
    return { coins: next.coins };
  }),
  purchaseUpgrade: (id, cost) => {
    const state = useStore.getState();
    if (state.coins < cost || state.purchasedUpgrades.includes(id)) return false;
    const nextCoins = state.coins - cost;
    const nextUpgrades = [...state.purchasedUpgrades, id];
    const shopData = { coins: nextCoins, purchasedUpgrades: nextUpgrades, robotColors: state.robotColors };
    saveShopData(shopData);
    set({ coins: nextCoins, purchasedUpgrades: nextUpgrades });
    return true;
  },
  purchaseColor: (robotId, colorHex, cost) => {
    const state = useStore.getState();
    if (state.coins < cost) return false;
    const nextCoins = state.coins - cost;
    const nextColors = { ...state.robotColors, [robotId]: colorHex };
    const shopData = { coins: nextCoins, purchasedUpgrades: state.purchasedUpgrades, robotColors: nextColors };
    saveShopData(shopData);
    set({ coins: nextCoins, robotColors: nextColors });
    return true;
  },

  // Smart home devices
  deviceStates: loadDeviceStates(),
  showDevicePanel: false,
  setShowDevicePanel: (show) => set({ showDevicePanel: show }),
  toggleDevice: (deviceId) => set((state) => {
    const current = state.deviceStates[deviceId];
    if (!current) return {};
    const next = { ...state.deviceStates, [deviceId]: { ...current, on: !current.on } };
    saveDeviceStates(next);
    return { deviceStates: next };
  }),
  setDeviceTemperature: (deviceId, temp) => set((state) => {
    const current = state.deviceStates[deviceId];
    if (!current) return {};
    const clamped = Math.max(60, Math.min(85, temp));
    const next = { ...state.deviceStates, [deviceId]: { ...current, temperature: clamped } };
    saveDeviceStates(next);
    return { deviceStates: next };
  }),
  setDeviceOn: (deviceId, on) => set((state) => {
    const current = state.deviceStates[deviceId];
    if (!current) return {};
    const next = { ...state.deviceStates, [deviceId]: { ...current, on } };
    saveDeviceStates(next);
    return { deviceStates: next };
  }),

  // Seasonal events
  currentSeason: getSeasonForDay(initialDay),
  seasonToast: null,
  setCurrentSeason: (season) => set({ currentSeason: season }),
  setSeasonToast: (toast) => set({ seasonToast: toast }),

  // Diary
  diaryEntries: { sim: [], chef: [], sparkle: [] },
  diaryDay: initialDay,
  showDiary: false,
  setShowDiary: (show) => set({ showDiary: show }),
  addDiaryEntry: (entry) => set((state) => ({
    diaryEntries: {
      ...state.diaryEntries,
      [entry.robotId]: [...(state.diaryEntries[entry.robotId] ?? []), entry],
    },
  })),
  resetDiary: (day) => set({ diaryEntries: { sim: [], chef: [], sparkle: [] }, diaryDay: day }),

  // Floor plan presets
  floorPlanId: loadFloorPlanId(),
  showFloorPlanSelector: false,
  setShowFloorPlanSelector: (show) => set({ showFloorPlanSelector: show }),
  setFloorPlan: (id) => {
    saveFloorPlanId(id);
    // Reset room/furniture/wall/decoration customizations when switching floor plans
    const defaultLayout = { overrides: {}, addedRooms: [], deletedRoomIds: [] };
    saveRoomLayout(defaultLayout);
    saveFurniturePositions({});
    saveCustomWalls(null);
    saveRoomDecorations({});
    set({
      floorPlanId: id,
      showFloorPlanSelector: false,
      roomLayout: defaultLayout,
      furniturePositions: {},
      customWalls: null,
      editMode: false,
      editSelectedRoomId: null,
      rearrangeMode: false,
      selectedFurnitureId: null,
      decorateMode: false,
      decorateSelectedRoomId: null,
      roomDecorations: {},
      // Reset all robots to idle
      tasks: [],
      robots: createAllRobotStates(),
    });
  },

  // Leaderboard
  showLeaderboard: false,
  setShowLeaderboard: (show) => set({ showLeaderboard: show }),
  sessionStats: createSessionStats(),
  leaderboardData: loadLeaderboard(),
  recordRobotTaskCompletion: (robotId, taskType, workDuration) => set((state) => ({
    sessionStats: recordRobotTask(state.sessionStats, robotId, taskType, workDuration),
  })),
  sampleCleanliness: (avgCleanliness) => set((state) => ({
    sessionStats: recordCleanlinessReading(state.sessionStats, avgCleanliness),
  })),
  flushSession: (simMinutesPlayed) => set((state) => ({
    leaderboardData: saveSession(state.sessionStats, simMinutesPlayed),
    sessionStats: createSessionStats(),
  })),

  // Personality
  showPersonality: false,
  setShowPersonality: (show) => set({ showPersonality: show }),
  personalities: loadPersonalities(),
  recordPersonalityTaskCompletion: (robotId, taskType) => set((state) => {
    const next = recordPersonalityTask(state.personalities, robotId, taskType);
    savePersonalities(next);
    return { personalities: next };
  }),
  recordPersonalityRoomTime: (robotId, roomId, minutes) => set((state) => {
    const next = recordRoomTime(state.personalities, robotId, roomId, minutes);
    savePersonalities(next);
    return { personalities: next };
  }),

  // Home events
  activeHomeEvent: null,
  homeEventHistory: [],
  setActiveHomeEvent: (event) => set({ activeHomeEvent: event }),
  updateHomeEvent: (updates) => set((state) => {
    if (!state.activeHomeEvent) return {};
    return { activeHomeEvent: { ...state.activeHomeEvent, ...updates } };
  }),
  resolveHomeEvent: (entry) => set((state) => ({
    activeHomeEvent: null,
    homeEventHistory: [...state.homeEventHistory, entry],
  })),

  // Robot social / friendships
  friendships: loadFriendships(),
  activeChats: [],
  showSocial: false,
  setShowSocial: (show) => set({ showSocial: show }),
  updateFriendship: (key, levelDelta, simMinutes) => set((state) => {
    const current = state.friendships[key];
    if (!current) return {};
    const next = {
      ...state.friendships,
      [key]: {
        ...current,
        level: Math.max(0, Math.min(100, current.level + levelDelta)),
        totalChats: current.totalChats + (levelDelta > 0 ? 1 : 0),
        lastChatAt: simMinutes,
      },
    };
    saveFriendships(next);
    return { friendships: next };
  }),
  startChat: (chat) => set((state) => ({
    activeChats: [...state.activeChats, chat],
  })),
  advanceChatLine: (robotA, robotB) => set((state) => ({
    activeChats: state.activeChats.map((c) =>
      (c.robotA === robotA && c.robotB === robotB)
        ? { ...c, currentLineIndex: c.currentLineIndex + 1 }
        : c
    ),
  })),
  endChat: (robotA, robotB) => set((state) => ({
    activeChats: state.activeChats.filter((c) =>
      !(c.robotA === robotA && c.robotB === robotB)
    ),
  })),

  // Crafting workshop
  showCrafting: false,
  setShowCrafting: (show) => set({ showCrafting: show }),
  ownedParts: initialCraftingData.ownedParts,
  customRobots: initialCraftingData.customRobots,
  purchasePart: (partId, cost) => {
    const state = useStore.getState();
    if (state.coins < cost || state.ownedParts.includes(partId)) return false;
    const nextCoins = state.coins - cost;
    const nextParts = [...state.ownedParts, partId];
    // Save shop coins
    const shopData = { coins: nextCoins, purchasedUpgrades: state.purchasedUpgrades, robotColors: state.robotColors };
    saveShopData(shopData);
    // Save crafting parts
    saveCraftingData({ ownedParts: nextParts, customRobots: state.customRobots });
    set({ coins: nextCoins, ownedParts: nextParts });
    return true;
  },
  buildCustomRobot: (name, headId, bodyId, armsId, legsId) => set((state) => {
    const newRobot: CustomRobot = {
      id: `custom-${Date.now()}`,
      name,
      headId,
      bodyId,
      armsId,
      legsId,
      createdAt: Date.now(),
      deployed: false,
    };
    const nextRobots = [...state.customRobots, newRobot];
    saveCraftingData({ ownedParts: state.ownedParts, customRobots: nextRobots });
    return { customRobots: nextRobots };
  }),
  deployCustomRobot: (robotId) => set((state) => {
    const nextRobots = state.customRobots.map((r) => ({
      ...r,
      deployed: r.id === robotId ? !r.deployed : false,
    }));
    saveCraftingData({ ownedParts: state.ownedParts, customRobots: nextRobots });
    return { customRobots: nextRobots };
  }),
  deleteCustomRobot: (robotId) => set((state) => {
    const nextRobots = state.customRobots.filter((r) => r.id !== robotId);
    saveCraftingData({ ownedParts: state.ownedParts, customRobots: nextRobots });
    return { customRobots: nextRobots };
  }),

  // Timelapse replay
  timelapseEvents: [],
  timelapsePlayback: null,
  showTimelapse: false,
  setShowTimelapse: (show) => set({ showTimelapse: show }),
  pushTimelapseEvent: (event) => set((state) => {
    // Circular buffer: keep up to 24 sim-hours (1440 sim-minutes) of events
    // Position events every ~2 sim-min × 3 robots ≈ 2160 pos events/day + task/room events
    const MAX_EVENTS = 8000;
    const next = [...state.timelapseEvents, event];
    if (next.length > MAX_EVENTS) {
      // Trim from the front to keep the most recent events
      return { timelapseEvents: next.slice(next.length - MAX_EVENTS) };
    }
    return { timelapseEvents: next };
  }),
  startTimelapsePlayback: () => set((state) => {
    const events = state.timelapseEvents;
    if (events.length === 0) return {};
    const startSimMinutes = events[0].simMinutes;
    const endSimMinutes = events[events.length - 1].simMinutes;
    return {
      timelapsePlayback: {
        playing: true,
        speed: 60,
        startSimMinutes,
        endSimMinutes,
        currentSimMinutes: startSimMinutes,
      },
      showTimelapse: true,
    };
  }),
  stopTimelapsePlayback: () => set({ timelapsePlayback: null }),
  setTimelapsePlaybackPlaying: (playing) => set((state) => {
    if (!state.timelapsePlayback) return {};
    return { timelapsePlayback: { ...state.timelapsePlayback, playing } };
  }),
  setTimelapsePlaybackSpeed: (speed) => set((state) => {
    if (!state.timelapsePlayback) return {};
    return { timelapsePlayback: { ...state.timelapsePlayback, speed } };
  }),
  setTimelapsePlaybackTime: (simMinutes) => set((state) => {
    if (!state.timelapsePlayback) return {};
    return { timelapsePlayback: { ...state.timelapsePlayback, currentSimMinutes: simMinutes } };
  }),

  // Task timeline
  showTimeline: false,
  setShowTimeline: (show) => set({ showTimeline: show }),

  // Room decoration
  decorateMode: false,
  decorateSelectedRoomId: null,
  roomDecorations: loadRoomDecorations(),
  setDecorateMode: (mode) => set({
    decorateMode: mode,
    decorateSelectedRoomId: null,
    // Disable other modes
    ...(mode ? { editMode: false, rearrangeMode: false } : {}),
  }),
  setDecorateSelectedRoomId: (id) => set({ decorateSelectedRoomId: id }),
  setRoomDecoration: (roomId, decoration) => set((state) => {
    const current = state.roomDecorations[roomId] ?? { wallColor: null, floorId: null, wallpaperId: null };
    const next = { ...state.roomDecorations, [roomId]: { ...current, ...decoration } };
    saveRoomDecorations(next);
    return { roomDecorations: next };
  }),
  resetRoomDecorations: () => {
    saveRoomDecorations({});
    set({ roomDecorations: {}, decorateSelectedRoomId: null });
  },

  // Notifications
  notifications: [],
  addNotification: (n) => set((state) => ({
    notifications: [
      ...state.notifications,
      { ...n, id: crypto.randomUUID(), createdAt: Date.now() },
    ].slice(-10), // keep max 10 in buffer
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));

// Each completion reduces duration by ~5%, capping at 30% faster
export function getTaskSpeedMultiplier(taskType: TaskType): number {
  const count = useStore.getState().taskExperience[taskType] ?? 0;
  return Math.max(0.7, 1 - count * 0.05);
}
