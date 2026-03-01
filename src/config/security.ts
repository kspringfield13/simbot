// ── Home Security Configuration ─────────────────────────────────
import type { IntruderType, RobotId, RoomId } from '../types';
export type { IntruderType };

// ── Camera system ──────────────────────────────────────────

export type CameraZoneId = 'living-room' | 'kitchen' | 'hallway' | 'bedroom' | 'bathroom' | 'laundry';

export interface SecurityCameraConfig {
  id: CameraZoneId;
  label: string;
  position: [number, number, number]; // 3D position for scene indicator
  coverageRooms: RoomId[];            // rooms this camera monitors
}

export const SECURITY_CAMERAS: SecurityCameraConfig[] = [
  { id: 'living-room', label: 'Living Room Cam', position: [-4, 3, -18], coverageRooms: ['living-room'] },
  { id: 'kitchen',     label: 'Kitchen Cam',     position: [8, 3, -18],  coverageRooms: ['kitchen'] },
  { id: 'hallway',     label: 'Hallway Cam',     position: [2, 3, -6],   coverageRooms: ['hallway'] },
  { id: 'bedroom',     label: 'Bedroom Cam',     position: [-12, 3, 6],  coverageRooms: ['bedroom'] },
  { id: 'bathroom',    label: 'Bathroom Cam',     position: [10, 3, 6],   coverageRooms: ['bathroom'] },
  { id: 'laundry',     label: 'Laundry Cam',     position: [-4, 3, 6],   coverageRooms: ['laundry'] },
];

export const CAMERA_IDS: CameraZoneId[] = SECURITY_CAMERAS.map((c) => c.id);

// ── Alarm system ──────────────────────────────────────────

export type AlarmState = 'disarmed' | 'armed-away' | 'armed-home' | 'triggered';

export interface AlarmConfig {
  triggerDelay: number;       // sim-minutes before alarm triggers after detection
  autoArmAtNight: boolean;    // auto-arms when sim enters night period
  sirenDuration: number;      // sim-minutes siren sounds before auto-reset
}

export const DEFAULT_ALARM_CONFIG: AlarmConfig = {
  triggerDelay: 1,
  autoArmAtNight: true,
  sirenDuration: 10,
};

// ── Robot patrol ──────────────────────────────────────────

export const PATROL_ROUTE: RoomId[] = [
  'hallway', 'living-room', 'kitchen', 'hallway', 'bedroom', 'bathroom', 'laundry', 'hallway',
];

export const PATROL_WAIT_PER_ROOM = 3; // sim-minutes spent checking each room
export const PATROL_START_HOUR = 22;   // 10 PM
export const PATROL_END_HOUR = 6;      // 6 AM

// ── Intruder events ──────────────────────────────────────────

export interface IntruderConfig {
  type: IntruderType;
  label: string;
  emoji: string;
  stealthLevel: number;       // 0-1, higher = harder to detect (affects camera miss chance)
  targetRooms: RoomId[];
  tidinessImpact: number;     // negative = damage
  cleanlinessImpact: number;
  fleeTime: number;           // sim-minutes intruder stays before fleeing on own
  detectionThoughts: Record<RobotId, string[]>;
  responseThoughts: Record<RobotId, string[]>;
  resolvedThoughts: Record<RobotId, string[]>;
}

export const INTRUDER_CONFIGS: Record<IntruderType, IntruderConfig> = {
  burglar: {
    type: 'burglar',
    label: 'Burglar',
    emoji: '🥷',
    stealthLevel: 0.6,
    targetRooms: ['living-room', 'bedroom', 'kitchen'],
    tidinessImpact: -20,
    cleanlinessImpact: -10,
    fleeTime: 12,
    detectionThoughts: {
      sim: [
        'INTRUDER ALERT! Someone just broke a window!',
        'I hear suspicious noises... there\'s someone in the house!',
      ],
      chef: [
        'Unauthorized individual detected. Initiating security protocol.',
        'My sensors are picking up an intruder! Nobody steals from this kitchen.',
      ],
      sparkle: [
        'INTRUDER! They\'re getting FOOTPRINTS on my clean floors!',
        'Someone broke in! My pristine home is being VIOLATED!',
      ],
    },
    responseThoughts: {
      sim: ['Racing to confront the intruder! Be brave, be brave...', 'Heading to intercept — they won\'t get away!'],
      chef: ['Moving to engage. Calculated response.', 'Converging on intruder position. Stay alert.'],
      sparkle: ['Charging toward the intruder! Nobody messes with this house!', 'Incoming! Prepare to be APPREHENDED!'],
    },
    resolvedThoughts: {
      sim: ['Intruder scared off! The house is safe again.', 'All clear! They ran when they saw all three of us.'],
      chef: ['Threat neutralized. Perimeter secured.', 'Intruder has fled. Running damage assessment.'],
      sparkle: ['GET OUT AND STAY OUT! ...Now to clean up their mess.', 'Security threat eliminated. Time to sanitize where they walked.'],
    },
  },

  raccoon: {
    type: 'raccoon',
    label: 'Raccoon',
    emoji: '🦝',
    stealthLevel: 0.3,
    targetRooms: ['kitchen', 'laundry'],
    tidinessImpact: -15,
    cleanlinessImpact: -18,
    fleeTime: 8,
    detectionThoughts: {
      sim: ['A raccoon got inside! It\'s raiding the kitchen!', 'Oh no, a trash panda! Cute but destructive!'],
      chef: ['A RACCOON in MY kitchen?! This is a code red!', 'Vermin in the pantry! Initiating pest removal.'],
      sparkle: ['A raccoon! It\'s making a MESS everywhere!', 'Furry intruder detected! My clean floors!'],
    },
    responseThoughts: {
      sim: ['Trying to shoo the raccoon out gently...', 'Here, little guy, the door is this way!'],
      chef: ['Herding the raccoon toward the exit. Methodically.', 'Cornering the pest. It won\'t escape with my food.'],
      sparkle: ['Get that trash goblin OUT before it ruins everything!', 'Chasing the raccoon with a broom! HYAH!'],
    },
    resolvedThoughts: {
      sim: ['The raccoon waddled away! Phew, what a mess though.', 'Bye bye, little raccoon. Let\'s lock that pet door.'],
      chef: ['Pest removed. Inventorying food damage now.', 'Raccoon evicted. Kitchen will need a deep clean.'],
      sparkle: ['Raccoon is GONE. The mess it left is NOT. Time to scrub.', 'Finally! Now to undo the furry chaos.'],
    },
  },

  prankster: {
    type: 'prankster',
    label: 'Prankster',
    emoji: '🎭',
    stealthLevel: 0.4,
    targetRooms: ['living-room', 'hallway', 'bedroom'],
    tidinessImpact: -12,
    cleanlinessImpact: -5,
    fleeTime: 6,
    detectionThoughts: {
      sim: ['Someone TP\'d the living room?! Who does that?!', 'I see a shadowy figure... is someone pranking us?'],
      chef: ['Childish vandalism detected. Unacceptable.', 'Prank in progress! Moving to intercept the perpetrator.'],
      sparkle: ['TOILET PAPER EVERYWHERE! This is my worst nightmare!', 'A prankster! The AUDACITY to mess up this house!'],
    },
    responseThoughts: {
      sim: ['Chasing the prankster down! No more mischief!', 'Come back here, you rascal!'],
      chef: ['Pursuing the vandal. They\'ll regret this.', 'Tracking the intruder. Nowhere to hide.'],
      sparkle: ['When I catch them, they\'re going to CLEAN all this up!', 'Running after the mess-maker! Justice will be served!'],
    },
    resolvedThoughts: {
      sim: ['Prankster chased off! What a weird night.', 'All clear. At least it was just a prank and nothing serious.'],
      chef: ['Vandal has departed. Assessing the clean-up requirements.', 'Threat was low-level. Still unacceptable. Perimeter checked.'],
      sparkle: ['Prankster is GONE but the mess is NOT. Ugh.', 'At least they\'re gone. Now... THE CLEANING BEGINS.'],
    },
  },
};

export const INTRUDER_TYPES: IntruderType[] = ['burglar', 'raccoon', 'prankster'];

// Intruder frequency: one attempt every 90-180 sim-minutes, but ONLY at night
export const INTRUDER_MIN_INTERVAL = 90;
export const INTRUDER_MAX_INTERVAL = 180;

// ── Security log entries ──────────────────────────────────

export interface SecurityLogEntry {
  id: string;
  simMinutes: number;
  type: 'camera-motion' | 'alarm-trigger' | 'alarm-arm' | 'alarm-disarm' | 'patrol-check' | 'intruder-detected' | 'intruder-resolved';
  message: string;
  roomId?: RoomId;
}

// ── Persistence ──────────────────────────────────────────

export const SECURITY_STORAGE_KEY = 'simbot-security';

export interface SecurityStorageData {
  installedCameras: CameraZoneId[];
  alarmState: AlarmState;
  patrolEnabled: boolean;
  intruderHistory: { type: IntruderType; roomId: RoomId; detectedAt: number; resolvedAt: number }[];
}

export function createDefaultSecurityData(): SecurityStorageData {
  return {
    installedCameras: ['hallway', 'living-room'],
    alarmState: 'disarmed',
    patrolEnabled: false,
    intruderHistory: [],
  };
}

export function loadSecurityData(): SecurityStorageData {
  try {
    const stored = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (stored) {
      return { ...createDefaultSecurityData(), ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return createDefaultSecurityData();
}

export function saveSecurityData(data: SecurityStorageData) {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickIntruderType(): IntruderType {
  return pick(INTRUDER_TYPES);
}

export function pickIntruderRoom(type: IntruderType): RoomId {
  return pick(INTRUDER_CONFIGS[type].targetRooms);
}
