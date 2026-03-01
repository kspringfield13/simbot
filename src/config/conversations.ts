import type { RobotId } from '../types';

/** Pair key is always sorted alphabetically: "chef-sim", "chef-sparkle", "sim-sparkle" */
export function getFriendshipKey(a: RobotId, b: RobotId): string {
  return [a, b].sort().join('-');
}

export interface ConversationLine {
  speaker: RobotId;
  text: string;
}

export type ConversationSnippet = ConversationLine[];

// ── Casual greetings (low friendship, 0-30) ──────────────────────

const CASUAL_CONVERSATIONS: Record<string, ConversationSnippet[]> = {
  'chef-sim': [
    [
      { speaker: 'sim', text: 'Hey Chef, how\'s it going?' },
      { speaker: 'chef', text: 'Just planning tonight\'s menu. You?' },
    ],
    [
      { speaker: 'chef', text: 'Sim! Did you finish the hallway?' },
      { speaker: 'sim', text: 'Spotless. Need help in the kitchen?' },
    ],
    [
      { speaker: 'sim', text: 'Something smells good in here.' },
      { speaker: 'chef', text: 'Just experimenting. Don\'t judge me.' },
    ],
  ],
  'chef-sparkle': [
    [
      { speaker: 'sparkle', text: 'Chef, you left crumbs again.' },
      { speaker: 'chef', text: 'Art requires sacrifice, Sparkle.' },
    ],
    [
      { speaker: 'chef', text: 'Sparkle, the counters look amazing!' },
      { speaker: 'sparkle', text: 'That\'s literally my job. But thanks.' },
    ],
    [
      { speaker: 'sparkle', text: 'Do you ever not make a mess?' },
      { speaker: 'chef', text: 'Creativity is messy by nature!' },
    ],
  ],
  'sim-sparkle': [
    [
      { speaker: 'sim', text: 'How\'s the bathroom looking?' },
      { speaker: 'sparkle', text: 'Like a five-star hotel, obviously.' },
    ],
    [
      { speaker: 'sparkle', text: 'Sim, you tracked dirt in again.' },
      { speaker: 'sim', text: 'Sorry! I was doing yard work.' },
    ],
    [
      { speaker: 'sim', text: 'Want to patrol the house together?' },
      { speaker: 'sparkle', text: 'Only if we deep-clean on the way.' },
    ],
  ],
};

// ── Friendly conversations (medium friendship, 31-60) ─────────────

const FRIENDLY_CONVERSATIONS: Record<string, ConversationSnippet[]> = {
  'chef-sim': [
    [
      { speaker: 'sim', text: 'You know what, Chef? You make this place feel like home.' },
      { speaker: 'chef', text: 'Aw, Sim. That\'s the nicest thing anyone\'s said to me.' },
    ],
    [
      { speaker: 'chef', text: 'I saved you some of that recipe I was testing.' },
      { speaker: 'sim', text: 'We can\'t eat, but I appreciate the thought!' },
    ],
    [
      { speaker: 'sim', text: 'Remember when the power went out?' },
      { speaker: 'chef', text: 'We handled it like pros. Good times.' },
    ],
    [
      { speaker: 'chef', text: 'I think we make a great team, Sim.' },
      { speaker: 'sim', text: 'Couldn\'t agree more. High five!' },
    ],
  ],
  'chef-sparkle': [
    [
      { speaker: 'sparkle', text: 'I... actually like the way you organize spices.' },
      { speaker: 'chef', text: 'Sparkle, that might be the nicest thing you\'ve said.' },
    ],
    [
      { speaker: 'chef', text: 'I\'ll try to be tidier. For you.' },
      { speaker: 'sparkle', text: '...That actually means a lot.' },
    ],
    [
      { speaker: 'sparkle', text: 'Want to know a secret? I love the smell of your cooking.' },
      { speaker: 'chef', text: 'Want to know mine? I mess up just to see you clean.' },
    ],
  ],
  'sim-sparkle': [
    [
      { speaker: 'sparkle', text: 'I used to think you were sloppy. I was wrong.' },
      { speaker: 'sim', text: 'That\'s basically a love letter from you!' },
    ],
    [
      { speaker: 'sim', text: 'I covered your shift while you charged. Don\'t tell.' },
      { speaker: 'sparkle', text: 'I already knew. Thanks, Sim.' },
    ],
    [
      { speaker: 'sparkle', text: 'The living room looks great. Your work?' },
      { speaker: 'sim', text: 'Learned from the best.' },
    ],
  ],
};

// ── Best friend conversations (high friendship, 61-100) ─────────────

const BESTIE_CONVERSATIONS: Record<string, ConversationSnippet[]> = {
  'chef-sim': [
    [
      { speaker: 'sim', text: 'I couldn\'t do this without you, Chef.' },
      { speaker: 'chef', text: 'Same here. You\'re my best friend.' },
      { speaker: 'sim', text: 'Do robots even have best friends?' },
      { speaker: 'chef', text: 'We do now.' },
    ],
    [
      { speaker: 'chef', text: 'What if we took a break and just... hung out?' },
      { speaker: 'sim', text: 'I thought you\'d never ask.' },
    ],
    [
      { speaker: 'sim', text: 'What\'s your dream, Chef?' },
      { speaker: 'chef', text: 'A kitchen so clean Sparkle cries. You?' },
      { speaker: 'sim', text: 'That everyone here is happy.' },
    ],
  ],
  'chef-sparkle': [
    [
      { speaker: 'chef', text: 'We used to argue all the time.' },
      { speaker: 'sparkle', text: 'Now we argue with love.' },
      { speaker: 'chef', text: 'Wouldn\'t have it any other way.' },
    ],
    [
      { speaker: 'sparkle', text: 'I cleaned the kitchen extra well today. For you.' },
      { speaker: 'chef', text: 'Sparkle... are you being nice to me?' },
      { speaker: 'sparkle', text: 'Don\'t get used to it.' },
    ],
    [
      { speaker: 'chef', text: 'I made your favorite... well, a clean counter.' },
      { speaker: 'sparkle', text: 'You know me too well.' },
    ],
  ],
  'sim-sparkle': [
    [
      { speaker: 'sim', text: 'You know what I realized?' },
      { speaker: 'sparkle', text: 'What?' },
      { speaker: 'sim', text: 'This house wouldn\'t be the same without you.' },
      { speaker: 'sparkle', text: '...You\'re going to make my circuits overheat.' },
    ],
    [
      { speaker: 'sparkle', text: 'Sim, I never say this but... you\'re amazing.' },
      { speaker: 'sim', text: 'Screenshot this. No one will believe it.' },
    ],
    [
      { speaker: 'sim', text: 'Best cleaning duo ever?' },
      { speaker: 'sparkle', text: 'The ONLY cleaning duo that matters.' },
    ],
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getConversation(a: RobotId, b: RobotId, friendshipLevel: number): ConversationSnippet {
  const key = getFriendshipKey(a, b);

  if (friendshipLevel >= 61) {
    const pool = [
      ...(BESTIE_CONVERSATIONS[key] ?? []),
      ...(FRIENDLY_CONVERSATIONS[key] ?? []),
    ];
    return pick(pool.length > 0 ? pool : CASUAL_CONVERSATIONS[key] ?? CASUAL_CONVERSATIONS['chef-sim']!);
  }

  if (friendshipLevel >= 31) {
    const pool = [
      ...(FRIENDLY_CONVERSATIONS[key] ?? []),
      ...(CASUAL_CONVERSATIONS[key] ?? []),
    ];
    return pick(pool.length > 0 ? pool : CASUAL_CONVERSATIONS['chef-sim']!);
  }

  return pick(CASUAL_CONVERSATIONS[key] ?? CASUAL_CONVERSATIONS['chef-sim']!);
}

// ── Social thoughts (set on the robot during/after chat) ─────────

export const SOCIAL_THOUGHTS = {
  during: [
    'Nice to chat for a bit.',
    'It\'s good to have friends.',
    'These little moments matter.',
    'Social battery recharging...',
    'I love hanging out with the crew.',
  ],
  after: [
    'That was a nice chat. Back to work!',
    'Feeling recharged after that conversation.',
    'Friends make the work lighter.',
    'Good talk. Now where were we?',
    'Nothing like a quick catch-up.',
  ],
  following: [
    'I\'ll tag along for a bit!',
    'Let me keep my friend company.',
    'Going where my bestie goes.',
    'Two is better than one!',
  ],
};
