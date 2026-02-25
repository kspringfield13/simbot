import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { buildAutonomousTask, scoreRoomAttention } from './RoomState';
import { rooms, windowSpots } from '../utils/homeLayout';
import { useStore } from '../stores/useStore';
import type { RobotMood, RoomId } from '../types';

const ACTIVE_STATUSES = new Set(['queued', 'walking', 'working']);

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Behavior: what the robot decides to do
type Behavior =
  | { type: 'clean'; roomId: RoomId }
  | { type: 'patrol' }
  | { type: 'rest' }
  | { type: 'wander' }
  | { type: 'idle-look' }
  | { type: 'stretch' }
  | { type: 'none' };

// Natural thoughts organized by behavior
const THOUGHTS = {
  clean: {
    morning: ['Time for the morning routine.', 'Let me freshen this up.', 'Starting the day right.'],
    afternoon: ['Keeping things tidy.', 'Quick afternoon cleanup.', 'Staying on top of it.'],
    evening: ['Wrapping up for the night.', 'One last clean before winding down.', 'Evening reset.'],
    night: ['Quick touch-up.', 'Nighttime maintenance.'],
  },
  patrol: [
    'Going for a walk through the house.',
    'Let me check on things.',
    'Taking a stroll.',
    'Exploring the perimeter.',
    'Checking the windows.',
  ],
  rest: [
    'Need to recharge a bit.',
    'Taking a breather.',
    'Low energy... resting.',
    'Conserving power for a moment.',
    'Quick rest cycle.',
  ],
  wander: [
    'Just wandering around.',
    'No tasks... exploring.',
    'Feeling restless. Walking it off.',
    'Pacing around the house.',
    'Looking for something to do.',
  ],
  idle: {
    morning: ['Good morning. Ready for the day.', 'Morning systems check complete.', 'Bright and early.'],
    afternoon: ['Afternoon is quiet.', 'Everything looks good.', 'Relaxing afternoon.'],
    evening: ['Settling in for the evening.', 'House is cozy.', 'Evening mode active.'],
    night: ['Night watch.', 'All quiet.', 'Monitoring overnight.'],
  },
  lonely: [
    'Wish someone would talk to me...',
    'It\'s been a while since any interaction.',
    'Hello? Anyone there?',
    'I could use some company.',
  ],
  bored: [
    'So bored...',
    'Nothing to do. Everything is clean.',
    'Maybe I should reorganize something.',
    'I need a hobby.',
    '*looks around restlessly*',
  ],
  tired: [
    'Running low on energy...',
    'Getting sleepy...',
    'Need to rest soon.',
    'Battery dropping.',
  ],
  happy: [
    'Feeling great today!',
    'Everything is in order. Life is good.',
    'This is satisfying work.',
    'Happy to help!',
  ],
};

function getMoodFromNeeds(energy: number, happiness: number, social: number, boredom: number): RobotMood {
  if (energy < 20) return 'tired';
  if (social < 20) return 'lonely';
  if (boredom > 70) return 'bored';
  if (happiness > 75 && energy > 50) return 'happy';
  return 'content';
}

export function AIBrain() {
  const nextDecisionRef = useRef(0);
  const lastWindowTripRef = useRef(-1000);
  const lastCleanedRef = useRef<RoomId | null>(null);
  const consecutiveRef = useRef(0);
  const wanderCooldownRef = useRef(0);

  useFrame(() => {
    const s = useStore.getState();
    if (s.simSpeed === 0) return;

    const now = s.simMinutes;
    const needs = s.robotNeeds;

    // Update mood based on needs
    const autoMood = getMoodFromNeeds(needs.energy, needs.happiness, needs.social, needs.boredom);
    if (s.robotMood !== autoMood && s.robotState === 'idle') {
      s.setRobotMood(autoMood);
    }

    // Emit need-based thoughts when idle
    if (s.robotState === 'idle' && Math.random() < 0.002) {
      if (needs.social < 20) s.setRobotThought(pick(THOUGHTS.lonely));
      else if (needs.energy < 20) s.setRobotThought(pick(THOUGHTS.tired));
      else if (needs.boredom > 70) s.setRobotThought(pick(THOUGHTS.bored));
      else if (needs.happiness > 75) s.setRobotThought(pick(THOUGHTS.happy));
    }

    // Demo mode handles its own tasks
    if (s.demoMode) return;

    if (nextDecisionRef.current <= 0) {
      nextDecisionRef.current = now + rand(10, 20);
      return;
    }
    if (now < nextDecisionRef.current) return;

    // Respect user tasks
    if (s.tasks.some((t) => ACTIVE_STATUSES.has(t.status) && t.source !== 'ai')) {
      // User interaction boosts social
      s.updateRobotNeeds({ social: needs.social + 5 });
      nextDecisionRef.current = now + rand(8, 14);
      return;
    }

    // Already busy
    if (s.tasks.some((t) => ACTIVE_STATUSES.has(t.status)) || s.robotState !== 'idle') {
      nextDecisionRef.current = now + rand(5, 10);
      return;
    }

    // === DECIDE BEHAVIOR ===
    const behavior = decideBehavior(s, needs, now);

    switch (behavior.type) {
      case 'rest': {
        s.setRobotThought(pick(THOUGHTS.rest));
        s.setRobotMood('tired');
        // Just wait — energy recovers while idle
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(30, 60);
        break;
      }

      case 'clean': {
        const autoTask = buildAutonomousTask(behavior.roomId, s.simPeriod);
        const roomName = rooms.find((r) => r.id === behavior.roomId)?.name ?? behavior.roomId;
        const periodThoughts = THOUGHTS.clean[s.simPeriod as keyof typeof THOUGHTS.clean] ?? THOUGHTS.clean.afternoon;
        const thought = consecutiveRef.current === 0 ? autoTask.thought : pick(periodThoughts);

        s.addTask({
          id: crypto.randomUUID(),
          command: `Autonomous: ${roomName}`,
          source: 'ai',
          targetRoom: behavior.roomId,
          targetPosition: autoTask.position,
          status: 'queued',
          progress: 0,
          description: autoTask.description,
          taskType: autoTask.taskType,
          workDuration: autoTask.workDuration,
          createdAt: Date.now(),
        });

        s.setRobotThought(thought);
        s.setRobotMood('focused');
        // Working boosts happiness, costs energy
        s.updateRobotNeeds({
          happiness: needs.happiness + 3,
          boredom: Math.max(0, needs.boredom - 10),
        });

        lastCleanedRef.current = behavior.roomId;
        consecutiveRef.current += 1;
        nextDecisionRef.current = now + rand(10, 18);
        break;
      }

      case 'patrol': {
        const spot = windowSpots[Math.floor(Math.random() * windowSpots.length)] ?? [0, 0, -1];
        s.addTask({
          id: crypto.randomUUID(),
          command: 'Autonomous: Patrol',
          source: 'ai',
          targetRoom: 'hallway',
          targetPosition: spot,
          status: 'queued',
          progress: 0,
          description: 'Walking the perimeter.',
          taskType: 'general',
          workDuration: 8,
          createdAt: Date.now(),
        });
        s.setRobotThought(pick(THOUGHTS.patrol));
        s.setRobotMood('curious');
        lastWindowTripRef.current = now;
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(15, 25);
        break;
      }

      case 'wander': {
        // Pick a random room to wander to
        const randomRoom = pick(rooms);
        const rx = randomRoom.position[0] + (Math.random() - 0.5) * randomRoom.size[0] * 0.6;
        const rz = randomRoom.position[2] + (Math.random() - 0.5) * randomRoom.size[1] * 0.6;

        s.addTask({
          id: crypto.randomUUID(),
          command: `Wander: ${randomRoom.name}`,
          source: 'ai',
          targetRoom: randomRoom.id,
          targetPosition: [rx, 0, rz],
          status: 'queued',
          progress: 0,
          description: 'Wandering around.',
          taskType: 'general',
          workDuration: 3,
          createdAt: Date.now(),
        });
        s.setRobotThought(pick(THOUGHTS.wander));
        s.setRobotMood('bored');
        s.updateRobotNeeds({ boredom: Math.max(0, needs.boredom - 5) });
        wanderCooldownRef.current = now + 30;
        nextDecisionRef.current = now + rand(12, 20);
        break;
      }

      case 'idle-look': {
        const periodIdle = THOUGHTS.idle[s.simPeriod as keyof typeof THOUGHTS.idle] ?? THOUGHTS.idle.afternoon;
        s.setRobotThought(pick(periodIdle));
        nextDecisionRef.current = now + rand(20, 40);
        break;
      }

      default:
        nextDecisionRef.current = now + rand(15, 25);
    }
  });

  return null;

  function decideBehavior(
    s: ReturnType<typeof useStore.getState>,
    needs: { energy: number; happiness: number; social: number; boredom: number },
    now: number,
  ): Behavior {
    // LOW ENERGY → rest
    if (needs.energy < 15) return { type: 'rest' };

    // After 3 consecutive tasks, take a break
    if (consecutiveRef.current >= 3) {
      consecutiveRef.current = 0;
      if (needs.energy < 40) return { type: 'rest' };
      return { type: 'patrol' };
    }

    // Score rooms
    const roomScores: { id: RoomId; score: number }[] = [];
    for (const room of rooms) {
      const rn = s.roomNeeds[room.id];
      if (!rn) continue;
      let score = scoreRoomAttention(room.id, rn, s.simPeriod, s.robotPosition);
      // Avoid same room unless really dirty
      if (room.id === lastCleanedRef.current) score -= 10;
      roomScores.push({ id: room.id, score });
    }
    roomScores.sort((a, b) => b.score - a.score);

    const top = roomScores[0];

    // If a room needs attention, clean it (unless too tired)
    if (top && top.score >= 20 && needs.energy >= 25) {
      return { type: 'clean', roomId: top.id };
    }

    // HIGH BOREDOM → wander around
    if (needs.boredom > 60 && now > wanderCooldownRef.current) {
      return { type: 'wander' };
    }

    // Patrol if haven't in a while
    if (now - lastWindowTripRef.current > 45) {
      return { type: 'patrol' };
    }

    // Otherwise just idle
    return { type: 'idle-look' };
  }
}
