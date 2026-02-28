# SimBot Codebase Documentation Index

## Quick Start

**New to the codebase?** Start here in this order:

1. **README_EXPLORATION.md** - High-level overview of what was documented
2. **QUICK_REFERENCE.md** - File locations and key concepts
3. **CODEBASE_ANALYSIS.md** - Deep technical dive into each system
4. **ARCHITECTURE_DIAGRAM.txt** - Visual flows and diagrams

## File Reference by Task

### Planning Multi-Robot Refactoring
- See: **CODEBASE_ANALYSIS.md** → "Summary of Key Systems for Multi-Robot Refactoring"
- See: **QUICK_REFERENCE.md** → "Multi-Robot Architecture Notes"
- Current bottleneck: Single robot in Zustand store needs to become array

### Understanding a Specific System
- **Zustand Store**: CODEBASE_ANALYSIS.md (Core State Management)
- **AI Behavior**: CODEBASE_ANALYSIS.md (AI Behavior System) + ARCHITECTURE_DIAGRAM.txt (AI Decision Loop)
- **Navigation**: CODEBASE_ANALYSIS.md (Navigation & Pathfinding) + ARCHITECTURE_DIAGRAM.txt (Waypoint Network)
- **Collision**: CODEBASE_ANALYSIS.md (Collision Detection & Avoidance) + ARCHITECTURE_DIAGRAM.txt
- **Rooms**: CODEBASE_ANALYSIS.md (Room State System) + ARCHITECTURE_DIAGRAM.txt (Room State System)
- **Camera**: CODEBASE_ANALYSIS.md (Camera System) + ARCHITECTURE_DIAGRAM.txt (Camera System)
- **Rendering**: CODEBASE_ANALYSIS.md (Robot 3D Rendering, Pet Cat System)
- **Tasks**: CODEBASE_ANALYSIS.md (Task Processing System) + ARCHITECTURE_DIAGRAM.txt (User Command → Completion)

### Extending the Codebase
- See: **QUICK_REFERENCE.md** → "Entry Points for Extension"
  - Adding new task type
  - Adding new room
  - Adding new furniture
  - Modifying AI behavior
  - Customizing camera

### Configuration & Constants
- All constants: **QUICK_REFERENCE.md** → "Constants & Configuration"
- Room decay rates: QUICK_REFERENCE.md
- Robot needs rates: QUICK_REFERENCE.md
- Task types & durations: QUICK_REFERENCE.md
- AI parameters: CODEBASE_ANALYSIS.md (AIBrain.ts section)

### Data Structures
- Critical interfaces: **QUICK_REFERENCE.md** → "Critical Data Structures"
- All types: CODEBASE_ANALYSIS.md → "Type System (types/index.ts)"
- State object: CODEBASE_ANALYSIS.md → "Core State Management (useStore.ts)"

### Key Algorithms
- Room scoring: CODEBASE_ANALYSIS.md (Room State System) or ARCHITECTURE_DIAGRAM.txt
- AI decision: ARCHITECTURE_DIAGRAM.txt (AI Decision Loop Flowchart)
- Pathfinding: CODEBASE_ANALYSIS.md (Navigation) or ARCHITECTURE_DIAGRAM.txt (Waypoint Network)
- Collision avoidance: ARCHITECTURE_DIAGRAM.txt (Collision & Avoidance section)
- Stuck detection: CODEBASE_ANALYSIS.md or ARCHITECTURE_DIAGRAM.txt (Robot Stuck Detection)

## Document Structure

### CODEBASE_ANALYSIS.md
Organized by topic:
1. Project Overview & Stack
2. Project Structure
3. Core State Management (useStore.ts)
4. Type System
5. AI Behavior System
6. Navigation & Pathfinding
7. Collision Detection & Avoidance
8. Room State System
9. Task Processing System
10. Robot 3D Rendering
11. Camera System
12. Room & Furniture Layout
13. Furniture System
14. Lighting & Time System
15. Pet Cat System
16. Visitor System
17. Thoughts & Expression System
18. Completion & Learning
19. UI Components Summary
20. Key Data Flows
21. Important Constraints & Patterns
22. Potential Issues & Technical Debt
23. Summary for Multi-Robot Refactoring

### QUICK_REFERENCE.md
Organized by developer task:
1. File Inventory (with line counts)
2. Core AI & Systems (brief descriptions)
3. Navigation & Layout
4. Task Processing
5. 3D Rendering
6. UI Components
7. Critical Data Structures
8. Key Function Signatures
9. State Update Patterns
10. Constants & Configuration
11. Entry Points for Extension
12. Multi-Robot Architecture Notes

### ARCHITECTURE_DIAGRAM.txt
Visual reference section by section:
1. Zustand Store Structure
2. Data Flow: User Command
3. Robot AI Decision Loop
4. Navigation System (Waypoint Graph)
5. Collision & Avoidance System
6. Room State System
7. Camera System (3 Modes)
8. Task Types & Durations
9. Robot Needs System
10. Component Rendering Hierarchy

### README_EXPLORATION.md
Summary and usage guide:
1. Documents Created (what was analyzed)
2. Project Structure Summary
3. Key Features Documented
4. Architecture Highlights (strengths & limitations)
5. Multi-Robot Refactoring Notes
6. Technology Stack
7. File Locations
8. Usage Notes

## Key Code Files by Complexity

### Simple (< 100 lines)
- TaskProcessor.tsx (10 lines) - Headless task executor
- ThoughtBubble.tsx (20 lines) - Thought display
- TimeSystem.ts (153 lines) - Time management
- ObstacleMap.ts (68 lines) - Collision detection
- types/index.ts (114 lines) - Type definitions

### Medium (100-250 lines)
- RoomState.ts (203 lines) - Room hygiene
- pathfinding.ts (87 lines) - Navigation
- homeLayout.ts (183 lines) - Environment definition
- furnitureRegistry.ts (185 lines) - Furniture catalog
- Robot.tsx (176 lines) - Robot rendering
- CameraController.tsx (233 lines) - Camera system
- GameUI.tsx (233 lines) - Main HUD

### Complex (250+ lines)
- useStore.ts (379 lines) - State management
- AIBrain.ts (520 lines) - AI decision engine
- useTaskRunner.ts (343 lines) - Task processing
- PetCat.tsx (391 lines) - Procedural cat
- FurnitureModels.tsx (137 lines) - Furniture rendering + interaction

## All Source Files

**Location:** `/home/kspri/projects/simbot/src/`

```
src/
├── App.tsx (main React component)
├── main.tsx (Vite entry point)
├── types/index.ts (314 lines) - Type definitions
├── stores/useStore.ts (379 lines) - Zustand store
├── systems/
│   ├── AIBrain.ts (520 lines)
│   ├── RoomState.ts (203 lines)
│   ├── ObstacleMap.ts (68 lines)
│   ├── TimeSystem.ts (153 lines)
│   ├── VisitorSystem.ts (197 lines)
│   └── Achievements.ts (not analyzed)
├── utils/
│   ├── homeLayout.ts (183 lines)
│   ├── pathfinding.ts (87 lines)
│   ├── furnitureRegistry.ts (185 lines)
│   └── demoTasks.ts (demo commands)
├── hooks/
│   ├── useTaskRunner.ts (343 lines)
│   ├── useVoice.ts (voice input - not analyzed)
│   ├── useAmbientSounds.ts (audio - not analyzed)
│   └── useKeyboardShortcuts.ts (keyboard - not analyzed)
├── components/
│   ├── scene/
│   │   ├── HomeScene.tsx (57 lines)
│   │   ├── Robot.tsx (176 lines)
│   │   ├── FurnitureModels.tsx (137 lines)
│   │   ├── PetCat.tsx (391 lines)
│   │   ├── VisitorNPC.tsx (not analyzed)
│   │   ├── Room.tsx
│   │   ├── Walls.tsx
│   │   ├── GLBModel.tsx
│   │   ├── SeasonalDecorations.tsx
│   │   ├── WindowGlow.tsx
│   │   └── DustMotes.tsx
│   ├── camera/
│   │   └── CameraController.tsx (233 lines)
│   ├── systems/
│   │   └── TaskProcessor.tsx (10 lines)
│   ├── game/
│   │   ├── GameUI.tsx (233 lines)
│   │   ├── ThoughtBubble.tsx (20 lines)
│   │   ├── SpeedControls.tsx
│   │   ├── TimeBar.tsx
│   │   └── RoomStatus.tsx
│   └── ui/
│       ├── ChatPanel.tsx
│       ├── RobotTerminal.tsx
│       ├── VisitorToast.tsx
│       ├── EmojiReaction.tsx
│       ├── ReactionsOverlay.tsx
│       ├── StatsPanel.tsx
│       ├── NeedsIndicator.tsx
│       ├── MiniMap.tsx
│       └── ScreenshotModal.tsx
└── audio/
    ├── SoundEffects.ts
    └── SoundController.tsx
```

## Search Tips

### Find by concept:
- "SOUL" → AIBrain.ts (robot personality)
- "INNER_VOICE" → AIBrain.ts (thoughts library)
- "room scoring" → RoomState.ts or ARCHITECTURE_DIAGRAM.txt
- "waypoint" → pathfinding.ts or ARCHITECTURE_DIAGRAM.txt
- "avoidance" → ObstacleMap.ts or ARCHITECTURE_DIAGRAM.txt
- "task lifecycle" → useTaskRunner.ts or ARCHITECTURE_DIAGRAM.txt (User Command flow)
- "three modes" → CameraController.tsx (overview, follow, pov)

### Find by error/issue:
- Robot stuck → Robot.tsx or ARCHITECTURE_DIAGRAM.txt (stuck detection)
- Path not found → pathfinding.ts
- Collision issues → ObstacleMap.ts
- Room never cleans → RoomState.ts (decay/scoring)
- Wrong mood → AIBrain.ts (getMoodFromNeeds)
- Camera jerky → CameraController.tsx (lerp factors)

---

**Last Updated:** 2026-02-28
**Analysis Scope:** All TypeScript/TSX files in src/
**Total Documentation:** 4 files, ~2,600 lines, 100 KB
