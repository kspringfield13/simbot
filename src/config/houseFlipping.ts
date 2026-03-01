// ── House Flipping Configuration ─────────────────────────────────

// ── Types ──────────────────────────────────────────────

export type HouseCondition = 'condemned' | 'rundown' | 'dated' | 'fair';
export type RenovationCategory = 'cleaning' | 'repair' | 'paint' | 'furniture' | 'landscaping';

export interface HouseFeature {
  id: string;
  name: string;
  icon: string;
  category: RenovationCategory;
  /** Cost to renovate this feature */
  renovationCost: number;
  /** How much value this adds once renovated */
  valueAdd: number;
  /** Seconds of work to renovate */
  workTime: number;
}

export interface HouseForSale {
  id: string;
  name: string;
  address: string;
  emoji: string;
  /** Purchase price */
  price: number;
  condition: HouseCondition;
  /** Base market value when fully renovated */
  marketValue: number;
  /** Rooms in this house */
  rooms: number;
  /** Square footage */
  sqft: number;
  /** Features that need renovation */
  features: HouseFeature[];
  /** Flavor text */
  description: string;
}

export interface OwnedHouse {
  house: HouseForSale;
  purchasedAt: number;
  renovatedFeatures: string[]; // feature IDs that have been completed
  activeRenovation: {
    featureId: string;
    startedAt: number;
    completesAt: number;
  } | null;
  listed: boolean;
  soldAt: number | null;
  soldPrice: number | null;
}

export interface FlipHistoryEntry {
  houseId: string;
  houseName: string;
  purchasePrice: number;
  totalRenovationCost: number;
  salePrice: number;
  profit: number;
  completedAt: number;
}

// ── Feature Templates ─────────────────────────────────

const FEATURE_TEMPLATES: Record<string, Omit<HouseFeature, 'id'>> = {
  'dirty-floors': { name: 'Deep Clean Floors', icon: '🧹', category: 'cleaning', renovationCost: 8, valueAdd: 25, workTime: 15 },
  'grimy-kitchen': { name: 'Scrub Kitchen', icon: '🍳', category: 'cleaning', renovationCost: 12, valueAdd: 35, workTime: 20 },
  'dusty-rooms': { name: 'Dust & Vacuum', icon: '🧽', category: 'cleaning', renovationCost: 5, valueAdd: 15, workTime: 10 },
  'moldy-bathroom': { name: 'Clean Bathroom', icon: '🚿', category: 'cleaning', renovationCost: 15, valueAdd: 40, workTime: 25 },
  'broken-pipes': { name: 'Fix Plumbing', icon: '🔧', category: 'repair', renovationCost: 30, valueAdd: 60, workTime: 35 },
  'cracked-walls': { name: 'Patch Walls', icon: '🧱', category: 'repair', renovationCost: 20, valueAdd: 45, workTime: 25 },
  'faulty-wiring': { name: 'Rewire Electric', icon: '⚡', category: 'repair', renovationCost: 35, valueAdd: 70, workTime: 40 },
  'leaky-roof': { name: 'Repair Roof', icon: '🏠', category: 'repair', renovationCost: 40, valueAdd: 80, workTime: 45 },
  'peeling-paint': { name: 'Paint Interior', icon: '🎨', category: 'paint', renovationCost: 15, valueAdd: 35, workTime: 20 },
  'faded-exterior': { name: 'Paint Exterior', icon: '🖌️', category: 'paint', renovationCost: 25, valueAdd: 50, workTime: 30 },
  'ugly-trim': { name: 'Refinish Trim', icon: '✨', category: 'paint', renovationCost: 10, valueAdd: 20, workTime: 15 },
  'bare-rooms': { name: 'Stage Furniture', icon: '🛋️', category: 'furniture', renovationCost: 25, valueAdd: 55, workTime: 25 },
  'old-appliances': { name: 'New Appliances', icon: '🏗️', category: 'furniture', renovationCost: 35, valueAdd: 65, workTime: 30 },
  'no-fixtures': { name: 'Install Fixtures', icon: '💡', category: 'furniture', renovationCost: 20, valueAdd: 40, workTime: 20 },
  'overgrown-yard': { name: 'Clear Yard', icon: '🌿', category: 'landscaping', renovationCost: 10, valueAdd: 30, workTime: 15 },
  'dead-garden': { name: 'Plant Garden', icon: '🌸', category: 'landscaping', renovationCost: 15, valueAdd: 35, workTime: 20 },
  'cracked-driveway': { name: 'Fix Driveway', icon: '🛣️', category: 'landscaping', renovationCost: 20, valueAdd: 45, workTime: 25 },
};

function feat(templateId: string): HouseFeature {
  const tmpl = FEATURE_TEMPLATES[templateId];
  return { id: templateId, ...tmpl };
}

// ── Condition Multipliers ──────────────────────────────

const CONDITION_CONFIG: Record<HouseCondition, { priceMultiplier: number; label: string; color: string }> = {
  condemned: { priceMultiplier: 0.3, label: 'Condemned', color: '#ef4444' },
  rundown: { priceMultiplier: 0.45, label: 'Run-Down', color: '#f97316' },
  dated: { priceMultiplier: 0.6, label: 'Dated', color: '#eab308' },
  fair: { priceMultiplier: 0.75, label: 'Fair', color: '#22c55e' },
};

export function getConditionConfig(condition: HouseCondition) {
  return CONDITION_CONFIG[condition];
}

// ── House Name / Address Generation ───────────────────

const STREET_NAMES = [
  'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Birch', 'Willow', 'Aspen',
  'Cherry', 'Walnut', 'Magnolia', 'Cypress', 'Chestnut', 'Spruce', 'Holly',
  'Rosewood', 'Ivy', 'Hazel', 'Laurel', 'Poplar',
];

const STREET_TYPES = ['St', 'Ave', 'Ln', 'Dr', 'Ct', 'Way', 'Rd', 'Blvd'];

const HOUSE_NAMES = [
  'The Fixer-Upper', 'Dusty Manor', 'Cobweb Cottage', 'Creaky House',
  'The Money Pit', 'Rusty Residence', 'Shabby Chalet', 'Grimy Grove',
  'Tumbledown Terrace', 'Dilapidated Den', 'Mossy Mansion', 'Peeling Palace',
  'The Diamond in the Rough', 'Forgotten Farmhouse', 'Crumbling Castle',
  'Weedy Cottage', 'Broken Dreams Bungalow', 'Dustbunny Villa',
  'The Handyman Special', 'Ramshackle Ranch',
];

const HOUSE_EMOJIS = ['🏚️', '🏠', '🏡', '🏘️', '🏗️'];

// ── Seeded random for consistent generation ───────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// ── House Generation ─────────────────────────────────

const FEATURE_KEYS = Object.keys(FEATURE_TEMPLATES);

export function generateHousesForSale(seed: number, count: number = 6): HouseForSale[] {
  const rng = seededRandom(seed);
  const houses: HouseForSale[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = pick(HOUSE_NAMES, rng);
    while (usedNames.has(name)) name = pick(HOUSE_NAMES, rng);
    usedNames.add(name);

    const streetNum = Math.floor(rng() * 900) + 100;
    const street = pick(STREET_NAMES, rng);
    const streetType = pick(STREET_TYPES, rng);
    const address = `${streetNum} ${street} ${streetType}`;

    const conditions: HouseCondition[] = ['condemned', 'rundown', 'dated', 'fair'];
    const condition = pick(conditions, rng);
    const config = CONDITION_CONFIG[condition];

    const rooms = condition === 'condemned' ? 2 + Math.floor(rng() * 2) :
                  condition === 'rundown' ? 3 + Math.floor(rng() * 2) :
                  condition === 'dated' ? 3 + Math.floor(rng() * 3) :
                  4 + Math.floor(rng() * 3);

    const sqft = rooms * (400 + Math.floor(rng() * 300));

    const numFeatures = condition === 'condemned' ? 5 + Math.floor(rng() * 3) :
                        condition === 'rundown' ? 4 + Math.floor(rng() * 3) :
                        condition === 'dated' ? 3 + Math.floor(rng() * 2) :
                        2 + Math.floor(rng() * 2);

    const features = pickN(FEATURE_KEYS, numFeatures, rng).map(feat);
    const totalRenovationValue = features.reduce((sum, f) => sum + f.valueAdd, 0);
    const totalRenovationCost = features.reduce((sum, f) => sum + f.renovationCost, 0);

    const baseValue = 150 + Math.floor(rng() * 200);
    const marketValue = baseValue + totalRenovationValue;
    const price = Math.round((baseValue + totalRenovationCost * 0.3) * config.priceMultiplier);

    houses.push({
      id: `house-${seed}-${i}`,
      name,
      address,
      emoji: pick(HOUSE_EMOJIS, rng),
      price,
      condition,
      marketValue,
      rooms,
      sqft,
      features,
      description: generateDescription(condition, rooms, rng),
    });
  }

  return houses.sort((a, b) => a.price - b.price);
}

function generateDescription(condition: HouseCondition, rooms: number, rng: () => number): string {
  const descriptions: Record<HouseCondition, string[]> = {
    condemned: [
      'This place has seen better days... much better days. Bring a hard hat.',
      'Condemned by the city, but nothing a dedicated robot crew can\'t fix!',
      'The neighbors call it haunted. We call it an opportunity.',
    ],
    rundown: [
      'Needs serious TLC, but the bones are good. Great flip potential!',
      'A classic fixer-upper with tons of character (and dust).',
      'Previous owner left in a hurry. Your robots will love the challenge.',
    ],
    dated: [
      'Stuck in the past but structurally sound. A fresh coat of paint goes a long way.',
      'Retro charm meets modern neglect. Update and profit!',
      'Everything works, it just looks like a time capsule.',
    ],
    fair: [
      'Minor cosmetic work needed. Quick flip potential!',
      'Almost move-in ready. A little robot magic and it\'ll shine.',
      'Light renovation needed. Should be a smooth flip.',
    ],
  };

  return pick(descriptions[condition], rng) + ` ${rooms} rooms of potential.`;
}

// ── Calculate house value ─────────────────────────────

export function calculateCurrentValue(owned: OwnedHouse): number {
  const baseValue = owned.house.price;
  const renovatedValue = owned.house.features
    .filter((f) => owned.renovatedFeatures.includes(f.id))
    .reduce((sum, f) => sum + f.valueAdd, 0);

  // Partial renovation gives partial value boost
  const totalPossibleValue = owned.house.marketValue - owned.house.price;
  const progress = owned.house.features.length > 0
    ? owned.renovatedFeatures.length / owned.house.features.length
    : 0;

  // Non-linear: fully renovated is worth market value, partial is less
  const bonus = progress >= 1 ? totalPossibleValue : renovatedValue * 0.8;
  return Math.round(baseValue + bonus);
}

export function calculateProfit(owned: OwnedHouse, salePrice: number): number {
  const renovationCost = owned.house.features
    .filter((f) => owned.renovatedFeatures.includes(f.id))
    .reduce((sum, f) => sum + f.renovationCost, 0);

  return salePrice - owned.house.price - renovationCost;
}

export function getTotalRenovationCost(owned: OwnedHouse): number {
  return owned.house.features
    .filter((f) => owned.renovatedFeatures.includes(f.id))
    .reduce((sum, f) => sum + f.renovationCost, 0);
}

// ── Renovation progress ───────────────────────────────

export function getRenovationProgress(owned: OwnedHouse): number {
  if (owned.house.features.length === 0) return 1;
  return owned.renovatedFeatures.length / owned.house.features.length;
}

export function getCategoryProgress(owned: OwnedHouse): Record<RenovationCategory, { done: number; total: number }> {
  const cats: Record<RenovationCategory, { done: number; total: number }> = {
    cleaning: { done: 0, total: 0 },
    repair: { done: 0, total: 0 },
    paint: { done: 0, total: 0 },
    furniture: { done: 0, total: 0 },
    landscaping: { done: 0, total: 0 },
  };

  for (const f of owned.house.features) {
    cats[f.category].total++;
    if (owned.renovatedFeatures.includes(f.id)) {
      cats[f.category].done++;
    }
  }

  return cats;
}

// ── Category colors and icons ─────────────────────────

export const CATEGORY_INFO: Record<RenovationCategory, { icon: string; color: string; label: string }> = {
  cleaning: { icon: '🧹', color: '#60a5fa', label: 'Cleaning' },
  repair: { icon: '🔧', color: '#f97316', label: 'Repairs' },
  paint: { icon: '🎨', color: '#a78bfa', label: 'Painting' },
  furniture: { icon: '🛋️', color: '#34d399', label: 'Furnishing' },
  landscaping: { icon: '🌿', color: '#22c55e', label: 'Landscaping' },
};
