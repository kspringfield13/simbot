# SimBot Battery System Research Summary

## Research Completion Date: 2026-02-28

This document summarizes the comprehensive codebase research for implementing a battery/power system in SimBot.

## What Was Analyzed

The research examined 8 key architectural areas:

1. **Robot State & Types** (src/types/index.ts)
   - RobotInstanceState structure
   - RobotNeeds interface with existing `energy` field
   - Mood, state, and animation types

2. **Store Architecture** (src/stores/useStore.ts)
   - Multi-robot state management with Zustand
   - Per-robot setter pattern
   - advanceTime() function (automatic needs ticking)
   - Robot initialization and clamping patterns

3. **Movement & Pathfinding** (src/systems/ObstacleMap.ts)
   - Obstacle detection and avoidance
   - Inter-robot collision avoidance
   - Energy cost during walking (-0.03/min)

4. **AI Brain System** (src/systems/AIBrain.ts)
   - Decision-making framework with behavior types
   - Energy thresholds: 15 (critical), 25 (min work), 35-40 (prefer rest)
   - Mood generation from needs
   - Inner voice and thought library (600+ lines of context)

5. **Furniture & World Objects** (src/stores/useStore.ts + ObstacleMap.ts)
   - Furniture persistence with localStorage
   - Obstacle radius for collision detection
   - Pattern for adding charging stations

6. **UI Components** (src/components/ui/)
   - NeedsIndicator as template (icon + percentage bar + colors)
   - GameUI layout and HUD structure
   - StatsPanel for tracking metrics
   - ChatPanel for robot communication

7. **Systems Architecture** (src/components/systems/)
   - Headless system components (TaskProcessor, ScheduleSystem)
   - Interval-based event processing
   - Per-robot state management across multiple systems

8. **Task Execution** (src/hooks/useTaskRunner.ts)
   - Task queuing and assignment
   - Navigation waypoint tracking
   - Work progress with configurable duration
   - Task completion with room state updates

## Key Findings

### Current Energy Implementation
- Already manages 0-100 values per robot
- Depletes at different rates: walk (-0.03/min), work (-0.08/min)
- Recharges while idle (+0.15/min)
- Influences mood at threshold 20

### Design Patterns Used Throughout
1. **Zustand State Management**: Record<RobotId, InstanceState> pattern
2. **Clamping Values**: Math.max(0, Math.min(100, value))
3. **Per-Robot Setters**: setRobotXXX(robotId, value)
4. **Headless Components**: useEffect-based systems returning null
5. **Ref-Based Tracking**: useRef for decision timing, consecutive counters
6. **Interval Loops**: window.setInterval for non-frame-bound logic

### Architecture Strengths
- Multi-robot support already built-in
- Existing energy system can serve as foundation
- Clear separation of concerns (types, store, systems, UI, hooks)
- Consistent patterns for adding new features
- Good time system with sim speed support

## Recommendations

### Recommended Approach: Hybrid Battery System
1. Keep existing `energy` in RobotNeeds (psychological fatigue)
2. Add separate `battery: number` field to RobotInstanceState (or RobotNeeds)
3. Update advanceTime() to deplete battery faster during work
4. Add battery checks in AIBrain.decideBehavior()
5. Create BatterySystem component for charging station detection
6. Add BatteryIndicator UI component
7. Enhance robot thoughts with battery-specific messages

### Implementation Complexity: Low to Medium
- No new data structures needed
- Follows existing patterns closely
- Estimated changes: 5-7 files
- No performance impact (already ticking all robots)

### Integration Points (Priority Order)
1. Types: Add battery property
2. Store: Update advanceTime() for battery rates
3. AIBrain: Add battery thresholds to behavior decisions
4. BatterySystem: Create charging station component
5. UI: Add battery indicator
6. Thoughts: Extend INNER_VOICE library
7. Config: Per-robot battery properties

## Files Delivered

1. **BATTERY_SYSTEM_RESEARCH.md** (12 sections, 700+ lines)
   - Detailed analysis of each architectural area
   - Code patterns with line references
   - Design decision options
   - Technical debt notes

2. **BATTERY_IMPLEMENTATION_GUIDE.md** (10 sections)
   - Quick-reference code templates
   - Integration checklist
   - Testing strategy
   - Performance considerations
   - Future enhancement ideas

3. **RESEARCH_SUMMARY.md** (this file)
   - High-level overview
   - Key findings and recommendations

## Key Code References

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Energy Ticking | useStore.ts | 285-289 | Auto-depletion/charging |
| Energy Thresholds | AIBrain.ts | 483-522 | Decision points |
| Energy Display | NeedsIndicator.tsx | 3-39 | UI pattern |
| Task Pickup | useTaskRunner.ts | 161-198 | Task queue processing |
| Mood Generation | AIBrain.ts | 219-225 | Mood from needs |
| Needs Update | useStore.ts | 233-245 | State mutations |

## Estimated Implementation Time

- Planning & Review: 1 hour
- Core Store Changes: 2-3 hours
- AI Brain Integration: 2-3 hours
- UI Components: 1-2 hours
- Charging System: 2-3 hours
- Testing & Polish: 2-3 hours
- **Total: 10-16 hours**

## Next Steps

1. Review BATTERY_SYSTEM_RESEARCH.md for detailed architecture
2. Review BATTERY_IMPLEMENTATION_GUIDE.md for code templates
3. Decide on battery tracking approach (Option A/B/C from research)
4. Start with type definitions and store changes
5. Test in-game behavior before adding UI
6. Iterate on charging station placement and rates

## Conclusion

The SimBot codebase is well-structured for adding a battery system. The existing `energy` property provides a foundation, and established patterns for state management, decision-making, and UI make implementation straightforward. The system can be fully integrated following the recommended approach within 2-3 development days.

All documentation is self-contained and includes code templates ready for implementation.

---

Generated: 2026-02-28
Research Depth: Comprehensive architectural analysis
Files Analyzed: 25+ source files
Lines of Code Examined: 5000+
