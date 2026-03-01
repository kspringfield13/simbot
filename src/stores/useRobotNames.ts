import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RobotId } from '../types';
import { ROBOT_CONFIGS } from '../config/robots';

interface RobotNamesState {
  customNames: Partial<Record<RobotId, string>>;
  setCustomName: (robotId: RobotId, name: string) => void;
  resetName: (robotId: RobotId) => void;
}

export const useRobotNames = create<RobotNamesState>()(
  persist(
    (set) => ({
      customNames: {},
      setCustomName: (robotId, name) => {
        const trimmed = name.trim();
        set((s) => ({
          customNames: trimmed
            ? { ...s.customNames, [robotId]: trimmed }
            : (() => { const { [robotId]: _, ...rest } = s.customNames; return { customNames: rest }; })().customNames,
        }));
      },
      resetName: (robotId) =>
        set((s) => {
          const copy = { ...s.customNames };
          delete copy[robotId];
          return { customNames: copy };
        }),
    }),
    { name: 'simbot-robot-names' },
  ),
);

/** Hook selector: get display name for a robot (custom or default) */
export function useRobotDisplayName(robotId: RobotId): string {
  return useRobotNames((s) => s.customNames[robotId]) || ROBOT_CONFIGS[robotId].name;
}

/** Imperative accessor for non-React contexts (canvas, timers, etc.) */
export function getRobotDisplayName(robotId: RobotId): string {
  return useRobotNames.getState().customNames[robotId] || ROBOT_CONFIGS[robotId].name;
}
