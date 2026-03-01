# SimBot Codebase Deep Research & Architecture Analysis

**Research Date:** March 1, 2026  
**Scope:** Complete investigation for Smart Scheduling AI feature implementation  
**Total TypeScript Files:** 170+

---

## 1. OVERALL PROJECT STRUCTURE

### Directory Hierarchy

```
/home/kspri/projects/simbot/
├── src/
│   ├── App.tsx                           # Main React component
│   ├── main.tsx                          # Vite entry point
│   ├── config/                           # Configuration files
│   │   ├── robots.ts                     # Robot configs (sim, chef, sparkle)
│   │   ├── challenges.ts                 # Mini-game challenges
│   │   ├── devices.ts                    # Smart device config
│   │   ├── floorPlans.ts                 # Multiple floor plan definitions
│   │   ├── seasons.ts                    # Seasonal task/modifier config
│   │   ├── skills.ts                     # Skill tree definitions
│   │   ├── shop.ts                       # Shop upgrades and pricing
│   │   ├── furnitureCrafting.ts          # Furniture crafting recipes
│   │   ├── roomThemes.ts                 # Room decoration themes
│   │   ├── decorations.ts                # Decoration items
│   │   ├── outsideNPCs.ts                # Visitor NPC definitions
│   │   ├── pets.ts                       # Pet configurations
│   │   ├── conversations.ts              # NPC dialogue
│   │   ├── diary.ts                      # Diary entry templates
│   │   └── security.ts                   # Security system config
│   ├── types/
│   │   └── index.ts                      # All TypeScript interfaces & types
│   ├── stores/
│   │   ├── useStore.ts                   # Zustand state management (2300+ LOC)
│   │   └── useRobotNames.ts              # Robot custom naming
│   ├── systems/
│   │   ├── AIBrain.ts                    # AI decision engine (520 LOC)
│   │   ├── RoomState.ts                  # Room hygiene/needs (200+ LOC)
│   │   ├── ObstacleMap.ts                # Collision detection (68 LOC)
│   │   ├── TimeSystem.ts                 # Time/lighting management (153 LOC)
│   │   ├── VisitorSystem.ts              # Visitor/guest events (197 LOC)
│   │   ├── SmartSchedule.ts              # Pattern recognition & scheduling (323 LOC)
│   │   ├── Achievements.ts               # Achievement tracking
│   │   ├── StoryDirector.ts              # Story arc management
│   │   ├── Personality.ts                # Robot personality learning
│   │   ├── Neighborhood.ts               # Neighbor/visit system
│   │   ├── Economy.ts                    # Coin/economy system
│   │   ├── HomeEvents.ts                 # Disaster/plumbing events
│   │   ├── DisasterEvents.ts             # Disaster management
│   │   ├── MoodMusicEngine.ts            # Music based on robot mood
│   │   ├── Leaderboard.ts                # Session stats and leaderboards
│   │   └── VoiceCommands.ts              # Voice input processing
│   ├── utils/
│   │   ├── homeLayout.ts                 # Room definitions & task anchors (183 LOC)
│   │   ├── pathfinding.ts                # Waypoint-based navigation (77 LOC)
│   │   ├── furnitureRegistry.ts          # Furniture catalog (185 LOC)
│   │   ├── evolution.ts                  # Robot evolution/aging system
│   │   ├── miniGameScores.ts             # Mini-game scoring system
│   │   ├── demoTasks.ts                  # Demo command sequences
│   │   └── [utilities]                   # Various helper functions
│   ├── hooks/
│   │   ├── useTaskRunner.ts              # Task execution loop (343 LOC)
│   │   ├── useVoice.ts                   # Voice input hook
│   │   ├── useAmbientSounds.ts           # Audio management
│   │   └── useKeyboardShortcuts.ts       # Keyboard input
│   ├── components/
│   │   ├── scene/
│   │   │   ├── HomeScene.tsx             # Main 3D scene (57 LOC)
│   │   │   ├── Robot.tsx                 # Robot 3D model & movement (176 LOC)
│   │   │   ├── FurnitureModels.tsx       # Furniture rendering (137 LOC)
│   │   │   ├── PetCat.tsx                # Cat procedural geometry (391 LOC)
│   │   │   ├── VisitorNPC.tsx            # Guest character rendering
│   │   │   ├── RoomThemeEffects.tsx      # Theme visual effects
│   │   │   ├── WeatherEffects.tsx        # Rain/snow effects
│   │   │   ├── DisasterEffects.tsx       # Fire/flood visual effects
│   │   │   ├── SmartDevices.tsx          # Device visual representations
│   │   │   ├── SeasonalDecorations.tsx   # Holiday decorations
│   │   │   ├── Room.tsx                  # Room mesh rendering
│   │   │   ├── Walls.tsx                 # Wall rendering
│   │   │   └── [other effects]
│   │   ├── camera/
│   │   │   └── CameraController.tsx      # 3-mode camera system (233 LOC)
│   │   ├── systems/
│   │   │   ├── TaskProcessor.tsx         # Headless task executor (10 LOC)
│   │   │   ├── MiniGameTrigger.tsx       # Mini-game trigger system
│   │   │   ├── ChallengeSystem.tsx       # Challenge management
│   │   │   ├── ScheduleSystem.tsx        # Schedule enforcement
│   │   │   └── [system components]
│   │   ├── game/
│   │   │   ├── GameUI.tsx                # Main HUD (233 LOC)
│   │   │   ├── ThoughtBubble.tsx         # Thought display (20 LOC)
│   │   │   ├── TimeBar.tsx               # Time visualization
│   │   │   ├── RoomStatus.tsx            # Room status display
│   │   │   └── SpeedControls.tsx         # Speed control buttons
│   │   └── ui/
│   │       ├── StatsPanel.tsx            # Statistics dashboard
│   │       ├── StatsGraphs.tsx           # Graphing component
│   │       ├── SmartSchedulePanel.tsx    # Smart schedule insights UI
│   │       ├── SchedulePanel.tsx         # Daily schedule editor
│   │       ├── MiniGamesPanel.tsx        # Mini-games hub
│   │       ├── CookingMiniGame.tsx       # Cooking challenge
│   │       ├── RepairMiniGame.tsx        # Pipe repair puzzle
│   │       ├── GardenMiniGame.tsx        # Garden tending game
│   │       ├── ChallengePanel.tsx        # Challenge browser
│   │       ├── EvolutionPanel.tsx        # Robot evolution display
│   │       ├── ChatPanel.tsx             # Chat history
│   │       ├── RobotTerminal.tsx         # Command input
│   │       ├── SaveLoadSystem.tsx        # Save/load management
│   │       ├── NeedsIndicator.tsx        # Robot needs bars
│   │       ├── [other UI panels]
│   ├── audio/
│   │   ├── SoundEffects.ts               # Sound playback
│   │   └── SoundController.tsx           # Audio management
│   └── [vite-env.d.ts and config files]
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
└── vite.config.ts                      # Vite build config
```

---

## 2. HOW ROOMS, ROBOTS, TASKS & SCHEDULING WORK

### Rooms System

**File:** `/home/kspri/projects/simbot/src/utils/homeLayout.ts`  
**Type Definition:** `Room` interface in `types/index.ts`

**Structure:**
- Each room has: `id`, `name`, `position [x, y, z]`, `size [width, depth]`, `color`
- Rooms can be on floor 0 or 1 (multi-floor support)
- Dynamic floor plans: 6 standard rooms + floor 2 variants
- Room overrides can be saved to localStorage via `ROOM_LAYOUT_KEY`

**Room Decay System** (`RoomState.ts`):
- Every room has: `cleanliness`, `tidiness`, `routine` scores (0-100)
- Per-minute decay rates vary by room type:
  - Kitchen: 0.16 cleanliness/min, 0.14 tidiness/min (fastest decay)
  - Bathroom: 0.14/0.11
  - Living room: 0.1/0.12
  - Bedroom: 0.07/0.1 (slowest)
- Task completion applies boosts: `cleaning +24 cleanliness`, `laundry +28 tidiness`, etc.

**Room Scoring Formula** (`scoreRoomAttention`):
```
score = (dirtiness × 0.48) + (clutter × 0.32) + (routineNeed × 0.2)
      + getRoutineBias(period, roomId)
      + proximityBonus
```
Used by AI to decide which room needs attention most.

---

### Robots System

**Files:**
- `/home/kspri/projects/simbot/src/config/robots.ts` - Robot configs
- `/home/kspri/projects/simbot/src/types/index.ts` - `RobotInstanceState`, `RobotConfig`

**Three Robots (Multi-Robot Architecture):**
1. **Sim** (Blue, #1a8cff)
   - General home assistant
   - Start: [0, 0, -2]
   - Favorite room: living-room
   - Traits: curiosity 0.8, warmth 0.9, playfulness 0.7, diligence 0.75

2. **Chef** (Orange, #f59e0b)
   - Kitchen specialist
   - Start: [8, 0, -12]
   - Favorite room: kitchen
   - Traits: diligence 0.9 (very focused)

3. **Sparkle** (Teal, #2dd4bf)
   - Cleaning/bathroom specialist
   - Start: [8, 0, 8]
   - Favorite room: bathroom
   - Traits: sensitivity 0.9, diligence 0.85

**Robot State Structure** (`RobotInstanceState`):
```typescript
{
  position: [x, y, z],
  target: [x, y, z] | null,
  state: 'idle' | 'walking' | 'working',
  path: NavigationPoint[],
  currentPathIndex: number,
  currentAnimation: TaskType,
  rotationY: number,
  thought: string,
  mood: RobotMood (content|focused|curious|routine|tired|lonely|bored|happy),
  needs: {
    energy: 0-100,      // -0.08/min working, +0.15/min idle
    happiness: 0-100,   // +0.02/min working
    social: 0-100,      // -0.02/min always
    boredom: 0-100      // +0.06/min idle, -0.05/min working
  },
  battery: 0-100,       // Electric power level
  isCharging: boolean,
  currentFloor: 0 | 1
}
```

**Store Management** (`useStore.ts`):
- Zustand store maintains: `robots: Record<RobotId, RobotInstanceState>`
- `activeRobotId` tracks which robot user is controlling
- All robot updates go through setters: `setRobotPosition(robotId, pos)`, etc.
- Tasks have `assignedTo: RobotId` field for multi-robot scheduling

---

### Tasks & Task Processing

**File:** `/home/kspri/projects/simbot/src/hooks/useTaskRunner.ts` (343 LOC)

**Task Lifecycle:**
1. **Queued** → 2. **Walking** → 3. **Working** → 4. **Completed** (removed after 1.5s)

**Task Structure:**
```typescript
{
  id: UUID,
  command: string,                    // Natural language: "clean kitchen"
  source: 'user' | 'ai' | 'demo' | 'schedule',
  targetRoom: RoomId,
  targetPosition: [x, y, z],
  status: TaskStatus,
  progress: 0-100,
  description: string,
  taskType: TaskType,                 // 19 types: cleaning, vacuuming, dishes, etc.
  workDuration: number,               // Minutes to complete (modified by speed multiplier)
  createdAt: number,
  assignedTo: RobotId                 // Which robot does this
}
```

**Task Types** (19 total):
Household: cleaning, vacuuming, dishes, laundry, organizing, cooking, bed-making, scrubbing, sweeping, grocery-list  
Outdoor: mowing, watering, leaf-blowing, weeding  
Pets: feeding-fish, feeding-hamster  
Other: general, seasonal, visiting

**Command Mapping** → Task Target:
- `findTaskTarget(command)` parses natural language commands
- Returns `TaskTarget`: roomId, position, description, taskType, workDuration, response, thought
- Mapping in `homeLayout.ts` with NLP-like phrase matching

**Task Speed Learning:**
- Base speed: 100%
- Each completion: -5% (gets faster)
- Minimum: 70% (30% speed boost at cap)
- Tracked in `taskExperience: Partial<Record<TaskType, number>>`

---

### Scheduling System

**Files:**
- `/home/kspri/projects/simbot/src/types/index.ts` - `ScheduledTask` interface
- `/home/kspri/projects/simbot/src/components/ui/SchedulePanel.tsx` - UI
- `/home/kspri/projects/simbot/src/systems/SmartSchedule.ts` - Smart pattern analysis (323 LOC)

**Manual Scheduling** (SchedulePanel):
```typescript
interface ScheduledTask {
  id: string,
  command: string,                    // e.g. "vacuum living room"
  timeMinutes: number,                // 0-1439 (within 24-hour sim day)
  assignedTo: RobotId,                // Which robot does it
  enabled: boolean
}
```
- Stored in localStorage: `simbot-scheduled-tasks`
- Currently loaded on app start but NOT yet auto-executed
- UI allows adding/removing/toggling via SchedulePanel

**Smart Schedule System** (`SmartSchedule.ts`):
Pattern recognition engine that learns from user behavior:

```typescript
interface CleaningEvent {
  roomId: RoomId,
  taskType: TaskType,
  simMinutes: number,
  timeOfDay: number,      // 0-1439 minutes within day
  source: 'user' | 'ai' | 'schedule',
  cleanlinessBeforeTask: number
}

interface RoomPattern {
  roomId: string,
  avgDirtinessAtUserAction: number,   // Lower = user intervenes earlier
  userInteractionCount: number,
  totalTaskCount: number,
  hourlyActivity: number[],            // 24 buckets per day
  peakHour: number,                    // 0-23 when most activity
  avgDirtyRate: number,                // Per-hour decay estimate
  optimalCleanTime: number,            // 0-1439 minutes
  topTasks: { taskType: string; count: number }[]
}
```

**Key Functions:**
- `recordCleaningEvent(data, event)` - Add task completion to history
- `analyzePatterns(data, simMinutes)` - Every 60 sim-minutes, recalculate patterns
- `getAutoScheduleEntries(data)` - Convert patterns → recommended schedule
- `getConfidenceLevel(data)` - 'low'|'medium'|'high' (based on event count)

**Storage:** `simbot-smart-schedule` in localStorage

---

## 3. EXISTING STATS PANEL IMPLEMENTATION

**File:** `/home/kspri/projects/simbot/src/components/ui/StatsPanel.tsx`

**Displayed Metrics:**
1. **Total Tasks Completed** - cumulative counter
2. **Tasks by Type** - breakdown of cleaning, vacuuming, dishes, etc.
3. **Tasks by Room** - how many tasks per room
4. **Average Cleanliness** - overall home hygiene score
5. **Home Event History** - disasters/emergencies that occurred
6. **Room Status** - current cleanliness/tidiness of each room
7. **Pet Happiness** - fish and hamster states

**Tabs in StatsPanel:**
- Overview
- Tasks
- Rooms
- Events
- Pets

**Related Files:**
- `/home/kspri/projects/simbot/src/components/ui/StatsGraphs.tsx` - Graphing
- `/home/kspri/projects/simbot/src/systems/Leaderboard.ts` - Session stats tracking

---

## 4. LOCALSTORAGE USAGE PATTERNS

**Current localStorage Keys** (used throughout):

| Key | Purpose | File | Scope |
|-----|---------|------|-------|
| `simbot-camera-presets` | Saved camera views | useStore.ts | Non-critical |
| `simbot-furniture-positions` | Furniture rearrangement | useStore.ts | Non-critical |
| `simbot-scheduled-tasks` | Manual daily schedule | useStore.ts | **Important** |
| `simbot-room-layout` | Room editor customizations | useStore.ts | Non-critical |
| `simbot-custom-walls` | Wall editor state | useStore.ts | Non-critical |
| `simbot-shop` | Coins, upgrades, colors | useStore.ts | **Important** |
| `simbot-crafting` | Robot parts, custom robots | useStore.ts | Non-critical |
| `simbot-devices` | Smart device state (thermostat, lights) | useStore.ts | Non-critical |
| `simbot-friendships` | Robot relationships | useStore.ts | Non-critical |
| `simbot-room-decorations` | Room decor state | useStore.ts | Non-critical |
| `simbot-skills` | Skill tree progress per robot | useStore.ts | Non-critical |
| `simbot-room-themes` | Theme selections | useStore.ts | Non-critical |
| `simbot-pets` | Pet happiness/feeding | useStore.ts | Non-critical |
| `simbot-smart-schedule` | **Smart schedule patterns** | SmartSchedule.ts | **Important** |
| `simbot-challenge-best-times` | Mini-game high scores | challenges.ts | Non-critical |
| `simbot-evolution` | Robot evolution stages | evolution.ts | **Important** |
| `simbot-security` | Security system state | useStore.ts | Non-critical |
| `simbot-floor-plan` | Selected floor plan | useStore.ts | Non-critical |
| `simbot-economy` | Coin transaction history | useStore.ts | Non-critical |
| `simbot-furniture-crafting` | Furniture recipe progress | useStore.ts | Non-critical |
| `simbot-personality-data` | Per-robot task/room preferences | Personality.ts | Non-critical |
| `simbot-leaderboard` | Session statistics | Leaderboard.ts | Non-critical |

**Pattern Observed:**
- Load function tries to get item, parse JSON, with fallback to defaults
- Save function wraps localStorage.setItem with try-catch
- All "ignore quota errors" philosophy for graceful degradation

---

## 5. SIM STATE MANAGEMENT APPROACH

**Framework:** Zustand (lightweight React state management)  
**File:** `/home/kspri/projects/simbot/src/stores/useStore.ts` (2300+ LOC)

**Store Structure:**
```typescript
interface SimBotStore {
  // === MULTI-ROBOT STATE ===
  robots: Record<RobotId, RobotInstanceState>;
  activeRobotId: RobotId;
  setActiveRobotId: (id: RobotId) => void;
  
  // Per-robot setters (21 setters):
  setRobotPosition, setRobotTarget, setRobotState, setRobotPath,
  setCurrentPathIndex, setCurrentAnimation, setRobotRotationY,
  setRobotThought, setRobotMood, updateRobotNeeds, setRobotBattery,
  setRobotCharging, setRobotFloor, ...
  
  // === TIME & SIMULATION ===
  simMinutes: number;
  simSpeed: SimSpeed (0|1|10|60);
  simPeriod: SimPeriod;
  setSimSpeed: (speed) => void;
  advanceTime: (deltaSeconds) => void;  // Main time progression
  
  // === ROOM STATE ===
  roomNeeds: Record<RoomId, RoomNeedState>;
  selectedRoomId: RoomId | null;
  setSelectedRoomId: (id) => void;
  applyRoomTaskResult: (roomId, taskType, robotId?) => void;
  
  // === TASK QUEUE ===
  tasks: Task[];
  addTask: (task) => void;
  updateTask: (id, updates) => void;
  removeTask: (id) => void;
  clearQueuedAiTasks: (robotId?) => void;
  clearActiveTaskState: (robotId) => void;
  
  // === MESSAGING ===
  messages: ChatMessage[];
  addMessage: (message) => void;
  
  // === SCHEDULED TASKS ===
  scheduledTasks: ScheduledTask[];
  addScheduledTask: (task) => void;
  removeScheduledTask: (id) => void;
  toggleScheduledTask: (id) => void;
  
  // === CAMERA ===
  cameraMode: CameraMode;
  cameraSnapTarget: [x,y,z] | null;
  setCameraMode: (mode) => void;
  cycleCameraMode: () => void;
  requestCameraSnap, clearCameraSnap, ...
  
  // === UI STATE ===
  showStats: boolean;
  setShowStats: (show) => void;
  statsTab: string;
  setStatsTab: (tab) => void;
  showSchedulePanel, setShowSchedulePanel,
  showMiniGames, setShowMiniGames,
  showCookingGame, setShowCookingGame,
  showRepairGame, setShowRepairGame,
  showGardenGame, setShowGardenGame,
  ... (40+ UI toggles)
  
  // === STATISTICS ===
  totalTasksCompleted: number;
  tasksByType: Record<TaskType, number>;
  tasksByRoom: Record<RoomId, number>;
  sessionStats: RobotSessionStats[];
  leaderboard: LeaderboardData;
  
  // === LEARNING & PROGRESSION ===
  taskExperience: Partial<Record<TaskType, number>>;
  recordTaskCompletion: (taskType) => void;
  robotEvolutions: Record<RobotId, RobotEvolution>;
  robotColors: Partial<Record<RobotId, string>>;
  robotPersonalities: Record<RobotId, RobotPersonalityData>;
  
  // === AUDIO ===
  soundMuted: boolean;
  setSoundMuted: (muted) => void;
  
  // === DEMO & OVERRIDE ===
  demoMode: boolean;
  setDemoMode: (enabled) => void;
  overrideUntilSimMinute: number;
  setOverrideUntil: (minute) => void;
  
  // === PERSISTENCE ===
  floorPlanId: string;
  setFloorPlanId: (id) => void;
  furniturePositions: Record<string, [x, z]>;
  setFurniturePosition: (id, [x, z]) => void;
  cameraPresets: CameraPreset[];
  ... (20+ persistence functions)
  
  // === NOTIFICATIONS ===
  notifications: AppNotification[];
  addNotification: (notif) => void;
  removeNotification: (id) => void;
  
  // === MINI-GAMES & EVENTS ===
  completedChallenges: string[];
  recordChallengeCompletion: (id) => void;
  activeHomeEvent: HomeEvent | null;
  homeEventHistory: HomeEventHistoryEntry[];
  ... (multi-page UI state)
}
```

**Key Time Progression Hook** (`advanceTime`):
Called every frame with delta seconds. Updates:
1. simMinutes counter
2. Room needs decay per room
3. All robots' need decay (energy, happiness, social, boredom)
4. Battery drain/charge
5. Check for scheduled task triggers
6. AI decision intervals

---

## 6. TYPES & INTERFACES FOR ROOMS, ROBOTS, TASKS

**Location:** `/home/kspri/projects/simbot/src/types/index.ts` (357 LOC)

### Key Types:

**RoomId:**
```typescript
type RoomId = string;
// Examples: 'kitchen', 'bedroom', 'living-room', 'bathroom', 'laundry', 'hallway', 'yard', 'f2-bedroom', 'f2-office', 'f2-balcony'
```

**RobotId:**
```typescript
type RobotId = 'sim' | 'chef' | 'sparkle';
const ROBOT_IDS: RobotId[] = ['sim', 'chef', 'sparkle'];
```

**Room Interface:**
```typescript
interface Room {
  id: RoomId;
  name: string;
  position: [x, y, z];
  size: [width, depth];
  color: string;
  furniture?: Furniture[];
  floor?: FloorLevel (0 | 1);
}
```

**RobotInstanceState:**
```typescript
interface RobotInstanceState {
  position: [x, y, z];
  target: [x, y, z] | null;
  state: RobotState ('idle'|'walking'|'working');
  path: NavigationPoint[];
  currentPathIndex: number;
  currentAnimation: TaskType;
  rotationY: number;
  thought: string;
  mood: RobotMood;
  needs: RobotNeeds;
  battery: 0-100;
  isCharging: boolean;
  currentFloor: FloorLevel;
}
```

**Task:**
```typescript
interface Task {
  id: string (UUID);
  command: string;
  source: TaskSource ('user'|'ai'|'demo'|'schedule');
  targetRoom: RoomId;
  targetPosition: [x, y, z];
  status: TaskStatus ('queued'|'walking'|'working'|'completed');
  progress: 0-100;
  description: string;
  taskType: TaskType;
  workDuration: number;
  createdAt: number;
  assignedTo: RobotId;
}
```

**ScheduledTask:**
```typescript
interface ScheduledTask {
  id: string;
  command: string;
  timeMinutes: number;     // 0-1439 (within 24-hour day)
  assignedTo: RobotId;
  enabled: boolean;
}
```

**RobotNeeds:**
```typescript
interface RobotNeeds {
  energy: 0-100;        // Depletes with tasks, recharges idle/charging
  happiness: 0-100;     // Increases with variety, social, task completion
  social: 0-100;        // Increases with user interaction
  boredom: 0-100;       // Increases when idle, decreases with tasks
}
```

**RoomNeedState:**
```typescript
interface RoomNeedState {
  cleanliness: 0-100;
  tidiness: 0-100;
  routine: 0-100;
  decayCleanliness: number;  // Per-minute rate (room-specific)
  decayTidiness: number;
  lastServicedAt: number;
}
```

**RobotEvolution:**
```typescript
interface RobotEvolution {
  totalTasksCompleted: number;
  totalWorkTime: number;
  taskSpecialty: Partial<Record<TaskType, number>>;
  firstActiveAt: number;
  lastActiveAt: number;
  stage: EvolutionStage ('novice'|'apprentice'|'expert'|'master'|'legend');
  stageUnlockedAt: Record<EvolutionStage, number | null>;
}
```

**NavigationPoint:**
```typescript
interface NavigationPoint {
  id: string;
  position: [x, y, z];
  pauseAtDoorway?: boolean;
  floor?: FloorLevel;
  isStairs?: boolean;
  isElevator?: boolean;
}
```

---

## 7. HOW MINI-GAMES INTEGRATE WITH THE SIM

**Files:**
- `/home/kspri/projects/simbot/src/components/ui/MiniGamesPanel.tsx` - Hub UI
- `/home/kspri/projects/simbot/src/components/ui/CookingMiniGame.tsx` - Cooking Challenge
- `/home/kspri/projects/simbot/src/components/ui/RepairMiniGame.tsx` - Pipe Repair
- `/home/kspri/projects/simbot/src/components/ui/GardenMiniGame.tsx` - Garden Tending
- `/home/kspri/projects/simbot/src/components/systems/MiniGameTrigger.tsx` - Trigger System
- `/home/kspri/projects/simbot/src/config/challenges.ts` - Challenge Definitions

**Trigger Mechanism:**
- `MiniGameTrigger` component watches for task completions
- 15% chance per task of that type to trigger mini-game
- Task type mapping:
  - Cooking tasks → Cooking Challenge
  - Cleaning/scrubbing/dishes → Pipe Repair
  - Watering/weeding/mowing → Garden Tending

**Mini-Game Features:**
1. **Cooking Challenge**: Match ingredients in order before time runs out
   - Tasks: cooking, dishes
   - Reward: 12-25 coins
   - Multiple recipes with unique combos

2. **Pipe Repair Puzzle**: Rotate tiles to connect water flow
   - Tasks: cleaning, scrubbing, dishes
   - Reward: 15-35 coins
   - Logic puzzle mechanic

3. **Garden Tending**: Plant, water, harvest
   - Tasks: watering, weeding, mowing
   - Reward: 3-10 coins per plant
   - Multi-plot management

**Challenge System** (`challenges.ts`):
```typescript
interface ChallengeDefinition {
  id: string;
  name: string;
  roomId: RoomId;
  description: string;
  tasks: { taskType: TaskType; command: string }[];
  starThresholds: [3-star, 2-star, 1-star] (seconds);
  coinReward: number;
}
```

7 challenges defined:
- Kitchen Blitz, Bedroom Sprint, Living Room Rush, Bathroom Blitz, Laundry Dash, Yard Cleanup, Whole House Hustle

**Integration Points:**
- Mini-game completion rewards coins → stored in `simbot-shop`
- Star ratings tracked in `simbot-challenge-best-times`
- Mini-game triggers saved as notifications
- UI modals prevent accidental sim progression during gameplay

---

## 8. AI DECISION ENGINE (CRITICAL FOR SMART SCHEDULING)

**File:** `/home/kspri/projects/simbot/src/systems/AIBrain.ts` (520 LOC)

**Key Components:**

### SOUL (Robot Personality):
Per-robot traits that influence behavior:
```typescript
{
  id: RobotId,
  name: string,
  color: string,
  curiosity: 0-1,      // 0.8 = Sim, 0.5 = Chef, 0.6 = Sparkle
  warmth: 0-1,
  playfulness: 0-1,
  diligence: 0-1,      // How hard they push to clean
  sensitivity: 0-1     // How much they notice mess
}
```

### INNER_VOICE (Thought Library):
Dictionary of 300+ contextual thoughts for different situations:
- wakeUp, discovery, working (18 task types), afterTask, exploring, windowGazing
- lonely, bored, tired, lowBattery, charging, happy, resting
- night, morning, philosophy, weather, seasonalTask, etc.

### Decision Algorithm (`decideBehavior`):
Called every 2-5 sim-minutes per robot. Returns next Behavior:

1. **Check Constraints:**
   - Low battery? → Rest at charger
   - Consecutive tasks? → Force break
   - User interaction? → Obey override

2. **Score All Rooms:**
   Using `scoreRoomAttention()`:
   ```
   score = (dirtiness × 0.48) + (clutter × 0.32) + (routine × 0.2)
         + timePeriodBias + proximityBonus
   ```

3. **Select Behavior:**
   If highest scoring room > threshold → `{ type: 'clean', roomId }`  
   Else if energy low → `{ type: 'rest' }`  
   Else if bored → `{ type: 'wander' }` or `{ type: 'watch-tv' }`  
   Else → `{ type: 'idle-look' }`

4. **Build Task:**
   Using `buildAutonomousTask()`:
   - Room + period → preset task type (dishes in morning kitchen, mowing afternoon yard)
   - Position from task anchors (3 per room)
   - Clear position via `findClearPosition()` from ObstacleMap

**Behavior Types:**
- `clean` → Execute cleaning task in room
- `patrol` → Wander rooms to "keep watch"
- `rest` → Go to charger or idle spot
- `wander` → Patrol all rooms
- `watch-tv` → Sit by device
- `idle-look` → Stand and think
- `seasonal-task` → Special limited-time task
- `night-patrol` → Security sweep
- `night-cleaning` → Quiet cleaning

---

## 9. ARCHITECTURE INSIGHTS & TECHNICAL PATTERNS

### Navigation System
**Waypoint Graph:** ~14-20 named waypoints per floor plan (connected graph)
- BFS pathfinding between waypoints
- Final destination is precise task position
- Walls have gaps (doorways) that trigger pause points
- Multi-floor support with stairs/elevators

### Collision Avoidance
`ObstacleMap.ts`:
- Furniture positions read from store at runtime
- Steering force calculation for smooth avoidance
- Spiral search for safe fallback positions

### Room Task Anchors
Auto-computed from room centers:
```
anchor1 = room.center
anchor2 = room.center - (size/4, size/4)
anchor3 = room.center + (size/4, size/4)
```
Robots pick random anchor when executing room task.

### Mood System
Robot mood derived from:
- Energy level (tired if <30)
- Happiness + user interaction (happy if >60 + recent user interaction)
- Social need (lonely if <30)
- Boredom (bored if >70)
- Battery (low battery warning)
- Time of day (night mood when period='night')

Maps to animation states and thought selection.

### Time System
- `simMinutes` = 0-1439 (24-hour day in sim time)
- `simSpeed` = 0, 1, 10, 60 (real-time, 10x, 60x)
- `simPeriod` = 'morning' (6-12), 'afternoon' (12-18), 'evening' (18-22), 'night' (22-6)
- 4 lighting keyframes per period for visual transition

### Learning System
Task completion speeds up task:
- Each unique task type tracked: `taskExperience[taskType]++`
- Speed multiplier: `max(0.7, 1.0 - experience[task] * 0.05)`
- Capped at 30% speedup

### Multi-Robot Coordination
- Shared room state (all robots see same room decay)
- Independent task queues per robot (can work simultaneously)
- Task assignment via `assignedTo: RobotId`
- No explicit robot-robot communication (simple bottleneck: if robot is in room, other robots prefer elsewhere)

---

## 10. EXISTING SMART SCHEDULING FEATURES

**Smart Schedule System** is partially implemented but NOT YET CONNECTED:

**What Exists:**
1. `recordCleaningEvent()` - Records task completions with context
2. `analyzePatterns()` - Identifies user behavior patterns hourly
3. `getRoomPriority()` - Ranks rooms by urgency
4. `getAutoScheduleEntries()` - Suggests optimal schedule times
5. `SmartSchedulePanel.tsx` - Shows insights & confidence level

**What's Missing:**
1. **Auto-Execution Hook** - No system watches scheduled tasks and triggers them
2. **Robot Assignment AI** - Doesn't intelligently assign tasks to best robot
3. **Conflict Resolution** - No logic to prevent simultaneous tasks
4. **Preference Learning** - Doesn't learn which robot is best for which task
5. **Real-time Adjustments** - Pattern analysis happens but not applied to scheduling

**Storage Structure Exists:**
- `loadSmartScheduleData()` / `saveSmartScheduleData()` ready
- Patterns calculated every 60 sim-minutes
- Confidence tracking based on event count (low: <20, medium: 20-80, high: 80+)

---

## 11. KEY ALGORITHMS USED

### Room Scoring (Priority Selection)
```
score(room) = (1 - cleanliness) × 0.48
            + (1 - tidiness) × 0.32
            + (1 - routine) × 0.2
            + timePeriodBias(room)
            + proximityBonus(robot, room)
```

### Pathfinding (BFS on Waypoint Graph)
```
start_waypoint = nearest_waypoint_to(robot_position)
end_waypoint = nearest_waypoint_to(task_target)
path = breadth_first_search(start, end)
return waypoints + final_position
```

### Collision Avoidance (Steering Force)
```
for each obstacle:
  if robot_will_hit(obstacle):
    force += normalize(robot_pos - obstacle_pos) × strength
force = clamp(force, 3.5)
```

### Evolution Stage Progression
```
novice (0), apprentice (10), expert (40), master (100), legend (200) tasks
stage = find_highest_threshold(total_tasks_completed)
```

### Smart Schedule Pattern Analysis
```
for each room:
  hourly_activity[] = count tasks per hour
  peak_hour = argmax(hourly_activity)
  optimal_time = (peak_hour - 1) × 60 + 30
  dirt_rate = (100 - avg_cleanliness) / 6
  confidence = min(100%, events_recorded / 80)
```

---

## 12. CRITICAL DEPENDENCIES & INTERDEPENDENCIES

### Circular Dependencies to Watch:
1. AIBrain.ts imports RoomState, ObstacleMap, Personality
2. Personality.ts imports useStore
3. useStore imports AIBrain mounting
4. Task completion triggers room decay, which triggers next AI decision

### External Library Usage:
- **Three.js** - 3D rendering
- **React Three Fiber** - React component wrapper for Three.js
- **Zustand** - State management
- **TypeScript** - Type safety

### Data Flow:
```
User Input
  ↓ submitCommand()
  ↓ createTask(source: 'user')
  ↓ useTaskRunner (3 effects per task lifecycle)
  ↓ Robot walks → works → completes
  ↓ applyRoomTaskResult() (decay & boost)
  ↓ recordTaskCompletion() (learning)
  ↓ recordEvolutionTask() (staging)
  ↓ recordCleaningEvent() (smart schedule)
  ↓ Next decision interval
  ↓ AIBrain.decideBehavior() (new task)
  ↓ Back to walking...
```

---

## 13. PERFORMANCE CONSIDERATIONS

### Bottlenecks:
1. **Task array scan** - `clearQueuedAiTasks()` loops all tasks every user command
2. **Room scoring** - Re-scores all 6+ rooms every decision interval
3. **Pathfinding** - BFS runs on every new task (but graph is small ~14 nodes)
4. **Furniture obstacle check** - Reads all furniture pieces per collision check
5. **localStorage writes** - Synchronous, can block on large schedules

### Optimizations in Place:
- Waypoint graph cached (getActiveWaypoints)
- Furniture registry loaded once at startup
- Zustand batches state updates per frame
- Demo mode can run at 60x speed without hanging

---

## 14. DATA PERSISTENCE STRATEGY

**Session vs Persistent:**
- **Session:** Robot positions, task queue, sim time, camera mode
- **Persistent:** Room layout, furniture, schedules, statistics, evolution, personalities

**Save Triggers:**
- Furniture moved → immediate save
- Scheduled task added/removed → immediate save
- On app close (via browser unload)
- Evolution milestone reached → immediate save

**Load Strategy:**
- On app start, all localStorage keys loaded into Zustand
- Merge with defaults (new features add fields without breaking old saves)
- Corrupted data gracefully ignored

---

## SUMMARY FOR SMART SCHEDULING AI IMPLEMENTATION

### Ready to Use:
1. ✅ Core Zustand store with multi-robot support
2. ✅ Task system with 19 task types
3. ✅ Room decay/scoring algorithms
4. ✅ AI decision engine (decideBehavior)
5. ✅ Smart schedule pattern recognition (SmartSchedule.ts)
6. ✅ localStorage infrastructure
7. ✅ ScheduledTask type and data structure
8. ✅ Task trigger mechanism (recording + execution)

### Needs Implementation:
1. Auto-execution loop for scheduled tasks
2. Smart robot assignment (which robot for which task type)
3. Conflict avoidance (don't schedule 2 robots same room same time)
4. Pattern → Schedule conversion (convert analysis to actual schedule)
5. Real-time adjustments (react to room decay changes)
6. Preference learning per robot (Chef better at cooking, etc)
7. UI integration (auto-schedule suggestions in SmartSchedulePanel)

### Key Files to Modify:
- `useStore.ts` - Add scheduling logic to advanceTime()
- `AIBrain.ts` - Check scheduled tasks when deciding
- `SmartSchedule.ts` - Expand analysis, add AI suggestions
- `SchedulePanel.tsx` - Show auto-generated schedules
- `SmartSchedulePanel.tsx` - Add "Apply Auto-Schedule" button

---

**End of Research Document**

