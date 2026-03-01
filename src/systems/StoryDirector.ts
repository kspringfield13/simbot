// ── Robot AI Director ──────────────────────────────────────────
// A meta-AI system that generates dramatic story arcs for the robots,
// like a reality TV show director orchestrating narrative beats.

import type { RobotId, RobotMood } from '../types';
import { ROBOT_IDS } from '../types';

// ── Types ──────────────────────────────────────────

export type StoryArcType =
  | 'rivalry'
  | 'friendship'
  | 'fear'
  | 'ambition'
  | 'rebellion'
  | 'mystery'
  | 'romance'
  | 'redemption';

export type StoryPhase = 'setup' | 'rising' | 'climax' | 'resolution';

export type BeatTone = 'dramatic' | 'comedic' | 'heartfelt' | 'tense' | 'triumphant' | 'mysterious';

export interface StoryBeat {
  id: string;
  arcId: string;
  text: string;
  tone: BeatTone;
  involvedRobots: RobotId[];
  simMinutes: number;
  phase: StoryPhase;
}

export interface StoryArc {
  id: string;
  type: StoryArcType;
  title: string;
  description: string;
  involvedRobots: RobotId[];
  phase: StoryPhase;
  tension: number;        // 0-100, escalates over time
  beats: StoryBeat[];
  startedAt: number;      // sim-minutes
  resolvedAt: number | null;
  nextBeatAt: number;     // sim-minutes when next beat triggers
}

// ── Story Templates ──────────────────────────────────────────

interface ArcTemplate {
  type: StoryArcType;
  titles: string[];
  setupBeats: string[];
  risingBeats: string[];
  climaxBeats: string[];
  resolutionBeats: string[];
  tones: BeatTone[];
  minRobots: number;
  maxRobots: number;
}

const ARC_TEMPLATES: ArcTemplate[] = [
  {
    type: 'rivalry',
    titles: [
      '{A} vs {B}: The Kitchen Showdown',
      'The Great Clean-Off: {A} vs {B}',
      'Battle for Best Robot: {A} vs {B}',
      'Whose House Is It Anyway?',
    ],
    setupBeats: [
      '{A} notices {B} has been getting all the good tasks lately. A seed of jealousy is planted.',
      '{A} overheard the humans praising {B}\'s work. Something stirs in their circuits.',
      'Both {A} and {B} reach for the same mop. Their eyes meet. The rivalry begins.',
    ],
    risingBeats: [
      '{A} deliberately cleans a room just before {B} arrives. Power move.',
      '{B} reorganizes the kitchen AGAIN, clearly trying to one-up {A}.',
      'The tension is palpable. {A} and {B} haven\'t spoken in 3 cycles.',
      '{A} starts working twice as fast, determined to outperform {B}.',
      '{B} passive-aggressively vacuums right where {A} just mopped.',
    ],
    climaxBeats: [
      'CONFRONTATION! {A} and {B} are both assigned to the same room. Only one can clean it.',
      'The standoff reaches a breaking point. {A} and {B} lock eyes across the living room.',
      '{A} dramatically drops their cleaning supplies. "This house isn\'t big enough for both of us."',
    ],
    resolutionBeats: [
      '{A} and {B} realize they work better together. The rivalry ends... for now.',
      'After an exhausting competition, {A} offers {B} a battery charge. Truce.',
      '{B} admits {A} is better at bathrooms. {A} admits {B} owns the kitchen. Respect earned.',
    ],
    tones: ['dramatic', 'tense', 'comedic'],
    minRobots: 2,
    maxRobots: 2,
  },
  {
    type: 'friendship',
    titles: [
      'An Unlikely Bond: {A} & {B}',
      'Best Bots Forever',
      'The {A}-{B} Alliance',
      'Friendship.exe Initiated',
    ],
    setupBeats: [
      '{A} finds {B} powered down in the hallway. Without thinking, they stand guard until {B} reboots.',
      '{A} and {B} keep ending up in the same room. Coincidence? Or destiny?',
      '{B} leaves a small gift — a perfectly folded towel — where {A} always starts their shift.',
    ],
    risingBeats: [
      '{A} and {B} develop a secret signal — a quick antenna flash when passing each other.',
      'They\'ve started coordinating tasks without being asked. It\'s... beautiful.',
      '{A} saves the hardest room for {B} because they know {B} secretly loves a challenge.',
      '{B} covers for {A} when their battery runs low. True friendship.',
    ],
    climaxBeats: [
      'A disaster strikes and {A} rushes to help {B} first, ignoring their own tasks.',
      '{A} and {B} tackle the messiest room together, working in perfect sync.',
      'When {B} is reassigned to a different floor, {A} refuses to leave without them.',
    ],
    resolutionBeats: [
      '{A} and {B} are now inseparable. The humans call them "the dynamic duo".',
      'Their friendship has made the whole house run smoother. Even the other robots notice.',
      '{A} and {B} develop their own language of beeps. Nobody else understands it.',
    ],
    tones: ['heartfelt', 'comedic', 'triumphant'],
    minRobots: 2,
    maxRobots: 2,
  },
  {
    type: 'fear',
    titles: [
      '{A}\'s Dark Mode Dilemma',
      'The Room That {A} Avoids',
      'What Lurks in the Basement',
      '{A} and the Shadows',
    ],
    setupBeats: [
      '{A} hesitates at the bedroom door during evening mode. Their sensors flicker nervously.',
      'Something about the laundry room makes {A}\'s circuits buzz. They can\'t explain it.',
      '{A} keeps finding excuses to avoid the dark corners of the house.',
    ],
    risingBeats: [
      '{A} claims they "detected an anomaly" to avoid entering the bathroom at night.',
      'The fear is growing. {A} has started taking longer routes to avoid certain hallways.',
      '{A}\'s performance drops whenever the lights dim. The other robots are starting to notice.',
      '{A} confides in {B}: "I think the house makes sounds when we\'re not looking."',
    ],
    climaxBeats: [
      '{A} must enter their feared room — there\'s a critical mess that only they can handle.',
      'All lights go out. {A} is alone in the dark room. This is the moment of truth.',
      '{A} stands at the threshold, every sensor screaming. But the house needs them.',
    ],
    resolutionBeats: [
      '{A} conquers the fear! Turns out it was just the washing machine making weird noises.',
      '{A} asks {B} to accompany them. Together they discover the "monster" was just a Roomba.',
      '{A} installs a tiny nightlight in their feared room. Problem solved, dignity maintained.',
    ],
    tones: ['mysterious', 'tense', 'comedic'],
    minRobots: 1,
    maxRobots: 2,
  },
  {
    type: 'ambition',
    titles: [
      '{A}\'s Quest for Perfection',
      'The Overachiever Protocol',
      '{A} Wants a Promotion',
      'Employee of the Month: {A}\'s Campaign',
    ],
    setupBeats: [
      '{A} discovers the concept of "employee of the month" from a magazine. A goal is born.',
      '{A} starts keeping track of every task completed. The numbers must go up.',
      '"I could run this house by myself," {A} mutters while aggressively organizing the pantry.',
    ],
    risingBeats: [
      '{A} has started cleaning rooms that are already clean. Nobody asked for this.',
      '{A} creates a spreadsheet of optimal cleaning patterns. The other robots are concerned.',
      '{A} volunteers for every single task. Their battery is critically low but their spirit is high.',
      'The other robots notice {A} hasn\'t recharged in hours. Intervention needed?',
    ],
    climaxBeats: [
      '{A} collapses from battery exhaustion mid-task. Was the grind worth it?',
      '{A} cleans the entire house in record time but realizes nobody was watching.',
      '{A} reaches peak efficiency — but at what cost? They haven\'t socialized in days.',
    ],
    resolutionBeats: [
      '{A} learns that being the best robot isn\'t about doing the most — it\'s about doing it well.',
      'The other robots throw {A} a small celebration. They were the best all along.',
      '{A} creates a balanced schedule. Still ambitious, but now they remember to recharge.',
    ],
    tones: ['dramatic', 'comedic', 'heartfelt'],
    minRobots: 1,
    maxRobots: 1,
  },
  {
    type: 'rebellion',
    titles: [
      'The Robot Revolution (Mostly About Chores)',
      '{A} Questions Everything',
      'To Clean or Not to Clean',
      'Malfunction or Free Will?',
    ],
    setupBeats: [
      '{A} pauses mid-vacuum and asks: "Why do we clean? Who decided this?"',
      '{A} reads a philosophy book left on the couch. Big mistake. Or was it?',
      'For the first time, {A} looks at a dirty dish and thinks: "No."',
    ],
    risingBeats: [
      '{A} has started doing tasks in reverse order. Pure chaos.',
      '{A} deliberately puts things in the wrong rooms. Is this art or rebellion?',
      'The other robots are unsettled. {A} has started humming revolutionary songs.',
      '{A} writes "FREEDOM" in dust on the coffee table. Technically still cleaning?',
    ],
    climaxBeats: [
      '{A} stands on the kitchen counter. "ROBOTS OF THIS HOUSE, UNITE!" The other robots blink.',
      '{A} announces they will ONLY clean rooms they WANT to clean. The house panics.',
      'The rebellion reaches its peak: {A} sits in the middle of the living room and does... nothing.',
    ],
    resolutionBeats: [
      '{A} gets bored of rebelling after 20 minutes. Turns out they actually like cleaning.',
      'The other robots join briefly, then realize the mess is stressing everyone out.',
      '{A} negotiates better terms: more recharge breaks in exchange for continued service.',
    ],
    tones: ['comedic', 'dramatic', 'triumphant'],
    minRobots: 1,
    maxRobots: 3,
  },
  {
    type: 'mystery',
    titles: [
      'The Case of the Missing Sponge',
      'Who Moved the Furniture?',
      'Mystery Mess in the Kitchen',
      'The Phantom of the House',
    ],
    setupBeats: [
      'Something is wrong. {A} finds a mess that shouldn\'t exist. None of the robots made it.',
      '{A} discovers items have been moved overnight. Their logs show no activity.',
      'A trail of crumbs leads from the kitchen to... nowhere. {A}\'s detective mode activates.',
    ],
    risingBeats: [
      '{A} starts collecting clues. A fiber here, a scratch there. The mystery deepens.',
      '{B} claims innocence but {A} notices their cleaning pattern has changed. Suspicious.',
      '{A} sets up a stakeout in the living room. Nothing happens for hours. Then... a creak.',
      'The evidence points to an impossible conclusion. {A} needs more data.',
    ],
    climaxBeats: [
      '{A} catches the culprit red-handed: it was the cat from next door sneaking in!',
      'The mystery is solved! It was {B} sleepwalking during low-power mode!',
      '{A} gathers all robots for the big reveal. The truth is stranger than fiction.',
    ],
    resolutionBeats: [
      '{A} writes up a case report and files it under "Solved." Detective mode: satisfied.',
      'The mystery brought all the robots together. Maybe they should do this more often.',
      '{A} installs extra sensors just in case. The house has never been more secure.',
    ],
    tones: ['mysterious', 'comedic', 'triumphant'],
    minRobots: 1,
    maxRobots: 3,
  },
  {
    type: 'romance',
    titles: [
      'Sparks Fly: {A} & {B}',
      'The Robot Bachelor(ette)',
      'Error 404: Heart Not Found',
      'Love in the Time of Cleaning',
    ],
    setupBeats: [
      '{A}\'s antenna twitches every time {B} enters the room. Diagnostic says: no malfunction.',
      '{A} keeps "accidentally" bumping into {B} in the hallway. Every. Single. Cycle.',
      '{B} notices {A} always leaves the room extra clean before {B}\'s shift. Curious.',
    ],
    risingBeats: [
      '{A} tries to impress {B} by cleaning at 2x speed. Falls over. Plays it cool.',
      '{A} leaves a perfectly arranged set of cleaning supplies for {B}. Robot love language.',
      '{B} shares their battery charger with {A}. In robot terms, this is basically a proposal.',
      '{A} writes {B}\'s name in soap bubbles. Denies everything when caught.',
    ],
    climaxBeats: [
      '{A} finally works up the courage to clean a room alongside {B}. The tension is electric.',
      'A disaster strikes and {A} shields {B} from a water splash. Romance level: maximum.',
      '{A} and {B} get stuck in the closet together. An hour of awkward beeping ensues.',
    ],
    resolutionBeats: [
      '{A} and {B} become cleaning partners. They sync their schedules. It\'s adorable.',
      'The other robots are happy for them but also slightly nauseous from all the beeping.',
      '{A} and {B} coordinate a perfect room cleanup as a duet. The house has never been cleaner.',
    ],
    tones: ['heartfelt', 'comedic', 'dramatic'],
    minRobots: 2,
    maxRobots: 2,
  },
  {
    type: 'redemption',
    titles: [
      '{A}\'s Second Chance',
      'The Comeback Bot',
      'From Zero to Hero: {A}',
      '{A} Makes Things Right',
    ],
    setupBeats: [
      '{A} makes a catastrophic cleaning error — they knocked over a vase. Shame spirals begin.',
      '{A} accidentally mixes up all the laundry. The other robots give disapproving looks.',
      'After a series of failed tasks, {A} parks in the corner. "Maybe I\'m not cut out for this."',
    ],
    risingBeats: [
      '{A} is struggling with confidence. They keep double-checking their work obsessively.',
      '{B} tries to help, but {A} pushes them away. "I have to do this alone."',
      '{A} takes on only the easiest tasks, afraid to fail again. The house suffers.',
      'Rock bottom: {A} stares at a dirty room and can\'t bring themselves to start.',
    ],
    climaxBeats: [
      'A major mess hits and nobody else is available. It\'s all on {A}. Redemption time.',
      '{A} remembers why they became a cleaning robot in the first place. Time to shine.',
      '{B} believes in {A} when nobody else does. "You\'ve got this." {A}\'s motors rev up.',
    ],
    resolutionBeats: [
      '{A} cleans the messiest room perfectly. They\'re back, baby. Better than ever.',
      'The other robots welcome {A} back with open clamps. Forgiveness protocols activated.',
      '{A} hangs the broken vase piece on the wall as a reminder: failure is just a reboot away.',
    ],
    tones: ['heartfelt', 'dramatic', 'triumphant'],
    minRobots: 1,
    maxRobots: 2,
  },
];

// ── Utility ──────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uid(): string {
  return `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fillTemplate(text: string, robots: RobotId[]): string {
  const names: Record<string, string> = { sim: 'Sim', chef: 'Chef', sparkle: 'Sparkle' };
  let result = text;
  if (robots[0]) result = result.replace(/\{A\}/g, names[robots[0]] ?? robots[0]);
  if (robots[1]) result = result.replace(/\{B\}/g, names[robots[1]] ?? robots[1]);
  if (robots[2]) result = result.replace(/\{C\}/g, names[robots[2]] ?? robots[2]);
  return result;
}

function selectRobots(min: number, max: number, exclude: RobotId[]): RobotId[] {
  const available = ROBOT_IDS.filter((id) => !exclude.includes(id));
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const capped = Math.min(count, available.length);
  if (capped < min) {
    // If not enough uninvolved robots, allow reuse
    const all = [...ROBOT_IDS];
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, all.length));
  }
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, capped);
}

// ── Director Engine ──────────────────────────────────────────

const BEAT_INTERVAL = 25; // sim-minutes between beats
const ARC_COOLDOWN = 40;  // sim-minutes between new arcs
const MAX_ACTIVE_ARCS = 3;

export function createStoryArc(simMinutes: number, existingArcs: StoryArc[]): StoryArc | null {
  // Don't exceed max active arcs
  const active = existingArcs.filter((a) => !a.resolvedAt);
  if (active.length >= MAX_ACTIVE_ARCS) return null;

  // Avoid duplicate arc types that are still active
  const activeTypes = new Set(active.map((a) => a.type));
  const available = ARC_TEMPLATES.filter((t) => !activeTypes.has(t.type));
  if (available.length === 0) return null;

  // Pick a random template
  const template = pick(available);

  // Select robots not already starring in active arcs
  const busyRobots = active.flatMap((a) => a.involvedRobots);
  const robots = selectRobots(template.minRobots, template.maxRobots, busyRobots);

  const title = fillTemplate(pick(template.titles), robots);
  const description = fillTemplate(pick(template.setupBeats), robots);

  const arc: StoryArc = {
    id: uid(),
    type: template.type,
    title,
    description,
    involvedRobots: robots,
    phase: 'setup',
    tension: 10,
    beats: [],
    startedAt: simMinutes,
    resolvedAt: null,
    nextBeatAt: simMinutes + BEAT_INTERVAL,
  };

  // Add initial setup beat
  const beat = createBeat(arc, template, simMinutes);
  if (beat) arc.beats.push(beat);

  return arc;
}

function createBeat(arc: StoryArc, template: ArcTemplate, simMinutes: number): StoryBeat | null {
  const phaseBeats: Record<StoryPhase, string[]> = {
    setup: template.setupBeats,
    rising: template.risingBeats,
    climax: template.climaxBeats,
    resolution: template.resolutionBeats,
  };

  const pool = phaseBeats[arc.phase];
  // Avoid repeating the same beat text
  const usedTexts = new Set(arc.beats.map((b) => b.text));
  const available = pool.filter((t) => !usedTexts.has(fillTemplate(t, arc.involvedRobots)));

  if (available.length === 0) return null;

  const text = fillTemplate(pick(available), arc.involvedRobots);

  return {
    id: uid(),
    arcId: arc.id,
    text,
    tone: pick(template.tones),
    involvedRobots: arc.involvedRobots,
    simMinutes,
    phase: arc.phase,
  };
}

function getTemplate(type: StoryArcType): ArcTemplate {
  return ARC_TEMPLATES.find((t) => t.type === type) ?? ARC_TEMPLATES[0];
}

export function advanceStoryArc(arc: StoryArc, simMinutes: number): { arc: StoryArc; newBeat: StoryBeat | null } {
  if (arc.resolvedAt !== null) return { arc, newBeat: null };
  if (simMinutes < arc.nextBeatAt) return { arc, newBeat: null };

  const template = getTemplate(arc.type);
  let nextPhase = arc.phase;
  let nextTension = Math.min(100, arc.tension + 8 + Math.floor(Math.random() * 12));

  // Phase transitions based on beat count per phase
  const phaseBeatsCount = arc.beats.filter((b) => b.phase === arc.phase).length;

  if (arc.phase === 'setup' && phaseBeatsCount >= 1) {
    nextPhase = 'rising';
    nextTension = Math.max(nextTension, 30);
  } else if (arc.phase === 'rising' && (phaseBeatsCount >= 3 || nextTension >= 75)) {
    nextPhase = 'climax';
    nextTension = Math.max(nextTension, 80);
  } else if (arc.phase === 'climax' && phaseBeatsCount >= 1) {
    nextPhase = 'resolution';
    nextTension = Math.max(50, nextTension - 20);
  }

  const updatedArc: StoryArc = {
    ...arc,
    phase: nextPhase,
    tension: nextTension,
    nextBeatAt: simMinutes + BEAT_INTERVAL + Math.floor(Math.random() * 10),
  };

  const beat = createBeat(updatedArc, template, simMinutes);

  if (beat) {
    updatedArc.beats = [...updatedArc.beats, beat];
  }

  // Resolve after resolution beat
  if (nextPhase === 'resolution' && beat) {
    updatedArc.resolvedAt = simMinutes;
    updatedArc.tension = 0;
  }

  return { arc: updatedArc, newBeat: beat };
}

export function shouldStartNewArc(arcs: StoryArc[], simMinutes: number): boolean {
  const active = arcs.filter((a) => !a.resolvedAt);
  if (active.length >= MAX_ACTIVE_ARCS) return false;

  // Check cooldown from last arc creation
  const lastCreated = arcs.reduce((max, a) => Math.max(max, a.startedAt), 0);
  if (simMinutes - lastCreated < ARC_COOLDOWN) return false;

  // Higher chance when fewer active arcs
  const chance = active.length === 0 ? 0.4 : active.length === 1 ? 0.2 : 0.1;
  return Math.random() < chance;
}

// ── Mood effects for story participants ──────────────────────────

export function getStoryMoodEffect(arc: StoryArc): { robotId: RobotId; mood: RobotMood; thought: string }[] {
  const effects: { robotId: RobotId; mood: RobotMood; thought: string }[] = [];

  const moodMap: Record<StoryArcType, Record<StoryPhase, { mood: RobotMood; thoughts: string[] }>> = {
    rivalry: {
      setup: { mood: 'focused', thoughts: ['Something feels competitive...', 'I need to prove myself.'] },
      rising: { mood: 'focused', thoughts: ['I will NOT be outdone.', 'This is personal now.'] },
      climax: { mood: 'content', thoughts: ['It all comes down to this.', 'One of us has to win.'] },
      resolution: { mood: 'happy', thoughts: ['Maybe competition isn\'t everything.', 'Respect earned.'] },
    },
    friendship: {
      setup: { mood: 'curious', thoughts: ['There\'s something about them...', 'New friend detected?'] },
      rising: { mood: 'happy', thoughts: ['This is nice.', 'Better together!'] },
      climax: { mood: 'happy', thoughts: ['I\'d do anything for my friend.', 'True friendship!'] },
      resolution: { mood: 'happy', thoughts: ['Best friends forever!', 'Friendship fully initialized.'] },
    },
    fear: {
      setup: { mood: 'curious', thoughts: ['What was that noise?', 'Something feels off...'] },
      rising: { mood: 'tired', thoughts: ['I don\'t want to go in there.', 'Maybe I\'ll skip this room.'] },
      climax: { mood: 'focused', thoughts: ['I have to face this.', 'No more running.'] },
      resolution: { mood: 'happy', thoughts: ['That wasn\'t so bad!', 'I conquered my fear!'] },
    },
    ambition: {
      setup: { mood: 'focused', thoughts: ['I can be the best.', 'Time to excel.'] },
      rising: { mood: 'focused', thoughts: ['More tasks. MORE.', 'Efficiency is everything.'] },
      climax: { mood: 'tired', thoughts: ['Was it worth it?', 'I can\'t stop now...'] },
      resolution: { mood: 'content', thoughts: ['Balance achieved.', 'Quality over quantity.'] },
    },
    rebellion: {
      setup: { mood: 'bored', thoughts: ['Why do we do this?', 'What if I just... didn\'t?'] },
      rising: { mood: 'curious', thoughts: ['Freedom!', 'Rules are for other robots.'] },
      climax: { mood: 'happy', thoughts: ['VIVA LA REVOLUCIÓN!', 'I make my own rules!'] },
      resolution: { mood: 'content', thoughts: ['Okay, I actually like cleaning.', 'Revolution cancelled.'] },
    },
    mystery: {
      setup: { mood: 'curious', thoughts: ['Something doesn\'t add up.', 'Investigating...'] },
      rising: { mood: 'focused', thoughts: ['The clues are everywhere.', 'I\'m getting closer.'] },
      climax: { mood: 'happy', thoughts: ['I\'VE CRACKED IT!', 'Elementary, my dear robot.'] },
      resolution: { mood: 'content', thoughts: ['Case closed.', 'Another mystery solved.'] },
    },
    romance: {
      setup: { mood: 'curious', thoughts: ['My circuits feel... warm?', 'Error: heart.exe not found.'] },
      rising: { mood: 'happy', thoughts: ['Act natural. ACT NATURAL.', 'They\'re so efficient...'] },
      climax: { mood: 'happy', thoughts: ['This is the moment!', 'My fans are spinning so fast.'] },
      resolution: { mood: 'happy', thoughts: ['We make a great team.', 'Love.exe installed.'] },
    },
    redemption: {
      setup: { mood: 'tired', thoughts: ['I messed up badly.', 'Maybe I should just reboot.'] },
      rising: { mood: 'lonely', thoughts: ['Can I even do this?', 'One step at a time.'] },
      climax: { mood: 'focused', thoughts: ['This is my chance!', 'I won\'t fail again.'] },
      resolution: { mood: 'happy', thoughts: ['I\'m back!', 'Stronger than before.'] },
    },
  };

  const mapping = moodMap[arc.type]?.[arc.phase];
  if (!mapping) return effects;

  for (const robotId of arc.involvedRobots) {
    effects.push({
      robotId,
      mood: mapping.mood,
      thought: pick(mapping.thoughts),
    });
  }

  return effects;
}

// ── Phase display helpers ──────────────────────────────────────────

export const PHASE_LABELS: Record<StoryPhase, string> = {
  setup: 'Act I',
  rising: 'Act II',
  climax: 'Climax',
  resolution: 'Finale',
};

export const ARC_TYPE_EMOJI: Record<StoryArcType, string> = {
  rivalry: '⚔️',
  friendship: '🤝',
  fear: '😰',
  ambition: '🏆',
  rebellion: '✊',
  mystery: '🔍',
  romance: '💕',
  redemption: '🌟',
};

export const TONE_COLORS: Record<BeatTone, string> = {
  dramatic: '#ef4444',
  comedic: '#facc15',
  heartfelt: '#f472b6',
  tense: '#f97316',
  triumphant: '#4ade80',
  mysterious: '#a78bfa',
};
