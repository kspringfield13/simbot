# Battery/Power System Implementation Guide

## Quick Reference: Key Files and Integration Points

### 1. Robot Type System Changes

**File**: `/src/types/index.ts`

Current RobotNeeds uses the `energy` field. To add explicit battery tracking:

```typescript
// Option A: Use existing energy as battery (minimal changes)
// Just modify the decay rates in useStore.ts advanceTime()

// Option B: Add separate battery property
interface RobotNeeds {
  energy: number;        // Psychological fatigue (stays as-is)
  happiness: number;
  social: number;
  boredom: number;
  battery?: number;      // NEW: Actual battery percentage (0-100)
}

// Option C: New RobotBatteryState (if complex behavior needed)
interface RobotBatteryState {
  current: number;           // 0-100
  capacity: number;          // Max capacity (degradation tracking)
  isCharging: boolean;
  chargeRate: number;        // Units/minute
  lastChargeTime: number;    // Sim-minutes
}

// Add to RobotInstanceState:
interface RobotInstanceState {
  // ... existing fields ...
  battery?: RobotBatteryState;  // If using Option C
}
```

### 2. Store Updates (Energy Ticking)

**File**: `/src/stores/useStore.ts` lines 262-299

Current energy logic:
```typescript
energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 
                                : isWorking ? -deltaSimMinutes * 0.08 
                                            : -deltaSimMinutes * 0.03)),
```

To add explicit battery with different rates:
```typescript
// Battery discharges faster during work
const batteryRate = isIdle ? 0.1          // Slow discharge while idle
                  : isWorking ? -0.12     // Faster discharge while working
                  : -0.05;                // Medium discharge while walking

updatedRobots[id] = {
  ...r,
  needs: {
    energy: clamp(n.energy + (isIdle ? deltaSimMinutes * 0.15 
                                    : isWorking ? -deltaSimMinutes * 0.08 
                                                : -deltaSimMinutes * 0.03)),
    // ... other needs
  },
  battery: r.battery ? clamp(r.battery + deltaSimMinutes * batteryRate) : 100,
};
```

To add charging station boost:
```typescript
// Check if robot is near charging station
const isNearCharger = isPositionClear(r.position[0], r.position[2], 0.5); // or custom check
const chargeBoost = isNearCharger && isIdle ? 0.25 : 0;

battery: r.battery ? clamp(r.battery + deltaSimMinutes * (batteryRate + chargeBoost)) : 100,
```

### 3. AI Decision Thresholds

**File**: `/src/systems/AIBrain.ts` lines 477-525

Current energy checks:
```typescript
if (needs.energy < 15) return { type: 'rest' };
if (needs.energy < 40) return { type: 'rest' };
if (top && top.score >= 18 && needs.energy >= 25) return { type: 'clean' };
if (needs.energy < 35) return { type: 'rest' };
```

To add separate battery checks:
```typescript
function decideBehavior(s, robot, needs, now): Behavior {
  // Battery critical - MUST charge
  if ((robot.battery ?? 100) < 10) return { type: 'rest' }; // Go charge
  
  // Standard energy checks
  if (needs.energy < 15) return { type: 'rest' };
  
  // After 3 tasks, check both energy AND battery
  if (consecutiveRef.current >= 3) {
    const avgEnergy = (needs.energy + (robot.battery ?? 100)) / 2;
    if (avgEnergy < 40) return { type: 'rest' };
    return { type: 'patrol' };
  }
  
  // Task minimum: need both energy and battery
  if (top && top.score >= 18 && needs.energy >= 25 && (robot.battery ?? 100) >= 20) {
    return { type: 'clean', roomId: top.id };
  }
  
  if (needs.energy < 35 || (robot.battery ?? 100) < 25) return { type: 'rest' };
  
  return { type: 'idle-look' };
}
```

### 4. Task Runner Integration

**File**: `/src/hooks/useTaskRunner.ts` lines 161-198

Add battery check before starting task:
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
    
    // NEW: Check battery before accepting task
    const robot = state.robots[rid];
    const hasEnoughBattery = (robot.battery ?? 100) >= 20;
    if (!hasEnoughBattery) {
      // Skip task, let AIBrain queue a rest/charge task
      continue;
    }

    const robotPos = robot.position;
    const path = getNavigationPath(robotPos, nextTask.targetPosition);
    if (path.length === 0) continue;

    setRobotPath(rid, path);
    // ... rest of task assignment
  }
}, [tasks, ...setters]);
```

### 5. UI Display Component

**File**: `/src/components/ui/BatteryIndicator.tsx` (NEW)

Create following the NeedsIndicator pattern:
```typescript
import { useActiveRobot } from '../../stores/activeRobot';

export function BatteryIndicator() {
  const battery = useActiveRobot((r) => r.battery ?? 100);
  const isCritical = battery < 20;

  const getBatteryColor = (level: number): string => {
    if (level >= 75) return '#4ade80';  // Green
    if (level >= 50) return '#facc15';  // Yellow
    if (level >= 25) return '#f97316';  // Orange
    return '#f87171';                   // Red
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] ${isCritical ? 'animate-pulse' : ''}`}>
        {battery >= 75 ? '🔋' : battery >= 50 ? '🪫' : '⚠️'}
      </span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${battery}%`,
            backgroundColor: isCritical ? '#f87171' : getBatteryColor(battery),
            opacity: isCritical ? 1 : 0.6,
          }}
        />
      </div>
      <span className="text-[9px] text-white/40 w-8">{Math.round(battery)}%</span>
    </div>
  );
}
```

Add to NeedsIndicator or separate in GameUI:
```typescript
// In GameUI.tsx or expanded NeedsIndicator.tsx
const BARS = [
  { key: 'battery', icon: '🔋', color: '#60a5fa' },  // NEW
  { key: 'energy', icon: '⚡', color: '#facc15' },
  { key: 'happiness', icon: '😊', color: '#4ade80' },
  { key: 'social', icon: '💬', color: '#60a5fa' },
  { key: 'boredom', icon: '😴', color: '#f87171', invertColor: true },
];
```

### 6. Battery System Component

**File**: `/src/components/systems/BatterySystem.tsx` (NEW)

```typescript
import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';

/**
 * Headless component that manages battery charging behavior
 */
export function BatterySystem() {
  const robotsRef = useRef<Record<string, { charging: boolean }>>(
    Object.fromEntries(ROBOT_IDS.map(id => [id, { charging: false }]))
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const s = useStore.getState();
      if (s.simSpeed === 0) return;

      for (const rid of ROBOT_IDS) {
        const robot = s.robots[rid];
        const battery = robot.battery ?? 100;
        
        // Start charging if near charger and battery low
        if (battery < 50 && robot.state === 'idle') {
          // Check if robot is near a charging station
          const nearCharger = isNearChargingStation(robot.position);
          if (nearCharger) {
            if (!robotsRef.current[rid].charging) {
              robotsRef.current[rid].charging = true;
              s.setRobotThought(rid, 'Found a charging station. Time to recharge.');
              s.setRobotMood(rid, 'routine');
            }
          }
        }
        
        // Stop charging when full
        if (battery >= 95) {
          if (robotsRef.current[rid].charging) {
            robotsRef.current[rid].charging = false;
            s.setRobotThought(rid, 'Fully charged! Ready for the next task.');
          }
        }
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}

function isNearChargingStation(pos: [number, number, number]): boolean {
  // Define charging station locations
  const stations: [number, number][] = [
    [10, -10],  // Living room corner
    [-8, -10],  // Kitchen corner
    // Add more stations
  ];
  
  const CHARGER_RADIUS = 2.0;
  
  for (const [sx, sz] of stations) {
    const dx = pos[0] - sx;
    const dz = pos[2] - sz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < CHARGER_RADIUS) return true;
  }
  return false;
}
```

### 7. AI Thoughts Enhancement

**File**: `/src/systems/AIBrain.ts` lines 122-189

Add battery-specific thoughts:
```typescript
const INNER_VOICE = {
  // ... existing thoughts ...
  
  lowBattery: [
    'Battery is getting low. I should find a charger soon.',
    'Need to charge up. These circuits won\'t sustain themselves.',
    'Energy dropping. Time to seek a charging station.',
    'My power reserves are depleting. Recharging is necessary.',
  ],
  
  charging: [
    'Plugged in and powering up. Feels good to charge.',
    'Electrons flowing back in. This is nice.',
    'Recharging my power cells. See you soon, world.',
    'Battery climbing back to full. Almost there.',
  ],
  
  fullyCharged: [
    'Fully charged! I\'m ready to tackle the world.',
    'Power at 100%. Let\'s get back to work.',
    'All systems go. Battery is maxed out.',
    'Completely recharged. Ready for anything.',
  ],
};

// Add to mood logic:
if ((robot.battery ?? 100) < 20 && robot.state === 'idle') {
  s.setRobotThought(robotId, pick(INNER_VOICE.lowBattery));
}
```

### 8. Robot Configuration

**File**: `/src/config/robots.ts`

Extend RobotConfig:
```typescript
interface RobotConfig {
  // ... existing ...
  batteryCapacity?: number;       // mAh (default 100)
  chargeRate?: number;            // units/minute (default 0.2)
  dischargeRate?: number;         // units/minute when working (default 0.08)
}

export const ROBOT_CONFIGS: Record<RobotId, RobotConfig> = {
  sim: {
    // ... existing config ...
    batteryCapacity: 100,
    chargeRate: 0.2,      // Charges at 0.2/min
    dischargeRate: 0.08,  // Discharges at 0.08/min during work
  },
  chef: {
    // Kitchen robot might use battery faster due to cooking tasks
    batteryCapacity: 100,
    chargeRate: 0.2,
    dischargeRate: 0.12,  // 50% faster discharge
  },
  sparkle: {
    // Cleaning robot more efficient
    batteryCapacity: 100,
    chargeRate: 0.25,     // Charges faster
    dischargeRate: 0.07,  // Discharges slower
  },
};
```

### 9. Integration Checklist

- [ ] Add battery property to RobotNeeds or RobotInstanceState
- [ ] Update advanceTime() to manage battery depletion/charging
- [ ] Modify AIBrain.decideBehavior() with battery thresholds
- [ ] Update useTaskRunner to check battery before task pickup
- [ ] Create BatteryIndicator UI component
- [ ] Create BatterySystem headless component
- [ ] Add battery thoughts to AIBrain INNER_VOICE
- [ ] Mount BatterySystem in App.tsx (next to TaskProcessor)
- [ ] Add robot battery properties to ROBOT_CONFIGS
- [ ] Test charging station detection and auto-charge behavior
- [ ] Test energy vs battery interaction (ensure they work together)
- [ ] Add battery stats to StatsPanel if needed

### 10. Mount in App.tsx

**File**: `/src/App.tsx`

```typescript
import { BatterySystem } from './components/systems/BatterySystem';

// In the return JSX, add alongside other systems:
<>
  <Canvas>
    <Suspense fallback={null}>
      <HomeScene />
    </Suspense>
    <TimeSystem />         // Existing
  </Canvas>
  
  <TaskProcessor />        // Existing
  <ScheduleSystem />       // Existing
  <BatterySystem />        // NEW
  <VisitorToast />         // Existing
  {/* ... rest of components ... */}
</>
```

---

## Testing Strategy

### Manual Testing

1. **Battery Depletion**: Start game, watch battery decrease while robot works
2. **Battery Charging**: Robot should return to idle/charging zone when low
3. **Thresholds**: Verify robot refuses tasks at <20% battery
4. **UI Updates**: Battery indicator shows correct percentage, colors change
5. **Thoughts**: Verify battery-related thoughts appear appropriately

### Console Testing

```javascript
// In browser console:
const s = window.useStore?.getState?.();
console.log(s.robots.sim.battery);  // Current battery
s.robots.sim.needs.energy;          // Current energy

// Force low battery
s.updateRobotNeeds('sim', { energy: 10 });
```

---

## Performance Considerations

- Battery calculation happens in `advanceTime()` which runs every frame: O(n_robots)
- Charging station detection: O(n_robots * n_stations) in BatterySystem interval
- Optimize by:
  - Caching charging station locations (precompute, not every tick)
  - Using spatial hashing if many stations
  - Deferring battery updates to lower-frequency interval

---

## Future Enhancements

1. **Battery Degradation**: Capacity reduces over time (0.01/day)
2. **Fast Charge**: Special chargers with 2x rate
3. **Battery Stats**: Track charge cycles in StatsPanel
4. **Alerts**: Notification when robot stuck (low battery, can't reach charger)
5. **Charging Queue**: Multiple robots waiting to charge
6. **Solar Panels**: Alternative charging during day (weather-dependent)
7. **Power Management**: Reduce background processes when battery low

