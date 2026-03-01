import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import { useAccessibility } from '../../stores/useAccessibility';
import { ROBOT_IDS } from '../../types';

export function ScreenReaderAnnouncer() {
  const enabled = useAccessibility((s) => s.screenReaderEnabled);
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const prevStates = useRef<Record<string, string>>({});
  const prevRoomNeeds = useRef<Record<string, number>>({});

  const announce = useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;
    // Clear then set to force re-announcement
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = text;
    });
  }, []);

  // Track robot state changes
  useEffect(() => {
    if (!enabled) return;

    const unsub = useStore.subscribe((state) => {
      for (const robotId of ROBOT_IDS) {
        const robot = state.robots[robotId];
        const name = robotId.charAt(0).toUpperCase() + robotId.slice(1);
        const prevState = prevStates.current[`${robotId}-state`];
        const currentState = robot.state;

        if (prevState && prevState !== currentState) {
          if (currentState === 'working') {
            const task = state.tasks.find((t) => t.assignedTo === robotId && t.status === 'working');
            if (task) {
              announce(`${name} started ${task.description} in ${task.targetRoom}`);
            } else {
              announce(`${name} is now working`);
            }
          } else if (currentState === 'idle' && prevState === 'working') {
            announce(`${name} finished task`);
          }
        }
        prevStates.current[`${robotId}-state`] = currentState;

        // Battery warnings
        const prevBatKey = `${robotId}-lowbat`;
        if (robot.battery <= 15 && !prevStates.current[prevBatKey]) {
          announce(`${name} battery low at ${Math.round(robot.battery)}%`, 'assertive');
          prevStates.current[prevBatKey] = 'warned';
        } else if (robot.battery > 20) {
          delete prevStates.current[prevBatKey];
        }
      }

      // Room cleanliness changes
      for (const [roomId, needs] of Object.entries(state.roomNeeds)) {
        const prev = prevRoomNeeds.current[roomId];
        const current = Math.round(needs.cleanliness);
        if (prev !== undefined && prev >= 50 && current < 30) {
          announce(`${roomId} cleanliness dropped to ${current}%`);
        }
        prevRoomNeeds.current[roomId] = current;
      }

      // Home events
      const event = state.activeHomeEvent;
      const prevEvent = prevStates.current['home-event'];
      if (event && event.id !== prevEvent) {
        const typeLabel = event.type.replace(/-/g, ' ');
        announce(`Alert: ${typeLabel} detected in ${event.roomId}`, 'assertive');
        prevStates.current['home-event'] = event.id;
      } else if (!event && prevEvent) {
        announce('Home event resolved');
        delete prevStates.current['home-event'];
      }
    });

    return unsub;
  }, [enabled, announce]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
