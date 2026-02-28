# SimBot Codebase Exploration - Complete Report

This directory now contains comprehensive documentation of the SimBot codebase:

## Documents Created

1. **CODEBASE_ANALYSIS.md** (1,394 lines)
   - Complete walkthrough of every major system
   - Detailed explanations of AI, navigation, rendering, UI
   - Data structures and type system
   - State management patterns
   - Multi-robot refactoring notes

2. **QUICK_REFERENCE.md** (410 lines)
   - File inventory with line counts
   - Critical data structures
   - Key function signatures
   - State update patterns
   - Configuration constants
   - Entry points for extension
   - Multi-robot architecture notes

3. **ARCHITECTURE_DIAGRAM.txt** (750+ lines)
   - ASCII diagrams of major systems
   - Data flow visualization
   - AI decision loop flowchart
   - Navigation waypoint graph
   - Collision/avoidance system
   - Room state system
   - Camera system modes
   - Component rendering hierarchy

## Project Structure Summary

**Core Systems (5 major files)**
- `useStore.ts` (379 lines) - Zustand state management
- `AIBrain.ts` (520 lines) - AI decision engine
- `RoomState.ts` (203 lines) - Room hygiene tracking
- `ObstacleMap.ts` (68 lines) - Collision detection
- `TimeSystem.ts` (153 lines) - Time & lighting simulation

**Navigation (2 files)**
- `pathfinding.ts` (87 lines) - Waypoint graph + BFS
- `homeLayout.ts` (183 lines) - Room definitions + task mapping

**Rendering (5 major components)**
- `Robot.tsx` (176 lines) - Robot 3D model & physics
- `FurnitureModels.tsx` (137 lines) - Furniture rendering
- `PetCat.tsx` (391 lines) - Procedural cat AI
- `CameraController.tsx` (233 lines) - Camera system
- `HomeScene.tsx` (57 lines) - Scene setup

**Task Processing (1 main hook)**
- `useTaskRunner.ts` (343 lines) - Task lifecycle management

**UI Components (8+ files)**
- `GameUI.tsx` (233 lines) - Main HUD
- `ThoughtBubble.tsx` (20 lines) - Thought display
- Plus: ChatPanel, RobotTerminal, VisitorToast, EmojiReaction, etc.

## Key Features Documented

### AI & Behavior
- Robot "SOUL" personality (traits: curiosity, warmth, diligence, sensitivity)
- INNER_VOICE thought system (200+ contextual thoughts)
- Mood system (8 moods: content, focused, curious, routine, tired, lonely, bored, happy)
- Decision loop (every 2-5 sim minutes, scores all rooms)
- Tamagotchi-like needs: energy, happiness, social, boredom

### Navigation & Collision
- 14-waypoint graph with BFS pathfinding
- Obstacle-based collision detection
- Avoidance steering force system
- Stuck detection with emergency escape
- Doorway pause system

### Room & Task System
- 6 rooms with independent hygiene states
- 11 task types with work durations
- Room decay rates (vary by room, 0.07-0.16 per minute)
- Task completion boosts (cleanliness/tidiness)
- Learning system: robot gets 5% faster per task type completion
- Time-of-day biases (morning: kitchen, afternoon: laundry, etc.)

### Camera System
- 3 modes: overview (free cam), follow (third-person), POV (first-person)
- Smooth 1-second mode transitions (cubic-out easing)
- Touch-friendly controls with damping
- Constrained rotation/zoom per mode

### Visitor Events
- 3 event types: doorbell, package, visitor
- Random triggering (15-50 sim minute intervals)
- Social/happiness boosts on interaction
- Toast notifications + emoji reactions

### Procedural Generation
- Pet cat with state machine (5 states)
- Thought bubbles from 200+ contextual phrases
- Procedural cat mesh (no GLB dependency)

## Architecture Highlights

### Strengths
- Single Zustand store provides clear state management
- Modular system design (AI, collision, room state separate)
- Personality-driven behavior (SOUL + INNER_VOICE)
- Efficient waypoint pathfinding
- Smooth physics-based movement
- Touch-friendly camera controls
- Dynamic time-based lighting

### Current Limitations
- **Single robot hardcoded** - not designed for multiple agents
- **No persistent storage** - tasks and progress lost on refresh
- **Fixed waypoint network** - can't dynamically reroute around blocked paths
- **Furniture-position-dependent** - misplaced furniture can block critical paths
- **No conversation memory** - chat is display-only
- **GLB model required** - no fallback if model fails to load

## For Multi-Robot Refactoring

The codebase documents identify these key changes needed:

1. **Store Structure**
   - Replace single `robotPosition` with `robots: Robot[]`
   - Add `activeRobotId` for camera tracking
   - Distribute all robot setters to per-robot versions

2. **Components to Replicate**
   - Robot.tsx → map over robots array
   - AIBrain.tsx → per-robot instances via useRef
   - useTaskRunner.ts → per-robot path/state tracking

3. **Shared Systems** (don't replicate)
   - Room state (shared degradation, multiple robots affect same rooms)
   - Time/lighting (global)
   - Visitor events (global)
   - Furniture/obstacles (global)

4. **Task Queue Strategy**
   - Current: single queue, first-come-first-served
   - Multi-robot options:
     a) Central queue with robot assignment
     b) Per-robot queues (robots steal from others' queues)
     c) Team-based queues (divvy up rooms)

## Technology Stack

- **React 19** with TypeScript
- **Three.js 0.183** for 3D graphics
- **React Three Fiber 9.5** for React-Three integration
- **Zustand 5** for state management
- **Tailwind CSS 4** for styling
- **Vite 7** for bundling

## File Locations

All source files: `/home/kspri/projects/simbot/src/`

Analysis documents saved to repo root:
- CODEBASE_ANALYSIS.md
- QUICK_REFERENCE.md
- ARCHITECTURE_DIAGRAM.txt
- README_EXPLORATION.md (this file)

## Usage Notes

These documents are meant for:
- **Planning** multi-robot refactoring
- **Onboarding** new team members
- **Understanding** data flows and dependencies
- **Extending** features (new room types, task types, behaviors)
- **Debugging** mysterious interactions

For hands-on development, the QUICK_REFERENCE.md is most useful for quick lookups.

