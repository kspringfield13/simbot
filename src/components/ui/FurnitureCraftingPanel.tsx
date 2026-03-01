import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import {
  FURNITURE_RECIPES,
  MATERIAL_INFO,
  canAffordRecipe,
  getRecipeById,
  type MaterialType,
  type FurnitureRecipe,
} from '../../config/furnitureCrafting';

type Tab = 'recipes' | 'inventory' | 'placed';
type CategoryFilter = 'all' | 'seating' | 'table' | 'storage' | 'decor' | 'lighting';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'seating', label: 'Seating' },
  { id: 'table', label: 'Tables' },
  { id: 'storage', label: 'Storage' },
  { id: 'decor', label: 'Decor' },
  { id: 'lighting', label: 'Lights' },
];

const MAT_ORDER: MaterialType[] = ['wood', 'metal', 'fabric', 'glass'];

function MaterialBadge({ type, count, dim }: { type: MaterialType; count: number; dim?: boolean }) {
  const info = MATERIAL_INFO[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
        dim ? 'opacity-40' : ''
      }`}
      style={{ backgroundColor: `${info.color}15`, color: info.color }}
    >
      {info.icon} {count}
    </span>
  );
}

function MaterialInventoryBar() {
  const materials = useStore((s) => s.furnitureMaterials);

  return (
    <div className="flex items-center gap-2">
      {MAT_ORDER.map((mat) => (
        <div key={mat} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
          <span className="text-xs">{MATERIAL_INFO[mat].icon}</span>
          <span className="text-xs font-bold" style={{ color: MATERIAL_INFO[mat].color }}>
            {materials[mat]}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecipeCard({
  recipe,
  affordable,
  crafting,
  onCraft,
}: {
  recipe: FurnitureRecipe;
  affordable: boolean;
  crafting: boolean;
  onCraft: () => void;
}) {
  const materials = useStore((s) => s.furnitureMaterials);

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-all ${
        affordable && !crafting
          ? 'border-white/10 bg-white/5 hover:bg-white/10'
          : 'border-white/5 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{recipe.icon}</span>
            <span className="text-sm font-medium text-white">{recipe.name}</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/40">
              {recipe.category}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/35">{recipe.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(Object.entries(recipe.materials) as [MaterialType, number][]).map(([mat, qty]) => (
              <MaterialBadge key={mat} type={mat} count={qty} dim={(materials[mat] ?? 0) < qty} />
            ))}
            <span className="ml-1 text-[10px] text-white/25">
              ~{recipe.craftTimeSeconds}s
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={!affordable || crafting}
          onClick={onCraft}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
            affordable && !crafting
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'cursor-not-allowed bg-white/5 text-white/20'
          }`}
        >
          {crafting ? 'Busy...' : 'Craft'}
        </button>
      </div>
    </div>
  );
}

function CraftingProgress() {
  const activeCraft = useStore((s) => s.activeFurnitureCraft);
  const simMinutes = useStore((s) => s.simMinutes);
  const cancelFurnitureCraft = useStore((s) => s.cancelFurnitureCraft);

  if (!activeCraft) return null;

  const recipe = getRecipeById(activeCraft.recipeId);
  if (!recipe) return null;

  const elapsed = simMinutes - activeCraft.startedAt;
  const progress = Math.min(100, (elapsed / activeCraft.craftDuration) * 100);
  const remaining = Math.max(0, activeCraft.craftDuration - elapsed);

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{recipe.icon}</span>
          <div>
            <span className="text-sm font-medium text-amber-200">Crafting {recipe.name}...</span>
            <div className="text-[10px] text-amber-300/60">
              {remaining > 0 ? `~${Math.ceil(remaining * 60)}s remaining` : 'Finishing...'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={cancelFurnitureCraft}
          className="rounded-lg bg-red-500/20 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/30"
          title="Cancel (materials refunded)"
        >
          Cancel
        </button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function InventoryItem({
  item,
  onPlace,
  onUnplace,
  onDelete,
}: {
  item: { id: string; recipeId: string; placed: boolean; roomId: string | null };
  onPlace: () => void;
  onUnplace: () => void;
  onDelete: () => void;
}) {
  const recipe = getRecipeById(item.recipeId);
  if (!recipe) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
        item.placed
          ? 'border-green-500/30 bg-green-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{recipe.icon}</span>
        <div>
          <span className="text-sm font-medium text-white">{recipe.name}</span>
          {item.placed && item.roomId && (
            <div className="text-[10px] text-green-400/70">
              Placed in {item.roomId.replace(/-/g, ' ')}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1.5">
        {item.placed ? (
          <button
            type="button"
            onClick={onUnplace}
            className="rounded-lg bg-orange-500/20 px-2 py-1.5 text-[11px] text-orange-300 hover:bg-orange-500/30"
          >
            Pickup
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlace}
            className="rounded-lg bg-green-500/20 px-2 py-1.5 text-[11px] text-green-300 hover:bg-green-500/30"
          >
            Place
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-white/5 px-2 py-1.5 text-[11px] text-white/30 hover:bg-red-500/20 hover:text-red-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function PlacementDialog({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const rooms = useStore((s) => s.roomNeeds);
  const placeCraftedFurniture = useStore((s) => s.placeCraftedFurniture);

  const roomIds = Object.keys(rooms);

  const handlePlace = (roomId: string) => {
    // Place at a random offset within the room
    const x = Math.round((Math.random() * 4 - 2) * 10) / 10;
    const z = Math.round((Math.random() * 4 - 2) * 10) / 10;
    placeCraftedFurniture(itemId, roomId, [x, z]);
    onClose();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/95 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Choose a room
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {roomIds.map((rid) => (
          <button
            key={rid}
            type="button"
            onClick={() => handlePlace(rid)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            {rid.replace(/-/g, ' ')}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-white/5 py-1.5 text-[11px] text-white/30 hover:bg-white/10"
      >
        Cancel
      </button>
    </div>
  );
}

export function FurnitureCraftingPanel() {
  const show = useStore((s) => s.showFurnitureCrafting);
  const setShow = useStore((s) => s.setShowFurnitureCrafting);
  const materials = useStore((s) => s.furnitureMaterials);
  const craftedFurniture = useStore((s) => s.craftedFurniture);
  const activeCraft = useStore((s) => s.activeFurnitureCraft);
  const startFurnitureCraft = useStore((s) => s.startFurnitureCraft);
  const unplaceCraftedFurniture = useStore((s) => s.unplaceCraftedFurniture);
  const deleteCraftedFurniture = useStore((s) => s.deleteCraftedFurniture);

  const [tab, setTab] = useState<Tab>('recipes');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [placingItemId, setPlacingItemId] = useState<string | null>(null);

  if (!show) return null;

  const filteredRecipes = category === 'all'
    ? FURNITURE_RECIPES
    : FURNITURE_RECIPES.filter((r) => r.category === category);

  const unplacedItems = craftedFurniture.filter((i) => !i.placed);
  const placedItems = craftedFurniture.filter((i) => i.placed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      {/* Panel */}
      <div className="relative w-[500px] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔨</span>
            <h2 className="text-lg font-semibold text-white">Furniture Workshop</h2>
          </div>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Material inventory bar */}
        <div className="flex items-center justify-center border-b border-white/10 px-4 py-2.5">
          <MaterialInventoryBar />
        </div>

        {/* Active craft progress */}
        {activeCraft && (
          <div className="border-b border-white/10 px-4 py-2.5">
            <CraftingProgress />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab('recipes')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'recipes'
                ? 'border-b-2 border-amber-400 text-amber-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Recipes
          </button>
          <button
            type="button"
            onClick={() => setTab('inventory')}
            className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'inventory'
                ? 'border-b-2 border-green-400 text-green-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Inventory
            {unplacedItems.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-500/30 px-1 text-[9px] font-bold text-green-300">
                {unplacedItems.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('placed')}
            className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'placed'
                ? 'border-b-2 border-blue-400 text-blue-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Placed
            {placedItems.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500/30 px-1 text-[9px] font-bold text-blue-300">
                {placedItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {/* ── Recipes ──────────────────────────── */}
          {tab === 'recipes' && (
            <div className="space-y-3">
              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      category === cat.id
                        ? 'border border-white/20 bg-white/10 text-white'
                        : 'border border-white/5 bg-white/[0.03] text-white/40 hover:text-white/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Recipe list */}
              <div className="space-y-1.5">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    affordable={canAffordRecipe(materials, recipe)}
                    crafting={!!activeCraft}
                    onCraft={() => startFurnitureCraft(recipe.id)}
                  />
                ))}
              </div>

              <p className="text-center text-[10px] text-white/20">
                Complete tasks to earn materials for crafting
              </p>
            </div>
          )}

          {/* ── Inventory (unplaced) ──────────────── */}
          {tab === 'inventory' && (
            <div className="space-y-2">
              {placingItemId && (
                <PlacementDialog
                  itemId={placingItemId}
                  onClose={() => setPlacingItemId(null)}
                />
              )}

              {unplacedItems.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-3xl">🪑</div>
                  <p className="text-sm text-white/40">No furniture in inventory</p>
                  <p className="mt-1 text-xs text-white/25">
                    Craft furniture from the Recipes tab!
                  </p>
                </div>
              ) : (
                unplacedItems.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    onPlace={() => setPlacingItemId(item.id)}
                    onUnplace={() => {}}
                    onDelete={() => deleteCraftedFurniture(item.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Placed furniture ──────────────────── */}
          {tab === 'placed' && (
            <div className="space-y-2">
              {placedItems.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-3xl">🏠</div>
                  <p className="text-sm text-white/40">No placed furniture yet</p>
                  <p className="mt-1 text-xs text-white/25">
                    Craft items and place them in rooms!
                  </p>
                </div>
              ) : (
                placedItems.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    onPlace={() => {}}
                    onUnplace={() => unplaceCraftedFurniture(item.id)}
                    onDelete={() => deleteCraftedFurniture(item.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            {tab === 'recipes'
              ? 'Robots earn materials when they complete tasks'
              : tab === 'inventory'
                ? 'Place furniture in rooms to decorate your home'
                : 'Pick up furniture to move it back to inventory'}
          </p>
        </div>
      </div>
    </div>
  );
}
