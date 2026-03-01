import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../stores/useStore';

// ── Cooking Mini-Game: Ingredient Matching + Timing ───────────────────

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface Recipe {
  name: string;
  emoji: string;
  ingredients: string[]; // ingredient ids in order
  timeLimit: number; // seconds
  reward: number;
}

const ALL_INGREDIENTS: Ingredient[] = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅', color: '#ef4444' },
  { id: 'onion', name: 'Onion', emoji: '🧅', color: '#a78bfa' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', color: '#f97316' },
  { id: 'egg', name: 'Egg', emoji: '🥚', color: '#fef3c7' },
  { id: 'cheese', name: 'Cheese', emoji: '🧀', color: '#fbbf24' },
  { id: 'pepper', name: 'Pepper', emoji: '🌶️', color: '#dc2626' },
  { id: 'mushroom', name: 'Mushroom', emoji: '🍄', color: '#92400e' },
  { id: 'bread', name: 'Bread', emoji: '🍞', color: '#d97706' },
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', color: '#22c55e' },
  { id: 'fish', name: 'Fish', emoji: '🐟', color: '#3b82f6' },
  { id: 'rice', name: 'Rice', emoji: '🍚', color: '#f5f5f4' },
  { id: 'butter', name: 'Butter', emoji: '🧈', color: '#fde68a' },
];

const RECIPES: Recipe[] = [
  { name: 'Omelette', emoji: '🍳', ingredients: ['egg', 'cheese', 'mushroom'], timeLimit: 12, reward: 15 },
  { name: 'Salad', emoji: '🥗', ingredients: ['lettuce', 'tomato', 'carrot', 'onion'], timeLimit: 15, reward: 20 },
  { name: 'Toast', emoji: '🥪', ingredients: ['bread', 'cheese', 'lettuce'], timeLimit: 10, reward: 12 },
  { name: 'Soup', emoji: '🍲', ingredients: ['tomato', 'onion', 'carrot', 'pepper'], timeLimit: 16, reward: 22 },
  { name: 'Sushi', emoji: '🍣', ingredients: ['rice', 'fish', 'lettuce'], timeLimit: 12, reward: 18 },
  { name: 'Pasta', emoji: '🍝', ingredients: ['tomato', 'mushroom', 'cheese', 'onion'], timeLimit: 16, reward: 25 },
  { name: 'Fried Rice', emoji: '🍛', ingredients: ['rice', 'egg', 'carrot', 'onion'], timeLimit: 14, reward: 20 },
  { name: 'Bruschetta', emoji: '🥖', ingredients: ['bread', 'tomato', 'butter'], timeLimit: 10, reward: 14 },
];

type GamePhase = 'ready' | 'playing' | 'cooking' | 'success' | 'failed';

export function CookingMiniGame() {
  const show = useStore((s) => s.showCookingGame);
  const setShow = useStore((s) => s.setShowCookingGame);
  const addCoins = useStore((s) => s.addCoins);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addCoinAnimation = useStore((s) => s.addCoinAnimation);
  const addNotification = useStore((s) => s.addNotification);

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cookProgress, setCookProgress] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number>(0);

  const startGame = useCallback(() => {
    const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    setRecipe(r);
    setSelectedIngredients([]);
    setScore(0);
    setCookProgress(0);

    // Build ingredient pool: recipe ingredients + random distractors
    const recipeIngs = r.ingredients.map((id) => ALL_INGREDIENTS.find((i) => i.id === id)!);
    const distractors = ALL_INGREDIENTS
      .filter((i) => !r.ingredients.includes(i.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(3, 8 - r.ingredients.length));
    setAvailableIngredients([...recipeIngs, ...distractors].sort(() => Math.random() - 0.5));
    setTimeLeft(r.timeLimit);
    setPhase('playing');
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('failed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Cooking animation
  useEffect(() => {
    if (phase !== 'cooking') return;
    const id = window.setInterval(() => {
      setCookProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setPhase('success');
          return 100;
        }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  const selectIngredient = useCallback(
    (ingredientId: string) => {
      if (phase !== 'playing') return;

      const nextIdx = selectedIngredients.length;
      const expectedId = recipe.ingredients[nextIdx];

      if (ingredientId === expectedId) {
        const newSelected = [...selectedIngredients, ingredientId];
        setSelectedIngredients(newSelected);

        // All ingredients selected correctly?
        if (newSelected.length === recipe.ingredients.length) {
          clearInterval(timerRef.current);
          setPhase('cooking');
        }
      } else {
        // Wrong ingredient — penalty
        setTimeLeft((t) => Math.max(1, t - 2));
      }
    },
    [phase, selectedIngredients, recipe],
  );

  // Award coins on success
  useEffect(() => {
    if (phase !== 'success') return;
    const timeBonus = Math.floor(timeLeft * 1.5);
    const total = recipe.reward + timeBonus;
    setScore(total);
    addCoins(total);
    recordTransaction('income', 'bonus', total, `Mini-game: Cooking ${recipe.name}`);
    addCoinAnimation(total);
    addNotification({ type: 'success', title: 'Dish Complete!', message: `${recipe.emoji} ${recipe.name} earned ${total} coins!` });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('ready');
    setShow(false);
  }, [setShow]);

  if (!show) return null;

  const timePct = recipe.timeLimit > 0 ? (timeLeft / recipe.timeLimit) * 100 : 0;
  const timeColor = timePct > 50 ? 'bg-green-500' : timePct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[480px] max-h-[85vh] overflow-hidden rounded-2xl border border-orange-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍳</span>
            <span className="text-base font-semibold text-white">Cooking Challenge</span>
          </div>
          <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Ready phase */}
          {phase === 'ready' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-6xl">🍳</div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Chef Challenge</h3>
                <p className="mt-2 text-sm text-white/60">
                  Match the ingredients in the right order before time runs out!
                  Pick carefully — wrong ingredients cost you 2 seconds.
                </p>
              </div>
              <button
                onClick={startGame}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:from-orange-400 hover:to-amber-400"
              >
                Start Cooking!
              </button>
            </div>
          )}

          {/* Playing phase */}
          {phase === 'playing' && (
            <div className="flex flex-col gap-4">
              {/* Timer bar */}
              <div className="relative h-3 overflow-hidden rounded-full bg-gray-800">
                <div className={`h-full ${timeColor} transition-all duration-1000`} style={{ width: `${timePct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {timeLeft}s
                </span>
              </div>

              {/* Recipe target */}
              <div className="rounded-xl border border-orange-400/20 bg-orange-950/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                  <span className="text-lg">{recipe.emoji}</span>
                  Make: {recipe.name}
                </div>
                <div className="mt-3 flex gap-2">
                  {recipe.ingredients.map((ingId, i) => {
                    const ing = ALL_INGREDIENTS.find((x) => x.id === ingId)!;
                    const isSelected = i < selectedIngredients.length;
                    const isCurrent = i === selectedIngredients.length;
                    return (
                      <div
                        key={i}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl transition-all ${
                          isSelected
                            ? 'border-green-400 bg-green-900/40 scale-110'
                            : isCurrent
                            ? 'border-orange-400 bg-orange-900/30 animate-pulse'
                            : 'border-white/10 bg-gray-800/50'
                        }`}
                      >
                        {isSelected ? ing.emoji : '?'}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Step {selectedIngredients.length + 1} of {recipe.ingredients.length} — Pick the next ingredient!
                </p>
              </div>

              {/* Ingredient grid */}
              <div className="grid grid-cols-4 gap-2">
                {availableIngredients.map((ing) => {
                  const used = selectedIngredients.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      disabled={used}
                      onClick={() => selectIngredient(ing.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                        used
                          ? 'border-green-500/30 bg-green-900/20 opacity-40'
                          : 'border-white/10 bg-gray-800/50 hover:border-orange-400/50 hover:bg-orange-900/20 active:scale-95'
                      }`}
                    >
                      <span className="text-2xl">{ing.emoji}</span>
                      <span className="text-[10px] text-white/60">{ing.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cooking animation */}
          {phase === 'cooking' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-6xl animate-bounce">{recipe.emoji}</div>
              <div className="w-full max-w-[200px]">
                <div className="h-4 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                    style={{ width: `${cookProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm text-orange-300">Cooking...</p>
              </div>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl">{recipe.emoji}</div>
              <h3 className="text-xl font-bold text-green-400">Delicious!</h3>
              <p className="text-sm text-white/60">{recipe.name} cooked to perfection!</p>
              <div className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-900/30 px-5 py-2">
                <span>🪙</span>
                <span className="text-lg font-bold text-yellow-300">+{score}</span>
              </div>
              <p className="text-xs text-white/40">Base {recipe.reward} + Time bonus {score - recipe.reward}</p>
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-orange-400 hover:to-amber-400"
                >
                  Cook Again
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {phase === 'failed' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl">⏰</div>
              <h3 className="text-xl font-bold text-red-400">Time's Up!</h3>
              <p className="text-sm text-white/60">
                You got {selectedIngredients.length} of {recipe.ingredients.length} ingredients for {recipe.name}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-bold text-white transition hover:from-orange-400 hover:to-amber-400"
                >
                  Try Again
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
