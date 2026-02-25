import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { buildAutonomousTask, scoreRoomAttention } from './RoomState';
import { rooms, windowSpots } from '../utils/homeLayout';
import { useStore } from '../stores/useStore';
import type { RoomId } from '../types';

const ACTIVE_STATUSES = new Set(['queued', 'walking', 'working']);

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickWindowSpot(): [number, number, number] {
  return windowSpots[Math.floor(Math.random() * windowSpots.length)] ?? [0, 0, -1];
}

export function AIBrain() {
  const nextDecisionAtRef = useRef(0);
  const lastWindowTripRef = useRef<number>(-1000);

  useFrame(() => {
    const state = useStore.getState();

    if (state.simSpeed === 0) return;
    if (state.demoMode) return;

    const now = state.simMinutes;
    if (nextDecisionAtRef.current <= 0) {
      nextDecisionAtRef.current = now + randomRange(15, 30);
      return;
    }

    if (now < nextDecisionAtRef.current) return;

    const hasUserOverrideTask = state.tasks.some((task) =>
      ACTIVE_STATUSES.has(task.status) && task.source !== 'ai',
    );

    const hasAnyActiveTask = state.tasks.some((task) => ACTIVE_STATUSES.has(task.status));

    if (hasUserOverrideTask || now < state.overrideUntilSimMinute) {
      state.setRobotThought('User override active. Awaiting instruction completion.');
      nextDecisionAtRef.current = now + randomRange(10, 18);
      return;
    }

    if (hasAnyActiveTask || state.robotState !== 'idle') {
      nextDecisionAtRef.current = now + randomRange(8, 14);
      return;
    }

    let topRoomId: RoomId = 'living-room';
    let topScore = -Infinity;

    for (const room of rooms) {
      const roomNeed = state.roomNeeds[room.id];
      if (!roomNeed) continue;

      const score = scoreRoomAttention(room.id, roomNeed, state.simPeriod);
      if (score > topScore) {
        topScore = score;
        topRoomId = room.id;
      }
    }

    if (topScore >= 28) {
      const autoTask = buildAutonomousTask(topRoomId, state.simPeriod);
      const roomName = rooms.find((room) => room.id === topRoomId)?.name ?? topRoomId;

      state.addTask({
        id: crypto.randomUUID(),
        command: `Autonomous: ${roomName}`,
        source: 'ai',
        targetRoom: topRoomId,
        targetPosition: autoTask.position,
        status: 'queued',
        progress: 0,
        description: autoTask.description,
        taskType: autoTask.taskType,
        workDuration: autoTask.workDuration,
        createdAt: Date.now(),
      });

      state.setRobotThought(autoTask.thought);
      state.setRobotMood('focused');
      state.addMessage({
        id: crypto.randomUUID(),
        sender: 'robot',
        text: autoTask.thought,
        timestamp: Date.now(),
      });

      nextDecisionAtRef.current = now + randomRange(15, 30);
      return;
    }

    if (now - lastWindowTripRef.current > 45) {
      const windowTarget = pickWindowSpot();

      state.addTask({
        id: crypto.randomUUID(),
        command: 'Autonomous: Window Check',
        source: 'ai',
        targetRoom: 'hallway',
        targetPosition: windowTarget,
        status: 'queued',
        progress: 0,
        description: 'Walking over to look outside for a moment.',
        taskType: 'general',
        workDuration: 12,
        createdAt: Date.now(),
      });

      state.setRobotThought('Everything is stable. Taking a quick look outside.');
      state.setRobotMood('curious');
      lastWindowTripRef.current = now;
    } else {
      state.setRobotThought('All rooms are in decent shape. Standing by.');
      state.setRobotMood('content');
    }

    nextDecisionAtRef.current = now + randomRange(18, 30);
  });

  return null;
}
