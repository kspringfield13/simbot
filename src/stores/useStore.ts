import { create } from 'zustand';
import { createInitialRoomNeeds, decayRoomNeeds, boostRoomAfterTask } from '../systems/RoomState';
import { getSimPeriod } from '../systems/TimeSystem';
import { createAllRobotStates } from '../config/robots';
import { DEFAULT_ACTIVE_WALLS } from '../utils/homeLayout';
import { getBatteryDrainMultiplier, getEnergyMultiplier } from '../config/shop';
import type { CustomRobot } from '../config/crafting';
import { getDeployedRobotBonuses } from '../config/crafting';
import type { MaterialInventory, CraftedFurnitureItem, ActiveCraft } from '../config/furnitureCrafting';
import { loadFurnitureCraftingData, saveFurnitureCraftingData, getRecipeById, canAffordRecipe } from '../config/furnitureCrafting';
import type { CameraZoneId, AlarmState, SecurityLogEntry } from '../config/security';
import type { StoryArc } from '../systems/StoryDirector';
import { loadEvolutionData, saveEvolutionData, recordEvolutionTask } from '../utils/evolution';
import type { NeighborHouse, VisitEvent } from '../systems/Neighborhood';
import { generateNeighborhood, VISIT_ACTIVITIES } from '../systems/Neighborhood';
import { loadSecurityData, saveSecurityData } from '../config/security';
import { getSkillQualityBonus } from '../config/skills';
import type { EconomyTransaction, TransactionCategory } from '../systems/Economy';
import { loadEconomyData, saveEconomyData } from '../systems/Economy';
import { loadFloorPlanId, saveFloorPlanId } from '../config/floorPlans';
import type { ChallengeDefinition, BestTime } from '../config/challenges';
import { loadBestTimes, saveBestTime, getStarsForTime } from '../config/challenges';
import { getComfortMultiplier } from '../config/devices';
import { createDisaster, DISASTER_TYPES } from '../systems/DisasterEvents';
import type { RoomDecoration } from '../config/decorations';
import type { RoomThemeId } from '../config/roomThemes';
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
  CameraPreset,
  ChatMessage,
  DeviceState,
  Disaster,
  DisasterHistoryEntry,
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
  RobotSkillData,
  RobotState,
  RoomId,
  RoomNeedState,
  ScheduledTask,
  Season,
  SimPeriod,
  Task,
  TaskType,
  IntruderEvent,
  RobotEvolution,
  TimelapseEvent,
  TimelapsePlaybackState,
  VisitorEvent,
  WeatherType,
} from '../types';
import { ROBOT_IDS } from '../types';
import { getSeasonForDay, SEASON_MODIFIERS } from '../config/seasons';
import { DEVICES } from '../config/devices';

export type SimSpeed = 0 | 1 | 10 | 60;

// ── Built-in camera presets ──────────────────────────
export const BUILTIN_CAMERA_PRESETS: CameraPreset[] = [
  { id: 'builtin-overview', name: 'Overview', position: [26, 29, 26], target: [0, 0, -2], builtIn: true },
  { id: 'builtin-closeup', name: 'Close-Up', position: [3, 4, 3], target: [0, 0, 0], builtIn: true },
  { id: 'builtin-room-level', name: 'Room Level', position: [12, 6, 0], target: [0, 0, 0], builtIn: true },
  { id: 'builtin-dramatic', name: 'Dramatic Angle', position: [-18, 32, -20], target: [0, 0, 2], builtIn: true },
];

// ── Camera presets localStorage persistence ──────────────────────────
const CAMERA_PRESETS_KEY = 'simbot-camera-presets';

function loadCameraPresets(): CameraPreset[] {
  try {
    const stored = localStorage.getItem(CAMERA_PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCameraPresets(presets: CameraPreset[]) {
  try {
    localStorage.setItem(CAMERA_PRESETS_KEY, JSON.stringify(presets));
  } catch { /* ignore quota errors */ }
}

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

// ── Skill tree localStorage persistence ──────────────────────────
const SKILLS_STORAGE_KEY = 'simbot-skills';

function createInitialSkillData(): Record<RobotId, RobotSkillData> {
  return {
    sim: { unlockedSkills: [] },
    chef: { unlockedSkills: [] },
    sparkle: { unlockedSkills: [] },
  };
}

function loadSkillData(): Record<RobotId, RobotSkillData> {
  try {
    const stored = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createInitialSkillData(), ...parsed };
    }
    return createInitialSkillData();
  } catch {
    return createInitialSkillData();
  }
}

function saveSkillData(data: Record<RobotId, RobotSkillData>) {
  try {
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Room themes localStorage persistence ──────────────────────────
const ROOM_THEMES_STORAGE_KEY = 'simbot-room-themes';

interface RoomThemesData {
  globalTheme: RoomThemeId;
  perRoom: Record<string, RoomThemeId>;
}

function loadRoomThemes(): RoomThemesData {
  try {
    const stored = localStorage.getItem(ROOM_THEMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { globalTheme: 'default', perRoom: {} };
  } catch {
    return { globalTheme: 'default', perRoom: {} };
  }
}

function saveRoomThemes(data: RoomThemesData) {
  try {
    localStorage.setItem(ROOM_THEMES_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

// ── Pet state localStorage persistence ──────────────────────────
const PETS_STORAGE_KEY = 'simbot-pets';

interface PetsStorageData {
  fish: { happiness: number; totalFeedings: number; lastFedAt: number };
  hamster: { happiness: number; totalFeedings: number; lastFedAt: number };
}

function loadPetData(): PetsStorageData {
  try {
    const stored = localStorage.getItem(PETS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    fish: { happiness: 70, totalFeedings: 0, lastFedAt: 0 },
    hamster: { happiness: 70, totalFeedings: 0, lastFedAt: 0 },
  };
}

function savePetData(data: PetsStorageData) {
  try {
    localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

const initialShopData = loadShopData();
const initialEconomyData = loadEconomyData();
const initialCraftingData = loadCraftingData();
const initialFurnitureCraftingData = loadFurnitureCraftingData();
const initialSecurityData = loadSecurityData();

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

  // Camera presets
  cameraPresets: CameraPreset[];
  showCameraPresets: boolean;
  autoTourActive: boolean;
  activeCameraPresetId: string | null;
  cameraPresetTarget: { position: [number, number, number]; target: [number, number, number] } | null;
  setShowCameraPresets: (show: boolean) => void;
  saveCameraPreset: (name: string, position: [number, number, number], target: [number, number, number]) => void;
  deleteCameraPreset: (id: string) => void;
  loadCameraPreset: (id: string) => void;
  setAutoTour: (active: boolean) => void;
  clearCameraPresetTarget: () => void;

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
  applyRoomTaskResult: (roomId: RoomId, taskType: TaskType, robotId?: RobotId) => void;

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
  recordStats: (taskType: TaskType, roomId: RoomId, robotId?: RobotId) => void;
  statsTab: 'overview' | 'graphs' | 'story';
  setStatsTab: (tab: 'overview' | 'graphs' | 'story') => void;

  // Graph history (sampled every 5 sim-minutes)
  cleanlinessHistory: { simMinutes: number; rooms: Record<string, number>; average: number }[];
  efficiencyHistory: { simMinutes: number; robots: Record<string, number> }[];
  _lastGraphSampleAt: number;
  _robotTaskCounts: Record<string, number>;
  _robotTaskSnapshots: Record<string, number>;
  sampleGraphData: () => void;

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

  // Mood music (ambient layer)
  moodMusicEnabled: boolean;
  moodMusicLabel: string;
  setMoodMusicEnabled: (enabled: boolean) => void;
  setMoodMusicLabel: (label: string) => void;

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

  // Community gallery
  showCommunityGallery: boolean;
  setShowCommunityGallery: (show: boolean) => void;

  // Robot evolution / aging
  robotEvolutions: Record<RobotId, RobotEvolution>;
  showEvolutionPanel: boolean;
  setShowEvolutionPanel: (show: boolean) => void;
  recordEvolution: (robotId: RobotId, taskType: TaskType, workDuration: number) => void;

  // Shop / economy
  coins: number;
  purchasedUpgrades: string[];
  robotColors: Partial<Record<RobotId, string>>;
  showShop: boolean;
  setShowShop: (show: boolean) => void;
  addCoins: (amount: number) => void;
  purchaseUpgrade: (id: string, cost: number) => boolean;
  purchaseColor: (robotId: RobotId, colorHex: string, cost: number) => boolean;

  // Economy / budget
  economyTransactions: EconomyTransaction[];
  purchasedRoomUpgrades: string[];
  purchasedFurniture: string[];
  purchasedAccessories: string[];
  showBudgetPanel: boolean;
  setShowBudgetPanel: (show: boolean) => void;
  coinAnimations: { id: string; amount: number; createdAt: number }[];
  addCoinAnimation: (amount: number) => void;
  removeCoinAnimation: (id: string) => void;
  recordTransaction: (type: 'income' | 'expense', category: TransactionCategory, amount: number, label: string) => void;
  purchaseRoomUpgrade: (id: string, cost: number) => boolean;
  purchaseFurnitureItem: (id: string, cost: number) => boolean;
  purchaseAccessory: (id: string, cost: number) => boolean;

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

  // Disasters
  activeDisaster: Disaster | null;
  disasterHistory: DisasterHistoryEntry[];
  setActiveDisaster: (disaster: Disaster | null) => void;
  updateDisaster: (updates: Partial<Disaster>) => void;
  resolveDisaster: (entry: DisasterHistoryEntry) => void;
  triggerDisaster: (type?: import('../types').DisasterType) => void;

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

  // Skill tree
  robotSkills: Record<RobotId, RobotSkillData>;
  showSkillTree: boolean;
  setShowSkillTree: (show: boolean) => void;
  unlockSkill: (robotId: RobotId, skillId: string) => void;

  // Room themes
  globalTheme: RoomThemeId;
  perRoomThemes: Record<string, RoomThemeId>;
  showThemeSelector: boolean;
  setShowThemeSelector: (show: boolean) => void;
  setGlobalTheme: (themeId: RoomThemeId) => void;
  setRoomTheme: (roomId: string, themeId: RoomThemeId) => void;
  resetRoomThemes: () => void;

  // Robot pets
  petStates: PetsStorageData;
  showPetPanel: boolean;
  setShowPetPanel: (show: boolean) => void;
  feedPet: (petId: 'fish' | 'hamster', simMinutes: number) => void;
  decayPetHappiness: (amount: number) => void;

  // Time challenges
  activeChallenge: {
    challenge: ChallengeDefinition;
    startedAt: number;       // Date.now() real-time start
    tasksCompleted: number;
    totalTasks: number;
    challengeTaskIds: string[];  // task IDs spawned for this challenge
  } | null;
  challengeResult: {
    challenge: ChallengeDefinition;
    timeSeconds: number;
    stars: 1 | 2 | 3;
    isNewBest: boolean;
  } | null;
  challengeBestTimes: Record<string, BestTime>;
  showChallengePanel: boolean;
  setShowChallengePanel: (show: boolean) => void;
  startChallenge: (challenge: ChallengeDefinition, taskIds: string[]) => void;
  advanceChallengeTask: () => void;
  completeChallenge: () => void;
  cancelChallenge: () => void;
  dismissChallengeResult: () => void;

  // Furniture crafting
  furnitureMaterials: MaterialInventory;
  craftedFurniture: CraftedFurnitureItem[];
  activeFurnitureCraft: ActiveCraft | null;
  showFurnitureCrafting: boolean;
  setShowFurnitureCrafting: (show: boolean) => void;
  addMaterials: (drops: Partial<MaterialInventory>) => void;
  startFurnitureCraft: (recipeId: string) => boolean;
  completeFurnitureCraft: () => void;
  cancelFurnitureCraft: () => void;
  placeCraftedFurniture: (itemId: string, roomId: string, position: [number, number]) => void;
  unplaceCraftedFurniture: (itemId: string) => void;
  deleteCraftedFurniture: (itemId: string) => void;

  // Home security
  installedCameras: CameraZoneId[];
  alarmState: AlarmState;
  patrolEnabled: boolean;
  activeIntruder: IntruderEvent | null;
  intruderHistory: { type: IntruderEvent['type']; roomId: RoomId; detectedAt: number; resolvedAt: number }[];
  securityLog: SecurityLogEntry[];
  showSecurityPanel: boolean;
  setShowSecurityPanel: (show: boolean) => void;
  installCamera: (id: CameraZoneId) => void;
  uninstallCamera: (id: CameraZoneId) => void;
  setAlarmState: (state: AlarmState) => void;
  setPatrolEnabled: (enabled: boolean) => void;
  setActiveIntruder: (event: IntruderEvent | null) => void;
  updateIntruder: (updates: Partial<IntruderEvent>) => void;
  resolveIntruder: () => void;
  addSecurityLog: (entry: Omit<SecurityLogEntry, 'id'>) => void;

  // Story Director
  storyArcs: StoryArc[];
  setStoryArcs: (arcs: StoryArc[]) => void;
  expandedStoryArcId: string | null;
  setExpandedStoryArcId: (id: string | null) => void;

  // Neighborhood
  neighborHouses: NeighborHouse[];
  streetView: boolean;
  visitingHouseId: string | null;  // which neighbor house interior is being viewed
  activeVisits: VisitEvent[];
  showNeighborhoodPanel: boolean;
  walkingRobots: { robotId: RobotId; fromX: number; toX: number; progress: number; houseId: string }[];
  setStreetView: (show: boolean) => void;
  setVisitingHouseId: (id: string | null) => void;
  setShowNeighborhoodPanel: (show: boolean) => void;
  sendRobotToVisit: (robotId: RobotId, houseId: string, activityId: string) => void;
  tickVisitProgress: () => void;
  recallRobot: (robotId: RobotId) => void;
  returnToPlayerHouse: () => void;
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

  // Camera presets
  cameraPresets: loadCameraPresets(),
  showCameraPresets: false,
  autoTourActive: false,
  activeCameraPresetId: null,
  cameraPresetTarget: null,
  setShowCameraPresets: (show) => set({ showCameraPresets: show }),
  saveCameraPreset: (name, position, target) => set((s) => {
    const preset: CameraPreset = { id: crypto.randomUUID(), name, position, target };
    const next = [...s.cameraPresets, preset];
    saveCameraPresets(next);
    return { cameraPresets: next };
  }),
  deleteCameraPreset: (id) => set((s) => {
    const next = s.cameraPresets.filter((p) => p.id !== id);
    saveCameraPresets(next);
    return { cameraPresets: next, activeCameraPresetId: s.activeCameraPresetId === id ? null : s.activeCameraPresetId };
  }),
  loadCameraPreset: (id) => set((s) => {
    const allPresets = [...BUILTIN_CAMERA_PRESETS, ...s.cameraPresets];
    const preset = allPresets.find((p) => p.id === id);
    if (!preset) return {};
    return {
      cameraMode: 'overview',
      activeCameraPresetId: id,
      cameraPresetTarget: { position: preset.position, target: preset.target },
    };
  }),
  setAutoTour: (active) => set({ autoTourActive: active, activeCameraPresetId: null }),
  clearCameraPresetTarget: () => set({ cameraPresetTarget: null }),

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

      // Seasonal modifiers affect battery drain, energy usage, and happiness
      const seasonMod = SEASON_MODIFIERS[state.currentSeason];

      // Battery drain/charge rates (per sim-minute), modified by shop upgrades + crafting + season
      const battDrainMult = getBatteryDrainMultiplier(state.purchasedUpgrades, craftBonuses.batteryBonus) * seasonMod.batteryDrainMult;
      const batteryDelta = r.isCharging
        ? deltaSimMinutes * 0.5
        : isWorking ? -deltaSimMinutes * 0.12 * battDrainMult
        : isIdle ? -deltaSimMinutes * 0.01 * battDrainMult
        : -deltaSimMinutes * 0.06 * battDrainMult;

      const energyMult = getEnergyMultiplier(state.purchasedUpgrades, craftBonuses.efficiencyBonus) * seasonMod.efficiencyMult;

      // Thermostat comfort affects happiness
      const thermoDevice = state.deviceStates['thermostat'];
      const thermoTemp = thermoDevice?.on ? (thermoDevice.temperature ?? 72) : 72;
      const comfortMult = getComfortMultiplier(thermoTemp);
      const comfortPenalty = comfortMult < 1 ? -deltaSimMinutes * 0.005 * (1 - comfortMult) : 0;

      // Seasonal happiness modifier
      const seasonHappiness = deltaSimMinutes * seasonMod.happinessDelta;

      updatedRobots[id] = {
        ...r,
        battery: clamp(r.battery + batteryDelta),
        needs: {
          energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 : isWorking ? -deltaSimMinutes * 0.08 * energyMult : -deltaSimMinutes * 0.03)),
          happiness: clamp(n.happiness + (isWorking ? deltaSimMinutes * 0.02 : -deltaSimMinutes * 0.01) + deltaSimMinutes * weatherHappinessBonus + comfortPenalty + seasonHappiness),
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
  applyRoomTaskResult: (roomId, taskType, robotId) => set((state) => {
    const current = state.roomNeeds[roomId];
    if (!current) return {};

    const boosted = boostRoomAfterTask(current, taskType);
    // Apply skill tree quality bonus (increases cleanliness/tidiness boost)
    if (robotId) {
      const qualBonus = getSkillQualityBonus(state.robotSkills[robotId].unlockedSkills, taskType);
      if (qualBonus > 0) {
        const extra = qualBonus; // e.g. 0.15 = 15% more boost
        const cleanDelta = boosted.cleanliness - current.cleanliness;
        const tidyDelta = boosted.tidiness - current.tidiness;
        boosted.cleanliness = Math.min(100, boosted.cleanliness + cleanDelta * extra);
        boosted.tidiness = Math.min(100, boosted.tidiness + tidyDelta * extra);
      }
    }

    return {
      roomNeeds: {
        ...state.roomNeeds,
        [roomId]: {
          ...boosted,
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
  recordStats: (taskType, roomId, robotId) => set((state) => ({
    totalTasksCompleted: state.totalTasksCompleted + 1,
    tasksByType: { ...state.tasksByType, [taskType]: (state.tasksByType[taskType] ?? 0) + 1 },
    tasksByRoom: { ...state.tasksByRoom, [roomId]: (state.tasksByRoom[roomId] ?? 0) + 1 },
    _robotTaskCounts: robotId
      ? { ...state._robotTaskCounts, [robotId]: (state._robotTaskCounts[robotId] ?? 0) + 1 }
      : state._robotTaskCounts,
  })),
  statsTab: 'overview',
  setStatsTab: (tab) => set({ statsTab: tab }),

  // Graph history
  cleanlinessHistory: [],
  efficiencyHistory: [],
  _lastGraphSampleAt: 0,
  _robotTaskCounts: {},
  _robotTaskSnapshots: {},
  sampleGraphData: () => set((state) => {
    const interval = 5; // sample every 5 sim-minutes
    if (state.simMinutes - state._lastGraphSampleAt < interval) return {};

    // Cleanliness snapshot
    const roomIds = Object.keys(state.roomNeeds);
    const rooms: Record<string, number> = {};
    let sum = 0;
    for (const id of roomIds) {
      const c = Math.round(state.roomNeeds[id as keyof typeof state.roomNeeds]?.cleanliness ?? 0);
      rooms[id] = c;
      sum += c;
    }
    const average = roomIds.length > 0 ? Math.round(sum / roomIds.length) : 0;
    const cleanlinessPoint = { simMinutes: state.simMinutes, rooms, average };

    // Efficiency: tasks completed per robot since last sample
    const prevSnaps = state._robotTaskSnapshots;
    const currentSnaps: Record<string, number> = {};
    const robotRates: Record<string, number> = {};
    for (const rid of ROBOT_IDS) {
      const current = state._robotTaskCounts[rid] ?? 0;
      currentSnaps[rid] = current;
      const prev = prevSnaps[rid] ?? 0;
      const delta = current - prev;
      // Convert to tasks/hour: delta tasks in `interval` sim-minutes
      robotRates[rid] = Math.round((delta / interval) * 60 * 10) / 10;
    }
    const efficiencyPoint = { simMinutes: state.simMinutes, robots: robotRates };

    // Keep last 200 data points max (= ~1000 sim-minutes = ~16.7 sim-hours)
    const maxPoints = 200;
    const newCleanliness = [...state.cleanlinessHistory, cleanlinessPoint].slice(-maxPoints);
    const newEfficiency = [...state.efficiencyHistory, efficiencyPoint].slice(-maxPoints);

    return {
      cleanlinessHistory: newCleanliness,
      efficiencyHistory: newEfficiency,
      _lastGraphSampleAt: state.simMinutes,
      _robotTaskSnapshots: currentSnaps,
    };
  }),

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

  // Mood music (ambient layer)
  moodMusicEnabled: false,
  moodMusicLabel: '',
  setMoodMusicEnabled: (enabled) => set({ moodMusicEnabled: enabled }),
  setMoodMusicLabel: (label) => set({ moodMusicLabel: label }),

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
  showCommunityGallery: false,
  setShowCommunityGallery: (show) => set({ showCommunityGallery: show }),

  // Robot evolution / aging
  robotEvolutions: loadEvolutionData(),
  showEvolutionPanel: false,
  setShowEvolutionPanel: (show) => set({ showEvolutionPanel: show }),
  recordEvolution: (robotId, taskType, workDuration) => set((state) => {
    const evo = state.robotEvolutions[robotId];
    const { evolution, stageChanged } = recordEvolutionTask(evo, taskType, workDuration, state.simMinutes);
    const next = { ...state.robotEvolutions, [robotId]: evolution };
    saveEvolutionData(next);
    if (stageChanged) {
      const stageLabels: Record<string, string> = { junior: 'Junior', seasoned: 'Seasoned', veteran: 'Veteran', legendary: 'Legendary' };
      state.addNotification({
        type: 'achievement',
        title: 'Evolution!',
        message: `${robotId.charAt(0).toUpperCase() + robotId.slice(1)} evolved to ${stageLabels[evolution.stage] ?? evolution.stage} stage!`,
      });
    }
    return { robotEvolutions: next };
  }),

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

  // Economy / budget
  economyTransactions: initialEconomyData.transactions,
  purchasedRoomUpgrades: initialEconomyData.purchasedRoomUpgrades,
  purchasedFurniture: initialEconomyData.purchasedFurniture,
  purchasedAccessories: initialEconomyData.purchasedAccessories,
  showBudgetPanel: false,
  setShowBudgetPanel: (show) => set({ showBudgetPanel: show }),
  coinAnimations: [],
  addCoinAnimation: (amount) => set((state) => {
    const anim = { id: crypto.randomUUID(), amount, createdAt: Date.now() };
    return { coinAnimations: [...state.coinAnimations, anim] };
  }),
  removeCoinAnimation: (id) => set((state) => ({
    coinAnimations: state.coinAnimations.filter((a) => a.id !== id),
  })),
  recordTransaction: (type, category, amount, label) => set((state) => {
    const tx: EconomyTransaction = {
      id: crypto.randomUUID(),
      type,
      category,
      amount,
      label,
      timestamp: Date.now(),
      simMinutes: state.simMinutes,
    };
    const next = [...state.economyTransactions, tx];
    saveEconomyData({
      transactions: next,
      purchasedRoomUpgrades: state.purchasedRoomUpgrades,
      purchasedFurniture: state.purchasedFurniture,
      purchasedAccessories: state.purchasedAccessories,
    });
    return { economyTransactions: next };
  }),
  purchaseRoomUpgrade: (id, cost) => {
    const state = useStore.getState();
    if (state.coins < cost || state.purchasedRoomUpgrades.includes(id)) return false;
    const nextCoins = state.coins - cost;
    const nextUpgrades = [...state.purchasedRoomUpgrades, id];
    saveShopData({ coins: nextCoins, purchasedUpgrades: state.purchasedUpgrades, robotColors: state.robotColors });
    saveEconomyData({
      transactions: state.economyTransactions,
      purchasedRoomUpgrades: nextUpgrades,
      purchasedFurniture: state.purchasedFurniture,
      purchasedAccessories: state.purchasedAccessories,
    });
    set({ coins: nextCoins, purchasedRoomUpgrades: nextUpgrades });
    state.recordTransaction('expense', 'room-upgrade', cost, `Room upgrade: ${id}`);
    return true;
  },
  purchaseFurnitureItem: (id, cost) => {
    const state = useStore.getState();
    if (state.coins < cost || state.purchasedFurniture.includes(id)) return false;
    const nextCoins = state.coins - cost;
    const nextFurn = [...state.purchasedFurniture, id];
    saveShopData({ coins: nextCoins, purchasedUpgrades: state.purchasedUpgrades, robotColors: state.robotColors });
    saveEconomyData({
      transactions: state.economyTransactions,
      purchasedRoomUpgrades: state.purchasedRoomUpgrades,
      purchasedFurniture: nextFurn,
      purchasedAccessories: state.purchasedAccessories,
    });
    set({ coins: nextCoins, purchasedFurniture: nextFurn });
    state.recordTransaction('expense', 'furniture', cost, `Furniture: ${id}`);
    return true;
  },
  purchaseAccessory: (id, cost) => {
    const state = useStore.getState();
    if (state.coins < cost || state.purchasedAccessories.includes(id)) return false;
    const nextCoins = state.coins - cost;
    const nextAcc = [...state.purchasedAccessories, id];
    saveShopData({ coins: nextCoins, purchasedUpgrades: state.purchasedUpgrades, robotColors: state.robotColors });
    saveEconomyData({
      transactions: state.economyTransactions,
      purchasedRoomUpgrades: state.purchasedRoomUpgrades,
      purchasedFurniture: state.purchasedFurniture,
      purchasedAccessories: nextAcc,
    });
    set({ coins: nextCoins, purchasedAccessories: nextAcc });
    state.recordTransaction('expense', 'accessory', cost, `Accessory: ${id}`);
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

  // Disasters
  activeDisaster: null,
  disasterHistory: [],
  setActiveDisaster: (disaster) => set({ activeDisaster: disaster }),
  updateDisaster: (updates) => set((state) => {
    if (!state.activeDisaster) return {};
    return { activeDisaster: { ...state.activeDisaster, ...updates } };
  }),
  resolveDisaster: (entry) => set((state) => ({
    activeDisaster: null,
    disasterHistory: [...state.disasterHistory, entry],
  })),
  triggerDisaster: (type) => set((state) => {
    if (state.activeDisaster || state.activeHomeEvent) return {};
    const disasterType = type ?? DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)];
    const disaster = createDisaster(disasterType, state.simMinutes);
    return { activeDisaster: disaster };
  }),

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

  // Skill tree
  robotSkills: loadSkillData(),
  showSkillTree: false,
  setShowSkillTree: (show) => set({ showSkillTree: show }),
  unlockSkill: (robotId, skillId) => set((state) => {
    const current = state.robotSkills[robotId];
    if (current.unlockedSkills.includes(skillId)) return {};
    const next = {
      ...state.robotSkills,
      [robotId]: { unlockedSkills: [...current.unlockedSkills, skillId] },
    };
    saveSkillData(next);
    return { robotSkills: next };
  }),

  // Room themes
  globalTheme: loadRoomThemes().globalTheme,
  perRoomThemes: loadRoomThemes().perRoom,
  showThemeSelector: false,
  setShowThemeSelector: (show) => set({ showThemeSelector: show }),
  setGlobalTheme: (themeId) => set((state) => {
    const data: RoomThemesData = { globalTheme: themeId, perRoom: state.perRoomThemes };
    saveRoomThemes(data);
    return { globalTheme: themeId };
  }),
  setRoomTheme: (roomId, themeId) => set((state) => {
    const next = { ...state.perRoomThemes, [roomId]: themeId };
    saveRoomThemes({ globalTheme: state.globalTheme, perRoom: next });
    return { perRoomThemes: next };
  }),
  resetRoomThemes: () => {
    saveRoomThemes({ globalTheme: 'default', perRoom: {} });
    set({ globalTheme: 'default', perRoomThemes: {} });
  },

  // Robot pets
  petStates: loadPetData(),
  showPetPanel: false,
  setShowPetPanel: (show) => set({ showPetPanel: show }),
  feedPet: (petId, simMinutes) => set((s) => {
    const pet = s.petStates[petId];
    const next: PetsStorageData = {
      ...s.petStates,
      [petId]: {
        happiness: Math.min(100, pet.happiness + (petId === 'fish' ? 30 : 35)),
        totalFeedings: pet.totalFeedings + 1,
        lastFedAt: simMinutes,
      },
    };
    savePetData(next);
    return { petStates: next };
  }),
  decayPetHappiness: (amount) => set((s) => {
    const next: PetsStorageData = {
      fish: { ...s.petStates.fish, happiness: Math.max(0, s.petStates.fish.happiness - amount * 0.04) },
      hamster: { ...s.petStates.hamster, happiness: Math.max(0, s.petStates.hamster.happiness - amount * 0.05) },
    };
    savePetData(next);
    return { petStates: next };
  }),

  // Time challenges
  activeChallenge: null,
  challengeResult: null,
  challengeBestTimes: loadBestTimes(),
  showChallengePanel: false,
  setShowChallengePanel: (show) => set({ showChallengePanel: show }),
  startChallenge: (challenge, taskIds) => set({
    activeChallenge: {
      challenge,
      startedAt: Date.now(),
      tasksCompleted: 0,
      totalTasks: challenge.tasks.length,
      challengeTaskIds: taskIds,
    },
    challengeResult: null,
    showChallengePanel: false,
  }),
  advanceChallengeTask: () => set((s) => {
    if (!s.activeChallenge) return {};
    return {
      activeChallenge: {
        ...s.activeChallenge,
        tasksCompleted: s.activeChallenge.tasksCompleted + 1,
      },
    };
  }),
  completeChallenge: () => set((s) => {
    if (!s.activeChallenge) return {};
    const elapsed = (Date.now() - s.activeChallenge.startedAt) / 1000;
    const stars = getStarsForTime(s.activeChallenge.challenge, elapsed);
    const existing = s.challengeBestTimes[s.activeChallenge.challenge.id];
    const isNewBest = !existing || elapsed < existing.timeSeconds;
    const best: BestTime = {
      challengeId: s.activeChallenge.challenge.id,
      timeSeconds: elapsed,
      stars,
      completedAt: Date.now(),
    };
    if (isNewBest) saveBestTime(best);
    const coinReward = s.activeChallenge.challenge.coinReward * stars;
    return {
      activeChallenge: null,
      challengeResult: {
        challenge: s.activeChallenge.challenge,
        timeSeconds: elapsed,
        stars,
        isNewBest,
      },
      challengeBestTimes: isNewBest
        ? { ...s.challengeBestTimes, [best.challengeId]: best }
        : s.challengeBestTimes,
      coins: s.coins + coinReward,
    };
  }),
  cancelChallenge: () => set({ activeChallenge: null }),
  dismissChallengeResult: () => set({ challengeResult: null }),

  // ── Furniture crafting ──────────────────────────────────
  furnitureMaterials: initialFurnitureCraftingData.materials,
  craftedFurniture: initialFurnitureCraftingData.craftedItems,
  activeFurnitureCraft: initialFurnitureCraftingData.activeCraft,
  showFurnitureCrafting: false,
  setShowFurnitureCrafting: (show) => set({ showFurnitureCrafting: show }),

  addMaterials: (drops) => set((state) => {
    const next = { ...state.furnitureMaterials };
    for (const [mat, qty] of Object.entries(drops) as [keyof MaterialInventory, number][]) {
      next[mat] = (next[mat] ?? 0) + qty;
    }
    saveFurnitureCraftingData({ materials: next, craftedItems: state.craftedFurniture, activeCraft: state.activeFurnitureCraft });
    return { furnitureMaterials: next };
  }),

  startFurnitureCraft: (recipeId) => {
    const state = useStore.getState();
    const recipe = getRecipeById(recipeId);
    if (!recipe || state.activeFurnitureCraft) return false;
    if (!canAffordRecipe(state.furnitureMaterials, recipe)) return false;

    // Deduct materials
    const nextMats = { ...state.furnitureMaterials };
    for (const [mat, qty] of Object.entries(recipe.materials) as [keyof MaterialInventory, number][]) {
      nextMats[mat] = Math.max(0, (nextMats[mat] ?? 0) - qty);
    }

    const craft: ActiveCraft = {
      recipeId,
      startedAt: state.simMinutes,
      craftDuration: recipe.craftTimeSeconds / 60, // convert seconds to sim-minutes
    };

    saveFurnitureCraftingData({ materials: nextMats, craftedItems: state.craftedFurniture, activeCraft: craft });
    set({ furnitureMaterials: nextMats, activeFurnitureCraft: craft });
    return true;
  },

  completeFurnitureCraft: () => set((state) => {
    if (!state.activeFurnitureCraft) return {};
    const recipe = getRecipeById(state.activeFurnitureCraft.recipeId);
    if (!recipe) return { activeFurnitureCraft: null };

    const newItem: CraftedFurnitureItem = {
      id: `cfurn-${Date.now()}`,
      recipeId: recipe.id,
      craftedAt: Date.now(),
      placed: false,
      roomId: null,
      position: null,
    };
    const nextItems = [...state.craftedFurniture, newItem];
    saveFurnitureCraftingData({ materials: state.furnitureMaterials, craftedItems: nextItems, activeCraft: null });
    return { craftedFurniture: nextItems, activeFurnitureCraft: null };
  }),

  cancelFurnitureCraft: () => set((state) => {
    if (!state.activeFurnitureCraft) return {};
    // Refund materials
    const recipe = getRecipeById(state.activeFurnitureCraft.recipeId);
    if (!recipe) {
      saveFurnitureCraftingData({ materials: state.furnitureMaterials, craftedItems: state.craftedFurniture, activeCraft: null });
      return { activeFurnitureCraft: null };
    }
    const nextMats = { ...state.furnitureMaterials };
    for (const [mat, qty] of Object.entries(recipe.materials) as [keyof MaterialInventory, number][]) {
      nextMats[mat] = (nextMats[mat] ?? 0) + qty;
    }
    saveFurnitureCraftingData({ materials: nextMats, craftedItems: state.craftedFurniture, activeCraft: null });
    return { furnitureMaterials: nextMats, activeFurnitureCraft: null };
  }),

  placeCraftedFurniture: (itemId, roomId, position) => set((state) => {
    const nextItems = state.craftedFurniture.map((item) =>
      item.id === itemId ? { ...item, placed: true, roomId, position } : item,
    );
    saveFurnitureCraftingData({ materials: state.furnitureMaterials, craftedItems: nextItems, activeCraft: state.activeFurnitureCraft });
    return { craftedFurniture: nextItems };
  }),

  unplaceCraftedFurniture: (itemId) => set((state) => {
    const nextItems = state.craftedFurniture.map((item) =>
      item.id === itemId ? { ...item, placed: false, roomId: null, position: null } : item,
    );
    saveFurnitureCraftingData({ materials: state.furnitureMaterials, craftedItems: nextItems, activeCraft: state.activeFurnitureCraft });
    return { craftedFurniture: nextItems };
  }),

  deleteCraftedFurniture: (itemId) => set((state) => {
    const nextItems = state.craftedFurniture.filter((item) => item.id !== itemId);
    saveFurnitureCraftingData({ materials: state.furnitureMaterials, craftedItems: nextItems, activeCraft: state.activeFurnitureCraft });
    return { craftedFurniture: nextItems };
  }),

  // ── Home security ──────────────────────────────────
  installedCameras: initialSecurityData.installedCameras,
  alarmState: initialSecurityData.alarmState,
  patrolEnabled: initialSecurityData.patrolEnabled,
  activeIntruder: null,
  intruderHistory: initialSecurityData.intruderHistory,
  securityLog: [],
  showSecurityPanel: false,
  setShowSecurityPanel: (show) => set({ showSecurityPanel: show }),

  installCamera: (id) => set((state) => {
    if (state.installedCameras.includes(id)) return {};
    const next = [...state.installedCameras, id];
    saveSecurityData({ ...initialSecurityData, installedCameras: next, alarmState: state.alarmState, patrolEnabled: state.patrolEnabled, intruderHistory: state.intruderHistory });
    return { installedCameras: next };
  }),

  uninstallCamera: (id) => set((state) => {
    const next = state.installedCameras.filter((c) => c !== id);
    saveSecurityData({ ...initialSecurityData, installedCameras: next, alarmState: state.alarmState, patrolEnabled: state.patrolEnabled, intruderHistory: state.intruderHistory });
    return { installedCameras: next };
  }),

  setAlarmState: (alarmState) => set((state) => {
    saveSecurityData({ installedCameras: state.installedCameras, alarmState, patrolEnabled: state.patrolEnabled, intruderHistory: state.intruderHistory });
    return { alarmState };
  }),

  setPatrolEnabled: (patrolEnabled) => set((state) => {
    saveSecurityData({ installedCameras: state.installedCameras, alarmState: state.alarmState, patrolEnabled, intruderHistory: state.intruderHistory });
    return { patrolEnabled };
  }),

  setActiveIntruder: (event) => set({ activeIntruder: event }),

  updateIntruder: (updates) => set((state) => {
    if (!state.activeIntruder) return {};
    return { activeIntruder: { ...state.activeIntruder, ...updates } };
  }),

  resolveIntruder: () => set((state) => {
    if (!state.activeIntruder) return {};
    const entry = {
      type: state.activeIntruder.type,
      roomId: state.activeIntruder.roomId,
      detectedAt: state.activeIntruder.startedAt,
      resolvedAt: state.simMinutes,
    };
    const nextHistory = [...state.intruderHistory, entry].slice(-20); // keep last 20
    saveSecurityData({ installedCameras: state.installedCameras, alarmState: state.alarmState === 'triggered' ? 'armed-home' : state.alarmState, patrolEnabled: state.patrolEnabled, intruderHistory: nextHistory });
    return {
      activeIntruder: null,
      intruderHistory: nextHistory,
      alarmState: state.alarmState === 'triggered' ? 'armed-home' : state.alarmState,
    };
  }),

  addSecurityLog: (entry) => set((state) => {
    const log: SecurityLogEntry = { ...entry, id: `slog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    return { securityLog: [...state.securityLog.slice(-49), log] }; // keep last 50
  }),

  // ── Story Director ──────────────────────────────────
  storyArcs: [],
  setStoryArcs: (arcs) => set({ storyArcs: arcs.slice(-20) }), // keep last 20 arcs
  expandedStoryArcId: null,
  setExpandedStoryArcId: (id) => set({ expandedStoryArcId: id }),

  // ── Neighborhood ──────────────────────────────────
  neighborHouses: generateNeighborhood(42),
  streetView: false,
  visitingHouseId: null,
  activeVisits: [],
  showNeighborhoodPanel: false,
  walkingRobots: [],
  setStreetView: (show) => set((s) => ({
    streetView: show,
    visitingHouseId: show ? s.visitingHouseId : null,
  })),
  setVisitingHouseId: (id) => set({ visitingHouseId: id, streetView: false }),
  setShowNeighborhoodPanel: (show) => set({ showNeighborhoodPanel: show }),
  sendRobotToVisit: (robotId, houseId, activityId) => set((s) => {
    if (s.activeVisits.some((v) => v.robotId === robotId)) return s;
    const activity = VISIT_ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) return s;

    const house = s.neighborHouses.find((h) => h.id === houseId);
    const toX = house ? house.streetPosition * 28 : 28;

    const newVisit: VisitEvent = {
      robotId,
      houseId,
      startedAt: s.simMinutes,
      interaction: `${activity.emoji} ${activity.label}`,
      activityId: activity.id,
      duration: activity.duration,
      progress: 0,
      completed: false,
    };
    const updatedHouses = s.neighborHouses.map((h) =>
      h.id === houseId
        ? { ...h, visitingRobots: [...h.visitingRobots, robotId] }
        : h,
    );
    return {
      activeVisits: [...s.activeVisits, newVisit],
      neighborHouses: updatedHouses,
      walkingRobots: [...s.walkingRobots, { robotId, fromX: 0, toX, progress: 0, houseId }],
    };
  }),
  tickVisitProgress: () => set((s) => {
    if (s.simSpeed === 0 || s.activeVisits.length === 0) return s;

    // Progress walking robots
    const updatedWalking = s.walkingRobots
      .map((w) => ({ ...w, progress: Math.min(1, w.progress + 0.02 * s.simSpeed) }))
      .filter((w) => w.progress < 1);

    // Progress active visits
    const completedVisits: VisitEvent[] = [];
    const updatedVisits = s.activeVisits.map((v) => {
      if (v.completed) return v;
      const step = (100 / v.duration) * (1 / 60) * s.simSpeed; // ~1 sim-minute per real second at speed 1
      const newProgress = Math.min(100, v.progress + step);
      const nowComplete = newProgress >= 100;
      if (nowComplete) completedVisits.push({ ...v, progress: 100, completed: true });
      return { ...v, progress: newProgress, completed: nowComplete };
    });

    // Handle completions: award coins, social, happiness
    let coins = s.coins;
    let robots = s.robots;
    const transactions = [...s.economyTransactions];
    const notifications = [...s.notifications];

    for (const visit of completedVisits) {
      const activity = VISIT_ACTIVITIES.find((a) => a.id === visit.activityId);
      if (!activity) continue;

      coins += activity.coinReward;
      transactions.push({
        id: crypto.randomUUID(),
        type: 'income',
        category: 'task-reward',
        amount: activity.coinReward,
        label: `Visit: ${activity.label}`,
        timestamp: Date.now(),
        simMinutes: s.simMinutes,
      });

      const rid = visit.robotId;
      const needs = robots[rid].needs;
      robots = {
        ...robots,
        [rid]: {
          ...robots[rid],
          needs: {
            ...needs,
            social: Math.min(100, needs.social + activity.socialBoost),
            happiness: Math.min(100, needs.happiness + activity.happinessBoost),
            boredom: Math.max(0, needs.boredom - 15),
          },
          mood: 'happy' as RobotMood,
          thought: activity.outcomeMessage,
        },
      };

      notifications.push({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'Visit Complete',
        message: `${rid} returned from visiting! ${activity.outcomeMessage}`,
        createdAt: Date.now(),
      });
    }

    // Auto-remove completed visits after marking
    const houseUpdates = new Map<string, RobotId[]>();
    for (const v of completedVisits) {
      if (!houseUpdates.has(v.houseId)) {
        const house = s.neighborHouses.find((h) => h.id === v.houseId);
        houseUpdates.set(v.houseId, house ? [...house.visitingRobots] : []);
      }
      const arr = houseUpdates.get(v.houseId)!;
      const idx = arr.indexOf(v.robotId);
      if (idx !== -1) arr.splice(idx, 1);
    }

    const updatedHouses = houseUpdates.size > 0
      ? s.neighborHouses.map((h) =>
          houseUpdates.has(h.id)
            ? { ...h, visitingRobots: houseUpdates.get(h.id)! }
            : h,
        )
      : s.neighborHouses;

    const finalVisits = updatedVisits.filter((v) => !v.completed);

    return {
      activeVisits: finalVisits,
      neighborHouses: updatedHouses,
      walkingRobots: updatedWalking,
      coins,
      robots,
      economyTransactions: transactions.slice(-200),
      notifications: notifications.slice(-50),
    };
  }),
  recallRobot: (robotId) => set((s) => {
    const visit = s.activeVisits.find((v) => v.robotId === robotId);
    if (!visit) return s;
    const updatedHouses = s.neighborHouses.map((h) =>
      h.id === visit.houseId
        ? { ...h, visitingRobots: h.visitingRobots.filter((r) => r !== robotId) }
        : h,
    );
    return {
      activeVisits: s.activeVisits.filter((v) => v.robotId !== robotId),
      neighborHouses: updatedHouses,
      walkingRobots: s.walkingRobots.filter((w) => w.robotId !== robotId),
    };
  }),
  returnToPlayerHouse: () => set({ visitingHouseId: null, streetView: false }),
}));

// Each completion reduces duration by ~5%, capping at 30% faster
export function getTaskSpeedMultiplier(taskType: TaskType): number {
  const count = useStore.getState().taskExperience[taskType] ?? 0;
  return Math.max(0.7, 1 - count * 0.05);
}
