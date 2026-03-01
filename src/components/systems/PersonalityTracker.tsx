import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId, RoomId } from '../../types';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { generatePersonalityDiaryEntry } from '../../config/diary';

/**
 * Headless component that:
 * 1. Tracks which room each robot is in and accumulates time spent
 * 2. Periodically generates personality reflection diary entries
 */
export function PersonalityTracker() {
  const lastRoomRef = useRef<Record<RobotId, RoomId | null>>({ sim: null, chef: null, sparkle: null });
  const lastSampleRef = useRef(0);
  const lastDiaryRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, simSpeed } = state;
      if (simSpeed === 0) return;

      // Sample every ~2 sim-minutes
      if (simMinutes - lastSampleRef.current < 2) return;
      const deltaMins = simMinutes - lastSampleRef.current;
      lastSampleRef.current = simMinutes;

      // Track room time for each robot
      for (const rid of ROBOT_IDS) {
        const robot = state.robots[rid];
        const currentRoom = getRoomFromPoint(robot.position[0], robot.position[2]);
        if (currentRoom) {
          state.recordPersonalityRoomTime(rid, currentRoom, deltaMins);
        }
        lastRoomRef.current[rid] = currentRoom;
      }

      // Generate personality diary entries occasionally (~every 120 sim-minutes)
      if (simMinutes - lastDiaryRef.current > 120 && Math.random() < 0.15) {
        lastDiaryRef.current = simMinutes;
        // Pick a random robot that has developed traits
        const candidates = ROBOT_IDS.filter((rid) => state.personalities[rid].totalTasksDone >= 3);
        if (candidates.length > 0) {
          const rid = candidates[Math.floor(Math.random() * candidates.length)];
          const robot = state.robots[rid];
          const entry = generatePersonalityDiaryEntry(
            rid,
            simMinutes,
            robot.mood,
            robot.battery,
            state.personalities[rid],
          );
          if (entry) {
            state.addDiaryEntry(entry);
          }
        }
      }
    }, 5000); // check every 5 real seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
