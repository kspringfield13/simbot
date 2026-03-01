import type { RoomId, Season, WeatherType } from '../types';

export const DAYS_PER_SEASON = 7;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4; // 28 sim-days = full year

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

export function getSeasonForDay(day: number): Season {
  const seasonIndex = Math.floor(((day - 1) % DAYS_PER_YEAR) / DAYS_PER_SEASON);
  return SEASON_ORDER[seasonIndex];
}

/** Returns 0-based day within the current season (0 = first day). */
export function getDayInSeason(day: number): number {
  return ((day - 1) % DAYS_PER_YEAR) % DAYS_PER_SEASON;
}

/** Returns the season progress as 0-1 (0 = start of season, 1 = end). */
export function getSeasonProgress(day: number): number {
  return getDayInSeason(day) / (DAYS_PER_SEASON - 1);
}

export interface SeasonalTask {
  id: string;
  name: string;
  description: string;
  thought: string;
  roomId: RoomId;
  workDuration: number;
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};

export const SEASON_ICONS: Record<Season, string> = {
  spring: '\u{1F338}',
  summer: '\u{2600}\u{FE0F}',
  fall: '\u{1F342}',
  winter: '\u{2744}\u{FE0F}',
};

// ── Season-aware weather biases ─────────────────────────────
// Each season has a weighted pool of weather types.
// The TimeSystem picks from this pool instead of a static cycle.

export interface SeasonWeatherBias {
  weights: Record<WeatherType, number>; // relative weights (sum needn't be 1)
}

export const SEASON_WEATHER: Record<Season, SeasonWeatherBias> = {
  spring: { weights: { sunny: 4, rainy: 5, snowy: 1 } },
  summer: { weights: { sunny: 8, rainy: 2, snowy: 0 } },
  fall:   { weights: { sunny: 4, rainy: 4, snowy: 2 } },
  winter: { weights: { sunny: 2, rainy: 2, snowy: 6 } },
};

/** Pick a weather type using the season's weighted distribution. */
export function pickSeasonWeather(season: Season, rand: number): WeatherType {
  const { weights } = SEASON_WEATHER[season];
  const types: WeatherType[] = ['sunny', 'rainy', 'snowy'];
  const total = types.reduce((s, t) => s + weights[t], 0);
  let acc = 0;
  for (const t of types) {
    acc += weights[t] / total;
    if (rand < acc) return t;
  }
  return 'sunny';
}

// ── Seasonal gameplay modifiers ─────────────────────────────
// These affect robot efficiency, energy costs, and task speed.

export interface SeasonalModifiers {
  /** Multiplier on robot efficiency (energy drain while working). >1 = more drain. */
  efficiencyMult: number;
  /** Multiplier on battery drain rate. >1 = faster drain. */
  batteryDrainMult: number;
  /** Multiplier on task work speed. >1 = faster. */
  taskSpeedMult: number;
  /** Bonus/penalty to happiness per sim-minute. */
  happinessDelta: number;
  /** Temperature label for UI display. */
  temperature: string;
}

export const SEASON_MODIFIERS: Record<Season, SeasonalModifiers> = {
  spring: {
    efficiencyMult: 1.0,      // neutral
    batteryDrainMult: 1.0,    // neutral
    taskSpeedMult: 1.05,      // slightly faster (pleasant weather)
    happinessDelta: 0.005,    // slight happiness boost
    temperature: '65°F',
  },
  summer: {
    efficiencyMult: 1.15,     // overheating = more energy used
    batteryDrainMult: 1.1,    // heat drains battery faster
    taskSpeedMult: 0.95,      // sluggish in heat
    happinessDelta: 0.0,      // neutral
    temperature: '88°F',
  },
  fall: {
    efficiencyMult: 0.9,      // cool weather = efficient
    batteryDrainMult: 0.95,   // slightly better
    taskSpeedMult: 1.0,       // neutral
    happinessDelta: 0.003,    // cozy vibes
    temperature: '52°F',
  },
  winter: {
    efficiencyMult: 1.2,      // cold = more energy to stay warm
    batteryDrainMult: 1.15,   // cold drains battery
    taskSpeedMult: 0.9,       // slower in cold
    happinessDelta: -0.003,   // cold discomfort
    temperature: '28°F',
  },
};

// ── Daylight hours per season (sunrise/sunset hour) ─────────
export const SEASON_DAYLIGHT: Record<Season, { sunrise: number; sunset: number }> = {
  spring: { sunrise: 6, sunset: 19 },
  summer: { sunrise: 5, sunset: 21 },
  fall:   { sunrise: 7, sunset: 17 },
  winter: { sunrise: 8, sunset: 16 },
};

// ── Seasonal tasks ──────────────────────────────────────────

export const SEASONAL_TASKS: Record<Season, SeasonalTask[]> = {
  winter: [
    {
      id: 'snow-shoveling',
      name: 'Snow shoveling',
      description: 'Clearing snow from the walkways and porch.',
      thought: 'Need to clear the snow before it piles up more!',
      roomId: 'hallway',
      workDuration: 28,
    },
    {
      id: 'wrap-presents',
      name: 'Wrapping presents',
      description: 'Carefully wrapping holiday gifts with festive paper.',
      thought: 'Time to wrap some presents! I love making things look special.',
      roomId: 'living-room',
      workDuration: 30,
    },
    {
      id: 'hang-decorations',
      name: 'Hanging decorations',
      description: 'Putting up holiday lights and ornaments around the house.',
      thought: 'The house needs more holiday cheer! Let me hang some decorations.',
      roomId: 'hallway',
      workDuration: 25,
    },
    {
      id: 'bake-cookies',
      name: 'Baking holiday cookies',
      description: 'Mixing dough and baking festive cookies for the season.',
      thought: 'Nothing says winter like freshly baked cookies!',
      roomId: 'kitchen',
      workDuration: 28,
    },
    {
      id: 'defrost-pipes',
      name: 'Defrosting pipes',
      description: 'Running warm water to prevent frozen pipes in the cold.',
      thought: 'Better keep the pipes warm before they freeze!',
      roomId: 'bathroom',
      workDuration: 20,
    },
  ],
  spring: [
    {
      id: 'spring-cleaning',
      name: 'Deep spring cleaning',
      description: 'Doing the annual deep clean — every corner matters!',
      thought: 'Spring cleaning time! Everything must sparkle.',
      roomId: 'bathroom',
      workDuration: 32,
    },
    {
      id: 'easter-eggs',
      name: 'Setting up Easter eggs',
      description: 'Hiding colorful Easter eggs around the living room.',
      thought: 'Easter egg time! Where should I hide these...',
      roomId: 'living-room',
      workDuration: 22,
    },
    {
      id: 'plant-flowers',
      name: 'Planting indoor flowers',
      description: 'Potting fresh spring flowers to brighten up the room.',
      thought: 'Spring is here! These flowers will make the room bloom.',
      roomId: 'bedroom',
      workDuration: 24,
    },
    {
      id: 'open-windows',
      name: 'Airing out the house',
      description: 'Opening windows to let fresh spring air flow through.',
      thought: 'The house needs some fresh air after winter!',
      roomId: 'living-room',
      workDuration: 15,
    },
    {
      id: 'garden-prep',
      name: 'Preparing the garden',
      description: 'Turning soil and adding compost for spring planting.',
      thought: 'Time to get the garden ready for the growing season!',
      roomId: 'hallway',
      workDuration: 26,
    },
  ],
  summer: [
    {
      id: 'bbq-prep',
      name: 'BBQ preparation',
      description: 'Preparing marinades and sides for a summer BBQ feast.',
      thought: 'Summer BBQ prep! The best season for grilling.',
      roomId: 'kitchen',
      workDuration: 28,
    },
    {
      id: 'make-lemonade',
      name: 'Making lemonade',
      description: 'Squeezing fresh lemons for a cool summer drink.',
      thought: 'When life gives you lemons... make lemonade!',
      roomId: 'kitchen',
      workDuration: 18,
    },
    {
      id: 'summer-tidyup',
      name: 'Summer room refresh',
      description: 'Airing out rooms and refreshing for the warm season.',
      thought: 'Time to freshen things up for summer!',
      roomId: 'living-room',
      workDuration: 22,
    },
    {
      id: 'cool-down-fans',
      name: 'Setting up fans',
      description: 'Positioning fans and checking the AC for the heat wave.',
      thought: 'It is so hot! Need to get the cooling set up.',
      roomId: 'bedroom',
      workDuration: 16,
    },
    {
      id: 'pool-clean',
      name: 'Cleaning the kiddie pool',
      description: 'Scrubbing and refilling the backyard splash pool.',
      thought: 'The pool needs a good clean for splash time!',
      roomId: 'bathroom',
      workDuration: 20,
    },
  ],
  fall: [
    {
      id: 'rake-leaves',
      name: 'Raking leaves',
      description: 'Sweeping up fallen autumn leaves that blew inside.',
      thought: 'So many leaves everywhere! Time to rake them up.',
      roomId: 'hallway',
      workDuration: 22,
    },
    {
      id: 'carve-pumpkins',
      name: 'Carving pumpkins',
      description: 'Scooping and carving spooky jack-o-lanterns.',
      thought: 'Pumpkin carving time! Let me make a spooky face.',
      roomId: 'kitchen',
      workDuration: 30,
    },
    {
      id: 'make-cider',
      name: 'Making apple cider',
      description: 'Warming spiced apple cider on the stove — smells amazing!',
      thought: 'Hot apple cider is the perfect fall treat.',
      roomId: 'kitchen',
      workDuration: 24,
    },
    {
      id: 'weather-seal',
      name: 'Weather-sealing windows',
      description: 'Applying weather strips to keep the cold drafts out.',
      thought: 'Better seal these windows before winter arrives!',
      roomId: 'bedroom',
      workDuration: 26,
    },
    {
      id: 'harvest-garden',
      name: 'Harvesting the garden',
      description: 'Picking the last vegetables and herbs before frost.',
      thought: 'Need to harvest before the first frost hits!',
      roomId: 'kitchen',
      workDuration: 20,
    },
  ],
};

export const SEASON_THOUGHTS: Record<Season, string[]> = {
  winter: [
    'I love the cozy winter atmosphere in the house.',
    'The holiday season makes everything feel magical.',
    'Winter tasks are my favorite. So festive!',
    'Brrr... my circuits need extra warmth today.',
  ],
  spring: [
    'Spring has sprung! Everything feels fresh and new.',
    'The house deserves a fresh start this season.',
    'I can almost smell the flowers blooming!',
    'Rain showers make everything so green and lovely.',
  ],
  summer: [
    'Summer vibes! Time for some warm-weather activities.',
    'The long days of summer mean more time for fun tasks.',
    'Nothing beats a summer afternoon in a clean house.',
    'My cooling fans are working overtime in this heat!',
  ],
  fall: [
    'Fall is in the air! Time for cozy autumn activities.',
    'I love the warm colors of autumn.',
    'Sweater weather and pumpkin everything!',
    'The leaves are putting on quite a show this year.',
  ],
};
