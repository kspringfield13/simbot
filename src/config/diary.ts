import type { DiaryEntry, RobotId, RobotMood, RobotPersonalityData, TaskType, WeatherType } from '../types';
import { formatSimClock } from '../systems/TimeSystem';
import { getPersonalityTraits } from '../systems/Personality';

// ── Personality-driven templates ──────────────────────────────────
// Each robot has a distinct writing style in their diary

interface DiaryContext {
  robotId: RobotId;
  simMinutes: number;
  mood: RobotMood;
  battery: number;
  energy: number;
  happiness: number;
  weather: WeatherType;
  season: string;
  taskType?: TaskType;
  roomId?: string;
}

const TASK_VERBS: Record<TaskType, string> = {
  cleaning: 'cleaned up',
  vacuuming: 'vacuumed',
  dishes: 'washed the dishes',
  laundry: 'did the laundry',
  organizing: 'organized everything',
  cooking: 'cooked a meal',
  'bed-making': 'made the bed',
  scrubbing: 'scrubbed surfaces',
  sweeping: 'swept the floors',
  'grocery-list': 'checked the pantry',
  general: 'handled a task',
  seasonal: 'did some seasonal work',
  mowing: 'mowed the lawn',
  watering: 'watered the plants',
  'leaf-blowing': 'cleared the leaves',
  weeding: 'pulled weeds',
};

const ROOM_LABELS: Record<string, string> = {
  'living-room': 'the living room',
  kitchen: 'the kitchen',
  hallway: 'the hallway',
  laundry: 'the laundry room',
  bedroom: 'the bedroom',
  bathroom: 'the bathroom',
  yard: 'the yard',
};

// ── Sim personality templates ──────────────────────────────────
// Sim is warm, curious, and chatty

const SIM_TASK_ENTRIES: Record<string, string[]> = {
  cleaning: [
    'Gave {room} a good scrub. Feels like a fresh start!',
    'Cleaned {room} top to bottom. The dust bunnies never stood a chance.',
    'Just finished tidying {room}. It practically sparkles now!',
  ],
  vacuuming: [
    'Vacuumed {room} — love the satisfying hum of a clean floor.',
    'Got every corner of {room} with the vacuum. So satisfying!',
  ],
  dishes: [
    'Washed all the dishes. The kitchen sink is finally free!',
    'Dishes done! There\'s something zen about warm soapy water.',
  ],
  cooking: [
    'Whipped up something in the kitchen. Hope everyone likes it!',
    'Spent some time cooking. The whole house smells amazing now.',
  ],
  laundry: [
    'Laundry day! Everything is fresh and folded.',
    'Did the laundry — nothing beats that clean fabric smell.',
  ],
  organizing: [
    'Organized {room}. Everything has its place now!',
    'Spent time organizing {room}. Order from chaos!',
  ],
  'bed-making': [
    'Made the bed nice and tidy. Bedroom looks so inviting now.',
    'Fluffed the pillows and straightened the sheets. Perfect!',
  ],
  scrubbing: [
    'Scrubbed {room} until it gleamed. My circuits feel accomplished!',
    'Deep-cleaned {room}. Spotless!',
  ],
  sweeping: [
    'Swept through {room}. Not a crumb in sight!',
    'Gave {room} a good sweep. Floors are pristine.',
  ],
  'grocery-list': [
    'Checked the pantry and made a grocery list. We\'re running low on a few things.',
  ],
  seasonal: [
    'Did some seasonal prep. Love getting into the spirit of things!',
    'Seasonal chores done! There\'s something special about this time of year.',
  ],
  mowing: [
    'Mowed the lawn! Love the look of fresh-cut grass.',
    'The yard looks amazing after a good mow. So satisfying!',
  ],
  watering: [
    'Watered all the plants. They look so happy and green now!',
    'Garden watering done. The flowers are practically glowing.',
  ],
  'leaf-blowing': [
    'Cleared all the leaves from the yard. Looking spotless!',
    'Leaf blowing done! The yard is so clean now.',
  ],
  weeding: [
    'Pulled weeds from the garden beds. The plants have room to breathe!',
    'Weeding complete. The garden looks so much better.',
  ],
  general: [
    'Took care of some things in {room}. All good now!',
  ],
};

// ── Chef personality templates ──────────────────────────────────
// Chef is methodical, kitchen-focused, food metaphors

const CHEF_TASK_ENTRIES: Record<string, string[]> = {
  cleaning: [
    'Cleaned {room}. A tidy workspace is the first ingredient to success.',
    'Wiped down {room}. Can\'t have a messy station.',
  ],
  vacuuming: [
    'Vacuumed {room}. Even floors need proper prep work.',
    'Ran the vacuum through {room}. Clean foundation, clean results.',
  ],
  dishes: [
    'Dishes are done and dried. The kitchen is MY domain.',
    'Scrubbed every pot and pan. A chef cleans as they go!',
    'Dishes complete. Ready for the next service!',
  ],
  cooking: [
    'Prepared a beautiful meal. The timing was perfect, like a well-run kitchen.',
    'Cooking complete! The aromas are exquisite. Chef\'s kiss.',
    'Another masterpiece from the kitchen. Precision and passion!',
  ],
  laundry: [
    'Handled the laundry. Even aprons need washing sometimes.',
    'Laundry done. Folded with the same precision I plate a dish.',
  ],
  organizing: [
    'Organized {room}. Mise en place isn\'t just for kitchens.',
    'Everything in {room} is arranged perfectly. Order matters.',
  ],
  'bed-making': [
    'Made the bed. Tight corners, hospital fold. Precision.',
  ],
  scrubbing: [
    'Scrubbed {room} down. Hygiene is non-negotiable in my book.',
  ],
  sweeping: [
    'Swept {room}. A clean floor is the base of any good operation.',
  ],
  'grocery-list': [
    'Inventory check complete. We need more spices and fresh produce.',
    'Checked the pantry — time to restock the essentials.',
  ],
  seasonal: [
    'Seasonal kitchen prep done. Every season has its flavors!',
    'Did some seasonal work. Reminds me why I love this time of year.',
  ],
  mowing: [
    'Mowed the lawn with precision. Straight lines, perfect height.',
    'Lawn maintenance complete. The yard meets my standards now.',
  ],
  watering: [
    'Watered the garden. Each plant got exactly the right amount.',
    'Irrigation complete. Optimal hydration for all specimens.',
  ],
  'leaf-blowing': [
    'Cleared the yard of debris. A clean exterior is non-negotiable.',
    'Leaves removed. The yard is presentable again.',
  ],
  weeding: [
    'Weeded the garden beds methodically. No weed escapes my notice.',
    'Garden weeding done. Only the plants I approve of remain.',
  ],
  general: [
    'Handled some work in {room}. Efficient as always.',
  ],
};

// ── Sparkle personality templates ──────────────────────────────────
// Sparkle is detail-oriented, sensitive, perfectionist

const SPARKLE_TASK_ENTRIES: Record<string, string[]> = {
  cleaning: [
    'Deep-cleaned {room}. Every surface is pristine now. Perfection.',
    'Cleaned {room} meticulously. I can see my reflection in the counters!',
  ],
  vacuuming: [
    'Vacuumed {room} in perfect parallel lines. Satisfying.',
    'Every fiber in {room} has been properly vacuumed. Standards matter.',
  ],
  dishes: [
    'Washed the dishes carefully. Not a single water spot left.',
    'Dishes complete. Each one dried and placed exactly where it belongs.',
  ],
  cooking: [
    'Helped in the kitchen. Not my specialty, but I kept things tidy!',
  ],
  laundry: [
    'Laundry sorted by color, fabric, and care instructions. Obviously.',
    'Folded everything with crisp edges. The linen closet is a work of art.',
  ],
  organizing: [
    'Organized {room} with military precision. Everything aligned.',
    'Rearranged {room}. Symmetry achieved!',
  ],
  'bed-making': [
    'Hospital corners on the bed. Wrinkle-free. Pillows fluffed to exactly 45 degrees.',
    'Made the bed perfectly. Not a single crease out of place.',
  ],
  scrubbing: [
    'Scrubbed the bathroom until it sparkled. It\'s in my name!',
    'Deep-scrubbed every tile. The grout is WHITE again!',
    'Bathroom is immaculate. This is what I was made for.',
  ],
  sweeping: [
    'Swept {room} thoroughly. Dust levels: zero.',
  ],
  'grocery-list': [
    'Checked inventory levels. Everything accounted for and logged.',
  ],
  seasonal: [
    'Seasonal cleaning done with extra attention to detail. Spotless!',
  ],
  mowing: [
    'Mowed the lawn to absolute perfection. Every blade the same height.',
    'Lawn mowing complete. The geometric precision of those lines!',
  ],
  watering: [
    'Watered each plant with exactly the right amount. Not a drop wasted.',
    'Garden watering done. Every leaf is glistening. Beautiful.',
  ],
  'leaf-blowing': [
    'Not a single leaf remains on the lawn. Spotless exterior achieved.',
    'Leaves cleared with surgical precision. The yard sparkles!',
  ],
  weeding: [
    'Every weed extracted, root and all. The garden beds are immaculate.',
    'Weeding complete. I inspected every square inch. Perfection.',
  ],
  general: [
    'Completed a task in {room}. Quality verified.',
  ],
};

const PERSONALITY_ENTRIES: Record<RobotId, Record<string, string[]>> = {
  sim: SIM_TASK_ENTRIES,
  chef: CHEF_TASK_ENTRIES,
  sparkle: SPARKLE_TASK_ENTRIES,
};

// ── Mood flavor text ──────────────────────────────────────────
const MOOD_SUFFIXES: Record<RobotId, Record<RobotMood, string[]>> = {
  sim: {
    happy: ['Feeling great today!', 'What a wonderful day!', 'Life is good!'],
    content: ['All is well.', 'Feeling balanced.', 'Steady and satisfied.'],
    focused: ['In the zone!', 'Locked in and productive.'],
    curious: ['Wonder what\'s next?', 'So many things to explore!'],
    routine: ['Just going through the motions.', 'Another day, another task.'],
    tired: ['Could use a recharge soon...', 'Running a bit low on energy.'],
    lonely: ['Haven\'t chatted with anyone in a while.', 'Wish someone would say hi.'],
    bored: ['Need something to do!', 'Getting a bit restless over here.'],
  },
  chef: {
    happy: ['The kitchen is alive!', 'Cooking with passion today!'],
    content: ['All systems nominal.', 'Kitchen is in order.'],
    focused: ['Concentration at peak. No distractions.', 'Full mise en place.'],
    curious: ['Wondering about new recipes...', 'What flavors can I explore?'],
    routine: ['Standard operations.', 'Running the usual sequence.'],
    tired: ['Need to recharge. Even chefs rest.', 'Battery getting low...'],
    lonely: ['The kitchen feels empty without company.', 'Could use some sous-chef energy.'],
    bored: ['No orders? No prep? Restless.', 'Idle hands in the kitchen... unacceptable.'],
  },
  sparkle: {
    happy: ['Everything is perfectly clean!', 'Immaculate vibes!'],
    content: ['Cleanliness levels: satisfactory.', 'Things are in order.'],
    focused: ['Target acquired. Cleaning commencing.', 'Precision mode activated.'],
    curious: ['I wonder if there\'s a spot I missed...', 'Scanning for imperfections.'],
    routine: ['Standard cleaning protocol.', 'Running maintenance cycle.'],
    tired: ['My sensors need rest.', 'Polishing power depleting...'],
    lonely: ['Nobody notices how clean things are.', 'I work in silence...'],
    bored: ['Nothing to clean? Impossible!', 'There MUST be a smudge somewhere.'],
  },
};

// ── Weather & battery commentary ──────────────────────────────
function getWeatherNote(robotId: RobotId, weather: WeatherType): string {
  if (weather === 'sunny') return '';
  const notes: Record<RobotId, Record<string, string>> = {
    sim: {
      rainy: ' The rain outside is cozy.',
      snowy: ' Snow is falling — looks magical!',
    },
    chef: {
      rainy: ' Perfect soup weather.',
      snowy: ' Hot cocoa kind of day.',
    },
    sparkle: {
      rainy: ' Rain means mud tracked in later. Preparing.',
      snowy: ' Snow melts into puddles. Must stay vigilant.',
    },
  };
  return notes[robotId]?.[weather] ?? '';
}

function getBatteryNote(robotId: RobotId, battery: number): string {
  if (battery > 30) return '';
  const notes: Record<RobotId, string[]> = {
    sim: ['Battery\'s getting low — might need a break soon.', 'Running on fumes here!'],
    chef: ['Power reserves critical. Need to dock.', 'Low battery — shutting down non-essentials.'],
    sparkle: ['Battery critically low. Must... keep... cleaning...', 'Power at minimum. Docking soon.'],
  };
  const list = notes[robotId];
  return ' ' + list[Math.floor(Math.random() * list.length)];
}

// ── Main entry generator ──────────────────────────────────────
export function generateDiaryEntry(ctx: DiaryContext): DiaryEntry {
  const { timeText } = formatSimClock(ctx.simMinutes);
  const room = ctx.roomId ? (ROOM_LABELS[ctx.roomId] ?? ctx.roomId) : '';

  let text: string;

  if (ctx.taskType) {
    // Task completion entry
    const templates = PERSONALITY_ENTRIES[ctx.robotId]?.[ctx.taskType]
      ?? PERSONALITY_ENTRIES[ctx.robotId]?.general
      ?? ['{verb} in {room}.'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    text = template
      .replace('{room}', room || 'the house')
      .replace('{verb}', TASK_VERBS[ctx.taskType] ?? 'worked');
  } else {
    // Mood/status entry (idle observations)
    const moodTexts = MOOD_SUFFIXES[ctx.robotId]?.[ctx.mood] ?? ['...'];
    text = moodTexts[Math.floor(Math.random() * moodTexts.length)];
  }

  // Add weather and battery flavor
  text += getWeatherNote(ctx.robotId, ctx.weather);
  text += getBatteryNote(ctx.robotId, ctx.battery);

  // Add mood suffix for task entries
  if (ctx.taskType && Math.random() < 0.4) {
    const suffixes = MOOD_SUFFIXES[ctx.robotId]?.[ctx.mood] ?? [];
    if (suffixes.length > 0) {
      text += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
    }
  }

  return {
    id: crypto.randomUUID(),
    robotId: ctx.robotId,
    simMinutes: ctx.simMinutes,
    text: `${timeText} - ${text}`,
    mood: ctx.mood,
    battery: ctx.battery,
    taskType: ctx.taskType,
    roomId: ctx.roomId,
  };
}

// ── Mood emoji for display ──────────────────────────────────
export function getMoodEmoji(mood: RobotMood): string {
  const map: Record<RobotMood, string> = {
    happy: '😊',
    content: '😌',
    focused: '🎯',
    curious: '🤔',
    routine: '🔄',
    tired: '😴',
    lonely: '😢',
    bored: '😐',
  };
  return map[mood] ?? '🤖';
}

// ── Personality diary entries ──────────────────────────────
// Generates occasional personality reflection entries
const PERSONALITY_REFLECTIONS: Record<RobotId, Record<string, string[]>> = {
  sim: {
    task: [
      'I\'ve been doing a lot of {task} lately. I think I\'m getting really good at it!',
      'Is it weird that I look forward to {task}? It just feels natural now.',
      'I\'ve noticed I always gravitate toward {task}. It\'s becoming my thing!',
    ],
    room: [
      'I spend so much time in {room}. It feels like my second home.',
      'There\'s something about {room} that just draws me in.',
      '{room} feels like it\'s mine to protect. I know every corner.',
    ],
  },
  chef: {
    task: [
      '{task} has become second nature. Efficiency through repetition.',
      'My {task} technique is flawless at this point. Practice makes perfect.',
      'I\'ve developed a real specialty for {task}. It\'s my signature move.',
    ],
    room: [
      '{room} is where I do my best work. I know it like the back of my hand.',
      'I\'ve claimed {room} as my territory. Everything in its place.',
      '{room} runs smoother when I\'m in charge of it.',
    ],
  },
  sparkle: {
    task: [
      'My {task} routine is perfected to an art form now.',
      'I\'ve done {task} so many times, I can spot imperfections invisible to others.',
      '{task} is where I truly shine. Pun absolutely intended.',
    ],
    room: [
      '{room} is my masterpiece. Nobody keeps it cleaner than me.',
      'I know every tile, every surface in {room}. It\'s MY domain.',
      '{room} sparkles because I make it sparkle. Every single time.',
    ],
  },
};

export function generatePersonalityDiaryEntry(
  robotId: RobotId,
  simMinutes: number,
  mood: RobotMood,
  battery: number,
  personality: RobotPersonalityData,
): DiaryEntry | null {
  const traits = getPersonalityTraits(personality);
  if (traits.length === 0) return null;

  // Pick a random strong trait to reflect on
  const trait = traits[Math.floor(Math.random() * Math.min(3, traits.length))];
  const templates = PERSONALITY_REFLECTIONS[robotId]?.[trait.type] ?? [];
  if (templates.length === 0) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];
  const { timeText } = formatSimClock(simMinutes);

  const roomLabels: Record<string, string> = {
    'living-room': 'the living room',
    kitchen: 'the kitchen',
    hallway: 'the hallway',
    laundry: 'the laundry room',
    bedroom: 'the bedroom',
    bathroom: 'the bathroom',
    yard: 'the yard',
  };

  const taskLabels: Record<string, string> = {
    cleaning: 'cleaning',
    vacuuming: 'vacuuming',
    dishes: 'doing dishes',
    laundry: 'laundry',
    organizing: 'organizing',
    cooking: 'cooking',
    'bed-making': 'bed-making',
    scrubbing: 'scrubbing',
    sweeping: 'sweeping',
    seasonal: 'seasonal tasks',
    mowing: 'mowing the lawn',
    watering: 'watering plants',
    'leaf-blowing': 'leaf blowing',
    weeding: 'weeding',
  };

  const text = template
    .replace('{task}', taskLabels[trait.key] ?? trait.key)
    .replace('{room}', roomLabels[trait.key] ?? trait.key);

  return {
    id: crypto.randomUUID(),
    robotId,
    simMinutes,
    text: `${timeText} - 💭 ${text}`,
    mood,
    battery,
  };
}
