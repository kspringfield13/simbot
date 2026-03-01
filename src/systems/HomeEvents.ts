import type { HomeEvent, HomeEventType, HomeEventHistoryEntry, RobotId, RoomId } from '../types';

// ── Event Configuration ──────────────────────────────────

export interface HomeEventConfig {
  type: HomeEventType;
  label: string;
  emoji: string;
  targetRooms: RoomId[];
  cleanlinessImpact: number;   // how much cleanliness drops on affected room
  tidinessImpact: number;
  fixDuration: number;          // sim-minutes of work to resolve
  detectionThoughts: Record<RobotId, string[]>;
  responseThoughts: Record<RobotId, string[]>;
  resolutionThoughts: Record<RobotId, string[]>;
  bannerText: (roomName: string) => string;
}

export const HOME_EVENT_CONFIGS: Record<HomeEventType, HomeEventConfig> = {
  'plumbing-leak': {
    type: 'plumbing-leak',
    label: 'Plumbing Leak',
    emoji: '🚰',
    targetRooms: ['bathroom', 'kitchen'],
    cleanlinessImpact: -25,
    tidinessImpact: -15,
    fixDuration: 18,
    detectionThoughts: {
      sim: [
        'Wait... is that water on the floor?! We have a leak!',
        'Oh no, there\'s water everywhere! Quick, I need to fix this!',
      ],
      chef: [
        'Water on the floor! This is NOT part of the recipe!',
        'Leak detected. This kitchen runs a tight ship — fixing now.',
      ],
      sparkle: [
        'WATER?! On MY clean floors?! Emergency mode activated!',
        'A leak! My pristine surfaces are being violated!',
      ],
    },
    responseThoughts: {
      sim: [
        'Rushing to help with the leak! Teamwork makes the dream work.',
        'On my way to help! Can\'t let the water spread.',
      ],
      chef: [
        'Moving to contain the water damage. Precision response.',
        'Heading to assist. Water and electricity don\'t mix.',
      ],
      sparkle: [
        'Racing to the leak! Every second means more water stains!',
        'Must. Stop. The water. Before it ruins EVERYTHING.',
      ],
    },
    resolutionThoughts: {
      sim: [
        'Leak fixed! Phew, that was a close one. Time to mop up.',
        'All patched up! The floor is drying nicely.',
      ],
      chef: [
        'Pipe secured. Crisis averted. Back to business.',
        'Leak contained and repaired. Efficient response.',
      ],
      sparkle: [
        'Leak FIXED. Now begins the REAL work — drying every last drop.',
        'Crisis resolved. But I won\'t rest until every water mark is gone.',
      ],
    },
    bannerText: (room) => `PLUMBING LEAK IN ${room.toUpperCase()}`,
  },

  'power-outage': {
    type: 'power-outage',
    label: 'Power Outage',
    emoji: '⚡',
    targetRooms: ['living-room', 'kitchen', 'bedroom', 'bathroom', 'hallway', 'laundry'],
    cleanlinessImpact: -5,
    tidinessImpact: -10,
    fixDuration: 14,
    detectionThoughts: {
      sim: [
        'The lights just went out! Don\'t panic — I\'ve got my flashlight.',
        'Power outage! Stay calm, I\'ll find the breaker.',
      ],
      chef: [
        'Darkness. The oven is down. I need to restore power immediately.',
        'Power failure. Switching to flashlight mode. Heading to the breaker.',
      ],
      sparkle: [
        'I can\'t see dirt in the dark! Must restore power NOW!',
        'Lights out?! Flashlight on. Heading to fix this.',
      ],
    },
    responseThoughts: {
      sim: [
        'Flashlight mode engaged! Heading to the breaker panel.',
        'Navigating by flashlight. I can do this!',
      ],
      chef: [
        'Following emergency protocol. Flashlight active.',
        'Moving to the breaker. The kitchen needs power.',
      ],
      sparkle: [
        'Flashlight on max. Can\'t let dust accumulate unseen!',
        'Operating in emergency lighting. Must restore power.',
      ],
    },
    resolutionThoughts: {
      sim: [
        'Power restored! Let there be light! ...Still love saying that.',
        'Breaker flipped! Everything\'s back online.',
      ],
      chef: [
        'Power restored. Oven status: operational. Crisis managed.',
        'Electricity flowing again. Back to peak performance.',
      ],
      sparkle: [
        'LIGHTS ON! Now I can see every speck of dust again. Bliss.',
        'Power back! My UV sanitizer needs electricity, you know.',
      ],
    },
    bannerText: (_room) => 'POWER OUTAGE — LIGHTS OUT!',
  },

  'pest-invasion': {
    type: 'pest-invasion',
    label: 'Pest Invasion',
    emoji: '🐛',
    targetRooms: ['kitchen', 'living-room', 'laundry', 'bedroom'],
    cleanlinessImpact: -20,
    tidinessImpact: -20,
    fixDuration: 22,
    detectionThoughts: {
      sim: [
        'EEK! Are those bugs?! We have uninvited guests!',
        'Oh no, critters! I need to deal with this fast!',
      ],
      chef: [
        'BUGS in my workspace?! Absolutely unacceptable! Exterminating!',
        'Pest alert! The kitchen must remain sanitary. Moving to intercept.',
      ],
      sparkle: [
        'BUGS?! In THIS house?! Not on my watch! DEFCON 1!',
        'Pests detected! This is a hygiene EMERGENCY!',
      ],
    },
    responseThoughts: {
      sim: [
        'Coming to help with the bugs! Strength in numbers!',
        'On my way! Those critters don\'t stand a chance.',
      ],
      chef: [
        'Reinforcing the pest response team. No bug survives.',
        'Joining the extermination effort. Zero tolerance policy.',
      ],
      sparkle: [
        'Rushing to eliminate every last creepy-crawly!',
        'Deploying to assist! Every bug must GO!',
      ],
    },
    resolutionThoughts: {
      sim: [
        'All clear! The bugs are gone. House is safe again.',
        'Pest problem solved! Time for a thorough clean-up.',
      ],
      chef: [
        'Pests eliminated. Sanitization in progress. Kitchen secured.',
        'All clear. My domain is pest-free once again.',
      ],
      sparkle: [
        'EXTERMINATED. Every. Last. One. Now to sanitize EVERYTHING.',
        'Bugs: gone. Surfaces: about to be scrubbed within an inch of their lives.',
      ],
    },
    bannerText: (room) => `PEST INVASION IN ${room.toUpperCase()}`,
  },
};

// ── Event helpers ──────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEventConfig(type: HomeEventType): HomeEventConfig {
  return HOME_EVENT_CONFIGS[type];
}

export function createHomeEvent(type: HomeEventType, simMinutes: number): HomeEvent {
  const config = HOME_EVENT_CONFIGS[type];
  const roomId = pick(config.targetRooms);
  return {
    id: crypto.randomUUID(),
    type,
    phase: 'detection',
    roomId,
    startedAt: simMinutes,
    detectedBy: null,
    respondingRobots: [],
    resolvedAt: null,
  };
}

export function eventToHistoryEntry(event: HomeEvent): HomeEventHistoryEntry {
  return {
    id: event.id,
    type: event.type,
    roomId: event.roomId,
    startedAt: event.startedAt,
    resolvedAt: event.resolvedAt ?? event.startedAt,
    detectedBy: event.detectedBy ?? 'sim',
    respondingRobots: [...event.respondingRobots],
  };
}

export function getEventRoomName(roomId: RoomId): string {
  const names: Record<string, string> = {
    'living-room': 'Living Room',
    kitchen: 'Kitchen',
    hallway: 'Hallway',
    laundry: 'Laundry',
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
  };
  return names[roomId] ?? roomId;
}

export const EVENT_TYPES: HomeEventType[] = ['plumbing-leak', 'power-outage', 'pest-invasion'];
