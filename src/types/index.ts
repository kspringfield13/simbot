export type RoomId = string;

export type RobotId = 'sim' | 'chef' | 'sparkle';

export const ROBOT_IDS: RobotId[] = ['sim', 'chef', 'sparkle'];

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
  | 'general'
  | 'seasonal'
  | 'mowing'
  | 'watering'
  | 'leaf-blowing'
  | 'weeding'
  | 'feeding-fish'
  | 'feeding-hamster'
  | 'visiting';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export type TaskStatus = 'queued' | 'walking' | 'working' | 'completed';
export type TaskSource = 'user' | 'ai' | 'demo' | 'schedule';

export interface ScheduledTask {
  id: string;
  command: string;
  timeMinutes: number; // 0-1439 (sim-minutes within a day)
  assignedTo: RobotId;
  enabled: boolean;
}

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
  assignedTo: RobotId;
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
export type VisitorEventType = 'doorbell' | 'package' | 'visitor';

export interface VisitorEvent {
  type: VisitorEventType;
}

export type CameraMode = 'overview' | 'follow' | 'pov';

export interface CameraPreset {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  builtIn?: boolean;
}

export type SimPeriod = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherType = 'sunny' | 'rainy' | 'snowy';

export type DeviceType = 'light' | 'thermostat' | 'tv';

export interface DeviceState {
  on: boolean;
  temperature?: number; // thermostat only (°F)
}

export interface RobotInstanceState {
  position: [number, number, number];
  target: [number, number, number] | null;
  state: RobotState;
  path: NavigationPoint[];
  currentPathIndex: number;
  currentAnimation: TaskType;
  rotationY: number;
  thought: string;
  mood: RobotMood;
  needs: RobotNeeds;
  battery: number; // 0-100: drains while working/moving, recharges at charging station
  isCharging: boolean;
}

export interface RobotConfig {
  id: RobotId;
  name: string;
  color: string;
  startPosition: [number, number, number];
  favoriteRoom: RoomId;
  preferredRooms: RoomId[];
  curiosity: number;
  warmth: number;
  playfulness: number;
  diligence: number;
  sensitivity: number;
  description: string;
}

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

export interface DiaryEntry {
  id: string;
  robotId: RobotId;
  simMinutes: number;      // sim time when entry was created
  text: string;             // personality-driven journal text
  mood: RobotMood;
  battery: number;
  taskType?: TaskType;      // if related to a task completion
  roomId?: RoomId;
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

// ── Robot Personality v2 ──────────────────────────────────
export interface RobotPersonalityData {
  taskCounts: Partial<Record<TaskType, number>>;       // how many times each task done
  roomTimeMins: Partial<Record<RoomId, number>>;       // sim-minutes spent in each room
  totalTasksDone: number;
}

export interface PersonalityTrait {
  label: string;        // e.g. "Loves vacuuming"
  type: 'task' | 'room';
  key: string;          // taskType or roomId
  strength: number;     // 0-1 normalized preference strength
}

// ── Robot Social / Friendships ──────────────────────────────
export interface FriendshipPair {
  key: string;                // sorted pair key e.g. "chef-sim"
  robotA: RobotId;
  robotB: RobotId;
  level: number;              // 0-100 friendship level
  totalChats: number;         // lifetime interaction count
  lastChatAt: number;         // sim-minutes when last chatted
}

export interface ActiveChat {
  robotA: RobotId;
  robotB: RobotId;
  lines: { speaker: RobotId; text: string }[];
  currentLineIndex: number;
  startedAt: number;          // sim-minutes
  nextLineAt: number;         // sim-minutes when next line shows
}

// ── Disasters ──────────────────────────────────────────
export type DisasterType = 'fire' | 'flood' | 'earthquake';
export type DisasterPhase = 'detection' | 'response' | 'resolution';

export interface Disaster {
  id: string;
  type: DisasterType;
  phase: DisasterPhase;
  roomId: RoomId;
  severity: number;        // 1-3, escalates if not handled
  progress: number;        // 0-100, how much has been resolved
  startedAt: number;       // sim-minutes
  detectedBy: RobotId | null;
  respondingRobots: RobotId[];
  resolvedAt: number | null;
}

export interface DisasterHistoryEntry {
  id: string;
  type: DisasterType;
  roomId: RoomId;
  maxSeverity: number;
  startedAt: number;
  resolvedAt: number;
  detectedBy: RobotId;
  respondingRobots: RobotId[];
}

// ── Home Events ──────────────────────────────────────────
export type HomeEventType = 'plumbing-leak' | 'power-outage' | 'pest-invasion';
export type HomeEventPhase = 'detection' | 'response' | 'resolution';

export interface HomeEvent {
  id: string;
  type: HomeEventType;
  phase: HomeEventPhase;
  roomId: RoomId;
  startedAt: number;        // sim-minutes when event began
  detectedBy: RobotId | null;
  respondingRobots: RobotId[];
  resolvedAt: number | null;  // sim-minutes when resolved
}

export interface HomeEventHistoryEntry {
  id: string;
  type: HomeEventType;
  roomId: RoomId;
  startedAt: number;
  resolvedAt: number;
  detectedBy: RobotId;
  respondingRobots: RobotId[];
}

// ── Robot Skill Tree ──────────────────────────────────────────
export type SkillSpecialization = 'chef' | 'cleaning' | 'handyman';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  specialization: SkillSpecialization;
  requiredTaskTypes: TaskType[];
  requiredCount: number;
  prerequisiteId: string | null;
  speedBonus: number;       // e.g. 0.10 = 10% faster
  qualityBonus: number;     // e.g. 0.10 = 10% more cleanliness boost
  affectedTasks: TaskType[];
  row: number;              // visual row in tree (0=top/root)
  col: number;              // visual column (0=left/main, 1=right/branch)
}

export interface RobotSkillData {
  unlockedSkills: string[];
}

// ── Timelapse Replay ──────────────────────────────────────────
export type TimelapseEventType = 'position' | 'task-start' | 'task-complete' | 'room-change';

export interface TimelapseEvent {
  type: TimelapseEventType;
  simMinutes: number;       // sim time when event was recorded
  robotId?: RobotId;
  position?: [number, number, number];
  taskType?: TaskType;
  roomId?: RoomId;
  cleanliness?: number;     // for room-change events
}

export interface TimelapsePlaybackState {
  playing: boolean;
  speed: 30 | 60 | 120;
  startSimMinutes: number;  // beginning of the replay window
  endSimMinutes: number;    // end of the replay window
  currentSimMinutes: number; // current playback position
}

// ── Home Security ──────────────────────────────────────────
export type IntruderPhase = 'detected' | 'responding' | 'resolved';

export type IntruderType = 'burglar' | 'raccoon' | 'prankster';

export interface IntruderEvent {
  id: string;
  type: IntruderType;
  phase: IntruderPhase;
  roomId: RoomId;
  startedAt: number;         // sim-minutes
  detectedBy: RobotId | null;
  respondingRobots: RobotId[];
  resolvedAt: number | null;
  cameraDetected: boolean;   // true if camera spotted them
  alarmTriggered: boolean;   // true if alarm went off
}
