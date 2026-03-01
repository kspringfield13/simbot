// ── Furniture Crafting System ──────────────────────────────────
// Players earn materials (wood, metal, fabric, glass) as robots complete tasks.
// Materials are combined into furniture items via recipes.
// Crafted furniture can be placed in rooms via the rearrangement mode.

export type MaterialType = 'wood' | 'metal' | 'fabric' | 'glass';

export interface MaterialInventory {
  wood: number;
  metal: number;
  fabric: number;
  glass: number;
}

export interface FurnitureRecipe {
  id: string;
  name: string;
  description: string;
  materials: Partial<Record<MaterialType, number>>;
  craftTimeSeconds: number; // sim-seconds to craft
  icon: string;
  category: 'seating' | 'table' | 'storage' | 'decor' | 'lighting';
}

export interface CraftedFurnitureItem {
  id: string;       // unique instance id
  recipeId: string;  // which recipe it was crafted from
  craftedAt: number; // Date.now()
  placed: boolean;   // whether placed in a room
  roomId: string | null;
  position: [number, number] | null; // x, z placement
}

export interface ActiveCraft {
  recipeId: string;
  startedAt: number;   // sim-minutes when started
  craftDuration: number; // sim-minutes to complete
}

export const MATERIAL_INFO: Record<MaterialType, { name: string; icon: string; color: string }> = {
  wood:   { name: 'Wood',   icon: '🪵', color: '#d97706' },
  metal:  { name: 'Metal',  icon: '⚙️', color: '#94a3b8' },
  fabric: { name: 'Fabric', icon: '🧵', color: '#c084fc' },
  glass:  { name: 'Glass',  icon: '💎', color: '#22d3ee' },
};

export const FURNITURE_RECIPES: FurnitureRecipe[] = [
  {
    id: 'craft-bookshelf',
    name: 'Bookshelf',
    description: 'A sturdy wooden bookshelf for any room',
    materials: { wood: 8, metal: 2 },
    craftTimeSeconds: 30,
    icon: '📚',
    category: 'storage',
  },
  {
    id: 'craft-armchair',
    name: 'Comfy Armchair',
    description: 'A plush armchair with soft fabric upholstery',
    materials: { wood: 4, fabric: 6 },
    craftTimeSeconds: 25,
    icon: '🪑',
    category: 'seating',
  },
  {
    id: 'craft-glass-table',
    name: 'Glass Coffee Table',
    description: 'An elegant glass-topped coffee table',
    materials: { glass: 6, metal: 4 },
    craftTimeSeconds: 35,
    icon: '🪟',
    category: 'table',
  },
  {
    id: 'craft-floor-lamp',
    name: 'Floor Lamp',
    description: 'A tall floor lamp with warm ambient lighting',
    materials: { metal: 5, fabric: 3 },
    craftTimeSeconds: 20,
    icon: '💡',
    category: 'lighting',
  },
  {
    id: 'craft-cabinet',
    name: 'Storage Cabinet',
    description: 'A spacious cabinet with metal handles',
    materials: { wood: 10, metal: 4, glass: 2 },
    craftTimeSeconds: 45,
    icon: '🗄️',
    category: 'storage',
  },
  {
    id: 'craft-dining-table',
    name: 'Dining Table',
    description: 'A large wooden dining table for gatherings',
    materials: { wood: 12, metal: 3 },
    craftTimeSeconds: 40,
    icon: '🍽️',
    category: 'table',
  },
  {
    id: 'craft-sofa',
    name: 'Velvet Sofa',
    description: 'A luxurious three-seater sofa',
    materials: { wood: 6, fabric: 10, metal: 2 },
    craftTimeSeconds: 50,
    icon: '🛋️',
    category: 'seating',
  },
  {
    id: 'craft-plant-stand',
    name: 'Plant Stand',
    description: 'A decorative stand for potted plants',
    materials: { wood: 3, metal: 2 },
    craftTimeSeconds: 15,
    icon: '🌿',
    category: 'decor',
  },
  {
    id: 'craft-mirror',
    name: 'Wall Mirror',
    description: 'A large framed mirror with glass panels',
    materials: { glass: 8, metal: 3, wood: 2 },
    craftTimeSeconds: 30,
    icon: '🪞',
    category: 'decor',
  },
  {
    id: 'craft-chandelier',
    name: 'Chandelier',
    description: 'An ornate ceiling light with glass crystals',
    materials: { glass: 10, metal: 6 },
    craftTimeSeconds: 55,
    icon: '✨',
    category: 'lighting',
  },
];

/** Get a recipe by ID */
export function getRecipeById(id: string): FurnitureRecipe | undefined {
  return FURNITURE_RECIPES.find((r) => r.id === id);
}

/** Check if player can afford a recipe */
export function canAffordRecipe(inventory: MaterialInventory, recipe: FurnitureRecipe): boolean {
  for (const [mat, qty] of Object.entries(recipe.materials) as [MaterialType, number][]) {
    if ((inventory[mat] ?? 0) < qty) return false;
  }
  return true;
}

/** Material drop table — which materials each task type tends to yield */
import type { TaskType } from '../types';

const TASK_MATERIAL_WEIGHTS: Partial<Record<TaskType, Partial<Record<MaterialType, number>>>> = {
  cleaning:     { fabric: 3, glass: 1 },
  vacuuming:    { fabric: 2, metal: 1 },
  dishes:       { glass: 3, metal: 1 },
  laundry:      { fabric: 4 },
  organizing:   { wood: 2, metal: 2 },
  cooking:      { metal: 2, wood: 1, glass: 1 },
  'bed-making': { fabric: 3, wood: 1 },
  scrubbing:    { glass: 2, metal: 2 },
  sweeping:     { wood: 3, fabric: 1 },
  mowing:       { wood: 3, metal: 1 },
  watering:     { wood: 2, glass: 2 },
  'leaf-blowing':  { wood: 4 },
  weeding:      { wood: 3, fabric: 1 },
  'grocery-list':  { wood: 1, metal: 1, fabric: 1, glass: 1 },
  general:      { wood: 1, metal: 1, fabric: 1, glass: 1 },
  seasonal:     { wood: 2, metal: 2 },
  'feeding-fish':    { glass: 2, wood: 1 },
  'feeding-hamster': { wood: 2, fabric: 1 },
};

/** Roll material drops for a completed task. Returns 1-3 materials. */
export function rollMaterialDrop(taskType: TaskType): Partial<MaterialInventory> {
  const weights = TASK_MATERIAL_WEIGHTS[taskType] ?? { wood: 1, metal: 1, fabric: 1, glass: 1 };
  const pool: MaterialType[] = [];
  for (const [mat, w] of Object.entries(weights) as [MaterialType, number][]) {
    for (let i = 0; i < w; i++) pool.push(mat);
  }

  const drops: Partial<MaterialInventory> = {};
  // Drop 1-3 materials per task
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const mat = pool[Math.floor(Math.random() * pool.length)];
    drops[mat] = (drops[mat] ?? 0) + 1;
  }
  return drops;
}

// ── localStorage persistence ──────────────────────────────────
const FURNITURE_CRAFTING_KEY = 'simbot-furniture-crafting';

export interface FurnitureCraftingData {
  materials: MaterialInventory;
  craftedItems: CraftedFurnitureItem[];
  activeCraft: ActiveCraft | null;
}

export function loadFurnitureCraftingData(): FurnitureCraftingData {
  try {
    const stored = localStorage.getItem(FURNITURE_CRAFTING_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        materials: parsed.materials ?? { wood: 0, metal: 0, fabric: 0, glass: 0 },
        craftedItems: parsed.craftedItems ?? [],
        activeCraft: parsed.activeCraft ?? null,
      };
    }
  } catch { /* ignore */ }
  return { materials: { wood: 0, metal: 0, fabric: 0, glass: 0 }, craftedItems: [], activeCraft: null };
}

export function saveFurnitureCraftingData(data: FurnitureCraftingData) {
  try {
    localStorage.setItem(FURNITURE_CRAFTING_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}
