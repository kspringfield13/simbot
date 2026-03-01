import type { RoomId, TaskType, RobotId } from '../types';

export type VoiceCommandType =
  | 'clean_room'
  | 'send_to_room'
  | 'status_query'
  | 'pause'
  | 'resume'
  | 'speed_up'
  | 'slow_down'
  | 'switch_robot'
  | 'open_panel'
  | 'close_panel'
  | 'mute'
  | 'unmute'
  | 'help'
  | 'greet'
  | 'unknown';

export interface VoiceCommand {
  type: VoiceCommandType;
  room?: RoomId;
  taskType?: TaskType;
  robotId?: RobotId;
  panel?: string;
  raw: string;
}

const ROOM_KEYWORDS: Record<string, RoomId> = {
  kitchen: 'kitchen',
  'living room': 'living-room',
  'living-room': 'living-room',
  living: 'living-room',
  lounge: 'living-room',
  hallway: 'hallway',
  hall: 'hallway',
  corridor: 'hallway',
  laundry: 'laundry',
  'laundry room': 'laundry',
  bedroom: 'bedroom',
  'bed room': 'bedroom',
  bathroom: 'bathroom',
  'bath room': 'bathroom',
  bath: 'bathroom',
  yard: 'yard',
  garden: 'yard',
  outside: 'yard',
  outdoor: 'yard',
  porch: 'yard',
  lawn: 'yard',
};

const TASK_KEYWORDS: Record<string, TaskType> = {
  clean: 'cleaning',
  vacuum: 'vacuuming',
  hoover: 'vacuuming',
  sweep: 'sweeping',
  mop: 'cleaning',
  scrub: 'scrubbing',
  wash: 'dishes',
  dishes: 'dishes',
  cook: 'cooking',
  cooking: 'cooking',
  laundry: 'laundry',
  organize: 'organizing',
  tidy: 'organizing',
  'make bed': 'bed-making',
  'make the bed': 'bed-making',
  mow: 'mowing',
  'mow the lawn': 'mowing',
  water: 'watering',
  'water plants': 'watering',
  weed: 'weeding',
  'pull weeds': 'weeding',
  'leaf blow': 'leaf-blowing',
  rake: 'leaf-blowing',
};

const ROBOT_KEYWORDS: Record<string, RobotId> = {
  sim: 'sim',
  simbot: 'sim',
  chef: 'chef',
  sparkle: 'sparkle',
};

const PANEL_KEYWORDS: Record<string, string> = {
  shop: 'shop',
  store: 'shop',
  diary: 'diary',
  journal: 'diary',
  leaderboard: 'leaderboard',
  scores: 'leaderboard',
  personality: 'personality',
  crafting: 'crafting',
  workshop: 'crafting',
  devices: 'devices',
  'smart home': 'devices',
  schedule: 'schedule',
};

function extractRoom(text: string): RoomId | undefined {
  // Check multi-word keys first (longer matches take priority)
  const sorted = Object.entries(ROOM_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, roomId] of sorted) {
    if (text.includes(keyword)) return roomId;
  }
  return undefined;
}

function extractTask(text: string): TaskType | undefined {
  const sorted = Object.entries(TASK_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, taskType] of sorted) {
    if (text.includes(keyword)) return taskType;
  }
  return undefined;
}

function extractRobot(text: string): RobotId | undefined {
  for (const [keyword, robotId] of Object.entries(ROBOT_KEYWORDS)) {
    if (text.includes(keyword)) return robotId;
  }
  return undefined;
}

function extractPanel(text: string): string | undefined {
  const sorted = Object.entries(PANEL_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, panel] of sorted) {
    if (text.includes(keyword)) return panel;
  }
  return undefined;
}

export function parseVoiceCommand(raw: string): VoiceCommand {
  const text = raw.toLowerCase().trim();

  // Pause / resume
  if (text.match(/\b(pause|stop|freeze|halt)\b/) && !text.includes('listening')) {
    return { type: 'pause', raw };
  }
  if (text.match(/\b(resume|unpause|play|continue|start)\b/) && !text.includes('listening')) {
    return { type: 'resume', raw };
  }

  // Speed control
  if (text.match(/\b(speed up|faster|fast forward|double speed)\b/)) {
    return { type: 'speed_up', raw };
  }
  if (text.match(/\b(slow down|slower|normal speed)\b/)) {
    return { type: 'slow_down', raw };
  }

  // Mute / unmute
  if (text.match(/\b(mute|silence|quiet)\b/)) {
    return { type: 'mute', raw };
  }
  if (text.match(/\b(unmute|sound on|volume)\b/)) {
    return { type: 'unmute', raw };
  }

  // Status queries
  if (text.match(/\b(status|how clean|cleanliness|how('s| is) the (house|home)|report)\b/)) {
    return { type: 'status_query', room: extractRoom(text), raw };
  }
  if (text.match(/\b(what.*(doing|up to)|where.*(robot|you|sim|chef|sparkle))\b/)) {
    return { type: 'status_query', raw };
  }

  // Switch robot
  if (text.match(/\b(switch|change|select)\b.*\b(robot|to)\b/)) {
    const robot = extractRobot(text);
    if (robot) return { type: 'switch_robot', robotId: robot, raw };
  }

  // Open / close panels
  if (text.match(/\b(open|show|display)\b/)) {
    const panel = extractPanel(text);
    if (panel) return { type: 'open_panel', panel, raw };
  }
  if (text.match(/\b(close|hide)\b/)) {
    const panel = extractPanel(text);
    if (panel) return { type: 'close_panel', panel, raw };
  }

  // Clean room commands — "clean the kitchen", "vacuum the bedroom"
  const task = extractTask(text);
  const room = extractRoom(text);
  if (task && room) {
    return { type: 'clean_room', room, taskType: task, raw };
  }
  if (text.match(/\b(clean|tidy|vacuum|sweep|scrub|mop|wash|organize)\b/) && room) {
    return { type: 'clean_room', room, taskType: task || 'cleaning', raw };
  }

  // Send robot to room — "go to kitchen", "send robot to bedroom"
  if (text.match(/\b(go to|head to|move to|send.*to|check the|visit)\b/) && room) {
    return { type: 'send_to_room', room, raw };
  }
  // Just a room name with cleaning intent
  if (room && text.match(/\b(clean|needs|dirty|messy)\b/)) {
    return { type: 'clean_room', room, taskType: 'cleaning', raw };
  }

  // Greet
  if (text.match(/^(hi|hello|hey|sup|yo|howdy)/)) {
    return { type: 'greet', raw };
  }

  // Help
  if (text.match(/\b(help|what can you do|commands)\b/)) {
    return { type: 'help', raw };
  }

  return { type: 'unknown', raw };
}

export const ROOM_CENTERS: Record<RoomId, [number, number, number]> = {
  kitchen: [-5, 0, -4],
  'living-room': [5, 0, -4],
  hallway: [0, 0, -1],
  laundry: [-5, 0, 3],
  bedroom: [5, 0, 3],
  bathroom: [0, 0, 3],
  yard: [0, 0, 24],
};

export const ROOM_DISPLAY_NAMES: Record<RoomId, string> = {
  'living-room': 'living room',
  kitchen: 'kitchen',
  hallway: 'hallway',
  laundry: 'laundry room',
  bedroom: 'bedroom',
  bathroom: 'bathroom',
  yard: 'yard',
};
