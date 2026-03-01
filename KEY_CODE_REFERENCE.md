# SimBot Smart Scheduling AI - Key Code Reference

## File Locations (Absolute Paths)

All files located in: `/home/kspri/projects/simbot/src/`

### Core Files

1. **Type Definitions**
   - `/home/kspri/projects/simbot/src/types/index.ts` (357 LOC)

2. **State Management**
   - `/home/kspri/projects/simbot/src/stores/useStore.ts` (2300+ LOC)

3. **AI & Decision Making**
   - `/home/kspri/projects/simbot/src/systems/AIBrain.ts` (520 LOC)
   - `/home/kspri/projects/simbot/src/systems/RoomState.ts` (203 LOC)

4. **Smart Scheduling**
   - `/home/kspri/projects/simbot/src/systems/SmartSchedule.ts` (323 LOC)

5. **Task Processing**
   - `/home/kspri/projects/simbot/src/hooks/useTaskRunner.ts` (343 LOC)

6. **UI Panels**
   - `/home/kspri/projects/simbot/src/components/ui/SchedulePanel.tsx`
   - `/home/kspri/projects/simbot/src/components/ui/SmartSchedulePanel.tsx`
   - `/home/kspri/projects/simbot/src/components/ui/StatsPanel.tsx`

7. **Configuration**
   - `/home/kspri/projects/simbot/src/config/robots.ts` - Robot configs
   - `/home/kspri/projects/simbot/src/config/challenges.ts` - Mini-games

8. **Utilities**
   - `/home/kspri/projects/simbot/src/utils/homeLayout.ts` (183 LOC)
   - `/home/kspri/projects/simbot/src/utils/pathfinding.ts` (77 LOC)
   - `/home/kspri/projects/simbot/src/utils/evolution.ts` - Evolution tracking

---

## Key Type Definitions

### ScheduledTask
File: `types/index.ts` lines 62-68
```typescript
export interface ScheduledTask {
  id: string;
  command: string;
  timeMinutes: number; // 0-1439 (sim-minutes within a day)
  assignedTo: RobotId;
  enabled: boolean;
}
```

### Task
File: `types/index.ts` lines 70-83
```typescript
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
```

### RobotInstanceState
File: `types/index.ts` lines 128-142
```typescript
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
  battery: number;
  isCharging: boolean;
  currentFloor: FloorLevel;
}
```

### RoomNeedState
File: `types/index.ts` lines 159-166
```typescript
export interface RoomNeedState {
  cleanliness: number;
  tidiness: number;
  routine: number;
  decayCleanliness: number;
  decayTidiness: number;
  lastServicedAt: number;
}
```

---

## Key Store Selectors & Actions

File: `stores/useStore.ts`

### Multi-Robot State Access
```typescript
const robots = useStore((state) => state.robots);              // Record<RobotId, RobotInstanceState>
const activeRobotId = useStore((state) => state.activeRobotId);
```

### Scheduled Tasks
```typescript
const scheduledTasks = useStore((state) => state.scheduledTasks);
const addScheduledTask = useStore((state) => state.addScheduledTask);
const removeScheduledTask = useStore((state) => state.removeScheduledTask);
const toggleScheduledTask = useStore((state) => state.toggleScheduledTask);
```

### Time & Simulation
```typescript
const simMinutes = useStore((state) => state.simMinutes);
const simPeriod = useStore((state) => state.simPeriod);
const advanceTime = useStore((state) => state.advanceTime);
```

### Room State
```typescript
const roomNeeds = useStore((state) => state.roomNeeds);        // Record<RoomId, RoomNeedState>
const applyRoomTaskResult = useStore((state) => state.applyRoomTaskResult);
```

### Tasks
```typescript
const tasks = useStore((state) => state.tasks);
const addTask = useStore((state) => state.addTask);
const updateTask = useStore((state) => state.updateTask);
const removeTask = useStore((state) => state.removeTask);
```

---

## Smart Schedule System

File: `systems/SmartSchedule.ts` (323 LOC)

### Data Structures
```typescript
interface CleaningEvent {
  roomId: RoomId;
  taskType: TaskType;
  simMinutes: number;
  timeOfDay: number;        // 0-1439 within the day
  source: 'user' | 'ai' | 'schedule';
  cleanlinessBeforeTask: number;
}

interface RoomPattern {
  roomId: string;
  avgDirtinessAtUserAction: number;
  userInteractionCount: number;
  totalTaskCount: number;
  hourlyActivity: number[];        // 24 buckets
  peakHour: number;
  avgDirtyRate: number;
  optimalCleanTime: number;        // 0-1439
  topTasks: { taskType: string; count: number }[];
}

interface SmartScheduleData {
  events: CleaningEvent[];
  roomPatterns: Record<string, RoomPattern>;
  lastAnalyzedAt: number;
  userInteractionTimes: number[];
  totalUserCommands: number;
  peakActivityHour: number;
}
```

### Key Functions
```typescript
// Record task completions
export function recordCleaningEvent(
  data: SmartScheduleData,
  event: CleaningEvent,
): SmartScheduleData

// Analyze patterns (every 60 sim-minutes)
export function analyzePatterns(
  data: SmartScheduleData,
  currentSimMinutes: number
): SmartScheduleData

// Get suggested schedule from patterns
export function getAutoScheduleEntries(
  data: SmartScheduleData
): AutoScheduleEntry[]

// Confidence level: 'low'|'medium'|'high'
export function getConfidenceLevel(data: SmartScheduleData): 'low' | 'medium' | 'high'

// Confidence percentage
export function getConfidencePercent(data: SmartScheduleData): number
```

### localStorage Integration
```typescript
const STORAGE_KEY = 'simbot-smart-schedule';

export function loadSmartScheduleData(): SmartScheduleData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return createEmptyData();
}

export function saveSmartScheduleData(data: SmartScheduleData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}
```

---

## Room State System

File: `systems/RoomState.ts` (203 LOC)

### Room Decay Rates
```typescript
const baseDecayByRoom: Record<RoomId, { cleanliness: number; tidiness: number }> = {
  'living-room': { cleanliness: 0.1, tidiness: 0.12 },
  kitchen: { cleanliness: 0.16, tidiness: 0.14 },          // Fastest
  hallway: { cleanliness: 0.08, tidiness: 0.09 },
  laundry: { cleanliness: 0.09, tidiness: 0.1 },
  bedroom: { cleanliness: 0.07, tidiness: 0.1 },           // Slowest
  bathroom: { cleanliness: 0.14, tidiness: 0.11 },
  yard: { cleanliness: 0.12, tidiness: 0.14 },
};
```

### Room Scoring Formula
```typescript
export function scoreRoomAttention(
  roomId: RoomId,
  roomState: RoomNeedState,
  period: SimPeriod,
  robotPosition?: [number, number, number],
): number {
  const dirtiness = 100 - roomState.cleanliness;
  const clutter = 100 - roomState.tidiness;
  const routineNeed = 100 - roomState.routine;

  let score = (dirtiness * 0.48) + (clutter * 0.32) + (routineNeed * 0.2) 
            + getRoutineBias(period, roomId);

  // Proximity bonus
  if (robotPosition) {
    const room = getActiveRooms().find((r) => r.id === roomId);
    if (room) {
      const dx = robotPosition[0] - room.position[0];
      const dz = robotPosition[2] - room.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      score += Math.max(0, 6 - dist * 0.6);
    }
  }

  return score;
}
```

### Task Completion Boosts
```typescript
export function boostRoomAfterTask(
  roomState: RoomNeedState,
  taskType: TaskType,
): RoomNeedState {
  const boosts: Partial<Record<TaskType, { cleanliness: number; tidiness: number; routine: number }>> = {
    cleaning: { cleanliness: 24, tidiness: 20, routine: 14 },
    vacuuming: { cleanliness: 20, tidiness: 12, routine: 12 },
    dishes: { cleanliness: 26, tidiness: 18, routine: 16 },
    laundry: { cleanliness: 10, tidiness: 28, routine: 20 },
    organizing: { cleanliness: 9, tidiness: 26, routine: 18 },
    cooking: { cleanliness: 8, tidiness: 12, routine: 16 },
    'bed-making': { cleanliness: 8, tidiness: 24, routine: 22 },
    // ... more task types
  };

  const boost = boosts[taskType] ?? boosts.general;

  return {
    ...roomState,
    cleanliness: clampPercent(roomState.cleanliness + (boost?.cleanliness ?? 10)),
    tidiness: clampPercent(roomState.tidiness + (boost?.tidiness ?? 10)),
    routine: clampPercent(roomState.routine + (boost?.routine ?? 10)),
  };
}
```

---

## AI Decision Engine

File: `systems/AIBrain.ts` (520 LOC)

### Robot Personality (SOUL)
From `config/robots.ts`:
```typescript
export const ROBOT_CONFIGS: Record<RobotId, RobotConfig> = {
  sim: {
    id: 'sim',
    name: 'Sim',
    color: '#1a8cff',
    startPosition: [0, 0, -2],
    favoriteRoom: 'living-room',
    preferredRooms: ['living-room', 'hallway', 'kitchen', 'yard'],
    curiosity: 0.8,
    warmth: 0.9,
    playfulness: 0.7,
    diligence: 0.75,
    sensitivity: 0.85,
    description: 'General home assistant',
  },
  chef: {
    id: 'chef',
    name: 'Chef',
    color: '#f59e0b',
    startPosition: [8, 0, -12],
    favoriteRoom: 'kitchen',
    preferredRooms: ['kitchen', 'living-room'],
    curiosity: 0.5,
    warmth: 0.8,
    playfulness: 0.6,
    diligence: 0.9,                  // HIGH: Works hard
    sensitivity: 0.6,
    description: 'Kitchen specialist',
  },
  sparkle: {
    id: 'sparkle',
    name: 'Sparkle',
    color: '#2dd4bf',
    startPosition: [8, 0, 8],
    favoriteRoom: 'bathroom',
    preferredRooms: ['bathroom', 'bedroom', 'laundry'],
    curiosity: 0.6,
    warmth: 0.7,
    playfulness: 0.5,
    diligence: 0.85,
    sensitivity: 0.9,                // HIGH: Notices mess
    description: 'Bathroom & bedroom specialist',
  },
};
```

### Decision Algorithm
File: `systems/AIBrain.ts` lines ~400-520 (decideBehavior function)

Main decision flow:
1. Check constraints (battery, breaks, user override)
2. Score all rooms
3. Select behavior based on score
4. Build autonomous task

---

## Task Processing Loop

File: `hooks/useTaskRunner.ts` (343 LOC)

### Submit Command
```typescript
export const useTaskRunner = () => {
  const submitCommand = useCallback((command: string, source: TaskSource = 'user') => {
    const trimmed = command.trim();
    if (!trimmed) return;

    const target = findTaskTarget(trimmed);

    if (!target) {
      addMessage({
        id: crypto.randomUUID(),
        sender: 'robot',
        text: 'I could not map that command to a task. Try: clean kitchen, vacuum living room, or make the bed.',
        timestamp: Date.now(),
      });
      return;
    }

    const state = useStore.getState();
    const rid = state.activeRobotId;

    // User interaction effects
    if (source === 'user') {
      clearQueuedAiTasks(rid);
      setOverrideUntil(state.simMinutes + 90);
      
      const needs = state.robots[rid].needs;
      updateRobotNeeds(rid, {
        social: Math.min(100, needs.social + 15),
        happiness: Math.min(100, needs.happiness + 5),
        boredom: Math.max(0, needs.boredom - 10),
      });
    }

    const task: Task = {
      id: crypto.randomUUID(),
      command: trimmed,
      source,
      targetRoom: target.roomId,
      targetPosition: target.position,
      status: 'queued',
      progress: 0,
      description: target.description,
      taskType: target.taskType,
      workDuration: target.workDuration,
      createdAt: Date.now(),
      assignedTo: rid,
    };

    addTask(task);
  }, []);
  
  // ... 4 useEffect hooks for task lifecycle
};
```

---

## Configuration: Task Types

File: `types/index.ts` lines 36-55

```typescript
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
```

---

## Evolution System

File: `utils/evolution.ts`

### Stage Progression
```typescript
const STAGE_THRESHOLDS: { stage: EvolutionStage; tasks: number }[] = [
  { stage: 'legend', tasks: 200 },
  { stage: 'master', tasks: 100 },
  { stage: 'expert', tasks: 40 },
  { stage: 'apprentice', tasks: 10 },
  { stage: 'novice', tasks: 0 },
];

export function getStageForTasks(totalTasks: number): EvolutionStage {
  for (const { stage, tasks } of STAGE_THRESHOLDS) {
    if (totalTasks >= tasks) return stage;
  }
  return 'novice';
}
```

### Record Task Completion
```typescript
export function recordEvolutionTask(
  evo: RobotEvolution,
  taskType: TaskType,
  workDuration: number,
  simMinutes: number,
): { evolution: RobotEvolution; stageChanged: boolean } {
  const newSpecialty = { ...evo.taskSpecialty };
  newSpecialty[taskType] = (newSpecialty[taskType] ?? 0) + 1;

  const newTotal = evo.totalTasksCompleted + 1;
  const newWorkTime = evo.totalWorkTime + workDuration;
  const newStage = getStageForTasks(newTotal);
  const stageChanged = newStage !== evo.stage;

  const newStageUnlockedAt = { ...evo.stageUnlockedAt };
  if (stageChanged && newStageUnlockedAt[newStage] === null) {
    newStageUnlockedAt[newStage] = simMinutes;
  }

  return {
    evolution: {
      totalTasksCompleted: newTotal,
      totalWorkTime: newWorkTime,
      taskSpecialty: newSpecialty,
      firstActiveAt: evo.firstActiveAt || simMinutes,
      lastActiveAt: simMinutes,
      stage: newStage,
      stageUnlockedAt: newStageUnlockedAt,
    },
    stageChanged,
  };
}
```

---

## localStorage Keys Reference

```typescript
// Scheduled tasks
const SCHEDULE_STORAGE_KEY = 'simbot-scheduled-tasks';

// Smart schedule patterns
const STORAGE_KEY = 'simbot-smart-schedule';

// Robot evolution
const EVOLUTION_STORAGE_KEY = 'simbot-evolution';

// Shop & coins
const SHOP_STORAGE_KEY = 'simbot-shop';

// Furniture positions
const FURNITURE_STORAGE_KEY = 'simbot-furniture-positions';

// Camera presets
const CAMERA_PRESETS_KEY = 'simbot-camera-presets';

// Challenge best times
const BEST_TIMES_KEY = 'simbot-challenge-best-times';

// All other keys in useStore.ts section ~110-400
```

---

## Key Constants

### Time System
```typescript
const initialSimMinutes = 440;  // 7:20 AM
type SimSpeed = 0 | 1 | 10 | 60;
type SimPeriod = 'morning' | 'afternoon' | 'evening' | 'night';
```

### Task Speed Learning
```typescript
// Base speed: 100%
// Per completion: -5%
// Minimum: 70% (30% boost cap)
const speedMultiplier = Math.max(0.7, 1.0 - taskExperience * 0.05);
```

### Room Needs
```typescript
const energyDrain = {
  working: 0.08,    // per-minute
  walking: 0.03,    // per-minute
  idle: -0.15,      // recharge
};

const happinessTick = {
  working: 0.02,    // per-minute
};

const socialDecay = 0.02;  // per-minute always
const boredomIdleIncrease = 0.06;  // per-minute
const boredomWorkingDecrease = 0.05;  // per-minute
```

---

## Summary for Implementation

**Files to Modify/Create:**
1. `SmartSchedule.ts` - Add robot assignment logic
2. `useStore.ts` - Add schedule execution in advanceTime()
3. `SmartSchedulePanel.tsx` - Add UI for recommendations
4. `AIBrain.ts` - Integrate scheduled tasks with decisions
5. New: `ScheduleExecutor.ts` - Schedule → Task conversion

**Data Flow:**
```
User behavior recorded → analyzePatterns() → RoomPattern suggestions
                              ↓
                    getAutoScheduleEntries() → AutoScheduleEntry[]
                              ↓
                    AI assignment (new) → RobotAssignment[]
                              ↓
                    advanceTime() checks & triggers
                              ↓
                    Creates Task with assignedTo field
```

