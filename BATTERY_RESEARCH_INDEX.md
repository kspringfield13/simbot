# SimBot Battery System Research - Complete Index

## Documents Generated

This research package contains 3 comprehensive documents totaling 1,376 lines of analysis:

### 1. BATTERY_SYSTEM_RESEARCH.md (772 lines)
**Primary Reference Document**
- Complete architectural analysis of the SimBot codebase
- 12 major sections covering all relevant systems
- Detailed code patterns with exact file:line references
- Design decision options (A, B, C approaches)
- Technical debt and enhancement notes

**Key Sections:**
1. Robot State & Type System (RobotNeeds, RobotInstanceState)
2. Store Architecture & State Management (Zustand patterns)
3. Movement & Pathfinding System (obstacle detection, avoidance)
4. AI Brain & Decision System (energy thresholds, mood, thoughts)
5. Game Objects & Furniture System (charging station placement)
6. UI Components & Display (NeedsIndicator pattern)
7. Systems Architecture (headless components)
8. Task Runner & Robot Behavior Control (task queuing)
9. Robot State Types & Animations (state enums)
10. Room State & Environmental Needs (decay patterns)
11. Robot Configuration (per-robot properties)
12. Time System Integration (event timing)

**Summary Section:** Key patterns for battery implementation with thresholds table

**Use This For:** Understanding the complete architecture before implementation

---

### 2. BATTERY_IMPLEMENTATION_GUIDE.md (440 lines)
**Practical Implementation Reference**
- Quick-reference code templates for all integration points
- Copy-paste ready code snippets
- Step-by-step integration checklist
- Testing strategy and console commands
- Performance considerations
- Future enhancement roadmap

**Key Sections:**
1. Robot Type System Changes (3 options with code)
2. Store Updates (Energy Ticking with examples)
3. AI Decision Thresholds (battery checks in decideBehavior)
4. Task Runner Integration (battery checks before task pickup)
5. UI Display Component (BatteryIndicator template)
6. Battery System Component (charging station detection)
7. AI Thoughts Enhancement (battery-specific inner voice)
8. Robot Configuration (per-robot battery properties)
9. Integration Checklist (9-point todo list)
10. Mount in App.tsx (where to import/use BatterySystem)
11. Testing Strategy (manual and console testing)
12. Performance Considerations (optimization tips)

**Use This For:** Step-by-step implementation with working code

---

### 3. RESEARCH_SUMMARY.md (164 lines)
**Executive Summary**
- High-level overview of research findings
- Key discoveries about current energy system
- Design patterns used throughout codebase
- Recommended hybrid battery approach
- Estimated implementation time (10-16 hours)
- File-by-file integration priority
- Next steps and quick reference table

**Use This For:** Quick reference and high-level planning

---

## Quick Navigation Guide

### If You Want To...

**Understand the overall architecture:**
- Read: RESEARCH_SUMMARY.md (5 min)
- Then: BATTERY_SYSTEM_RESEARCH.md sections 1-2

**Understand how energy currently works:**
- Read: BATTERY_SYSTEM_RESEARCH.md section 1 (RobotNeeds)
- Read: BATTERY_SYSTEM_RESEARCH.md section 2 (advanceTime)
- Read: BATTERY_SYSTEM_RESEARCH.md section 4 (energy thresholds)

**Understand decision-making:**
- Read: BATTERY_SYSTEM_RESEARCH.md section 4 (complete)
- Reference: AIBrain.ts lines 477-525

**Understand UI patterns:**
- Read: BATTERY_SYSTEM_RESEARCH.md section 6
- Reference: NeedsIndicator.tsx (entire file)

**Start implementing:**
- Read: RESEARCH_SUMMARY.md (get oriented)
- Use: BATTERY_IMPLEMENTATION_GUIDE.md (follow step-by-step)
- Reference: BATTERY_SYSTEM_RESEARCH.md (for deep dives)

**Implement a specific component:**
- Find component in BATTERY_IMPLEMENTATION_GUIDE.md
- Copy code template
- Cross-reference with main research for context

---

## File Reference Matrix

| Feature | Research Doc | Implementation Doc | Source File |
|---------|--------------|-------------------|-------------|
| Type System | Section 1 | Section 1 | src/types/index.ts |
| Store State | Section 2 | Section 2 | src/stores/useStore.ts |
| Energy Ticking | Section 2 | Section 2 | useStore.ts:285-299 |
| Energy Decay | Section 2 | Section 2 | useStore.ts:285-289 |
| AI Brain | Section 4 | Section 3 | src/systems/AIBrain.ts |
| Thresholds | Section 4 | Section 3 | AIBrain.ts:477-525 |
| UI Pattern | Section 6 | Section 5 | NeedsIndicator.tsx |
| Systems | Section 7 | Section 6 | components/systems/ |
| Task Runner | Section 8 | Section 4 | useTaskRunner.ts |
| Config | Section 11 | Section 8 | src/config/robots.ts |

---

## Key Code References (Quick Lookup)

**Energy Depletion Rates:**
- Walk: `-0.03/min` (useStore.ts:285)
- Work: `-0.08/min` (useStore.ts:285)
- Idle: `+0.15/min` (useStore.ts:285)

**Energy Thresholds (AIBrain.ts:477-525):**
- `< 15`: Mandatory rest
- `< 40`: Rest after 3 consecutive tasks
- `>= 25`: Minimum to start work
- `< 35`: Prefer rest

**Mood Triggers:**
- `energy < 20`: 'tired' mood (AIBrain.ts:220)
- `energy > 50`: 'happy' mood (AIBrain.ts:223)

**UI Components:**
- NeedsIndicator: absolute right-3 bottom-20 (NeedsIndicator.tsx:14)
- Colors: Green (#4ade80), Yellow (#facc15), Red (#f87171)
- Animation: Pulse when `value < 25` (NeedsIndicator.tsx:23)

**System Patterns:**
- Headless component: returns null (TaskProcessor.tsx)
- Effect interval: 500ms (ScheduleSystem.tsx:73)
- Store getter: `useStore.getState()` (AIBrain.ts:245)

---

## Implementation Approach Comparison

### Option A: Use Existing Energy
**Complexity:** Low
**Changes:** Modify only advanceTime() rates
**Pros:** Minimal code changes, reuse existing UI
**Cons:** Can't distinguish battery from fatigue

### Option B: Separate Battery Field
**Complexity:** Medium
**Changes:** 5-7 files
**Pros:** Explicit battery tracking, independent rates
**Cons:** Slight duplication with energy

### Option C: Hybrid Approach (RECOMMENDED)
**Complexity:** Medium
**Changes:** 6-8 files
**Pros:** Best of both worlds, clear semantics
**Cons:** Slight added complexity in AIBrain

**Recommendation:** Use Option C
- Keep `energy` for psychological fatigue
- Add `battery` for power management
- Both affect robot behavior but for different reasons
- Allows sophisticated decision-making

---

## Development Timeline Estimate

Based on research analysis:

| Phase | Duration | Files |
|-------|----------|-------|
| Planning & Review | 1 hour | All docs |
| Type Definitions | 30 min | types/index.ts |
| Store Changes | 2-3 hours | stores/useStore.ts |
| AI Brain Integration | 2-3 hours | systems/AIBrain.ts |
| UI Components | 1-2 hours | components/ui/ |
| Charging System | 2-3 hours | components/systems/ |
| Testing & Iteration | 2-3 hours | All files |
| **Total** | **10-16 hours** | **8-10 files** |

---

## Critical Integration Points

**Must Do (in order):**
1. Add battery to RobotInstanceState (types/index.ts)
2. Update advanceTime() to tick battery (useStore.ts)
3. Add battery checks to decideBehavior() (AIBrain.ts)
4. Create BatterySystem component (components/systems/)
5. Add BatteryIndicator UI (components/ui/)

**Should Do:**
6. Add battery thoughts (AIBrain.ts INNER_VOICE)
7. Add battery to robot config (config/robots.ts)
8. Add battery stats tracking (StatsPanel)

**Nice to Have:**
9. Charging animations (Robot.tsx)
10. Battery degradation tracking
11. Multiple charger types

---

## Testing Checklist

- [ ] Battery depletes during work
- [ ] Battery recharges while idle
- [ ] Battery recharges while charging (if applicable)
- [ ] Robot refuses tasks at low battery
- [ ] Robot seeks rest when battery critical
- [ ] Battery UI shows correct percentage
- [ ] Battery UI changes colors appropriately
- [ ] Battery pulses when critical
- [ ] Battery thoughts appear at low levels
- [ ] Multiple robots manage batteries independently
- [ ] Robots prioritize charging when needed
- [ ] No performance regression

---

## Performance Impact

**Expected:** Negligible
- Battery calculations: O(n_robots) per frame (already done for energy)
- Charging station detection: O(n_robots * n_stations) in 500ms interval
- UI updates: Follows existing needs pattern

**Optimization Tips:**
- Cache charging station positions (don't recalculate every frame)
- Use spatial hashing if >10 charging stations
- Batch battery updates in advanceTime()

---

## Future Enhancements (Not Included)

1. **Battery Degradation**: Capacity reduces over time
2. **Fast Charging**: Different charger types with different rates
3. **Battery Health**: Track battery age and efficiency
4. **Power Management**: Disable non-essential systems at low battery
5. **Solar Charging**: Alternative power source during day
6. **Battery Notifications**: Alert when critically low
7. **Charging Queue**: Handle multiple robots at one charger
8. **Battery Stats**: Track cycles and efficiency in StatsPanel
9. **Emergency Mode**: Reduced functionality at <10% battery
10. **Power Budget**: Plan work tasks based on available battery

---

## Glossary

- **Battery**: Physical power storage (0-100%)
- **Energy**: Psychological fatigue/effort (0-100%)
- **Charging**: Process of restoring battery power
- **Charger/Charging Station**: Physical furniture piece that restores battery
- **Discharge Rate**: Speed at which battery decreases (units/minute)
- **Charge Rate**: Speed at which battery increases (units/minute)
- **Threshold**: Specific battery level that triggers behavior change
- **Headless Component**: React component that returns null but runs effects

---

## Contact & Questions

For questions about this research:
1. Refer to the specific section in the relevant document
2. Check the code reference matrix above
3. Review the code templates in BATTERY_IMPLEMENTATION_GUIDE.md
4. Examine actual source files in /home/kspri/projects/simbot/src/

---

## Document Versions

- Generated: 2026-02-28
- Research Scope: Comprehensive architectural analysis
- Files Analyzed: 25+ source files
- Code Examined: 5000+ lines
- Documentation: 1,376 lines across 3 documents

---

## License & Usage

These documents are designed to guide the implementation of a battery system in SimBot.
They contain direct code references from the SimBot codebase and are intended for:
- Internal development reference
- Implementation guidance
- Architecture documentation
- Future maintenance

**Start Here:** RESEARCH_SUMMARY.md → BATTERY_IMPLEMENTATION_GUIDE.md → BATTERY_SYSTEM_RESEARCH.md

