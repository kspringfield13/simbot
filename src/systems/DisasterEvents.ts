import type { Disaster, DisasterType, DisasterHistoryEntry, RobotId, RoomId } from '../types';

// ── Disaster Configuration ──────────────────────────────────

export interface DisasterConfig {
  type: DisasterType;
  label: string;
  emoji: string;
  targetRooms: RoomId[];
  cleanlinessImpact: Record<number, number>;   // severity → cleanliness penalty
  tidinessImpact: Record<number, number>;       // severity → tidiness penalty
  escalateAfterMinutes: number;                 // sim-minutes before severity increases
  progressPerRobot: number;                     // progress per tick per responding robot
  detectionThoughts: Record<RobotId, string[]>;
  responseThoughts: Record<RobotId, string[]>;
  resolutionThoughts: Record<RobotId, string[]>;
  bannerText: (roomName: string, severity: number) => string;
  severityLabels: Record<number, string>;
}

export const DISASTER_CONFIGS: Record<DisasterType, DisasterConfig> = {
  fire: {
    type: 'fire',
    label: 'Fire',
    emoji: '🔥',
    targetRooms: ['kitchen', 'living-room', 'laundry'],
    cleanlinessImpact: { 1: -20, 2: -40, 3: -60 },
    tidinessImpact: { 1: -15, 2: -30, 3: -50 },
    escalateAfterMinutes: 8,
    progressPerRobot: 3.5,
    detectionThoughts: {
      sim: [
        'FIRE! I smell smoke! Emergency protocols activated!',
        'Oh no — flames! Quick, grab the extinguisher!',
      ],
      chef: [
        'FIRE IN THE KITCHEN! This is NOT a flambé! Emergency response!',
        'Smoke alarm triggered! Deploying fire suppression immediately!',
      ],
      sparkle: [
        'FIRE?! The soot! The ASH! Must extinguish NOW!',
        'Flames detected! My pristine surfaces are in DANGER!',
      ],
    },
    responseThoughts: {
      sim: [
        'Rushing to help fight the fire! We can do this together!',
        'Grabbing the extinguisher — every second counts!',
      ],
      chef: [
        'Moving to contain the blaze. Fire safety protocol engaged.',
        'Reinforcing fire response. Kitchen fires are MY specialty.',
      ],
      sparkle: [
        'Racing to fight the fire! The cleanup afterward will be EPIC.',
        'Fire suppression mode! Must save the surfaces!',
      ],
    },
    resolutionThoughts: {
      sim: [
        'Fire is OUT! Phew! That was intense. Everyone okay?',
        'Flames extinguished! Time for recovery and cleanup.',
      ],
      chef: [
        'Fire contained and extinguished. Damage assessment: manageable.',
        'Blaze eliminated. Resuming normal operations after cleanup.',
      ],
      sparkle: [
        'Fire OUT! Now begins the REAL battle — soot removal!',
        'Extinguished! But the smoke stains... this will take hours.',
      ],
    },
    bannerText: (room, severity) =>
      severity >= 3
        ? `INFERNO IN ${room.toUpperCase()} — CRITICAL!`
        : severity >= 2
          ? `FIRE SPREADING IN ${room.toUpperCase()}!`
          : `FIRE DETECTED IN ${room.toUpperCase()}`,
    severityLabels: { 1: 'Small Fire', 2: 'Growing Fire', 3: 'Inferno' },
  },

  flood: {
    type: 'flood',
    label: 'Flood',
    emoji: '🌊',
    targetRooms: ['bathroom', 'kitchen', 'laundry'],
    cleanlinessImpact: { 1: -25, 2: -45, 3: -65 },
    tidinessImpact: { 1: -20, 2: -35, 3: -55 },
    escalateAfterMinutes: 10,
    progressPerRobot: 3.0,
    detectionThoughts: {
      sim: [
        'Water everywhere! The floor is flooding! Emergency!',
        'A pipe burst! Water is rising fast — need to act NOW!',
      ],
      chef: [
        'FLOODING! Water on the floor — electronics at risk!',
        'Major water breach detected. Initiating emergency drainage!',
      ],
      sparkle: [
        'WATER?! On MY floors?! This is a CATASTROPHE!',
        'Flood alert! The water damage will be devastating!',
      ],
    },
    responseThoughts: {
      sim: [
        'On my way with towels and buckets! We\'ll stop this flood!',
        'Rushing to help — need to stop the water source!',
      ],
      chef: [
        'Moving to contain the water. Precision mopping engaged.',
        'Joining flood response. Must protect the appliances.',
      ],
      sparkle: [
        'Deploying MAXIMUM absorption! Not one drop gets away!',
        'Racing to mop! Every second means more water damage!',
      ],
    },
    resolutionThoughts: {
      sim: [
        'Flood contained! The water is receding. Great teamwork!',
        'All dried up! That was a close one.',
      ],
      chef: [
        'Water breach sealed. Drying operations complete.',
        'Flood resolved. All systems nominal. Back to cooking.',
      ],
      sparkle: [
        'Flood MOPPED! But the water stains... round two begins NOW.',
        'Dry at last! Now I need to sanitize everything the water touched.',
      ],
    },
    bannerText: (room, severity) =>
      severity >= 3
        ? `${room.toUpperCase()} SUBMERGED — EMERGENCY!`
        : severity >= 2
          ? `FLOOD RISING IN ${room.toUpperCase()}!`
          : `WATER LEAK IN ${room.toUpperCase()}`,
    severityLabels: { 1: 'Water Leak', 2: 'Rising Water', 3: 'Submerged' },
  },

  earthquake: {
    type: 'earthquake',
    label: 'Earthquake',
    emoji: '🏚️',
    targetRooms: ['living-room', 'kitchen', 'bedroom', 'bathroom', 'hallway', 'laundry'],
    cleanlinessImpact: { 1: -15, 2: -30, 3: -50 },
    tidinessImpact: { 1: -30, 2: -50, 3: -70 },
    escalateAfterMinutes: 6,
    progressPerRobot: 4.0,
    detectionThoughts: {
      sim: [
        'The ground is SHAKING! Earthquake! Take cover!',
        'Everything is rattling! Earthquake alert!',
      ],
      chef: [
        'Seismic activity! Securing the kitchen equipment NOW!',
        'EARTHQUAKE! Fragile items at risk! Emergency stabilization!',
      ],
      sparkle: [
        'Everything is FALLING! My carefully organized shelves! NOOO!',
        'Earthquake! Things are crashing everywhere! Must secure items!',
      ],
    },
    responseThoughts: {
      sim: [
        'Heading to help secure the house! Stay safe everyone!',
        'Rushing to catch falling items and check for damage!',
      ],
      chef: [
        'Moving to secure breakables. Systematic damage prevention.',
        'Reinforcing response. Structural integrity is priority one.',
      ],
      sparkle: [
        'Must pick up EVERYTHING! The chaos is UNBEARABLE!',
        'Racing to re-organize! Every fallen item hurts my soul!',
      ],
    },
    resolutionThoughts: {
      sim: [
        'Shaking stopped! All clear — time to pick up the pieces.',
        'Earthquake over! Let\'s make sure everyone is okay.',
      ],
      chef: [
        'Tremors ceased. Damage assessment: repairable. Resuming duties.',
        'Seismic event concluded. All equipment secured and operational.',
      ],
      sparkle: [
        'It stopped! Now for the BIGGEST cleanup of my LIFE.',
        'Quake done. The mess level is... *recalibrating sensors*... catastrophic.',
      ],
    },
    bannerText: (room, severity) =>
      severity >= 3
        ? 'MAJOR EARTHQUAKE — HOUSE SHAKING!'
        : severity >= 2
          ? 'EARTHQUAKE — THINGS ARE FALLING!'
          : `TREMORS DETECTED IN ${room.toUpperCase()}`,
    severityLabels: { 1: 'Tremors', 2: 'Moderate Quake', 3: 'Major Earthquake' },
  },
};

// ── Helpers ──────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getDisasterConfig(type: DisasterType): DisasterConfig {
  return DISASTER_CONFIGS[type];
}

export function createDisaster(type: DisasterType, simMinutes: number): Disaster {
  const config = DISASTER_CONFIGS[type];
  const roomId = pick(config.targetRooms);
  return {
    id: crypto.randomUUID(),
    type,
    phase: 'detection',
    roomId,
    severity: 1,
    progress: 0,
    startedAt: simMinutes,
    detectedBy: null,
    respondingRobots: [],
    resolvedAt: null,
  };
}

export function disasterToHistoryEntry(disaster: Disaster, maxSeverity: number): DisasterHistoryEntry {
  return {
    id: disaster.id,
    type: disaster.type,
    roomId: disaster.roomId,
    maxSeverity,
    startedAt: disaster.startedAt,
    resolvedAt: disaster.resolvedAt ?? disaster.startedAt,
    detectedBy: disaster.detectedBy ?? 'sim',
    respondingRobots: [...disaster.respondingRobots],
  };
}

export const DISASTER_TYPES: DisasterType[] = ['fire', 'flood', 'earthquake'];

export function getDisasterRoomName(roomId: RoomId): string {
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
