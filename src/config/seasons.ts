import type { RoomId, Season } from '../types';

export const DAYS_PER_SEASON = 3;
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4; // 12 sim-days = full year

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

export function getSeasonForDay(day: number): Season {
  const seasonIndex = Math.floor(((day - 1) % DAYS_PER_YEAR) / DAYS_PER_SEASON);
  return SEASON_ORDER[seasonIndex];
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

export const SEASONAL_TASKS: Record<Season, SeasonalTask[]> = {
  winter: [
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
  ],
  spring: [
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
      id: 'spring-cleaning',
      name: 'Deep spring cleaning',
      description: 'Doing the annual deep clean — every corner matters!',
      thought: 'Spring cleaning time! Everything must sparkle.',
      roomId: 'bathroom',
      workDuration: 32,
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
  ],
  fall: [
    {
      id: 'carve-pumpkins',
      name: 'Carving pumpkins',
      description: 'Scooping and carving spooky jack-o-lanterns.',
      thought: 'Pumpkin carving time! Let me make a spooky face.',
      roomId: 'kitchen',
      workDuration: 30,
    },
    {
      id: 'rake-leaves',
      name: 'Raking leaves',
      description: 'Sweeping up fallen autumn leaves that blew inside.',
      thought: 'So many leaves everywhere! Time to rake them up.',
      roomId: 'hallway',
      workDuration: 22,
    },
    {
      id: 'make-cider',
      name: 'Making apple cider',
      description: 'Warming spiced apple cider on the stove — smells amazing!',
      thought: 'Hot apple cider is the perfect fall treat.',
      roomId: 'kitchen',
      workDuration: 24,
    },
  ],
};

export const SEASON_THOUGHTS: Record<Season, string[]> = {
  winter: [
    'I love the cozy winter atmosphere in the house.',
    'The holiday season makes everything feel magical.',
    'Winter tasks are my favorite. So festive!',
  ],
  spring: [
    'Spring has sprung! Everything feels fresh and new.',
    'The house deserves a fresh start this season.',
    'I can almost smell the flowers blooming!',
  ],
  summer: [
    'Summer vibes! Time for some warm-weather activities.',
    'The long days of summer mean more time for fun tasks.',
    'Nothing beats a summer afternoon in a clean house.',
  ],
  fall: [
    'Fall is in the air! Time for cozy autumn activities.',
    'I love the warm colors of autumn.',
    'Sweater weather and pumpkin everything!',
  ],
};
