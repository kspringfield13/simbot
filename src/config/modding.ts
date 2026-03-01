import type { BehaviorMod, SkinMod, RobotId } from '../types';

// ── Example / Template Mods ──────────────────────────────────

export const EXAMPLE_BEHAVIOR_MODS: Omit<BehaviorMod, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Energetic Pacer',
    description: 'Robot moves faster when battery is above 80%',
    type: 'behavior',
    code: `// When battery is high, robot gets a speed boost
if (robot.battery > 80) {
  action("boost_speed", 1.5);
  say("I'm fully charged! Let's go!");
} else {
  action("boost_speed", 1.0);
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Social Butterfly',
    description: 'Robot seeks other robots when lonely',
    type: 'behavior',
    code: `// When social need is low, seek a friend
if (robot.needs.social < 30) {
  action("seek_friend");
  say("I need some company!");
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Neat Freak',
    description: 'Robot prioritizes the dirtiest room',
    type: 'behavior',
    code: `// Always clean the worst room first
action("prioritize_dirty_room");
say("I can't stand the mess!");`,
    targetRobot: 'all',
    enabled: false,
  },
];

export const EXAMPLE_SKIN_MODS: Omit<SkinMod, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Neon Racer',
    description: 'Electric blue with neon glow trail',
    type: 'skin',
    bodyColor: '#0066ff',
    accentColor: '#00ffcc',
    glowColor: '#00ffff',
    accessories: [
      { type: 'trail', color: '#00ffff' },
      { type: 'antenna', color: '#00ffcc' },
    ],
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Golden Knight',
    description: 'Gold armor with a shield',
    type: 'skin',
    bodyColor: '#ffd700',
    accentColor: '#ff8c00',
    glowColor: '#ffaa00',
    accessories: [
      { type: 'shield', color: '#ffd700' },
      { type: 'hat', color: '#ff8c00' },
    ],
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Stealth Bot',
    description: 'Dark matte with red eyes',
    type: 'skin',
    bodyColor: '#1a1a2e',
    accentColor: '#e94560',
    glowColor: '#e94560',
    accessories: [
      { type: 'antenna', color: '#e94560' },
    ],
    targetRobot: 'all',
    enabled: false,
  },
];

// ── Behavior DSL Sandbox ──────────────────────────────────

// Blocked patterns that could be dangerous
const BLOCKED_PATTERNS = [
  /\beval\b/,
  /\bFunction\b/,
  /\bimport\b/,
  /\brequire\b/,
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\bglobalThis\b/,
  /\bprocess\b/,
  /\b__proto__\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bwhile\s*\(/,         // prevent infinite loops
  /\bfor\s*\(\s*;\s*;\s*\)/, // prevent infinite for loops
];

export interface BehaviorContext {
  robot: {
    id: RobotId;
    battery: number;
    mood: string;
    state: string;
    needs: { energy: number; happiness: number; social: number; boredom: number };
  };
}

export interface BehaviorResult {
  actions: { type: string; value?: number | string }[];
  messages: string[];
  error?: string;
}

/** Validate mod code before execution */
export function validateModCode(code: string): { valid: boolean; error?: string } {
  if (!code.trim()) {
    return { valid: false, error: 'Code cannot be empty' };
  }
  if (code.length > 2000) {
    return { valid: false, error: 'Code too long (max 2000 characters)' };
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return { valid: false, error: `Blocked pattern detected: ${pattern.source}` };
    }
  }
  // Try to parse as valid JS
  try {
    // eslint-disable-next-line no-new
    new (Function as FunctionConstructor)('robot', 'action', 'say', code);
  } catch (e) {
    return { valid: false, error: `Syntax error: ${(e as Error).message}` };
  }
  return { valid: true };
}

/** Execute behavior mod code in a restricted sandbox */
export function executeBehaviorMod(
  code: string,
  context: BehaviorContext,
): BehaviorResult {
  const result: BehaviorResult = { actions: [], messages: [] };

  const validation = validateModCode(code);
  if (!validation.valid) {
    return { ...result, error: validation.error };
  }

  // Create frozen copies so mod code can't mutate state
  const robotProxy = Object.freeze({
    id: context.robot.id,
    battery: context.robot.battery,
    mood: context.robot.mood,
    state: context.robot.state,
    needs: Object.freeze({ ...context.robot.needs }),
  });

  const actionFn = (type: string, value?: number | string) => {
    if (result.actions.length < 10) { // cap actions per execution
      result.actions.push({ type, value });
    }
  };

  const sayFn = (message: string) => {
    if (result.messages.length < 5) { // cap messages
      result.messages.push(String(message).slice(0, 200));
    }
  };

  try {
    const fn = new (Function as FunctionConstructor)(
      'robot', 'action', 'say',
      `"use strict";\n${code}`,
    );
    fn(robotProxy, actionFn, sayFn);
  } catch (e) {
    result.error = `Runtime error: ${(e as Error).message}`;
  }

  return result;
}

// ── Accessory Catalog ──────────────────────────────────

export const ACCESSORY_CATALOG: { type: string; label: string; emoji: string }[] = [
  { type: 'hat', label: 'Hat', emoji: '🎩' },
  { type: 'antenna', label: 'Antenna', emoji: '📡' },
  { type: 'shield', label: 'Shield', emoji: '🛡️' },
  { type: 'trail', label: 'Trail', emoji: '✨' },
];
