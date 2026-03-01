// ── Robot Pets Configuration ─────────────────────────────────

export type PetId = 'fish' | 'hamster';

export interface PetConfig {
  id: PetId;
  name: string;
  location: string;          // roomId where the pet lives
  feedTaskType: 'feeding-fish' | 'feeding-hamster';
  feedDuration: number;       // sim-minutes for feeding task
  happinessDecayRate: number; // happiness lost per sim-minute
  feedHappinessBoost: number; // happiness gained per feeding
  position: [number, number, number]; // 3D position in the room
}

export const PET_CONFIGS: Record<PetId, PetConfig> = {
  fish: {
    id: 'fish',
    name: 'Fish Tank',
    location: 'living-room',
    feedTaskType: 'feeding-fish',
    feedDuration: 8,
    happinessDecayRate: 0.04,
    feedHappinessBoost: 30,
    position: [-3, 0, -18.5],
  },
  hamster: {
    id: 'hamster',
    name: 'Hamster',
    location: 'bedroom',
    feedTaskType: 'feeding-hamster',
    feedDuration: 6,
    happinessDecayRate: 0.05,
    feedHappinessBoost: 35,
    position: [-14, 0, 8],
  },
};

export const PET_IDS: PetId[] = ['fish', 'hamster'];

export interface PetState {
  happiness: number;      // 0-100
  totalFeedings: number;
  lastFedAt: number;      // sim-minutes
}

export function createInitialPetState(): PetState {
  return {
    happiness: 70,
    totalFeedings: 0,
    lastFedAt: 0,
  };
}

// Thoughts robots have while feeding pets
export const PET_THOUGHTS = {
  fish: [
    'The fish are swimming up to greet me! Feeding time.',
    'A few sprinkles of food... there you go, little ones.',
    'I love watching them dart around at feeding time.',
    'The fish tank is so peaceful. I could watch them for hours.',
    'Dinner is served, my aquatic friends!',
  ],
  hamster: [
    'Hey there, little buddy! Hungry?',
    'The hamster is running on its wheel again. So much energy!',
    'Fresh seeds and a tiny water refill. You\'re all set.',
    'Look at those little cheeks! Storing food for later, huh?',
    'The hamster squeaks when it sees me. I think it knows I bring food.',
  ],
};
