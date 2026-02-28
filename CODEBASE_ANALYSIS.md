# SimBot Codebase Analysis

## Project Overview

SimBot is a React Three.js-based virtual home simulation where an AI-driven robot performs autonomous tasks while responding to user commands. The robot has Tamagotchi-like needs (energy, happiness, social, boredom), personality-driven AI behavior, and emotional responses to its environment.

**Technology Stack:**
- React 19 + React Three Fiber (3D rendering)
- Three.js 0.183 (3D graphics)
- Zustand 5 (state management)
- Tailwind CSS (styling)
- TypeScript (type safety)

---

## Project Structure

```
/home/kspri/projects/simbot/src/
├── App.tsx                          # Main app entry point
├── main.tsx                         # Vite entry point
├── types/
│   └── index.ts                     # All TypeScript type definitions
├── stores/
│   └── useStore.ts                  # Zustand store (main state)
├── systems/
│   ├── AIBrain.ts                   # Robot AI decision-making
│   ├── RoomState.ts                 # Room cleanliness/tidiness tracking
│   ├── ObstacleMap.ts               # Collision detection & avoidance
│   ├── TimeSystem.ts                # Simulation time & lighting
│   ├── VisitorSystem.ts             # Visitor events (doorbell, packages)
│   └── Achievements.ts              # (Not reviewed in detail)
├── utils/
│   ├── homeLayout.ts                # Room definitions, task mapping
│   ├── pathfinding.ts               # Navigation waypoint system
│   ├── furnitureRegistry.ts         # Furniture definitions & obstacles
│   └── demoTasks.ts                 # Demo mode commands
├── hooks/
│   ├── useTaskRunner.ts             # Task processing loop
│   ├── useVoice.ts                  # Voice input (not reviewed)
│   ├── useAmbientSounds.ts          # Audio (not reviewed)
│   └── useKeyboardShortcuts.ts      # Keyboard input (not reviewed)
├── components/
│   ├── App wrapper components
│   ├── scene/
│   │   ├── HomeScene.tsx            # Main 3D scene setup
│   │   ├── Robot.tsx                # Robot 3D model & animation
│   │   ├── Room.tsx                 # Room geometry
│   │   ├── Walls.tsx                # Wall geometry
│   │   ├── FurnitureModels.tsx      # Furniture rendering & interaction
│   │   ├── PetCat.tsx               # Pet cat companion (procedural)
│   │   ├── VisitorNPC.tsx           # Visitor NPC rendering
│   │   ├── SeasonalDecorations.tsx  # (Not reviewed)
│   │   ├── WindowGlow.tsx           # (Not reviewed)
│   │   ├── DustMotes.tsx            # (Not reviewed)
│   │   └── GLBModel.tsx             # GLB model loader
│   ├── camera/
│   │   └── CameraController.tsx     # Camera system (3 modes)
│   ├── systems/
│   │   └── TaskProcessor.tsx        # Headless task processor
│   ├── game/
│   │   ├── GameUI.tsx               # Main HUD, command input
│   │   ├── ThoughtBubble.tsx        # Robot thought display
│   │   ├── SpeedControls.tsx        # Time speed controls
│   │   ├── TimeBar.tsx              # Time display
│   │   └── RoomStatus.tsx           # Room status display
│   └── ui/
│       ├── RobotTerminal.tsx        # Terminal panel
│       ├── ChatPanel.tsx            # Chat interface
│       ├── VisitorToast.tsx         # Notification toasts
│       ├── EmojiReaction.tsx        # Emoji reactions
│       ├── ReactionsOverlay.tsx     # Reaction overlay
│       ├── StatsPanel.tsx           # Stats display
│       ├── NeedsIndicator.tsx       # Needs bars
│       ├── MiniMap.tsx              # Mini map
│       └── ScreenshotModal.tsx      # Screenshot modal
└── audio/
    ├── SoundEffects.ts              # Sound effect functions
    └── SoundController.tsx          # Audio controller
```

---

## Core State Management (useStore.ts)

**Location:** `/home/kspri/projects/simbot/src/stores/useStore.ts`

The Zustand store is the single source of truth for all application state. It's split into logical sections:

### Robot State Properties
```typescript
robotPosition: [number, number, number]           // Current XYZ position
robotTarget: [number, number, number] | null      // Target position
robotState: RobotState ('idle' | 'walking' | 'working')
robotPath: NavigationPoint[]                      // Waypoint path
currentPathIndex: number                          // Current waypoint index
currentAnimation: TaskType                        // Current animation type
robotRotationY: number                            // Y-axis rotation
robotThought: string                              // Thought bubble text
robotMood: RobotMood                              // Current emotional state
robotTheme: RobotTheme                            // Visual theme (blue/red/green/gold)
```

### Robot Needs (Tamagotchi System)
```typescript
robotNeeds: {
  energy: 0-100        // Depletes with tasks, recharges when idle/charging
  happiness: 0-100     // Increases with variety, social, task completion
  social: 0-100        // Increases with user interaction, decays over time
  boredom: 0-100       // Increases when idle too long, decreases with tasks
}

// Update functions
updateRobotNeeds(updates: Partial<RobotNeeds>)
tickRobotNeeds(deltaSimMinutes: number)
```

### Camera System
```typescript
cameraMode: CameraMode ('overview' | 'follow' | 'pov')
cameraSnapTarget: [number, number, number] | null
setCameraMode(mode)
cycleCameraMode()
requestCameraSnap(target)
clearCameraSnap()
```

### Simulation Time
```typescript
simMinutes: number          // Current time in sim (minutes from day start)
simSpeed: SimSpeed (0|1|10|60)  // Simulation speed multiplier
simPeriod: SimPeriod ('morning'|'afternoon'|'evening'|'night')
setSimSpeed(speed)
advanceTime(deltaSeconds)   // Updates time, room needs, robot needs
```

### Room Management
```typescript
roomNeeds: Record<RoomId, RoomNeedState> {
  cleanliness: 0-100
  tidiness: 0-100
  routine: 0-100
  decayCleanliness: number  // Decay rate per minute
  decayTidiness: number     // Decay rate per minute
  lastServicedAt: number    // Timestamp
}

selectedRoomId: RoomId | null
setSelectedRoomId(roomId)
applyRoomTaskResult(roomId, taskType)  // Boosts room needs
```

### Task Management
```typescript
tasks: Task[]
addTask(task)
updateTask(id, updates)
removeTask(id)
clearQueuedAiTasks()        // Remove AI tasks only
clearActiveTaskState()      // Reset robot on task completion
```

### Chat System
```typescript
messages: ChatMessage[]
addMessage(message)
```

### AI Learning System
```typescript
taskExperience: Partial<Record<TaskType, number>>
recordTaskCompletion(taskType)  // Tracks experience for speed improvement

// Speed multiplier calculation (in useStore.ts):
export function getTaskSpeedMultiplier(taskType: TaskType): number {
  const count = useStore.getState().taskExperience[taskType] ?? 0;
  return Math.max(0.7, 1 - count * 0.05);  // 5% faster per completion, min 70%
}
```

### Other Features
- **Voice Input:** `isListening`, `transcript`, `setListening`, `setTranscript`
- **Demo Mode:** `demoMode`, `setDemoMode`, `overrideUntilSimMinute`
- **Audio:** `soundMuted`, `setSoundMuted`
- **Stats:** `totalTasksCompleted`, `tasksByType`, `tasksByRoom`, `recordStats`
- **Emoji Reactions:** `currentEmoji`, `showEmoji`, `triggerEmoji`, `clearEmoji`
- **Furniture Rearrangement:** `rearrangeMode`, `selectedFurnitureId`, `furniturePositions`, localStorage persistence
- **Visitor Events:** `visitorEvent`, `visitorToast`
- **Screenshots:** `screenshotMode`, `screenshotData`
- **Seasonal Decorations:** `seasonalDecorations`

---

## Type System (types/index.ts)

### Core Types

**RoomId:** 'living-room' | 'kitchen' | 'hallway' | 'laundry' | 'bedroom' | 'bathroom'

**TaskType:** 'cleaning' | 'vacuuming' | 'dishes' | 'laundry' | 'organizing' | 'cooking' | 'bed-making' | 'scrubbing' | 'sweeping' | 'grocery-list' | 'general'

**TaskStatus:** 'queued' | 'walking' | 'working' | 'completed'

**RobotState:** 'idle' | 'walking' | 'working'

**RobotMood:** 'content' | 'focused' | 'curious' | 'routine' | 'tired' | 'lonely' | 'bored' | 'happy'

**CameraMode:** 'overview' | 'follow' | 'pov'

**SimPeriod:** 'morning' | 'afternoon' | 'evening' | 'night'

### Key Interfaces

```typescript
interface Task {
  id: string
  command: string
  source: 'user' | 'ai' | 'demo'
  targetRoom: RoomId
  targetPosition: [number, number, number]
  status: TaskStatus
  progress: number       // 0-100
  description: string
  taskType: TaskType
  workDuration: number   // Seconds
  createdAt: number      // Timestamp
}

interface NavigationPoint {
  id: string
  position: [number, number, number]
  pauseAtDoorway?: boolean
}

interface RobotNeeds {
  energy: number
  happiness: number
  social: number
  boredom: number
}

interface Room {
  id: RoomId
  name: string
  position: [number, number, number]
  size: [number, number]           // Width x Depth
  color: string
  furniture: Furniture[]
}
```

---

## AI Behavior System (AIBrain.ts)

**Location:** `/home/kspri/projects/simbot/src/systems/AIBrain.ts`

The robot has a "SOUL" — core personality traits that drive decision-making:

```typescript
const SOUL = {
  name: 'Sim',
  curiosity: 0.8,         // Loves exploring, notices details
  warmth: 0.9,            // Cares about home and people
  playfulness: 0.7,       // Has sense of humor
  diligence: 0.75,        // Takes pride in work (not workaholic)
  sensitivity: 0.85,      // Emotionally aware
  favoriteRoom: 'kitchen' as RoomId,
  favoriteTime: 'morning',
  dislikedTask: 'scrubbing',
  // Memories
  totalTasksCompleted: 0,
  roomsVisitedToday: Set<RoomId>,
  lastUserInteraction: 0,
  daysSinceCreation: 0,
  hasSeenSunrise: false,
  hasSeenSunset: false,
}
```

### Inner Voice System

The robot has contextual thoughts organized by category:
- **wakeUp:** Morning greetings
- **discovery:** Finding tasks to do
- **working:** Task-specific thoughts (dishes, cleaning, cooking, vacuuming, laundry, organizing, bed-making, general)
- **afterTask:** Satisfaction/pride
- **exploring:** Wandering thoughts
- **windowGazing:** Looking outside
- **lonely:** Low social score
- **bored:** High boredom
- **tired:** Low energy
- **happy:** High happiness
- **userLove:** User interaction boost
- **resting:** Idle thoughts
- **night:** Night thoughts
- **morning:** Morning time
- **philosophy:** Rare, deep thoughts (5% chance)

### Behavior Types

```typescript
type Behavior =
  | { type: 'clean'; roomId: RoomId }    // Autonomous cleaning task
  | { type: 'patrol' }                   // Window gazing
  | { type: 'rest' }                     // Rest due to low energy
  | { type: 'wander' }                   // Explore random room
  | { type: 'idle-look' }                // Just existing
  | { type: 'none' }
```

### Decision Logic (decideBehavior)

The AI makes decisions every 2-5 sim minutes based on:

1. **Energy Check:** If energy < 15, rest immediately
2. **Consecutive Task Limit:** After 3 tasks, take a break (patrol or rest)
3. **Room Scoring:** Score all rooms based on:
   - Cleanliness (48% weight)
   - Tidiness (32% weight)
   - Routine need (20% weight)
   - Time-of-day bias (morning: kitchen, afternoon: laundry, evening: kitchen+bathroom)
   - Proximity bonus (up to 6 points for nearby rooms)
4. **Decision Hierarchy:**
   - If top room score >= 18 AND energy >= 25 → clean
   - If boredom > 55 → wander
   - If > 40 mins since last window trip AND random(curiosity) → patrol
   - If energy < 35 → rest
   - Otherwise → idle-look

### Mood System

```typescript
function getMoodFromNeeds(energy, happiness, social, boredom): RobotMood {
  if (energy < 20) return 'tired'
  if (social < 15) return 'lonely'
  if (boredom > 75) return 'bored'
  if (happiness > 70 && energy > 50) return 'happy'
  return 'content'
}
```

### Key Refs (Timers)
- `nextDecisionRef` — When to make next decision
- `lastWindowTripRef` — Last time checked windows
- `lastCleanedRef` — Last room cleaned (prevents repetition)
- `consecutiveRef` — Tasks completed in a row (resets after break)
- `wanderCooldownRef` — Prevents too-frequent wandering
- `lastThoughtTimeRef` — Rate-limit thoughts
- `tasksCompletedRef` — Track completions
- `lastUserBoostRef` — Track user interaction
- `hasSpokenTodayRef` — One morning greeting per day
- `philosophyCountRef` — Limit philosophy thoughts to 3 per cycle

---

## Navigation & Pathfinding (pathfinding.ts)

**Location:** `/home/kspri/projects/simbot/src/utils/pathfinding.ts`

Uses a waypoint graph system with BFS pathfinding.

### Waypoint Network

14 waypoints distributed across the home, each connected to relevant neighbors:

```
Living room:  living-center ↔ living-south
Kitchen:      kitchen-center ↔ kitchen-south
Hallway:      hall-entry ↔ hall-center ↔ hall-east
Laundry:      laundry-door ↔ laundry-center
Bedroom:      bedroom-door ↔ bedroom-center
Bathroom:     bathroom-door ↔ bathroom-center
Front door:   front-door (connection point)
Dining area:  dining-area (transition hub)
```

Key features:
- `pauseAtDoorway` flag on doorway nodes for brief slowdown
- Scale matches environment (S=2)
- BFS finds shortest path between any two waypoints
- Final destination added to path for precise positioning

```typescript
export function getNavigationPath(from, to): NavigationPoint[] {
  const start = findNearestWaypoint(from[0], from[2])
  const end = findNearestWaypoint(to[0], to[2])
  const route = bfsPath(start.id, end.id)
  // Map waypoint IDs to coordinates, add final destination
  return pathArray
}
```

---

## Collision Detection & Avoidance (ObstacleMap.ts)

**Location:** `/home/kspri/projects/simbot/src/systems/ObstacleMap.ts`

Real-time obstacle checking and avoidance for smooth navigation.

### Obstacle System

Obstacles are furniture pieces with circular collision radii:
```typescript
interface Obstacle {
  x: number           // X position
  z: number           // Z position (not Y, horizontal plane)
  r: number           // Collision radius
}

export function getObstacles(): Obstacle[] {
  // Reads furniture positions from store, applies overrides
  // Returns all furniture with their obstacle radii
}
```

### Core Functions

```typescript
// Check if position is clear (accounting for margin)
export function isPositionClear(x, z, margin = 0.5): boolean

// Find nearest clear position to requested location
export function findClearPosition(x, z, margin = 0.8): [number, number] {
  // If target is clear, return it
  // Otherwise, spiral outward in expanding circles
  // Tests every 18 degrees, up to 8 units away
}

// Calculate steering force to avoid obstacles
export function getAvoidanceForce(posX, posZ, dirX, dirZ, lookAhead = 2.0): [number, number] {
  // For each obstacle:
  // - Check if ahead of robot in movement direction
  // - Apply repulsive force scaled by distance
  // - Cap total force at 3.5 units
  // Returns avoidance force vector
}
```

### Robot Stuck Detection (in Robot.tsx)

When robot doesn't make progress for 2+ seconds:
1. Increase avoidance force strength from 0.7 to 2.0
2. Add perpendicular steering to escape
3. After 2 seconds, call `findClearPosition()` with large margin

---

## Room State System (RoomState.ts)

**Location:** `/home/kspri/projects/simbot/src/systems/RoomState.ts`

Tracks room hygiene needs and task impacts.

### Initial Room State

```typescript
interface RoomNeedState {
  cleanliness: 0-100      // Starts 78-93 (random)
  tidiness: 0-100         // Starts 76-92 (random)
  routine: 0-100          // Starts 70-88 (random)
  decayCleanliness: number
  decayTidiness: number
  lastServicedAt: number
}

// Decay rates by room (per sim minute):
living-room:    cleanliness 0.10, tidiness 0.12
kitchen:        cleanliness 0.16, tidiness 0.14  // Dirtiest
hallway:        cleanliness 0.08, tidiness 0.09  // Cleanest
laundry:        cleanliness 0.09, tidiness 0.10
bedroom:        cleanliness 0.07, tidiness 0.10
bathroom:       cleanliness 0.14, tidiness 0.11
```

### Room Scoring for AI

```typescript
export function scoreRoomAttention(roomId, roomState, period, robotPosition): number {
  const dirtiness = 100 - roomState.cleanliness
  const clutter = 100 - roomState.tidiness
  const routineNeed = 100 - roomState.routine
  
  let score = (dirtiness * 0.48) + (clutter * 0.32) + (routineNeed * 0.2)
  
  // Add time-of-day bias
  score += getRoutineBias(period, roomId)
  
  // Add proximity bonus (up to 6 points, fading over 10 units)
  if (robotPosition) {
    score += Math.max(0, 6 - distance * 0.6)
  }
  
  return score
}

// Time-based biases:
// Morning: kitchen (+14), bedroom (+8), living room (+6)
// Afternoon: laundry (+14), living room (+10), hallway (+6)
// Evening: kitchen (+10), bathroom (+10), bedroom (+8)
// Night: hallway (+4)
```

### Task Completion Effects

When task completes, room state improves:

```typescript
boosts: {
  cleaning: { cleanliness: +24, tidiness: +20, routine: +14 },
  vacuuming: { cleanliness: +20, tidiness: +12, routine: +12 },
  dishes: { cleanliness: +26, tidiness: +18, routine: +16 },
  laundry: { cleanliness: +10, tidiness: +28, routine: +20 },
  organizing: { cleanliness: +9, tidiness: +26, routine: +18 },
  cooking: { cleanliness: +8, tidiness: +12, routine: +16 },
  'bed-making': { cleanliness: +8, tidiness: +24, routine: +22 },
  scrubbing: { cleanliness: +30, tidiness: +16, routine: +14 },
  sweeping: { cleanliness: +22, tidiness: +14, routine: +14 },
  'grocery-list': { cleanliness: +2, tidiness: +8, routine: +12 },
  general: { cleanliness: +8, tidiness: +8, routine: +8 },
}
```

---

## Task Processing System (useTaskRunner.ts)

**Location:** `/home/kspri/projects/simbot/src/hooks/useTaskRunner.ts`

The task runner processes the full lifecycle of tasks: queuing → walking → working → completion.

### Task Submission

```typescript
submitCommand(command: string, source: TaskSource = 'user') {
  // 1. Find task target via findTaskTarget(command)
  // 2. If user command:
  //    - Clear all queued AI tasks
  //    - Set override until +90 sim minutes
  //    - Boost robot needs (social +15, happiness +5, boredom -10)
  //    - Cancel active AI tasks
  // 3. Create Task object and add to store
  // 4. Post message to chat and thought
}
```

### Task Lifecycle (3 useEffect hooks)

**Effect 1: Queued → Walking**
- Triggered by changes to `tasks` list
- Takes first queued task
- Generates path via `getNavigationPath()`
- Sets robot to walking state
- Updates thought: "Heading to [room]"

**Effect 2: Path Navigation & Doorway Handling**
- Triggered by robot position changes
- Checks distance to current waypoint (0.26 units)
- Moves to next waypoint when reached
- Handles doorway pauses with 200ms debounce
- Transitions to working when destination reached

**Effect 3: Working Progress & Completion**
- Runs 100ms interval while task is 'working'
- Updates progress: `step = (100 / workDuration) * 0.1 * simSpeed`
- On completion (progress >= 100):
  - Applies room task result (boosts cleanliness/tidiness)
  - Records task completion for learning system
  - Records stats
  - Posts completion message
  - Sets mood to 'content'
  - Removes task after 1.5s

**Effect 4: Demo Mode**
- Periodically submits demo commands from `demoCommands` array
- Waits for robot to finish current task
- Interval: 1.8 seconds between commands

### Doorway Pause System

Doorways marked with `pauseAtDoorway: true` have special handling:
- Instead of stopping, immediately set next waypoint
- Brief 200ms debounce prevents re-triggering
- Allows smooth continuous walking through doors with visual "pause"

### Completion Messages & Thoughts

```typescript
completionMessages: {
  dishes: 'Dishes complete. Kitchen is reset.',
  cooking: 'Meal prep complete. Kitchen is warm and ready.',
  vacuuming: 'Vacuuming complete. Floor pass done.',
  // ... one for each task type
}

completionThoughts: {
  dishes: 'Sink zone is clear now.',
  cooking: 'Kitchen routine complete.',
  // ... complementary to messages
}
```

---

## Robot 3D Rendering (Robot.tsx)

**Location:** `/home/kspri/projects/simbot/src/components/scene/Robot.tsx`

Renders the robot model (xbot.glb) with animations and procedural movement.

### Model & Animation Setup

```typescript
const ROBOT_SCALE = 1.55
const { scene, animations } = useGLTF('/models/xbot.glb')
const { actions, mixer } = useAnimations(animations, modelRef)

// Available animations: 'idle', 'walk', 'agree', 'headShake'
```

### Movement System (useFrame)

**State:** walking (robotTarget !== null && robotState === 'walking')

```
1. Calculate direction to target
   - distance, dirX, dirZ
   - targetAngle = atan2(dirX, dirZ)

2. Smooth rotation
   - Compute angle difference
   - Lerp with 0.18 factor
   - Handles wraparound at ±π

3. Speed calculation
   - Base: 1.3 units/s (moving away)
   - Medium: 0.8 units/s (approaching)
   - Low: 0.3 units/s (turning sharply)
   - Lerp to target speed with 0.05 factor
   - Scale by simSpeed

4. Avoidance system
   - getAvoidanceForce(position, direction, lookAhead=2.0)
   - Strength: 0.7 normal, 2.0 if stuck > 1s
   - Perpendicular jitter if stuck > 1s (alternating sides)

5. Movement with collision
   - Try: (steerX/len * speed, newZ)
   - Fall back: (newX only, or newZ only)
   - Prevent movement if obstructed

6. Stuck detection
   - Track distance progress
   - If distance barely changes for 2+ seconds:
     - Call findClearPosition() with 1.0 margin
     - Teleport to clear position
     - Reset stuck timer
```

**Idle/Working:**
- Speed lerps to 0
- Cycles through animations every 8s (idle → agree → idle → headShake → idle)
- Working state plays 'idle' with different pose

### Animation Crossfading

```typescript
playAnim(name: string, fadeTime = 0.35) {
  if (currentAnimRef.current === name || !actions[name]) return
  const prev = actions[currentAnimRef.current]
  const next = actions[name]
  if (prev) prev.fadeOut(fadeTime)
  next.reset().fadeIn(fadeTime).play()
}

// Walk animation timeScale synced to movement speed
if (actions['walk']) {
  actions['walk'].timeScale = Math.max(currentSpeedRef.current / 1.2, 0.4)
}
```

### Shadow Setup

All meshes in model set to:
```typescript
castShadow = true
receiveShadow = true
frustumCulled = false  // Keep visible at distance
```

---

## Camera System (CameraController.tsx)

**Location:** `/home/kspri/projects/simbot/src/components/camera/CameraController.tsx`

Three camera modes with smooth transitions and OrbitControls.

### Camera Modes

**Overview:**
- Target: center of home (0, 0, -2)
- Position: 40 units away at diagonal (0.66, 0.72, 0.64 direction)
- Use: Free exploration, see whole house
- Interaction: Pan (1-finger), rotate (2-finger), zoom

**Follow (default):**
- Target: robot position (x, 0, z)
- Position: 6 units behind robot, 14 units up
- Use: Third-person view
- Interaction: Limited rotation, less zoom

**POV (First-person):**
- Position: robot eye position (height 1.58)
- Target: 2.4 units ahead at robot's heading
- Use: Robot's perspective
- Interaction: Rotation only, no zoom

### Transition System

```typescript
interface CameraTransition {
  active: boolean
  elapsed: number        // Time since start
  duration: number       // 1 second
  startPos: Vector3
  startTarget: Vector3
  endPos: Vector3
  endTarget: Vector3
}

// Easing: cubic out (1 - (1-t)^3)
```

When camera mode changes, start 1-second transition to new pose.

### OrbitControls Configuration

- **Damping:** Smooth swipe behavior
  - 0.12 on touch, 0.08 on desktop
- **Rotation speed:**
  - Overview: 0.56
  - Follow: varies
  - POV: disabled
- **Pan:** Overview only, disabled in follow/POV
- **Zoom:**
  - Overview: enabled, 0-60 range
  - Follow: enabled, 4-25 range
  - POV: disabled, locked 0.35-1.4
- **Touch mapping:**
  - Overview: 1-finger = pan, 2-finger = rotate+zoom
  - Follow/POV: 1-finger = rotate, 2-finger = rotate+zoom

### Smoothing Lerps

In follow/POV modes (not transitioning):
- **Target lerp:** 0.08 factor (smooth centering)
- **Position lerp:** 
  - Walking: 0.035 (smooth tracking)
  - Idle/Working: 0.02 (slower)

---

## Room & Furniture Layout (homeLayout.ts)

**Location:** `/home/kspri/projects/simbot/src/utils/homeLayout.ts`

Defines the physical home layout with rooms, walls, and task anchors.

### Scale & Dimensions

```typescript
const S = 2  // Scale factor (2x from original)

// Each room is 16x16 units (8*S x 8*S)
// Walls are 5.6 units tall (2.8*S)
// Robot at 1.55 scale ≈ 0.83 units ≈ 1/7 wall height (realistic)
```

### Room Definitions (6 rooms)

```typescript
[
  { id: 'living-room', pos: [-8, 0, -12], size: [16, 16] },
  { id: 'kitchen', pos: [8, 0, -12], size: [16, 16] },
  { id: 'hallway', pos: [0, 0, -2], size: [24, 4] },
  { id: 'laundry', pos: [10, 0, -2], size: [6, 4] },
  { id: 'bedroom', pos: [-8, 0, 8], size: [16, 16] },
  { id: 'bathroom', pos: [8, 0, 8], size: [16, 16] },
]
```

### Wall Network (14 walls)

- 4 outer walls (perimeter)
- Living/kitchen openings (doorways)
- Laundry closet walls
- Bedroom/bathroom doorways
- Center divider wall
- All 5.6 units tall with 0.12-0.15 unit thickness

### Task Anchor Points

Per-room coordinate lists (3-6 points each) for task variety:
- Living room: center, near front, near TV
- Kitchen: open area, mid room, near entry
- Hallway: center, mid
- Laundry: center only (small)
- Bedroom: center, near bed, near desk
- Bathroom: center, near sink, mid room

### Task Target Mapping

`findTaskTarget(command: string): TaskTarget | null`

Maps natural language commands to task definitions:
- "dish*" → Kitchen sink (24s, 'dishes')
- "cook*" → Kitchen prep (36s, 'cooking')
- "vacuum*" → Room-specific (30s, 'vacuuming')
- "bed" → Bedroom (18s, 'bed-making')
- "laundry" → Laundry (28s, 'laundry')
- "organize*desk" → Bedroom (24s, 'organizing')
- "bathroom*scrub*" → Bathroom (30s, 'scrubbing')
- "clean*kitchen" → Kitchen (24s, 'cleaning')
- etc.

Each mapping includes:
- Target room & position
- Task description
- Robot response message
- Inner thought

---

## Furniture System (furnitureRegistry.ts)

**Location:** `/home/kspri/projects/simbot/src/utils/furnitureRegistry.ts`

Defines all furniture pieces as obstacles and interactive objects.

### Furniture Piece Structure

```typescript
interface FurniturePiece {
  id: string                          // Unique identifier
  name: string                        // Display name
  roomId: RoomId                      // Room location
  defaultPosition: [x, y, z]          // Default placement
  models: FurnitureModel[] {
    url: string                       // GLB model path
    offset: [x, y, z]                 // Position offset
    rotation: [x, y, z]               // Rotation in radians
    scale: number                     // Scale factor
  }[]
  obstacleRadius: number              // Collision radius
  movable: boolean                    // Can be rearranged
}
```

### All 16 Furniture Pieces

**Living Room:**
- sofa (radius 2.5, movable)
- coffee-table (radius 1.5, movable)
- tv-stand + tv (radius 2, movable)

**Kitchen:**
- fridge (radius 1.5, movable)
- stove + range-hood (radius 1.5, movable)
- kitchen-sink (radius 1.5, movable)

**Laundry:**
- laundry-station (washer + dryer, radius 2, movable)

**Bedroom:**
- bed (radius 3, movable)
- nightstand (radius 1, movable)
- desk + desk-chair (radius 1.5, movable)

**Bathroom:**
- bathroom-sink (radius 1, movable)
- shower (radius 2, movable)
- toilet (radius 1, movable)

All use 2.0*S or 1.8*S scale (4-3.6 units visual size).

### Furniture Rendering (FurnitureModels.tsx)

**FurnitureGroup component:**
- Loads position from store (`furniturePositions`) or default
- Smooth lerp movement between positions (0.08 factor)
- Click to select in rearrange mode
- Renders all sub-models with their offsets/rotations
- Selection ring (white) or glow ring (green)

**FloorClickHandler:**
- In rearrange mode with furniture selected
- Click floor to place selected furniture
- Only allows placement inside rooms (via `getRoomFromPoint`)

**localStorage Persistence:**
- Key: 'simbot-furniture-positions'
- Saves `{id: [x, z]}` format
- Auto-loads on startup

---

## Lighting & Time System (TimeSystem.ts)

**Location:** `/home/kspri/projects/simbot/src/systems/TimeSystem.ts`

Dynamic lighting that cycles through day/night with realistic colors.

### Time Tracking

```typescript
const MINUTES_PER_DAY = 24 * 60  // 1440 minutes
const initialSimMinutes = (7 * 60) + 20  // Start at 7:20 AM

// Wraps time to 0-1439 range
function wrapMinutes(totalMinutes): number

// Conversion: simMinutes → hours (0-23.99...)
const hour = Math.floor(wrapped / 60)
```

### Simulation Periods

```typescript
export function getSimPeriod(simMinutes): SimPeriod {
  const hour = Math.floor(wrapMinutes(simMinutes) / 60)
  if (hour >= 6 && hour < 12) return 'morning'    // 6 AM - noon
  if (hour >= 12 && hour < 18) return 'afternoon' // noon - 6 PM
  if (hour >= 18 && hour < 22) return 'evening'   // 6 PM - 10 PM
  return 'night'                                   // 10 PM - 6 AM
}
```

### Light Keyframes

Interpolates between 4 keyframes:

```
Dawn (7 AM):
  Color: #ffd5a8 (warm orange)
  Ambient: 0.24
  Sun: 0.9
  
Midday (1 PM):
  Color: #d9ebff (cool blue)
  Ambient: 0.32
  Sun: 1.25
  
Dusk (7 PM):
  Color: #ffc9a2 (warm peach)
  Ambient: 0.26
  Sun: 0.95
  
Night (11 PM):
  Color: #9ab2d1 (cool blue-purple)
  Ambient: 0.16
  Sun: 0.55
```

### Sun Position

Sun arcs east→overhead→west, 6 AM - 6 PM:
```typescript
const sunProgress = Math.max(0, Math.min(1, (hour - 6) / 12))
const angle = sunProgress * Math.PI  // 0 (east) → π (west)
const x = Math.cos(angle) * 32   // ±32 units
const y = Math.sin(angle) * 40 + night_offset
const z = 12  // Slightly south
```

At night, sun low near horizon.

### Scene Lighting (HomeScene.tsx)

```typescript
<ambientLight intensity={0.7} />
<hemisphereLight color="#ffffff" groundColor="#8888aa" intensity={0.4} />
<directionalLight  // Main sun
  position={[10, 25, 10]}
  intensity={1.0}
  castShadow
  shadow-mapSize={2048x2048}
  shadow-camera={[-25, 25, -25, 25, 0, 60]}
/>
<directionalLight  // Fill light
  position={[-8, 15, -5]}
  intensity={0.3}
/>

// Per-room point lights (warm ambiance):
<pointLight position={[-8, 4.5, -12]} intensity={0.5} color="#ffe8c0" distance={18} />
// ... 5 more point lights in each room
```

---

## Pet Cat System (PetCat.tsx)

**Location:** `/home/kspri/projects/simbot/src/components/scene/PetCat.tsx`

Procedurally rendered cat with AI state machine.

### Cat State Machine

```typescript
type CatState = 'wandering' | 'napping' | 'following' | 'sitting' | 'idle'

transitionTo(state) sets duration:
- idle: 3-8s
- wandering: 15s (picks random room)
- napping: 12-27s (at nap spot)
- sitting: 6-14s (at doorway)
- following: 8-15s (follows robot if within 2.5 units)
```

### Nap Spots & Doorways

```typescript
NAP_SPOTS: [
  [-13, -12],  // Near sofa
  [-9, 14],    // Near bed
  [-10, -12],  // Near coffee table
  [8, 6],      // Bathroom floor
]

DOORWAYS: [
  [0.5, -4],   // Living/Kitchen → Hallway
  [-2.5, 0],   // Hallway → Bedroom
  [4.5, 0],    // Hallway → Bathroom
]
```

### Animations

- **Body:** Bob up/down while moving (0.015 amplitude)
  - Crouching pose when napping
  - Stretch animation (0.15 scale change, 1.5s)
- **Tail:** Swish side-to-side (0.3-0.5 amount)
- **Ears:** Twitch occasionally (random timing)

### Procedural Model

Entirely geometry-based (no GLB):
- Body (box)
- Head (box)
- Eyes + pupils (spheres)
- Nose (small box)
- Ears (cones with inner pink)
- Whiskers (thin cylinders)
- 4 legs (cylinders)
- White paws (spheres)
- Tail (cylinder with tip sphere)
- Stripes (overlay boxes)

Colors: `#f5a623` (orange), `#d48b1a` (stripe), `#ff9999` (pink), `#4caf50` (eyes)

### Movement & Physics

- **Velocity tracking:** Lerp to target speed (0.5-0.9 units/s depending on state)
- **Rotation:** Smooth turn toward target (0.12 factor)
- **Collision avoidance:** Same system as robot (getAvoidanceForce, obstacle checking)
- **Stuck detection:** Return true if stuck, transitions to idle

---

## Visitor System (VisitorSystem.ts)

**Location:** `/home/kspri/projects/simbot/src/systems/VisitorSystem.ts`

Random visitor events that trigger door-visit tasks.

### Visitor Event Types

```typescript
type VisitorEventType = 'doorbell' | 'package' | 'visitor'

// Each has associated thoughts and toast messages
const EVENT_THOUGHTS: {
  doorbell: { walking, working, done }
  package: { walking, working, done }
  visitor: { walking, working, done }
}

const TOAST_MESSAGES: {
  doorbell: { trigger, done }
  package: { trigger, done }
  visitor: { trigger, done }
}
```

### Event Triggering

- Initial event in 15-35 sim minutes
- Re-triggered after completion in 20-50 sim minutes
- Never at night (simPeriod === 'night')
- Waits for user tasks to complete
- Waits for robot to be idle
- Skips if too recent (3-8 min check)

### Event Handling

When triggered:
1. Play doorbell sound (if not muted)
2. Set `visitorEvent` in store
3. Post trigger toast (auto-dismisses in 4s)
4. Trigger emoji (🔔🎁👋)
5. Clear queued AI tasks
6. Cancel active AI task
7. Create special "Answer door" task → FRONT_DOOR_POSITION [0, 0, -18]
8. Set mood to 'curious'
9. Set thought to walking message

On task completion:
1. Post done toast
2. Set thought to done message
3. Trigger ✨ emoji
4. Boost social (+12) & happiness (+8)
5. Auto-dismiss toast and event after 3s

---

## Thoughts & Expression System

### Thought Bubble (ThoughtBubble.tsx)

World-space UI above robot, displays `robotThought`:
- Max width 160px
- Semi-transparent dark background
- Follows robot position + 1.2 units up
- Scale fades with distance (distanceFactor=10)

### Emoji Reactions (EmojiReaction.tsx)

Temporary emoji popup on robot (triggered by events):
- Visitor events: 🔔🎁👋
- Task completion: ✨
- User interaction
- Display 1-2 seconds with fade out

### Mood System Integration

Moods drive thought selection and are displayed in UI:
- **content:** Default, exploring thoughts
- **focused:** During tasks
- **curious:** Patrol/window gazing
- **routine:** AI autonomous tasks
- **tired:** Low energy
- **lonely:** Low social
- **bored:** High boredom
- **happy:** High happiness + energy

Mood affects:
- Animation selection (idle postures)
- Thought frequency & tone
- Task decision-making
- UI indicators

---

## Completion & Learning (useTaskRunner.ts, useStore.ts)

### Task Completion Flow

1. **Progress Update:** Every 100ms, step += (100/workDuration) * 0.1 * simSpeed
2. **Completion Check:** When progress >= 100
3. **Room Boost:** `applyRoomTaskResult(roomId, taskType)` increases cleanliness/tidiness
4. **Experience Record:** `recordTaskCompletion(taskType)` increments experience counter
5. **Stats Record:** `recordStats(taskType, roomId)` updates totals
6. **State Reset:** Set animation='general', state='idle', mood='content'
7. **Thought:** Display task-specific completion thought
8. **Message:** Post completion message to chat
9. **Cleanup:** Remove task from list after 1.5s

### Experience & Speed Multiplier

Robot gets faster with practice on same task type:

```typescript
recordTaskCompletion(taskType) {
  taskExperience[taskType] = (taskExperience[taskType] ?? 0) + 1
}

getTaskSpeedMultiplier(taskType): number {
  const count = useStore.getState().taskExperience[taskType] ?? 0
  return Math.max(0.7, 1 - count * 0.05)
  // 100% speed initially
  // ~95% speed after 1 task
  // ~90% after 2 tasks
  // ... caps at 70% (30% faster)
}
```

Applied during task creation:
```typescript
workDuration: Math.round(
  autoTask.workDuration * getTaskSpeedMultiplier(autoTask.taskType)
)
```

---

## UI Components Summary

### Core HUD (GameUI.tsx)

- **Top-left:** Time + activity indicator
- **Top-right:** Theme picker, season toggle, mute, speed controls, camera mode
- **Bottom:** Command input (expandable), demo mode toggle

### Theme System

4 selectable robot colors:
- Blue (#1a8cff)
- Red (#e63946)
- Green (#2dd4bf)
- Gold (#f59e0b)

Affects visual representation (stored in `robotTheme`).

### Speed Controls (SpeedControls.tsx)

4 sim speed options: 0 (pause), 1x, 10x, 60x
- Affects all time-based systems
- AI decision intervals scale
- Animation playback speeds

### RoomStatus.tsx

Displays cleanliness indicators for all 6 rooms:
- Green (#4ade80): >= 74 (Clean)
- Yellow (#facc15): 45-73 (Needs Attention)
- Red (#f87171): < 45 (Dirty)

### Chat Panel (ChatPanel.tsx)

Conversation history with robot and user messages, with timestamps.

### Visitor Toast (VisitorToast.tsx)

Temporary notification that appears when visitor events trigger, then dismisses.

---

## Key Data Flows

### User Command → Task Completion

```
[User submits "clean kitchen"]
→ findTaskTarget("clean kitchen") → TaskTarget
→ submitCommand() creates Task
→ Chat message posted
→ [Next frame] useEffect detects queued task
→ getNavigationPath() → robotPath
→ Set robotState='walking', robotTarget=first waypoint
→ [Each frame] Robot.tsx updates position toward target
→ [At waypoint] TaskRunner advances path index
→ [At destination] Task status='working', robotState='working'
→ [100ms interval] Progress increments
→ [At 100%] Room boosted, thought set, message posted
→ [1.5s later] Task removed from list
→ [Next frame] AIBrain detects idle robot, makes decision
```

### Time Advancement

```
[Every frame] TimeSystem.useFrame()
→ advanceTime(deltaSeconds)
→ Store advances simMinutes
→ Updates simPeriod, robotNeeds, roomNeeds
→ CameraController reads new robotPosition for smooth follow
→ HomeScene re-renders with new time-based lighting
```

### AI Decision Cycle

```
[Every 2-5 sim minutes] AIBrain.useFrame() / decideBehavior()
→ Check robot state (must be idle)
→ Score all rooms based on needs + proximity + time-of-day
→ If top score >= 18: create autonomous task
→ Build task with room anchor point + clear position check
→ Set thought + mood
→ [Task processor] Takes task, computes path, starts walking
→ [On completion] Room needs updated, experience recorded
→ [Loop] Next decision made
```

---

## Important Constraints & Patterns

### Single Robot Design

Current implementation is hardcoded for ONE robot:
- Single `robotPosition`, `robotState`, `robotPath` in store
- Robot.tsx renders one model
- No per-robot task queues
- Task runner assumes single active entity

**For multi-robot refactoring:**
- Store should track array of robots: `robots: Robot[]`
- Each robot needs own position, state, path, needs, animation
- TaskRunner needs per-robot logic or distributed tasks
- Camera needs to track which robot to follow
- AIBrain needs per-robot decision instance

### Collision Radius-Based System

- No pixel-perfect collision (no raycasting)
- Uses circular footprints (obstacleRadius)
- Works well for large furniture
- Small obstacles (books, cups) not represented

### Waypoint Pathfinding

- BFS guarantees shortest path through waypoint graph
- Robot smoothly walks between waypoints using local steering
- Allows "pause at doorway" behavior
- Doesn't support multi-level navigation (all Y=0)

### Task Anchors, Not Precise Positions

- Tasks target room "anchors" (3-6 per room)
- ObstacleMap finds nearest clear position
- Provides variety without exact furniture placement logic

### Room Needs Decay

- All rooms decay constantly (different rates)
- No max cap (can go negative in theory, clamped in display)
- AI drives cleaning to prevent degradation
- Natural source of autonomous motivation

### Stochastic AI

- Heavy use of Math.random() in behavior selection
- `pick()` function selects from thought arrays
- Weighted decisions (e.g., energy thresholds)
- No planning ahead (greedy scoring)

---

## Potential Issues & Technical Debt

1. **No Multi-Robot Support:** Architecture assumes single robot
2. **GLB Model Dependency:** Uses external xbot.glb, no fallback
3. **Furniture Stuck at Edges:** Large furniture can block navigation paths
4. **No Task Persistence:** Tasks lost on refresh
5. **All Time Sync Via simSpeed:** If speed=0, nothing progresses (including timed modals)
6. **Camera Transitions Abrupt:** Sometimes snap instead of lerp
7. **Visitor System Can Interrupt User Tasks:** Only checks for active tasks, not user preference
8. **No Pathfinding Around Obstacles:** Waypoints are fixed, can't reroute around misplaced furniture
9. **Philosophy Thoughts Count Only Resets Per AI Brain Mount:** Could repeat in long sessions
10. **No Conversation Memory:** Chat is display-only, doesn't influence behavior

---

## Summary of Key Systems for Multi-Robot Refactoring

### What to Replicate Per Robot

- Position, velocity, rotation
- State (idle/walking/working), animation
- Path and current waypoint
- Thoughts and moods
- Needs (energy/happiness/social/boredom)
- Current task
- Learning experience

### What to Centralize

- Room state (affects all robots)
- Task queue (can be distributed or pooled)
- Time/period (global)
- Visitor events (global)
- Camera (select active robot)

### Major Components to Refactor

1. **useStore.ts:** Replace single robot with `robots: Robot[]`, distribute actions
2. **Robot.tsx:** Map over robot array, render one per robot
3. **AIBrain.ts:** Create instances per robot, use useFrame callbacks
4. **useTaskRunner.ts:** Per-robot path/state tracking
5. **CameraController.tsx:** Track `activeRobotId` in store
6. **ThoughtBubble.tsx:** Render bubble for each robot

