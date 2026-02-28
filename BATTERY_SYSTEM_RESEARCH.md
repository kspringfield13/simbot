# SimBot Codebase Architecture Research: Battery/Power System Implementation

## Executive Summary

This document provides a comprehensive analysis of the SimBot codebase architecture to guide the implementation of a battery/power system. The codebase uses a Zustand store for state management, React Three Fiber for 3D rendering, and a modular systems architecture with per-robot instance management. A battery system can follow established patterns for robot state, UI display, and need-based decision-making.

---

## 1. ROBOT STATE & TYPE SYSTEM

### File: `/home/kspri/projects/simbot/src/types/index.ts`

#### RobotInstanceState (lines 104-115)
The core state for each robot instance tracks:
```typescript
interface RobotInstanceState {
  position: [number, number, number];
  target: [number, number, number] | null;
  state: RobotState;                    // 'idle' | 'walking' | 'working'
  path: NavigationPoint[];
  currentPathIndex: number;
  currentAnimation: TaskType;
  rotationY: number;
  thought: string;
  mood: RobotMood;
  needs: RobotNeeds;                    // KEY: Existing needs system
}
```

#### RobotNeeds (lines 88-93) - CRITICAL FOR BATTERY SYSTEM
```typescript
interface RobotNeeds {
  energy: number;        // 0-100: depletes with tasks, recharges when idle
  happiness: number;     // 0-100: increases with variety, social, completing tasks
  social: number;        // 0-100: increases with user interaction
  boredom: number;       // 0-100: increases when idle too long
}
```

**KEY INSIGHT**: The battery system should integrate with the existing `energy` need in RobotNeeds. Energy already:
- Depletes when working (useStore.ts:285, `-deltaSimMinutes * 0.08`)
- Recharges when idle (useStore.ts:285, `+deltaSimMinutes * 0.15`)
- Influences mood (AIBrain.ts:220, `if (energy < 20) return 'tired'`)

### Design Pattern: Nested Needs System
The `RobotNeeds` object uses a flat structure with 0-100 values for each need. A battery system should follow this exact pattern if adding granular power tracking, or leverage the existing `energy` field.

---

## 2. STORE ARCHITECTURE & STATE MANAGEMENT

### File: `/home/kspri/projects/simbot/src/stores/useStore.ts`

#### Multi-Robot State Pattern (lines 64-80)
```typescript
interface SimBotStore {
  // Multi-robot state - keyed by RobotId
  robots: Record<RobotId, RobotInstanceState>;
  activeRobotId: RobotId;
  setActiveRobotId: (id: RobotId) => void;

  // Per-robot setters follow convention:
  setRobotPosition: (robotId: RobotId, position: [...]) => void;
  setRobotTarget: (robotId: RobotId, target: [...] | null) => void;
  setRobotState: (robotId: RobotId, state: RobotState) => void;
  // ... more setters
  updateRobotNeeds: (robotId: RobotId, updates: Partial<RobotNeeds>) => void;
}
```

#### Needs Update Pattern (lines 233-245)
```typescript
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
```

**Pattern**: All needs are clamped to [0, 100] using Math.max/Math.min. Battery system should follow this convention.

#### Time Advancement (lines 262-299)
The store automatically ticks all robot needs every frame via `advanceTime()`:
```typescript
advanceTime: (deltaSeconds) => set((state) => {
  // ... time logic ...
  const updatedRobots = { ...state.robots };
  for (const id of ROBOT_IDS) {
    const r = updatedRobots[id];
    const n = r.needs;
    const isWorking = r.state === 'working';
    const isIdle = r.state === 'idle';
    
    // Energy logic:
    updatedRobots[id] = {
      ...r,
      needs: {
        energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 
                                        : isWorking ? -deltaSimMinutes * 0.08 
                                                    : -deltaSimMinutes * 0.03)),
        // ... other needs
      },
    };
  }
  return { simMinutes: nextSimMinutes, robots: updatedRobots };
}),
```

**BATTERY INTEGRATION POINT**: This is where battery depletion/charging happens automatically every frame. Modify energy rate here or add separate battery tracking.

#### Initial Robot State (lines 200-203)
```typescript
robots: createAllRobotStates(),
activeRobotId: 'sim',
```

See `/home/kspri/projects/simbot/src/config/robots.ts:48-61` for initial state creation:
```typescript
function createInitialRobotState(config: RobotConfig): RobotInstanceState {
  return {
    position: [...config.startPosition],
    target: null,
    state: 'idle',
    path: [],
    currentPathIndex: 0,
    currentAnimation: 'general',
    rotationY: 0,
    thought: `${config.name} online. Scanning home.`,
    mood: 'content',
    needs: { energy: 85, happiness: 70, social: 50, boredom: 10 },
  };
}
```

**PATTERN**: Robots start with energy: 85 (not fully charged). Battery system can adjust this per robot.

---

## 3. MOVEMENT & PATHFINDING SYSTEM

### File: `/home/kspri/projects/simbot/src/systems/ObstacleMap.ts`

#### Obstacle Detection
```typescript
export function getObstacles(): Obstacle[] {
  const positions = useStore.getState().furniturePositions;
  return FURNITURE_PIECES.map((piece) => ({
    x: override ? override[0] : piece.defaultPosition[0],
    z: override ? override[1] : piece.defaultPosition[2],
    r: piece.obstacleRadius,
  }));
}

export function isPositionClear(x: number, z: number, margin: number = 0.5): boolean {
  const obstacles = getObstacles();
  for (const obs of obstacles) {
    const dx = x - obs.x;
    const dz = z - obs.z;
    if (Math.sqrt(dx * dx + dz * dz) < obs.r + margin) return false;
  }
  return true;
}
```

#### Avoidance Forces (lines 41-67)
```typescript
export function getAvoidanceForce(
  posX: number, posZ: number, dirX: number, dirZ: number, lookAhead: number = 2.0,
): [number, number] {
  const obstacles = getObstacles();
  let forceX = 0, forceZ = 0;
  for (const obs of obstacles) {
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = obs.r + robotR;
    if (dist < minDist + lookAhead) {
      const strength = dist < minDist ? 3.5 : 1.5 / Math.max(dist - minDist, 0.1);
      forceX += nx * strength;
      forceZ += nz * strength;
    }
  }
  return [forceX, forceZ];
}
```

**BATTERY IMPACT**: Movement is handled by pathfinding (getNavigationPath in useTaskRunner.ts:4), which uses these obstacles. Battery depletion during movement happens via the state change to 'walking' which costs energy at `-deltaSimMinutes * 0.03`.

### Inter-Robot Avoidance (Robot.tsx:27-58)
Robots actively avoid each other during navigation using separate force calculations.

---

## 4. AI BRAIN & DECISION SYSTEM

### File: `/home/kspri/projects/simbot/src/systems/AIBrain.ts`

#### Decision Framework (lines 231-473)
The AI brain runs in a `useFrame` loop and makes decisions every N sim-minutes:
```typescript
export function AIBrain({ robotId }: { robotId: RobotId }) {
  const nextDecisionRef = useRef(0);
  
  useFrame(() => {
    const s = useStore.getState();
    if (s.simSpeed === 0) return;
    
    const robot = s.robots[robotId];
    const needs = robot.needs;
    
    // ... various behavior checks ...
    
    if (nextDecisionRef.current <= 0) {
      nextDecisionRef.current = now + rand(2, 5);
      return;
    }
    if (now < nextDecisionRef.current) return;
    
    // DECIDE
    const behavior = decideBehavior(s, robot, needs, now);
    
    switch (behavior.type) {
      case 'rest': { ... }
      case 'clean': { ... }
      case 'patrol': { ... }
      // ...
    }
  });
}
```

#### Energy/Battery Decision Point (lines 477-525)
```typescript
function decideBehavior(...): Behavior {
  if (needs.energy < 15) return { type: 'rest' };  // CRITICAL THRESHOLD
  
  if (consecutiveRef.current >= 3) {
    consecutiveRef.current = 0;
    if (needs.energy < 40) return { type: 'rest' };  // REST THRESHOLD
    return { type: 'patrol' };
  }
  
  // ... room scoring logic ...
  
  if (top && top.score >= 18 && needs.energy >= 25) {
    return { type: 'clean', roomId: top.id };  // Min energy for work
  }
  
  if (needs.energy < 35) return { type: 'rest' };
  
  return { type: 'idle-look' };
}
```

**KEY BATTERY DECISION THRESHOLDS**:
- `energy < 15`: Mandatory rest (lines 483)
- `energy < 40`: Rest after 3 consecutive tasks (line 487)
- `energy >= 25`: Minimum energy to start a task (line 510)
- `energy < 35`: Prefer rest over other activities (line 522)

#### Mood Generation from Needs (lines 219-225)
```typescript
function getMoodFromNeeds(energy: number, happiness: number, social: number, boredom: number): RobotMood {
  if (energy < 20) return 'tired';
  if (social < 15) return 'lonely';
  if (boredom > 75) return 'bored';
  if (happiness > 70 && energy > 50) return 'happy';
  return 'content';
}
```

**Battery Integration**: Battery level directly affects mood at threshold `energy < 20` → 'tired'.

#### Thought System (lines 122-189)
The AI uses a large library of contextual thoughts. For battery system, relevant lines include:

```typescript
const INNER_VOICE = {
  tired: [
    'Running a little low... need to rest these servos.',
    'Even machines need downtime. I\'m not a machine though. I\'m me.',
    'Gonna sit here for a bit. Recharging my soul, not just my battery.',
    'Rest isn\'t laziness. It\'s maintenance. I deserve this.',
  ],
  resting: [
    'Just resting my eyes. Wait, I don\'t have eyelids.',
    'Recharging... thinking about tomorrow\'s plan.',
    'Quiet moment. I\'m grateful for these.',
    'Resting doesn\'t mean I stopped caring. Just conserving energy to care harder.',
  ],
}
```

**OPPORTUNITY**: Add battery-specific thoughts into the idle/resting library.

---

## 5. GAME OBJECTS & FURNITURE SYSTEM

### File: `/home/kspri/projects/simbot/src/stores/useStore.ts` (lines 27-43)

#### Furniture Persistence
```typescript
interface SimBotStore {
  furniturePositions: Record<string, [number, number]>;
  setRearrangeMode: (mode: boolean) => void;
  selectFurniture: (id: string | null) => void;
  moveFurniture: (id: string, x: number, z: number) => void;
  resetFurnitureLayout: () => void;
}
```

Furniture positions are saved to `localStorage` with key `'simbot-furniture-positions'`.

**Battery System Consideration**: If a charging station is to be a furniture piece, use the same storage pattern.

---

## 6. UI COMPONENTS & DISPLAY

### File: `/home/kspri/projects/simbot/src/components/ui/NeedsIndicator.tsx`

This is the PRIMARY example for displaying robot needs and should inform battery UI design:

```typescript
const BARS: { key: 'energy' | 'happiness' | 'social' | 'boredom'; 
              icon: string; color: string; invertColor?: boolean }[] = [
  { key: 'energy', icon: '⚡', color: '#facc15' },      // Yellow
  { key: 'happiness', icon: '😊', color: '#4ade80' },   // Green
  { key: 'social', icon: '💬', color: '#60a5fa' },     // Blue
  { key: 'boredom', icon: '😴', color: '#f87171', invertColor: true }, // Red
];

export function NeedsIndicator() {
  const needs = useActiveRobot((r) => r.needs);

  return (
    <div className="absolute right-3 bottom-20 z-20 flex flex-col gap-1.5 
                    rounded-xl border border-white/6 bg-black/50 p-2 backdrop-blur-md">
      {BARS.map(({ key, icon, color, invertColor }) => {
        const val = needs[key];
        const displayVal = invertColor ? 100 - val : val;
        const isLow = displayVal < 25;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`text-[10px] ${isLow ? 'animate-pulse' : ''}`}>{icon}</span>
            <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${displayVal}%`,
                  backgroundColor: isLow ? '#f87171' : color,
                  opacity: isLow ? 1 : 0.6,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**PATTERN FOR BATTERY UI**:
- Position: `absolute right-3 bottom-20` (overlays over needs indicator or beside it)
- Format: Icon + percentage bar
- Colors: Use consistent palette (⚡ for power, color gradient for battery level)
- Animation: Pulse when critical (`isLow` state)
- Styling: `bg-black/50 backdrop-blur-md` for HUD consistency

### File: `/home/kspri/projects/simbot/src/components/game/GameUI.tsx`

This is the main HUD component. Battery UI elements should integrate into the existing layout:

- **Top-left**: Time, weather, robot state indicator
- **Top-right**: Robot picker, schedule, season toggle, mute, speed controls, camera
- **Bottom**: Chat input, auto mode button
- **Right-side**: NeedsIndicator (lines 14-39 in the function)

---

## 7. SYSTEMS ARCHITECTURE

### File: `/home/kspri/projects/simbot/src/components/systems/`

#### TaskProcessor.tsx (Headless System Component)
```typescript
export function TaskProcessor() {
  useTaskRunner();
  return null;
}
```

This pattern mounts a hook that runs the task execution loop. A BatterySystem could follow this:

```typescript
export function BatterySystem() {
  useBatteryManager();
  return null;
}
```

#### ScheduleSystem.tsx (Event-Driven System)
```typescript
export function ScheduleSystem() {
  const firedRef = useRef<Set<string>>(new Set());
  const lastDayRef = useRef(-1);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0) return;
      
      // Check sim-time and fire scheduled tasks
      for (const scheduled of s.scheduledTasks) {
        if (!scheduled.enabled) continue;
        if (firedRef.current.has(scheduled.id)) continue;
        
        if (timeOfDay >= scheduled.timeMinutes && timeOfDay < scheduled.timeMinutes + 2) {
          // Execute scheduled action
        }
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
```

**BATTERY SYSTEM PATTERN**: A `BatteryChargingSystem` could be implemented as an interval-based component that:
1. Checks robots in 'rest' state or near charging stations
2. Increments their energy based on charging rate
3. Fires events when charging completes/starts

---

## 8. TASK RUNNER & ROBOT BEHAVIOR CONTROL

### File: `/home/kspri/projects/simbot/src/hooks/useTaskRunner.ts`

This is the core task execution engine with three main effects:

#### Pick Up Queued Tasks (lines 161-198)
```typescript
useEffect(() => {
  const state = useStore.getState();
  
  for (const rid of ROBOT_IDS) {
    const robotTasks = state.tasks.filter((t) => t.assignedTo === rid);
    const hasActive = robotTasks.some((task) => task.status === 'walking' || task.status === 'working');
    if (hasActive) continue;

    const nextTask = robotTasks
      .filter((task) => task.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (!nextTask) continue;

    const robotPos = state.robots[rid].position;
    const path = getNavigationPath(robotPos, nextTask.targetPosition);
    if (path.length === 0) continue;

    setRobotPath(rid, path);
    setCurrentPathIndex(rid, 0);
    setRobotTarget(rid, path[0].position);
    setRobotState(rid, 'walking');
    updateTask(nextTask.id, { status: 'walking', progress: Math.max(nextTask.progress, 2) });
  }
}, [tasks, ...setters]);
```

**BATTERY CONSIDERATION**: Before picking up a task, check if robot has sufficient energy:
```typescript
if (state.robots[rid].needs.energy < 25) {
  // Queue auto-rest task or skip
  continue;
}
```

#### Work Progress (lines 251-305)
```typescript
useEffect(() => {
  const interval = window.setInterval(() => {
    const state = useStore.getState();
    if (state.simSpeed === 0) return;

    for (const rid of ROBOT_IDS) {
      const activeTask = state.tasks.find((task) => task.assignedTo === rid && task.status === 'working');
      if (!activeTask) continue;

      const step = (100 / activeTask.workDuration) * 0.1 * state.simSpeed;
      const nextProgress = Math.min(100, activeTask.progress + step);

      updateTask(activeTask.id, { progress: nextProgress });

      if (nextProgress < 100) continue;

      updateTask(activeTask.id, { status: 'completed', progress: 100 });
      applyRoomTaskResult(activeTask.targetRoom, activeTask.taskType);
      state.recordTaskCompletion(activeTask.taskType);
      state.recordStats(activeTask.taskType, activeTask.targetRoom);

      setCurrentAnimation(rid, 'general');
      setRobotState(rid, 'idle');
      // ...
    }
  }, 100);

  return () => window.clearInterval(interval);
}, [...setters]);
```

---

## 9. ROBOT STATE TYPES & ANIMATIONS

### File: `/home/kspri/projects/simbot/src/types/index.ts` (lines 84-93)

```typescript
export type RobotState = 'idle' | 'walking' | 'working';
export type RobotMood = 'content' | 'focused' | 'curious' | 'routine' | 'tired' | 'lonely' | 'bored' | 'happy';
export type TaskType = 'cleaning' | 'vacuuming' | 'dishes' | 'laundry' | 'organizing' | 'cooking' | 
                       'bed-making' | 'scrubbing' | 'sweeping' | 'grocery-list' | 'general';
```

**OPPORTUNITY**: Add new RobotState like `'charging'` for explicit charging behavior, or extend RobotMood with `'lowbattery'` to distinguish from 'tired'.

---

## 10. ROOM STATE & ENVIRONMENTAL NEEDS

### File: `/home/kspri/projects/simbot/src/systems/RoomState.ts`

While not directly related to battery, the room state system shows a good pattern for tracking time-based decay:

```typescript
interface RoomNeedState {
  cleanliness: number;
  tidiness: number;
  routine: number;
  decayCleanliness: number;      // Per-minute decay rate
  decayTidiness: number;         // Per-minute decay rate
  lastServicedAt: number;
}

export function decayRoomNeeds(
  current: Record<RoomId, RoomNeedState>,
  deltaSimMinutes: number,
): Record<RoomId, RoomNeedState> {
  if (deltaSimMinutes <= 0) return current;
  
  const next = { ...current };
  for (const roomId of Object.keys(next) as RoomId[]) {
    const existing = next[roomId];
    next[roomId] = {
      ...existing,
      cleanliness: clampPercent(existing.cleanliness - existing.decayCleanliness * deltaSimMinutes),
      // ...
    };
  }
  return next;
}
```

**PATTERN FOR BATTERY**: Use similar per-robot decay rates. Robots could have different battery discharge rates based on activity type:
```typescript
interface RobotEnergyConfig {
  restChargeRate: number;           // +0.15/min when idle
  walkDischargeRate: number;        // -0.03/min when walking
  workDischargeRate: number;        // -0.08/min when working
  specificWorkRates?: Record<TaskType, number>; // Task-specific rates
}
```

---

## 11. ROBOT CONFIGURATION

### File: `/home/kspri/projects/simbot/src/config/robots.ts`

```typescript
export const ROBOT_CONFIGS: Record<RobotId, RobotConfig> = {
  sim: {
    id: 'sim',
    name: 'Sim',
    color: '#1a8cff',
    startPosition: [0, 0, -2],
    favoriteRoom: 'living-room',
    preferredRooms: ['living-room', 'hallway', 'kitchen'],
    curiosity: 0.8,
    warmth: 0.9,
    playfulness: 0.7,
    diligence: 0.75,
    sensitivity: 0.85,
    description: 'General home assistant',
  },
  chef: { /* ... */ },
  sparkle: { /* ... */ },
};
```

**BATTERY CONFIGURATION**: Could add per-robot properties:
```typescript
interface RobotConfig {
  // ... existing ...
  batteryCapacity: number;           // mAh or abstract units
  chargeRate: number;                // units/minute
  dischargeRate: number;             // Task-dependent
  maxWorkDurationOnCharge: number;   // Limits before mandatory rest
}
```

---

## 12. TIME SYSTEM INTEGRATION

### File: `/home/kspri/projects/simbot/src/systems/TimeSystem.ts`

The TimeSystem is a perfect reference for how global events are triggered:

```typescript
export function TimeSystem() {
  const advanceTime = useStore((state) => state.advanceTime);
  const lastWeatherIdxRef = useRef(-1);

  useFrame((_, delta) => {
    advanceTime(delta);

    const s = useStore.getState();
    const idx = Math.floor(s.simMinutes / WEATHER_INTERVAL) % WEATHER_CYCLE.length;
    if (idx !== lastWeatherIdxRef.current) {
      lastWeatherIdxRef.current = idx;
      s.setWeather(WEATHER_CYCLE[idx]);
    }
  });

  return null;
}
```

**BATTERY INTEGRATION**: Battery charging/discharging happens in `advanceTime()` in the store itself, but time-based charging station behavior could use this pattern.

---

## SUMMARY: KEY PATTERNS FOR BATTERY SYSTEM IMPLEMENTATION

### 1. **State Management Pattern**
- Add `battery: number` (0-100) to `RobotNeeds` interface, OR
- Create separate `RobotBatteryState` interface and add to `RobotInstanceState`
- Update via `updateRobotNeeds()` store method

### 2. **Automatic Tick Pattern**
- Modify `advanceTime()` in useStore.ts to include battery depletion/charging logic
- Current energy rates:
  - Idle: `+0.15/min`
  - Walking: `-0.03/min`
  - Working: `-0.08/min`
- Battery could have similar or identical rates, or task-specific rates

### 3. **Decision-Making Pattern**
- Add energy thresholds to `AIBrain.ts:decideBehavior()`
- Current thresholds: 15 (critical), 25 (task minimum), 35-40 (prefer rest)
- Queue auto-charging tasks when energy low
- Skip queuing tasks if insufficient energy in `useTaskRunner.ts:161-198`

### 4. **UI Display Pattern**
- Follow `NeedsIndicator.tsx` format
- Icon: ⚡ or 🔋
- Color: Gradient from green (100%) → yellow (50%) → red (0%)
- Animation: Pulse when critical (`<25%`)
- Position: Integrate into right-side HUD or separate battery indicator

### 5. **Mood & Thought Pattern**
- Battery low (`<20`) should trigger 'tired' mood (already implemented)
- Add battery-specific thoughts to `INNER_VOICE.tired` and `INNER_VOICE.resting`
- Examples: "Running low on power", "Need to find a charging station"

### 6. **Charging Behavior Pattern**
- Add 'charging' to `RobotState` type, OR use 'idle' + special flag
- Create charging station as furniture piece with obstacle detection
- Implement `BatteryChargingSystem` component (headless system pattern)
- When robot enters charging zone + energy < 100:
  - Set state to 'charging' or special 'rest' variant
  - Increase energy at higher rate (+0.2-0.3/min)
  - Play charging animation
  - Generate charging thoughts

### 7. **Configuration Pattern**
- Add battery capacity/rate properties to `RobotConfig` interface
- Allow different robots to have different battery characteristics
- Store initial energy in robot creation (currently 85 default)

### 8. **Persistence Pattern**
- Battery state auto-saves via Zustand store (in-memory)
- Charge stations stored in furniture system with localStorage
- Optional: Track battery history in stats

### 9. **Animation Pattern** (Robot.tsx integration)
- Map 'charging' animation to animation clips in xbot.glb model
- Fallback: Use 'idle' animation during charging
- Visual indicator: Emit particle effects or change material color

### 10. **Thresholds Reference**
```
Energy Level    AI Behavior          Mood       Display Color
100%           Can work              happy       Green
75-100%        Prefers work          content     Green
50-74%         Works if needed       content     Yellow
25-49%         Prefers rest          content     Yellow
15-24%         Should rest soon      tired       Orange
0-14%          Must rest NOW         tired       Red (pulsing)
```

---

## FILE INVENTORY FOR BATTERY SYSTEM MODIFICATIONS

| File Path | Purpose | Battery Integration |
|-----------|---------|---------------------|
| `/src/types/index.ts` | Type definitions | Add `battery` to RobotNeeds or create BatteryState |
| `/src/stores/useStore.ts` | State management | Modify `advanceTime()`, add battery update method |
| `/src/systems/AIBrain.ts` | Decision making | Add battery thresholds to `decideBehavior()` |
| `/src/hooks/useTaskRunner.ts` | Task execution | Check energy before picking up tasks |
| `/src/components/ui/NeedsIndicator.tsx` | HUD display | Add battery bar (follows existing pattern) |
| `/src/components/systems/BatterySystem.tsx` | Battery logic | Create charging system component |
| `/src/config/robots.ts` | Robot config | Add battery properties per robot |
| `/src/components/scene/Robot.tsx` | 3D rendering | Add charging animation mapping |
| `/src/stores/useStore.ts` | Furniture | Add charging station to furniture system |

---

## ARCHITECTURAL DECISIONS

### Option A: Extend RobotNeeds.energy
- **Pros**: Minimal changes, leverage existing infrastructure
- **Cons**: Battery and energy become the same thing
- **Use Case**: Simple 1:1 mapping

### Option B: Separate RobotBatteryState
- **Pros**: Explicit battery tracking, allows granular control
- **Cons**: More code, potential duplication with energy
- **Use Case**: Complex battery behavior (capacity degradation, temperature effects)

### Option C: Hybrid Approach (RECOMMENDED)
- Use existing `energy` in RobotNeeds (0-100) as the user-facing "fatigue" metric
- Add separate `battery` as internal implementation detail if needed
- Charging stations boost `energy` when robot is idle/resting
- Task execution affected by both energy AND battery percentage if implemented

---

## CONCLUSION

The SimBot codebase has excellent patterns for extending state with per-robot properties. A battery system naturally integrates into:
1. The `RobotNeeds` system for 0-100 tracking
2. The `advanceTime()` tick system for automatic depletion/charging
3. The `AIBrain` decision system for behavior changes based on low battery
4. The UI system via the `NeedsIndicator` component pattern
5. The systems architecture via headless components pattern

The existing `energy` property in `RobotNeeds` already implements most battery mechanics. Enhancing it requires modifying rates, adding charging stations, and improving AI decision thresholds.

