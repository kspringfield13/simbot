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

// Context-aware idle thoughts by time of day
const idleThoughtsByPeriod: Record<string, string[]> = {
  morning: [
    'Morning routine complete. House is ready for the day.',
    'Good start to the day. Everything looks fresh.',
    'Morning checklist done. Standing by.',
    'All set for the morning. Monitoring.',
  ],
  afternoon: [
    'Afternoon check — everything is holding up nicely.',
    'Midday status: all rooms looking good.',
    'Running a quiet afternoon scan.',
    'Home is in good shape. Conserving energy.',
  ],
  evening: [
    'Winding down. Home is cozy and clean.',
    'Evening check complete. Ready for relaxation.',
    'Getting the house settled for the night.',
    'Everything is tidy for the evening.',
  ],
  night: [
    'Night mode. Minimal activity, just monitoring.',
    'House is quiet. All systems nominal.',
    'Running overnight passive checks.',
    'Night watch. Everything is secure.',
  ],
};

// Fallback idle thoughts
const idleThoughts = [
  'All clear. Monitoring ambient conditions.',
  'Systems nominal. Scanning for changes.',
  'Home looks good. Standing by.',
  'No urgent tasks detected.',
];

// Context-aware transition thoughts
const transitionThoughtsByPeriod: Record<string, string[]> = {
  morning: [
    'Part of the morning routine.',
    'Keeping the morning flow going.',
    'Next on the morning checklist.',
  ],
  afternoon: [
    'Afternoon maintenance pass.',
    'Staying on top of things.',
    'Keeping the house fresh.',
  ],
  evening: [
    'Evening reset — one more spot.',
    'Prepping the house for tonight.',
    'Almost done with the evening round.',
  ],
  night: [
    'Quick nighttime touch-up.',
    'One more thing before quiet hours.',
  ],
};

const transitionThoughts = [
  'Let me check on the next area.',
  'Moving to assess the situation.',
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

function pickFromPeriod(periodMap: Record<string, string[]>, fallback: string[], period: string): string {
  const list = periodMap[period] ?? fallback;
  return list[Math.floor(Math.random() * list.length)];
}

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

      // Pick a natural transition thought, context-aware by time of day
      const thought = consecutiveTasksRef.current === 0
        ? autoTask.thought
        : pickFromPeriod(transitionThoughtsByPeriod, transitionThoughts, state.simPeriod);

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
      // Cycle through time-aware idle thoughts
      const thought = pickFromPeriod(idleThoughtsByPeriod, idleThoughts, state.simPeriod);
      idleThoughtIndexRef.current += 1;
      state.setRobotThought(thought);
      state.setRobotMood('content');
    }

    nextDecisionAtRef.current = now + randomRange(20, 35);
  });

  return null;
}
