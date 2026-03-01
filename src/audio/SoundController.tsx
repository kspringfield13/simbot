import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { getRoomFromPoint } from '../utils/homeLayout';
import {
  startWalkSound,
  stopWalkSound,
  startWorkSound,
  stopWorkSound,
  updateWalkFloorType,
  setMuted,
  getFloorTypeForRoom,
} from './SoundEffects';

/**
 * Headless component that bridges robot state → sound effects.
 * Tracks which room the active robot is in and adjusts footstep
 * sounds based on floor surface type.
 * Mount once in the React tree.
 */
export function SoundController() {
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
  const currentAnimation = useStore((s) => s.robots[s.activeRobotId].currentAnimation);
  const simSpeed = useStore((s) => s.simSpeed);
  const soundMuted = useStore((s) => s.soundMuted);
  const robotPosition = useStore((s) => s.robots[s.activeRobotId].position);

  const prevState = useRef(robotState);
  const prevAnimation = useRef(currentAnimation);
  const prevSpeed = useRef(simSpeed);
  const prevRoomId = useRef<string | null>(null);

  // Sync mute state
  useEffect(() => {
    setMuted(soundMuted);
  }, [soundMuted]);

  // Track room changes for floor-type-aware footsteps
  const currentRoomId = getRoomFromPoint(robotPosition[0], robotPosition[2]);
  const floorType = getFloorTypeForRoom(currentRoomId);

  // When room changes while walking, update the floor type live
  useEffect(() => {
    if (currentRoomId !== prevRoomId.current) {
      prevRoomId.current = currentRoomId;
      if (robotState === 'walking') {
        updateWalkFloorType(floorType);
      }
    }
  }, [currentRoomId, floorType, robotState]);

  // React to state changes
  useEffect(() => {
    const stateChanged = prevState.current !== robotState;
    const animChanged = prevAnimation.current !== currentAnimation;
    const speedChanged = prevSpeed.current !== simSpeed;

    prevState.current = robotState;
    prevAnimation.current = currentAnimation;
    prevSpeed.current = simSpeed;

    if (simSpeed === 0) {
      stopWalkSound();
      stopWorkSound();
      return;
    }

    if (robotState === 'walking') {
      stopWorkSound();
      if (stateChanged || speedChanged) {
        startWalkSound(simSpeed, floorType);
      }
    } else if (robotState === 'working') {
      stopWalkSound();
      if (stateChanged || animChanged || speedChanged) {
        startWorkSound(currentAnimation, simSpeed);
      }
    } else {
      // idle
      stopWalkSound();
      stopWorkSound();
    }
  }, [robotState, currentAnimation, simSpeed, floorType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWalkSound();
      stopWorkSound();
    };
  }, []);

  return null;
}
