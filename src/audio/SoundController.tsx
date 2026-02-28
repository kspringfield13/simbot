import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import {
  startWalkSound,
  stopWalkSound,
  startWorkSound,
  stopWorkSound,
  setMuted,
} from './SoundEffects';

/**
 * Headless component that bridges robot state → sound effects.
 * Mount once in the React tree.
 */
export function SoundController() {
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
  const currentAnimation = useStore((s) => s.robots[s.activeRobotId].currentAnimation);
  const simSpeed = useStore((s) => s.simSpeed);
  const soundMuted = useStore((s) => s.soundMuted);

  const prevState = useRef(robotState);
  const prevAnimation = useRef(currentAnimation);
  const prevSpeed = useRef(simSpeed);

  // Sync mute state
  useEffect(() => {
    setMuted(soundMuted);
  }, [soundMuted]);

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
        startWalkSound(simSpeed);
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
  }, [robotState, currentAnimation, simSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWalkSound();
      stopWorkSound();
    };
  }, []);

  return null;
}
