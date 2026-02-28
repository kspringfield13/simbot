import { useStore } from './useStore';
import type { RobotInstanceState } from '../types';

/** Select a field from the currently active robot */
export function useActiveRobot<T>(selector: (r: RobotInstanceState) => T): T {
  return useStore((s) => selector(s.robots[s.activeRobotId]));
}

/** Get active robot state imperatively */
export function getActiveRobot(): RobotInstanceState {
  const s = useStore.getState();
  return s.robots[s.activeRobotId];
}
