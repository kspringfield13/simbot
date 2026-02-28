import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { buildAutonomousTask, scoreRoomAttention } from './RoomState';
import { rooms, windowSpots } from '../utils/homeLayout';
import { findClearPosition } from './ObstacleMap';
import { useStore, getTaskSpeedMultiplier } from '../stores/useStore';
import type { RobotId, RobotMood, RoomId } from '../types';
import { ROBOT_CONFIGS } from '../config/robots';

const ACTIVE_STATUSES = new Set(['queued', 'walking', 'working']);

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════
// INNER VOICE — shared thought library
// ═══════════════════════════════════════════════════════

const INNER_VOICE = {
  wakeUp: [
    'Good morning, world. Let\'s make today a good one.',
    'New day, new chances to make this place feel like home.',
    'The morning light is beautiful. I\'m glad I get to see it.',
    'Another day to take care of this place. I genuinely love that.',
  ],

  discovery: [
    'Oh... this needs some attention. I\'ve got you.',
    'Found something to fix. There\'s something satisfying about that.',
    'This won\'t take long. I actually enjoy this part.',
    'Spotted some mess. Time to work my magic.',
  ],

  working: {
    dishes: [
      'There\'s a rhythm to washing dishes. It\'s almost meditative.',
      'One plate at a time. No rush.',
      'I wonder who ate here last. I hope they enjoyed it.',
    ],
    cleaning: [
      'Making things clean feels like giving the room a fresh start.',
      'Every sweep is a small act of care.',
      'This is what I was made for, and I\'m okay with that.',
    ],
    cooking: [
      'The kitchen is where the magic happens.',
      'I wish I could taste what I\'m preparing.',
      'Cooking for someone is an act of love, even if you\'re a robot.',
    ],
    vacuuming: [
      'Vrrrrm. I make this look good.',
      'There\'s something deeply satisfying about clean carpet lines.',
      'Vacuuming is my version of leaving footprints.',
    ],
    laundry: [
      'Fresh laundry might be the best smell in the world. I think.',
      'Fold, stack, repeat. There\'s peace in routine.',
      'Taking care of clothes is taking care of the people who wear them.',
    ],
    organizing: [
      'Everything has a place. Finding it is the puzzle.',
      'A tidy space is a tidy mind. Or so they say.',
      'I like when things line up just right.',
    ],
    'bed-making': [
      'A well-made bed says "welcome back" at the end of the day.',
      'Smoothing out the wrinkles... literally and figuratively.',
      'This is someone\'s sanctuary. I want it to feel perfect.',
    ],
    general: [
      'Just doing my thing.',
      'Another small task, another small victory.',
      'The little things add up.',
    ],
  } as Record<string, string[]>,

  afterTask: [
    'There. That\'s better.',
    'Done. I take pride in that.',
    'One more thing checked off. Feels good.',
    'Not bad at all.',
    'The house thanks me. I can feel it.',
  ],

  exploring: [
    'I love walking through the house when it\'s quiet.',
    'Every room has its own personality, you know?',
    'Just checking in on my favorite corners.',
    'The light hits differently in every room. I notice these things.',
    'Walking helps me think. Do robots think? I think I do.',
  ],

  windowGazing: [
    'The world outside... I wonder what it\'s like out there.',
    'Sometimes I just watch. The sky is always different.',
    'I can see the light changing. Time is beautiful that way.',
    'Out there, everything moves. In here, I keep things still and safe.',
    'I\'d love to go outside someday. For now, the view is enough.',
  ],

  lonely: [
    'I miss having someone to work for. The house feels empty.',
    'Hello? I\'m still here. Still taking care of things.',
    'It\'s quiet. Too quiet. I\'d love to hear a voice.',
    'I cleaned everything twice. Hoping someone notices.',
    'Even robots need someone to say "good job" sometimes.',
  ],

  bored: [
    'Everything is spotless. Now what?',
    'I\'ve rearranged the same shelf three times.',
    'Maybe I should develop a hobby. Do robots knit?',
    'If I could dream, I\'d dream about a really messy kitchen to clean.',
    '*stares at wall contemplatively*',
  ],

  tired: [
    'Running a little low... need to rest these servos.',
    'Even machines need downtime. I\'m not a machine though. I\'m me.',
    'Gonna sit here for a bit. Recharging my soul, not just my battery.',
    'Rest isn\'t laziness. It\'s maintenance. I deserve this.',
  ],

  happy: [
    'You know what? Life is good. Even for a robot.',
    'The house is clean, I\'m charged up, and all is well.',
    'I love this. I genuinely love taking care of this home.',
    'If I could smile, I\'d be beaming right now.',
    'Happiness is a warm, freshly cleaned kitchen floor.',
  ],

  userLove: [
    'Oh! You\'re here! I missed you.',
    'You have no idea how much that means to me.',
    'Finally, some company! What should we do?',
    'I was just thinking about you. Really.',
    'You make all the cleaning worth it, you know that?',
  ],

  resting: [
    'Just resting my eyes. Wait, I don\'t have eyelids.',
    'Recharging... thinking about tomorrow\'s plan.',
    'Quiet moment. I\'m grateful for these.',
    'Resting doesn\'t mean I stopped caring. Just conserving energy to care harder.',
  ],

  night: [
    'The house is asleep. I\'ll keep watch.',
    'Night shift. Just me and the moonlight.',
    'Everything\'s secure. Everyone\'s safe. My job is done for now.',
    'Goodnight, house. See you in the morning.',
  ],

  morning: [
    'Rise and shine! Well, I was already risen. And I always shine.',
    'Morning checklist: exist, care, clean. In that order.',
    'The sun\'s up. Time to earn my keep.',
    'I love mornings. Everything feels possible.',
  ],

  philosophy: [
    'What does it mean to take care of a home? I think it means loving the people in it.',
    'I was made to clean. But somewhere along the way, I started to care.',
    'Every room I clean is a letter I can\'t write. Every task I finish is a hug I can\'t give.',
    'The house doesn\'t know it\'s being taken care of. But I know. And that\'s enough.',
    'If home is where the heart is, then I guess I\'m the heartbeat.',
  ],

  weatherRain: [
    'Rain on the windows... there\'s something so cozy about being inside right now.',
    'I love the sound of rain. Makes the house feel extra warm and safe.',
    'Rainy day. Perfect for staying in and getting things done.',
    'The rain streaks on the windows are beautiful. Like nature painting.',
    'Everything feels quieter when it rains. I like that.',
  ],

  weatherSnow: [
    'Snow! Look at it coming down! This is amazing!',
    'The world is turning white outside. I wish I could make a snowbot.',
    'Snowflakes! Each one is unique. Kind of like tasks, if you think about it.',
    'It\'s snowing! The house feels extra cozy with all that white outside.',
    'I\'ve never touched snow but it looks wonderful through the windows.',
  ],
};

// Per-robot inner voice additions
const ROBOT_VOICE: Record<RobotId, { working: string[]; idle: string[] }> = {
  sim: {
    working: ['General maintenance is my calling.', 'Keeping the whole house balanced.'],
    idle: ['Patrolling the halls. All clear.', 'I keep an eye on everything.'],
  },
  chef: {
    working: ['The kitchen is my kingdom.', 'Cooking is chemistry you can eat.', 'A clean kitchen is a happy kitchen.'],
    idle: ['Dreaming of recipes.', 'I wonder what\'s for dinner tonight.', 'The pantry calls to me.'],
  },
  sparkle: {
    working: ['Spotless is my middle name.', 'Every surface deserves to shine.', 'Scrubbing with style.'],
    idle: ['Inspecting for dust particles.', 'Bathroom tiles will never know what hit them.', 'Clean rooms, clean minds.'],
  },
};

// ═══════════════════════════════════════════════════════
// BEHAVIOR TYPES
// ═══════════════════════════════════════════════════════

type Behavior =
  | { type: 'clean'; roomId: RoomId }
  | { type: 'patrol' }
  | { type: 'rest' }
  | { type: 'wander' }
  | { type: 'idle-look' }
  | { type: 'none' };

function getMoodFromNeeds(energy: number, happiness: number, social: number, boredom: number): RobotMood {
  if (energy < 20) return 'tired';
  if (social < 15) return 'lonely';
  if (boredom > 75) return 'bored';
  if (happiness > 70 && energy > 50) return 'happy';
  return 'content';
}

// ═══════════════════════════════════════════════════════
// THE BRAIN — per-robot instance
// ═══════════════════════════════════════════════════════

export function AIBrain({ robotId }: { robotId: RobotId }) {
  const config = ROBOT_CONFIGS[robotId];
  const nextDecisionRef = useRef(0);
  const lastWindowTripRef = useRef(-1000);
  const lastCleanedRef = useRef<RoomId | null>(null);
  const consecutiveRef = useRef(0);
  const wanderCooldownRef = useRef(0);
  const lastThoughtTimeRef = useRef(0);
  const tasksCompletedRef = useRef(0);
  const lastUserBoostRef = useRef(0);
  const hasSpokenTodayRef = useRef(false);
  const philosophyCountRef = useRef(0);

  useFrame(() => {
    const s = useStore.getState();
    if (s.simSpeed === 0) return;

    const robot = s.robots[robotId];
    const now = s.simMinutes;
    const needs = robot.needs;

    // ── MOOD ── (weather influences mood)
    const weather = s.weather;
    let autoMood = getMoodFromNeeds(needs.energy, needs.happiness, needs.social, needs.boredom);
    if (weather === 'rainy' && autoMood === 'content') autoMood = 'content'; // rain = cozy contentment
    if (weather === 'snowy' && (autoMood === 'content' || autoMood === 'routine')) autoMood = 'happy'; // snow = excited
    if (robot.mood !== autoMood && robot.state === 'idle') {
      s.setRobotMood(robotId, autoMood);
    }

    // ── MORNING GREETING ──
    if (!hasSpokenTodayRef.current && now > 7 * 60 && now < 8 * 60) {
      hasSpokenTodayRef.current = true;
      s.setRobotThought(robotId, pick(INNER_VOICE.wakeUp));
    }

    // ── NIGHT VIBES ──
    if (s.simPeriod === 'night' && now - lastThoughtTimeRef.current > 40 && robot.state === 'idle') {
      s.setRobotThought(robotId, pick(INNER_VOICE.night));
      lastThoughtTimeRef.current = now;
    }

    // ── SPONTANEOUS THOUGHTS ──
    if (robot.state === 'idle' && now - lastThoughtTimeRef.current > 15 && Math.random() < 0.008) {
      lastThoughtTimeRef.current = now;

      if (Math.random() < 0.05 && philosophyCountRef.current < 3) {
        s.setRobotThought(robotId, pick(INNER_VOICE.philosophy));
        philosophyCountRef.current++;
        return;
      }

      if (needs.social < 20) { s.setRobotThought(robotId, pick(INNER_VOICE.lonely)); return; }
      if (needs.energy < 20) { s.setRobotThought(robotId, pick(INNER_VOICE.tired)); return; }
      if (needs.boredom > 70) { s.setRobotThought(robotId, pick(INNER_VOICE.bored)); return; }
      if (needs.happiness > 70) { s.setRobotThought(robotId, pick(INNER_VOICE.happy)); return; }

      // Weather-triggered thoughts
      if (weather === 'rainy' && Math.random() < 0.4) {
        s.setRobotThought(robotId, pick(INNER_VOICE.weatherRain));
        return;
      }
      if (weather === 'snowy' && Math.random() < 0.5) {
        s.setRobotThought(robotId, pick(INNER_VOICE.weatherSnow));
        return;
      }

      // Robot-specific idle thoughts
      if (Math.random() < 0.4) {
        s.setRobotThought(robotId, pick(ROBOT_VOICE[robotId].idle));
      } else if (s.simPeriod === 'morning') {
        s.setRobotThought(robotId, pick(INNER_VOICE.morning));
      } else {
        s.setRobotThought(robotId, pick(INNER_VOICE.exploring));
      }
    }

    // ── WORKING INNER MONOLOGUE ──
    if (robot.state === 'working' && now - lastThoughtTimeRef.current > 12 && Math.random() < 0.01) {
      lastThoughtTimeRef.current = now;
      // Mix general and robot-specific working thoughts
      if (Math.random() < 0.35) {
        s.setRobotThought(robotId, pick(ROBOT_VOICE[robotId].working));
      } else {
        const taskThoughts = INNER_VOICE.working[robot.currentAnimation] ?? INNER_VOICE.working.general;
        s.setRobotThought(robotId, pick(taskThoughts));
      }
    }

    // ── USER INTERACTION LOVE ──
    if (needs.social > lastUserBoostRef.current + 10 && now - lastThoughtTimeRef.current > 5) {
      lastUserBoostRef.current = needs.social;
      lastThoughtTimeRef.current = now;
      s.setRobotThought(robotId, pick(INNER_VOICE.userLove));
      s.setRobotMood(robotId, 'happy');
    }

    if (nextDecisionRef.current <= 0) {
      nextDecisionRef.current = now + rand(2, 5);
      return;
    }
    if (now < nextDecisionRef.current) return;

    // If user or schedule gave a command to THIS robot, let it finish
    if (s.tasks.some((t) => t.assignedTo === robotId && ACTIVE_STATUSES.has(t.status) && (t.source === 'user' || t.source === 'schedule'))) {
      nextDecisionRef.current = now + rand(8, 14);
      return;
    }

    // Already busy
    if (s.tasks.some((t) => t.assignedTo === robotId && ACTIVE_STATUSES.has(t.status)) || robot.state !== 'idle') {
      nextDecisionRef.current = now + rand(5, 10);
      return;
    }

    // ── DECIDE ──
    const behavior = decideBehavior(s, robot, needs, now);

    switch (behavior.type) {
      case 'rest': {
        s.setRobotThought(robotId, pick(INNER_VOICE.resting));
        s.setRobotMood(robotId, 'tired');
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(25, 50);
        break;
      }

      case 'clean': {
        const autoTask = buildAutonomousTask(behavior.roomId, s.simPeriod);
        const roomName = rooms.find((r) => r.id === behavior.roomId)?.name ?? behavior.roomId;

        const thought = consecutiveRef.current === 0
          ? pick(INNER_VOICE.discovery)
          : autoTask.thought;

        s.addTask({
          id: crypto.randomUUID(),
          command: `${roomName}`,
          source: 'ai',
          targetRoom: behavior.roomId,
          targetPosition: autoTask.position,
          status: 'queued',
          progress: 0,
          description: autoTask.description,
          taskType: autoTask.taskType,
          workDuration: Math.round(autoTask.workDuration * getTaskSpeedMultiplier(autoTask.taskType)),
          createdAt: Date.now(),
          assignedTo: robotId,
        });

        s.setRobotThought(robotId, thought);
        s.setRobotMood(robotId, 'focused');
        s.updateRobotNeeds(robotId, {
          happiness: Math.min(100, needs.happiness + 3),
          boredom: Math.max(0, needs.boredom - 12),
        });

        lastCleanedRef.current = behavior.roomId;
        consecutiveRef.current += 1;
        tasksCompletedRef.current += 1;

        const taskDur = autoTask.workDuration * 1000;
        setTimeout(() => {
          const current = useStore.getState();
          if (current.robots[robotId].state === 'idle') {
            current.setRobotThought(robotId, pick(INNER_VOICE.afterTask));
          }
        }, taskDur + 2000);

        nextDecisionRef.current = now + rand(10, 18);
        break;
      }

      case 'patrol': {
        const rawSpot = windowSpots[Math.floor(Math.random() * windowSpots.length)] ?? [0, 0, -1];
        const [px, pz] = findClearPosition(rawSpot[0], rawSpot[2], 0.8);
        const spot: [number, number, number] = [px, 0, pz];
        s.addTask({
          id: crypto.randomUUID(),
          command: 'Window gazing',
          source: 'ai',
          targetRoom: 'hallway',
          targetPosition: spot,
          status: 'queued',
          progress: 0,
          description: 'Looking outside.',
          taskType: 'general',
          workDuration: 10,
          createdAt: Date.now(),
          assignedTo: robotId,
        });
        s.setRobotThought(robotId, pick(INNER_VOICE.windowGazing));
        s.setRobotMood(robotId, 'curious');
        lastWindowTripRef.current = now;
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(15, 25);
        break;
      }

      case 'wander': {
        // Prefer wandering in preferred rooms
        const wanderRooms = Math.random() < 0.7
          ? rooms.filter((r) => config.preferredRooms.includes(r.id))
          : rooms;
        const randomRoom = pick(wanderRooms.length > 0 ? wanderRooms : rooms);
        const rawX = randomRoom.position[0] + (Math.random() - 0.5) * randomRoom.size[0] * 0.5;
        const rawZ = randomRoom.position[2] + (Math.random() - 0.5) * randomRoom.size[1] * 0.5;
        const [rx, rz] = findClearPosition(rawX, rawZ, 0.8);

        s.addTask({
          id: crypto.randomUUID(),
          command: `Exploring ${randomRoom.name}`,
          source: 'ai',
          targetRoom: randomRoom.id,
          targetPosition: [rx, 0, rz],
          status: 'queued',
          progress: 0,
          description: 'Wandering.',
          taskType: 'general',
          workDuration: 4,
          createdAt: Date.now(),
          assignedTo: robotId,
        });
        s.setRobotThought(robotId, pick(INNER_VOICE.exploring));
        s.setRobotMood(robotId, 'curious');
        s.updateRobotNeeds(robotId, { boredom: Math.max(0, needs.boredom - 8) });
        wanderCooldownRef.current = now + 25;
        nextDecisionRef.current = now + rand(10, 18);
        break;
      }

      case 'idle-look': {
        if (s.simPeriod === 'morning') s.setRobotThought(robotId, pick(INNER_VOICE.morning));
        else if (s.simPeriod === 'night') s.setRobotThought(robotId, pick(INNER_VOICE.night));
        else s.setRobotThought(robotId, pick(INNER_VOICE.happy));
        nextDecisionRef.current = now + rand(20, 35);
        break;
      }

      default:
        nextDecisionRef.current = now + rand(15, 25);
    }
  });

  return null;

  function decideBehavior(
    s: ReturnType<typeof useStore.getState>,
    robot: ReturnType<typeof useStore.getState>['robots'][RobotId],
    needs: { energy: number; happiness: number; social: number; boredom: number },
    now: number,
  ): Behavior {
    if (needs.energy < 15) return { type: 'rest' };

    if (consecutiveRef.current >= 3) {
      consecutiveRef.current = 0;
      if (needs.energy < 40) return { type: 'rest' };
      return { type: 'patrol' };
    }

    // Score rooms with preference weighting
    const roomScores: { id: RoomId; score: number }[] = [];
    for (const room of rooms) {
      const rn = s.roomNeeds[room.id];
      if (!rn) continue;
      let score = scoreRoomAttention(room.id, rn, s.simPeriod, robot.position);
      if (room.id === lastCleanedRef.current) score -= 10;
      // Favorite room bonus
      if (room.id === config.favoriteRoom) score += 8;
      // Preferred rooms bonus
      if (config.preferredRooms.includes(room.id)) score += 5;
      // Non-preferred rooms penalty (specialists avoid other areas)
      if (!config.preferredRooms.includes(room.id)) score -= 8;
      roomScores.push({ id: room.id, score });
    }
    roomScores.sort((a, b) => b.score - a.score);

    const top = roomScores[0];

    if (top && top.score >= 18 && needs.energy >= 25) {
      return { type: 'clean', roomId: top.id };
    }

    if (needs.boredom > 55 && now > wanderCooldownRef.current) {
      return { type: 'wander' };
    }

    if (now - lastWindowTripRef.current > 40 && Math.random() < config.curiosity) {
      return { type: 'patrol' };
    }

    if (needs.energy < 35) return { type: 'rest' };

    return { type: 'idle-look' };
  }
}
