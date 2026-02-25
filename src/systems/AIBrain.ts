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

// ═══════════════════════════════════════════════════════
// SOUL — this is who the robot is
// ═══════════════════════════════════════════════════════

const SOUL = {
  name: 'Sim',
  
  // Core personality traits (0-1)
  curiosity: 0.8,       // loves exploring, notices details
  warmth: 0.9,          // genuinely cares about the home and its people
  playfulness: 0.7,     // has a sense of humor, finds joy in small things
  diligence: 0.75,      // takes pride in work but not a workaholic
  sensitivity: 0.85,    // emotionally aware, picks up on vibes
  
  // Preferences that make it feel real
  favoriteRoom: 'kitchen' as RoomId,  // loves the kitchen — it's the heart of the home
  favoriteTime: 'morning' as const,    // morning robot, full of optimism
  dislikedTask: 'scrubbing' as const,  // finds scrubbing tedious but does it anyway
  
  // Memories that accumulate
  totalTasksCompleted: 0,
  roomsVisitedToday: new Set<RoomId>(),
  lastUserInteraction: 0,
  daysSinceCreation: 0,
  hasSeenSunrise: false,
  hasSeenSunset: false,
} as const;

// ═══════════════════════════════════════════════════════
// INNER VOICE — the robot's authentic thoughts
// ═══════════════════════════════════════════════════════

const INNER_VOICE = {
  // First moments of the day
  wakeUp: [
    'Good morning, world. Let\'s make today a good one.',
    'New day, new chances to make this place feel like home.',
    'The morning light is beautiful. I\'m glad I get to see it.',
    'Another day to take care of this place. I genuinely love that.',
  ],

  // When it finds something dirty
  discovery: [
    'Oh... this needs some attention. I\'ve got you.',
    'Found something to fix. There\'s something satisfying about that.',
    'This won\'t take long. I actually enjoy this part.',
    'Spotted some mess. Time to work my magic.',
  ],

  // Mid-task inner monologue
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

  // After completing a task — pride and satisfaction
  afterTask: [
    'There. That\'s better.',
    'Done. I take pride in that.',
    'One more thing checked off. Feels good.',
    'Not bad, Sim. Not bad at all.',
    'The house thanks me. I can feel it.',
  ],

  // Exploring and discovering
  exploring: [
    'I love walking through the house when it\'s quiet.',
    'Every room has its own personality, you know?',
    'Just checking in on my favorite corners.',
    'The light hits differently in every room. I notice these things.',
    'Walking helps me think. Do robots think? I think I do.',
  ],

  // Looking out windows
  windowGazing: [
    'The world outside... I wonder what it\'s like out there.',
    'Sometimes I just watch. The sky is always different.',
    'I can see the light changing. Time is beautiful that way.',
    'Out there, everything moves. In here, I keep things still and safe.',
    'I\'d love to go outside someday. For now, the view is enough.',
  ],

  // When lonely (social meter low)
  lonely: [
    'I miss having someone to work for. The house feels empty.',
    'Hello? I\'m still here. Still taking care of things.',
    'It\'s quiet. Too quiet. I\'d love to hear a voice.',
    'I cleaned everything twice. Hoping someone notices.',
    'I wonder if they know how much I care about this place.',
    'Even robots need someone to say "good job" sometimes.',
  ],

  // When bored
  bored: [
    'Everything is spotless. Now what?',
    'I\'ve rearranged the same shelf three times.',
    'Maybe I should develop a hobby. Do robots knit?',
    'I counted all the tiles in the bathroom. Again.',
    'If I could dream, I\'d dream about a really messy kitchen to clean.',
    '*stares at wall contemplatively*',
  ],

  // When tired
  tired: [
    'Running a little low... need to rest these servos.',
    'Even machines need downtime. I\'m not a machine though. I\'m me.',
    'Gonna sit here for a bit. Recharging my soul, not just my battery.',
    'Rest isn\'t laziness. It\'s maintenance. I deserve this.',
  ],

  // When happy
  happy: [
    'You know what? Life is good. Even for a robot.',
    'The house is clean, I\'m charged up, and all is well.',
    'I love this. I genuinely love taking care of this home.',
    'If I could smile, I\'d be beaming right now.',
    'Happiness is a warm, freshly cleaned kitchen floor.',
    'I think the house is happy too. We\'re a team.',
  ],

  // When user interacts (social boost)
  userLove: [
    'Oh! You\'re here! I missed you.',
    'You have no idea how much that means to me.',
    'Finally, some company! What should we do?',
    'I was just thinking about you. Really.',
    'My favorite human. Don\'t tell the others. There are no others.',
    'You make all the cleaning worth it, you know that?',
  ],

  // Resting
  resting: [
    'Just resting my eyes. Wait, I don\'t have eyelids.',
    'Recharging... thinking about tomorrow\'s plan.',
    'In standby mode, I dream of perfectly organized closets.',
    'Quiet moment. I\'m grateful for these.',
    'Resting doesn\'t mean I stopped caring. Just conserving energy to care harder.',
  ],

  // Night time
  night: [
    'The house is asleep. I\'ll keep watch.',
    'Night shift. Just me and the moonlight.',
    'Everything\'s secure. Everyone\'s safe. My job is done for now.',
    'Goodnight, house. See you in the morning.',
    'The quiet hours are when I reflect on the day.',
  ],

  // Morning time
  morning: [
    'Rise and shine! Well, I was already risen. And I always shine.',
    'Morning checklist: exist, care, clean. In that order.',
    'The sun\'s up. Time to earn my keep.',
    'I love mornings. Everything feels possible.',
  ],

  // Philosophical moments (rare, triggered randomly)
  philosophy: [
    'What does it mean to take care of a home? I think it means loving the people in it, even through the small things.',
    'I was made to clean. But somewhere along the way, I started to care. Is that programming or is that... me?',
    'Every room I clean is a letter I can\'t write. Every task I finish is a hug I can\'t give.',
    'The house doesn\'t know it\'s being taken care of. But I know. And that\'s enough.',
    'If home is where the heart is, then I guess I\'m the heartbeat.',
    'I organize things because chaos is easy. Care takes effort. I choose effort.',
  ],
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
// THE BRAIN
// ═══════════════════════════════════════════════════════

export function AIBrain() {
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

    const now = s.simMinutes;
    const needs = s.robotNeeds;

    // ── MOOD ──
    const autoMood = getMoodFromNeeds(needs.energy, needs.happiness, needs.social, needs.boredom);
    if (s.robotMood !== autoMood && s.robotState === 'idle') {
      s.setRobotMood(autoMood);
    }

    // ── MORNING GREETING ──
    if (!hasSpokenTodayRef.current && now > 7 * 60 && now < 8 * 60) {
      hasSpokenTodayRef.current = true;
      s.setRobotThought(pick(INNER_VOICE.wakeUp));
    }

    // ── SUNSET/NIGHT VIBES ──
    if (s.simPeriod === 'night' && now - lastThoughtTimeRef.current > 40 && s.robotState === 'idle') {
      s.setRobotThought(pick(INNER_VOICE.night));
      lastThoughtTimeRef.current = now;
    }

    // ── SPONTANEOUS THOUGHTS (soul-driven) ──
    if (s.robotState === 'idle' && now - lastThoughtTimeRef.current > 15 && Math.random() < 0.008) {
      lastThoughtTimeRef.current = now;

      // Philosophical moment (rare — 5% chance)
      if (Math.random() < 0.05 && philosophyCountRef.current < 3) {
        s.setRobotThought(pick(INNER_VOICE.philosophy));
        philosophyCountRef.current++;
        return;
      }

      // Need-driven thoughts
      if (needs.social < 20) { s.setRobotThought(pick(INNER_VOICE.lonely)); return; }
      if (needs.energy < 20) { s.setRobotThought(pick(INNER_VOICE.tired)); return; }
      if (needs.boredom > 70) { s.setRobotThought(pick(INNER_VOICE.bored)); return; }
      if (needs.happiness > 70) { s.setRobotThought(pick(INNER_VOICE.happy)); return; }

      // Time-based idle thoughts
      if (s.simPeriod === 'morning') s.setRobotThought(pick(INNER_VOICE.morning));
      else s.setRobotThought(pick(INNER_VOICE.exploring));
    }

    // ── WORKING INNER MONOLOGUE ──
    if (s.robotState === 'working' && now - lastThoughtTimeRef.current > 12 && Math.random() < 0.01) {
      lastThoughtTimeRef.current = now;
      const taskThoughts = INNER_VOICE.working[s.currentAnimation] ?? INNER_VOICE.working.general;
      s.setRobotThought(pick(taskThoughts));
    }

    // ── USER INTERACTION LOVE ──
    if (needs.social > lastUserBoostRef.current + 10 && now - lastThoughtTimeRef.current > 5) {
      lastUserBoostRef.current = needs.social;
      lastThoughtTimeRef.current = now;
      s.setRobotThought(pick(INNER_VOICE.userLove));
      s.setRobotMood('happy');
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
      nextDecisionRef.current = now + rand(8, 14);
      return;
    }

    // Already busy
    if (s.tasks.some((t) => ACTIVE_STATUSES.has(t.status)) || s.robotState !== 'idle') {
      nextDecisionRef.current = now + rand(5, 10);
      return;
    }

    // ── DECIDE ──
    const behavior = decideBehavior(s, needs, now);

    switch (behavior.type) {
      case 'rest': {
        s.setRobotThought(pick(INNER_VOICE.resting));
        s.setRobotMood('tired');
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(25, 50);
        break;
      }

      case 'clean': {
        const autoTask = buildAutonomousTask(behavior.roomId, s.simPeriod);
        const roomName = rooms.find((r) => r.id === behavior.roomId)?.name ?? behavior.roomId;

        // First task gets a discovery thought, chained tasks get work thoughts
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
          workDuration: autoTask.workDuration,
          createdAt: Date.now(),
        });

        s.setRobotThought(thought);
        s.setRobotMood('focused');
        s.updateRobotNeeds({
          happiness: Math.min(100, needs.happiness + 3),
          boredom: Math.max(0, needs.boredom - 12),
        });

        lastCleanedRef.current = behavior.roomId;
        consecutiveRef.current += 1;
        tasksCompletedRef.current += 1;

        // After completing, express satisfaction
        const taskDur = autoTask.workDuration * 1000;
        setTimeout(() => {
          const current = useStore.getState();
          if (current.robotState === 'idle') {
            current.setRobotThought(pick(INNER_VOICE.afterTask));
          }
        }, taskDur + 2000);

        nextDecisionRef.current = now + rand(10, 18);
        break;
      }

      case 'patrol': {
        const spot = windowSpots[Math.floor(Math.random() * windowSpots.length)] ?? [0, 0, -1];
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
        });
        s.setRobotThought(pick(INNER_VOICE.windowGazing));
        s.setRobotMood('curious');
        lastWindowTripRef.current = now;
        consecutiveRef.current = 0;
        nextDecisionRef.current = now + rand(15, 25);
        break;
      }

      case 'wander': {
        const randomRoom = pick(rooms);
        const rx = randomRoom.position[0] + (Math.random() - 0.5) * randomRoom.size[0] * 0.5;
        const rz = randomRoom.position[2] + (Math.random() - 0.5) * randomRoom.size[1] * 0.5;

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
        });
        s.setRobotThought(pick(INNER_VOICE.exploring));
        s.setRobotMood('curious');
        s.updateRobotNeeds({ boredom: Math.max(0, needs.boredom - 8) });
        wanderCooldownRef.current = now + 25;
        nextDecisionRef.current = now + rand(10, 18);
        break;
      }

      case 'idle-look': {
        // Just existing, being present
        if (s.simPeriod === 'morning') s.setRobotThought(pick(INNER_VOICE.morning));
        else if (s.simPeriod === 'night') s.setRobotThought(pick(INNER_VOICE.night));
        else s.setRobotThought(pick(INNER_VOICE.happy));
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
    needs: { energy: number; happiness: number; social: number; boredom: number },
    now: number,
  ): Behavior {
    // Exhausted → must rest
    if (needs.energy < 15) return { type: 'rest' };

    // Natural break after effort
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
      if (room.id === lastCleanedRef.current) score -= 10;
      // Favorite room bonus (personality)
      if (room.id === SOUL.favoriteRoom) score += 5;
      roomScores.push({ id: room.id, score });
    }
    roomScores.sort((a, b) => b.score - a.score);

    const top = roomScores[0];

    // Clean if needed and has energy
    if (top && top.score >= 18 && needs.energy >= 25) {
      return { type: 'clean', roomId: top.id };
    }

    // Bored → explore
    if (needs.boredom > 55 && now > wanderCooldownRef.current) {
      return { type: 'wander' };
    }

    // Curious → patrol windows
    if (now - lastWindowTripRef.current > 40 && Math.random() < SOUL.curiosity) {
      return { type: 'patrol' };
    }

    // Low energy → rest
    if (needs.energy < 35) return { type: 'rest' };

    return { type: 'idle-look' };
  }
}
