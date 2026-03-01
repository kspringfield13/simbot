import type { BehaviorMod, SkinMod, SkinPattern, RobotId, BehaviorHook } from '../types';

// ── Skin Patterns ──────────────────────────────────────────

export const SKIN_PATTERNS: { value: SkinPattern; label: string; desc: string }[] = [
  { value: 'solid', label: 'Solid', desc: 'Clean single-color finish' },
  { value: 'stripes', label: 'Stripes', desc: 'Horizontal racing stripes' },
  { value: 'dots', label: 'Dots', desc: 'Polka dot pattern' },
  { value: 'camo', label: 'Camo', desc: 'Military camouflage' },
  { value: 'gradient', label: 'Gradient', desc: 'Smooth color fade' },
  { value: 'circuit', label: 'Circuit', desc: 'Circuit board traces' },
  { value: 'chevron', label: 'Chevron', desc: 'V-shaped chevron bands' },
  { value: 'diamond', label: 'Diamond', desc: 'Diamond grid overlay' },
];

// ── Example / Template Mods ──────────────────────────────────

export const EXAMPLE_BEHAVIOR_MODS: Omit<BehaviorMod, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Lazy Robot',
    description: 'Takes extra breaks between tasks to relax',
    type: 'behavior',
    hook: 'onTask',
    code: `// After finishing a task, take a break
if (robot.state === "idle") {
  action("pause", 3);
  say("Just need a quick breather...");
}
if (robot.needs.energy < 60) {
  action("rest");
  say("I deserve a break!");
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Speedster',
    description: 'Moves at 2x speed and rushes through tasks',
    type: 'behavior',
    hook: 'onTask',
    code: `// Double speed for everything
action("set_speed", 2);
say("Gotta go fast!");
if (robot.state === "working") {
  action("rush_task");
  say("Zoom zoom zoom!");
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Dance Break',
    description: 'Robot randomly breaks into a dance when idle',
    type: 'behavior',
    hook: 'onIdle',
    code: `// Random chance to dance when idle
if (Math.random() < 0.3) {
  action("dance", "shuffle");
  say("Time for a dance break!");
} else if (Math.random() < 0.2) {
  action("dance", "spin");
  say("Can't stop the groove!");
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Perfectionist',
    description: 'Robot only leaves a room when it is 100% clean',
    type: 'behavior',
    hook: 'onTask',
    code: `// Stay in room until perfectly clean
if (robot.state === "working") {
  action("set_threshold", 100);
  say("Not leaving until it sparkles!");
}`,
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Social Butterfly',
    description: 'Prioritizes rooms where other robots are working',
    type: 'behavior',
    hook: 'onEvent',
    code: `// Seek rooms with other robots for company
action("prefer_occupied_rooms");
if (robot.needs.social < 40) {
  action("seek_friend");
  say("Let's work together!");
}`,
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
    pattern: 'stripes',
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
    pattern: 'diamond',
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
    pattern: 'camo',
    accessories: [
      { type: 'antenna', color: '#e94560' },
    ],
    targetRobot: 'all',
    enabled: false,
  },
  {
    name: 'Circuit Master',
    description: 'Tech-themed with circuit board pattern',
    type: 'skin',
    bodyColor: '#0d3b0d',
    accentColor: '#00ff41',
    glowColor: '#00ff41',
    pattern: 'circuit',
    accessories: [
      { type: 'antenna', color: '#00ff41' },
      { type: 'trail', color: '#00ff41' },
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
  hook: BehaviorHook;
  event?: string;  // populated for onEvent hooks
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
