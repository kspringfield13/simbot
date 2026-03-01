import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { getUnlockedAchievements } from '../../systems/Achievements';
import { ROBOT_IDS } from '../../types';
import type { RobotId, HomeEventType } from '../../types';
import { LOW_BATTERY_THRESHOLD } from '../../utils/battery';
import { getEventConfig } from '../../systems/HomeEvents';
import { getRobotDisplayName } from '../../stores/useRobotNames';

const EVENT_LABELS: Record<HomeEventType, string> = {
  'plumbing-leak': 'Plumbing Leak',
  'power-outage': 'Power Outage',
  'pest-invasion': 'Pest Invasion',
};

/**
 * Headless system that watches game state and fires toast notifications.
 * Hooks into: achievements, home events, visitor events, battery warnings, task completions.
 */
export function NotificationTracker() {
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const prevTotalTasksRef = useRef(0);
  const batteryWarnedRef = useRef<Set<RobotId>>(new Set());
  const prevEventIdRef = useRef<string | null>(null);
  const prevEventPhaseRef = useRef<string | null>(null);
  const prevVisitorTypeRef = useRef<string | null>(null);
  const initRef = useRef(false);

  // Initialize refs with current state to avoid stale notifications on mount
  useEffect(() => {
    const s = useStore.getState();
    const stats = {
      totalTasksCompleted: s.totalTasksCompleted,
      tasksByType: s.tasksByType,
      tasksByRoom: s.tasksByRoom,
      simMinutes: s.simMinutes,
    };
    const unlocked = getUnlockedAchievements(stats);
    prevUnlockedRef.current = new Set(unlocked.map((a) => a.id));
    prevTotalTasksRef.current = s.totalTasksCompleted;
    if (s.activeHomeEvent) {
      prevEventIdRef.current = s.activeHomeEvent.id;
      prevEventPhaseRef.current = s.activeHomeEvent.phase;
    }
    if (s.visitorEvent) {
      prevVisitorTypeRef.current = s.visitorEvent.type;
    }
    initRef.current = true;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!initRef.current) return;
      const s = useStore.getState();
      if (s.simSpeed === 0) return;
      const addNotification = s.addNotification;

      // ── Achievement tracking ──
      const stats = {
        totalTasksCompleted: s.totalTasksCompleted,
        tasksByType: s.tasksByType,
        tasksByRoom: s.tasksByRoom,
        simMinutes: s.simMinutes,
      };
      const unlocked = getUnlockedAchievements(stats);
      for (const a of unlocked) {
        if (!prevUnlockedRef.current.has(a.id)) {
          addNotification({
            type: 'achievement',
            title: `${a.emoji} ${a.title}`,
            message: a.description,
          });
          prevUnlockedRef.current.add(a.id);
        }
      }

      // ── Task completion milestones ──
      const total = s.totalTasksCompleted;
      if (total > prevTotalTasksRef.current) {
        const prev = prevTotalTasksRef.current;
        const milestones = [5, 10, 25, 50, 100, 200, 500];
        for (const m of milestones) {
          if (prev < m && total >= m) {
            addNotification({
              type: 'success',
              title: 'Milestone Reached!',
              message: `${m} tasks completed across all robots.`,
            });
          }
        }
        prevTotalTasksRef.current = total;
      }

      // ── Battery warnings ──
      for (const rid of ROBOT_IDS) {
        const robot = s.robots[rid];
        const name = getRobotDisplayName(rid);
        if (robot.battery < LOW_BATTERY_THRESHOLD && !batteryWarnedRef.current.has(rid)) {
          addNotification({
            type: 'warning',
            title: 'Low Battery',
            message: `${name} is at ${Math.round(robot.battery)}% — heading to charge.`,
          });
          batteryWarnedRef.current.add(rid);
        }
        if (robot.battery > LOW_BATTERY_THRESHOLD + 20) {
          batteryWarnedRef.current.delete(rid);
        }
      }

      // ── Home events ──
      const event = s.activeHomeEvent;
      if (event) {
        if (event.id !== prevEventIdRef.current) {
          // New event triggered
          const config = getEventConfig(event.type);
          addNotification({
            type: 'warning',
            title: `${config.emoji} ${EVENT_LABELS[event.type]}`,
            message: config.bannerText(event.roomId.replace(/-/g, ' ')),
          });
          prevEventIdRef.current = event.id;
          prevEventPhaseRef.current = event.phase;
        } else if (event.phase === 'resolution' && prevEventPhaseRef.current !== 'resolution') {
          addNotification({
            type: 'success',
            title: 'Event Resolved',
            message: `${EVENT_LABELS[event.type]} has been fixed!`,
          });
          prevEventPhaseRef.current = event.phase;
        } else {
          prevEventPhaseRef.current = event.phase;
        }
      } else {
        prevEventIdRef.current = null;
        prevEventPhaseRef.current = null;
      }

      // ── Visitor events ──
      const visitor = s.visitorEvent;
      if (visitor && visitor.type !== prevVisitorTypeRef.current) {
        const labels: Record<string, { title: string; msg: string }> = {
          doorbell: { title: 'Ding-dong!', msg: 'Someone rang the doorbell.' },
          package: { title: 'Package Delivery', msg: 'A package arrived at the front door!' },
          visitor: { title: 'Visitor', msg: 'A guest appeared at the front door!' },
        };
        const info = labels[visitor.type];
        if (info) {
          addNotification({
            type: 'info',
            title: info.title,
            message: info.msg,
          });
        }
        prevVisitorTypeRef.current = visitor.type;
      }
      if (!visitor) {
        prevVisitorTypeRef.current = null;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
