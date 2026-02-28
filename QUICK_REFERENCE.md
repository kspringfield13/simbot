# SimBot Quick Reference - Key Files & Locations

## File Inventory

### State Management (Zustand)
- **useStore.ts** (379 lines) - Single source of truth
  - Robot position, state, animation, mood, needs
  - Camera mode
  - Tasks and chat messages
  - Room state (cleanliness/tidiness)
  - Furniture positions (localStorage)
  - Demo mode, stats tracking

### Core AI & Systems
- **AIBrain.ts** (520 lines) - Decision-making engine
  - SOUL object (personality traits)
  - INNER_VOICE (thought library, 200+ lines)
  - decideBehavior() function (room scoring, decision logic)
  - Refs: nextDecision, lastWindowTrip, lastCleaned, consecutive, wanderCooldown, lastThought, tasksCompleted, lastUserBoost, hasSpokenToday, philosophy

- **RoomState.ts** (203 lines) - Room hygiene tracking
  - createInitialRoomNeeds()
  - decayRoomNeeds() - Per-minute degradation
  - boostRoomAfterTask() - Completion effects
  - scoreRoomAttention() - AI priority scoring
  - roomOutlineColor(), roomAttentionLabel()
  - buildAutonomousTask() - Generates task with clear position

- **ObstacleMap.ts** (68 lines) - Collision & avoidance
  - getObstacles() - Reads furniture from store
  - isPositionClear(x, z, margin)
  - findClearPosition(x, z, margin) - Spiral search
  - getAvoidanceForce(x, z, dirX, dirZ) - Steering force

- **TimeSystem.ts** (153 lines) - Time & lighting
  - getSimPeriod(minutes) - 4 periods
  - formatSimClock(minutes) - Time display
  - getTimeLighting(minutes) - Dynamic colors
  - 4 keyframes: dawn, midday, dusk, night

- **VisitorSystem.ts** (197 lines) - Visitor events
  - 3 event types: doorbell, package, visitor
  - EVENT_THOUGHTS & TOAST_MESSAGES
  - Triggers every 15-50 sim minutes
  - Creates door-visit task

### Navigation & Layout
- **pathfinding.ts** (87 lines) - Waypoint graph
  - 14 waypoints across home
  - bfsPath() - Shortest path
  - getNavigationPath() - Returns NavigationPoint[]

- **homeLayout.ts** (183 lines) - Environment definition
  - 6 rooms with position/size/color
  - 14 walls with gaps (doorways)
  - roomTaskAnchors - 3-6 per room
  - findTaskTarget(command) - NLP-like mapping
  - getRoomCenter(), getRoomFromPoint()

- **furnitureRegistry.ts** (185 lines) - Furniture catalog
  - FURNITURE_PIECES: 16 pieces
  - Each with: position, models[], obstacleRadius, movable
  - 3-5 living, 3 kitchen, 1 laundry, 3 bedroom, 3 bathroom

### Task Processing
- **useTaskRunner.ts** (343 lines) - Main task loop
  - submitCommand(command, source)
  - 4 useEffect hooks:
    1. queued → walking (path generation)
    2. walking → working (waypoint progression)
    3. working → completion (progress, 100ms interval)
    4. demo mode command scheduling

### 3D Rendering
- **Robot.tsx** (176 lines) - Robot model & movement
  - Loads xbot.glb model
  - Movement physics: rotation, speed, avoidance, stuck detection
  - Animation crossfading (idle, walk, agree, headShake)
  - Shadow setup, scale 1.55

- **HomeScene.tsx** (57 lines) - Main 3D scene
  - Renders: rooms, walls, furniture, robot, cat, visitors, decorations
  - Lighting: ambient, hemisphere, directional, point lights
  - Mounts systems: TimeSystem, AIBrain, CameraController

- **FurnitureModels.tsx** (137 lines) - Furniture rendering
  - FurnitureGroup: position tracking, selection ring, smooth movement
  - FloorClickHandler: placement in rearrange mode
  - localStorage persistence

- **PetCat.tsx** (391 lines) - Procedural cat
  - State machine: wandering, napping, following, sitting, idle
  - Procedural geometry (no GLB)
  - Movement physics, animation loops
  - 6 nap spots, 3 doorway sitting spots

- **CameraController.tsx** (233 lines) - Camera system
  - 3 modes: overview (pan/rotate/zoom), follow (third-person), pov (first-person)
  - Smooth transitions (1 second, cubic out easing)
  - OrbitControls with touch support
  - Damping, constraints per mode

### UI Components
- **GameUI.tsx** (233 lines) - Main HUD
  - Top-left: time + activity indicator
  - Top-right: theme, season, mute, speed, camera
  - Bottom: command input, demo toggle
  - ThemePicker, SeasonToggle, MuteToggle

- **ThoughtBubble.tsx** (20 lines) - World-space thought display

- **RobotTerminal.tsx** - Command terminal interface

- **ChatPanel.tsx** - Chat history display

- **EmojiReaction.tsx** - Emoji pop-ups on robot

- **VisitorToast.tsx** - Event notifications

### Supporting Files
- **types/index.ts** (114 lines) - All TypeScript interfaces
- **Audio/SoundEffects.ts** - Sound playback
- **App.tsx** - Main React component tree
- **TaskProcessor.tsx** - Headless task executor

---

## Critical Data Structures

### Task Object
```typescript
{
  id: UUID
  command: string
  source: 'user' | 'ai' | 'demo'
  targetRoom: RoomId
  targetPosition: [x, y, z]
  status: 'queued' | 'walking' | 'working' | 'completed'
  progress: 0-100
  description: string
  taskType: TaskType
  workDuration: number
  createdAt: timestamp
}
```

### RobotNeeds Object
```typescript
{
  energy: 0-100          // +0.15/min idle, -0.08/min working, -0.03/min walking
  happiness: 0-100       // +0.02/min working, -0.01/min idle
  social: 0-100          // -0.02/min always
  boredom: 0-100         // +0.06/min idle, -0.05/min working, -0.02/min walking
}
```

### NavigationPoint Array
```typescript
[
  { id: 'waypoint-id', position: [x, y, z], pauseAtDoorway?: boolean },
  // ... more waypoints ...
  { id: 'destination', position: [x, y, z] }  // Final position
]
```

---

## Key Function Signatures

### AI Decision
```typescript
decideBehavior(s: Store, needs, now): Behavior
// Returns: { type: 'clean'|'patrol'|'rest'|'wander'|'idle-look'|'none', roomId? }
```

### Pathfinding
```typescript
getNavigationPath(from: [x,y,z], to: [x,y,z]): NavigationPoint[]
```

### Room Scoring
```typescript
scoreRoomAttention(roomId, state, period, robotPosition): number
// Output: 0-100+ score for priority
```

### Task Target Mapping
```typescript
findTaskTarget(command: string): TaskTarget | null
// Returns: { roomId, position, description, taskType, workDuration, response, thought }
```

### Collision Detection
```typescript
isPositionClear(x, z, margin): boolean
findClearPosition(x, z, margin): [x, z]
getAvoidanceForce(x, z, dirX, dirZ): [forceX, forceZ]
```

---

## State Update Patterns

### Update Robot Position
```typescript
setRobotPosition([x, y, z])  // From Robot.tsx movement
```

### Queue Task
```typescript
addTask(task)  // submitCommand() creates & adds
```

### Complete Task
```typescript
updateTask(taskId, { status: 'completed', progress: 100 })
applyRoomTaskResult(roomId, taskType)  // Boosts room needs
recordTaskCompletion(taskType)         // Learning system
recordStats(taskType, roomId)          // Stats tracking
removeTask(taskId)                     // After 1.5s
```

### Trigger Visitor
```typescript
setVisitorEvent({ type: 'doorbell'|'package'|'visitor' })
addTask(doorTaskObject)
setVisitorToast(message)
triggerEmoji(emoji)
```

### Set Thought
```typescript
setRobotThought(text)  // Updates thought bubble
```

### Update Mood
```typescript
setRobotMood('tired'|'lonely'|'bored'|'happy'|'content'|'focused'|'curious'|'routine')
```

---

## Constants & Configuration

### Scale
- S = 2 (2x from original layout)
- Robot scale = 1.55
- Rooms: 16×16 units each
- Walls: 5.6 units tall

### Time
- initialSimMinutes = 440 (7:20 AM)
- simSpeed: 0, 1, 10, 60
- Decision interval: 2-5 sim minutes
- Task intervals: 100ms progress update

### AI Behavior
- Energy drain: 0.08/min working, 0.03/min walking
- Energy restore: 0.15/min idle
- Room scoring weights: cleanliness 48%, tidiness 32%, routine 20%
- Consecutive task limit: 3 before break
- Window trip frequency: max 40+ sim minutes apart

### Room Decay Rates (per min)
- living-room: 0.1 clean, 0.12 tidy
- kitchen: 0.16 clean, 0.14 tidy
- laundry: 0.09 clean, 0.1 tidy
- bedroom: 0.07 clean, 0.1 tidy
- bathroom: 0.14 clean, 0.11 tidy
- hallway: 0.08 clean, 0.09 tidy

### Task Speed Multiplier (Learning)
- Starts: 100%
- Per completion: -5%
- Minimum: 70% (30% faster)

### Waypoint Network
- 14 waypoints total
- Max distance: 2-3 hops for most rooms
- Doorway pause: 200ms debounce

---

## Entry Points for Extension

### Add New Task Type
1. Add to TaskType enum in types/index.ts
2. Add boost to boostRoomAfterTask() in RoomState.ts
3. Add to completionMessages in useTaskRunner.ts
4. Add command mapping in findTaskTarget() in homeLayout.ts
5. Add to buildAutonomousTask() room-task picker

### Add New Room
1. Add Room object to rooms[] in homeLayout.ts
2. Add RoomId variant to type definition
3. Add to createInitialRoomNeeds() base decay
4. Add decay rates to baseDecayByRoom
5. Add waypoints to pathfinding.ts network
6. Add task anchors to roomTaskAnchors
7. Add walls as needed
8. Update routine biases in RoomState.ts
9. Add point light in HomeScene.tsx

### Add New Furniture
1. Add FurniturePiece to FURNITURE_PIECES in furnitureRegistry.ts
2. Set position, obstacle radius, movability
3. Add GLB model path(s)
4. Update obstacle map automatically reads from registry

### Modify AI Behavior
1. Edit SOUL traits in AIBrain.ts
2. Add/remove INNER_VOICE thoughts
3. Adjust room scoring thresholds in decideBehavior()
4. Modify need decay rates in useStore.ts advanceTime()
5. Adjust decision interval in AIBrain.ts nextDecisionRef

### Customize Camera
1. Adjust OVERVIEW_DIRECTION in CameraController.tsx
2. Modify getFollowPose / getPovPose camera distances/heights
3. Change OrbitControls constraints by mode
4. Adjust transition duration or easing

---

## Multi-Robot Architecture Notes

**Current bottleneck:** useStore stores single robot state (robotPosition, robotState, etc.)

**To refactor:**
1. Create Robot interface with all current robot properties
2. Change store: `robots: Robot[]` + `activeRobotId: string`
3. Distribute useStore setters: `setRobotPosition(id, pos)` etc.
4. Map Robot.tsx over robots array
5. Create AIBrain instances per robot or use per-robot refs
6. Update useTaskRunner to track per-robot state
7. Modify CameraController to track activeRobotId

**Shared systems (centralize):**
- Room state (shared degradation)
- Time / lighting
- Visitor events
- Furniture / obstacles
- Task queue (or per-robot queues)

