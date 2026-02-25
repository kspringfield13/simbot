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

// Idle thoughts the robot cycles through when everything is clean
const idleThoughts = [
  'All clear. Monitoring ambient conditions.',
  'Systems nominal. Scanning for changes.',
  'Home looks good. Standing by.',
  'Running passive environment check.',
  'No urgent tasks detected.',
  'Efficient. Everything is in order.',
  'Sensors are clear. Waiting for next trigger.',
  'Home status: stable.',
];

// Transition thoughts when moving between tasks
const transitionThoughts = [
  'Let me check on the next area.',
  'Moving to assess the situation.',
  'Time to address that.',
  'On it.',
  'Heading over now.',
  'Prioritizing this next.',
];

// Window/patrol thoughts
const patrolThoughts = [
  'Taking a quick perimeter check.',
  'Going to look outside for a moment.',
  'Checking the windows.',
  'Doing a quick walkthrough.',
  'Scanning exterior conditions.',
];

export function AIBrain() {
  const nextDecisionAtRef = useRef(0);
  const lastWindowTripRef = useRef<number>(-1000);
  const lastCleanedRoomRef = useRef<RoomId | null>(null);
  const consecutiveTasksRef = useRef(0);
  const idleThoughtIndexRef = useRef(0);

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

    // Respect user override
    const hasUserOverrideTask = state.tasks.some((task) =>
      ACTIVE_STATUSES.has(task.status) && task.source !== 'ai',
    );

    if (hasUserOverrideTask || now < state.overrideUntilSimMinute) {
      state.setRobotThought('User override active. Standing by.');
      nextDecisionAtRef.current = now + randomRange(10, 18);
      return;
    }

    // Don't pile on if already busy
    const hasAnyActiveTask = state.tasks.some((task) => ACTIVE_STATUSES.has(task.status));
    if (hasAnyActiveTask || state.robotState !== 'idle') {
      nextDecisionAtRef.current = now + randomRange(8, 14);
      return;
    }

    // After consecutive tasks, take a natural break
    if (consecutiveTasksRef.current >= 3) {
      consecutiveTasksRef.current = 0;
      state.setRobotThought('Taking a brief pause between routines.');
      state.setRobotMood('content');
      nextDecisionAtRef.current = now + randomRange(25, 45);
      return;
    }

    // Score all rooms
    const roomScores: { id: RoomId; score: number }[] = [];
    for (const room of rooms) {
      const roomNeed = state.roomNeeds[room.id];
      if (!roomNeed) continue;
      const score = scoreRoomAttention(room.id, roomNeed, state.simPeriod);
      roomScores.push({ id: room.id, score });
    }
    roomScores.sort((a, b) => b.score - a.score);

    const top = roomScores[0];
    if (!top) {
      nextDecisionAtRef.current = now + randomRange(20, 35);
      return;
    }

    // Pick highest priority room, but avoid the same room twice in a row unless it's really dirty
    let targetRoom = top;
    if (top.id === lastCleanedRoomRef.current && top.score < 45 && roomScores.length > 1) {
      targetRoom = roomScores[1];
    }

    if (targetRoom.score >= 25) {
      const autoTask = buildAutonomousTask(targetRoom.id, state.simPeriod);
      const roomName = rooms.find((room) => room.id === targetRoom.id)?.name ?? targetRoom.id;

      // Pick a natural transition thought
      const thought = consecutiveTasksRef.current === 0
        ? autoTask.thought
        : transitionThoughts[Math.floor(Math.random() * transitionThoughts.length)];

      state.addTask({
        id: crypto.randomUUID(),
        command: `Autonomous: ${roomName}`,
        source: 'ai',
        targetRoom: targetRoom.id,
        targetPosition: autoTask.position,
        status: 'queued',
        progress: 0,
        description: autoTask.description,
        taskType: autoTask.taskType,
        workDuration: autoTask.workDuration,
        createdAt: Date.now(),
      });

      state.setRobotThought(thought);
      state.setRobotMood('focused');
      state.addMessage({
        id: crypto.randomUUID(),
        sender: 'robot',
        text: autoTask.thought,
        timestamp: Date.now(),
      });

      lastCleanedRoomRef.current = targetRoom.id;
      consecutiveTasksRef.current += 1;

      // Shorter gap between chained tasks, longer after standalone
      nextDecisionAtRef.current = now + randomRange(12, 22);
      return;
    }

    // Everything is clean — either patrol or idle
    if (now - lastWindowTripRef.current > 60) {
      const windowTarget = pickWindowSpot();
      const patrolThought = patrolThoughts[Math.floor(Math.random() * patrolThoughts.length)];

      state.addTask({
        id: crypto.randomUUID(),
        command: 'Autonomous: Patrol',
        source: 'ai',
        targetRoom: 'hallway',
        targetPosition: windowTarget,
        status: 'queued',
        progress: 0,
        description: 'Walking the home perimeter.',
        taskType: 'general',
        workDuration: 10,
        createdAt: Date.now(),
      });

      state.setRobotThought(patrolThought);
      state.setRobotMood('curious');
      lastWindowTripRef.current = now;
      consecutiveTasksRef.current = 0;
    } else {
      // Cycle through idle thoughts
      const thought = idleThoughts[idleThoughtIndexRef.current % idleThoughts.length];
      idleThoughtIndexRef.current += 1;
      state.setRobotThought(thought);
      state.setRobotMood('content');
    }

    nextDecisionAtRef.current = now + randomRange(20, 35);
  });

  return null;
}
