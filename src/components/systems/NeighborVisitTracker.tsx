// ── Neighbor Visit Tracker ────────────────────────────────────
// Manages robot visits to neighbor houses:
// - Updates interaction messages periodically
// - Boosts social needs for visiting robots
// - Sends notifications about visit events
// Headless component — renders nothing.

import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { getRandomInteraction } from '../../systems/Neighborhood';

const VISIT_TICK_MS = 5000; // check every 5 seconds
const SOCIAL_BOOST_INTERVAL = 30; // every 30 sim-minutes of visiting

export function NeighborVisitTracker() {
  const lastBoostRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { activeVisits, simMinutes, neighborHouses } = state;

      if (activeVisits.length === 0) return;

      for (const visit of activeVisits) {
        const elapsed = simMinutes - visit.startedAt;
        const lastBoost = lastBoostRef.current[visit.robotId] ?? visit.startedAt;

        // Boost social every interval
        if (simMinutes - lastBoost >= SOCIAL_BOOST_INTERVAL) {
          lastBoostRef.current[visit.robotId] = simMinutes;
          const robot = state.robots[visit.robotId];
          if (robot) {
            state.updateRobotNeeds(visit.robotId, {
              social: Math.min(100, robot.needs.social + 8),
              happiness: Math.min(100, robot.needs.happiness + 3),
            });
          }
        }

        // Update interaction message every ~60 sim-minutes
        if (elapsed > 0 && elapsed % 60 < 2) {
          const newInteraction = getRandomInteraction();
          const updatedVisits = state.activeVisits.map((v) =>
            v.robotId === visit.robotId ? { ...v, interaction: newInteraction } : v,
          );
          useStore.setState({ activeVisits: updatedVisits });
        }

        // Auto-recall after 3 sim-hours (180 minutes)
        if (elapsed >= 180) {
          state.recallRobot(visit.robotId);
          const house = neighborHouses.find((h) => h.id === visit.houseId);
          state.addNotification({
            type: 'info',
            title: 'Visit Complete',
            message: `${visit.robotId} returned from visiting ${house?.name ?? 'a neighbor'}`,
          });
          delete lastBoostRef.current[visit.robotId];
        }
      }
    }, VISIT_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
