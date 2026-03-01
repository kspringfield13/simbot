import type { TaskType } from '../types';

// ── Transaction tracking ─────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type TransactionCategory =
  | 'task-reward'
  | 'bonus'
  | 'upgrade'
  | 'furniture'
  | 'accessory'
  | 'room-upgrade'
  | 'color';

export interface EconomyTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  label: string;
  timestamp: number; // Date.now()
  simMinutes: number;
}

// ── Coin reward scaling (harder tasks = more coins) ──────────

const TASK_DIFFICULTY: Record<TaskType, number> = {
  'bed-making': 1,
  'feeding-fish': 1,
  'feeding-hamster': 1,
  sweeping: 1.2,
  dishes: 1.3,
  cleaning: 1.5,
  vacuuming: 1.5,
  organizing: 1.6,
  laundry: 1.8,
  scrubbing: 2,
  cooking: 2.2,
  'grocery-list': 1.4,
  general: 1,
  seasonal: 2.5,
  mowing: 2,
  watering: 1.3,
  'leaf-blowing': 1.5,
  weeding: 1.8,
  visiting: 1.5,
};

/** Enhanced coin reward: base from duration + difficulty multiplier. Returns 3–25. */
export function getEnhancedCoinReward(workDuration: number, taskType: TaskType): number {
  const diffMult = TASK_DIFFICULTY[taskType] ?? 1;
  const base = 3 + workDuration * 0.5 * diffMult;
  return Math.min(25, Math.max(3, Math.round(base)));
}

// ── Room Upgrades ────────────────────────────────────────────

export interface RoomUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  roomId: string | null; // null = applies to all rooms
  icon: string;
}

export const ROOM_UPGRADES: RoomUpgrade[] = [
  { id: 'wallpaper-modern', name: 'Modern Wallpaper', description: 'Sleek walls for any room', cost: 30, roomId: null, icon: '🎨' },
  { id: 'flooring-hardwood', name: 'Hardwood Floors', description: 'Elegant wooden flooring', cost: 45, roomId: null, icon: '🪵' },
  { id: 'lighting-ambient', name: 'Ambient Lighting', description: 'Mood lighting throughout', cost: 35, roomId: null, icon: '💡' },
  { id: 'kitchen-deluxe', name: 'Deluxe Kitchen', description: 'Premium countertops & appliances', cost: 60, roomId: 'kitchen', icon: '🍳' },
  { id: 'bath-spa', name: 'Spa Bathroom', description: 'Luxury tiles & rain shower', cost: 55, roomId: 'bathroom', icon: '🛁' },
  { id: 'bedroom-cozy', name: 'Cozy Bedroom', description: 'Memory foam mattress & curtains', cost: 50, roomId: 'bedroom', icon: '🛏️' },
  { id: 'living-theater', name: 'Home Theater', description: 'Surround sound & big screen', cost: 75, roomId: 'living-room', icon: '🎬' },
  { id: 'garage-workshop', name: 'Garage Workshop', description: 'Workbench & tool wall', cost: 40, roomId: 'garage', icon: '🔧' },
];

// ── Furniture Items ──────────────────────────────────────────

export interface FurnitureItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const FURNITURE_ITEMS: FurnitureItem[] = [
  { id: 'furn-bookshelf', name: 'Bookshelf', description: 'Tall bookshelf for any room', cost: 20, icon: '📚' },
  { id: 'furn-plant-big', name: 'Indoor Tree', description: 'Large potted plant', cost: 15, icon: '🌳' },
  { id: 'furn-rug', name: 'Area Rug', description: 'Cozy patterned rug', cost: 12, icon: '🟫' },
  { id: 'furn-lamp', name: 'Floor Lamp', description: 'Stylish standing lamp', cost: 10, icon: '🪔' },
  { id: 'furn-aquarium', name: 'Aquarium', description: 'Decorative fish tank', cost: 35, icon: '🐠' },
  { id: 'furn-piano', name: 'Piano', description: 'Mini grand piano', cost: 80, icon: '🎹' },
  { id: 'furn-art', name: 'Wall Art', description: 'Abstract painting set', cost: 18, icon: '🖼️' },
  { id: 'furn-desk', name: 'Standing Desk', description: 'Adjustable standing desk', cost: 25, icon: '🖥️' },
];

// ── Robot Accessories ────────────────────────────────────────

export interface RobotAccessory {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const ROBOT_ACCESSORIES: RobotAccessory[] = [
  { id: 'acc-hat-tophat', name: 'Top Hat', description: 'Dapper & distinguished', cost: 15, icon: '🎩' },
  { id: 'acc-hat-chef', name: 'Chef Hat', description: 'For the culinary bot', cost: 12, icon: '👨‍🍳' },
  { id: 'acc-glasses', name: 'Smart Glasses', description: 'AR display visor', cost: 20, icon: '🤓' },
  { id: 'acc-bowtie', name: 'Bow Tie', description: 'Classic bow tie', cost: 8, icon: '🎀' },
  { id: 'acc-jetpack', name: 'Mini Jetpack', description: 'Decorative thruster pack', cost: 30, icon: '🚀' },
  { id: 'acc-antenna', name: 'Gold Antenna', description: 'Premium signal booster', cost: 25, icon: '📡' },
  { id: 'acc-cape', name: 'Hero Cape', description: 'Flowing mini cape', cost: 18, icon: '🦸' },
  { id: 'acc-scarf', name: 'Cozy Scarf', description: 'Knitted neck wrap', cost: 10, icon: '🧣' },
];

// ── Budget helpers ───────────────────────────────────────────

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: EconomyTransaction[];
  incomeByCategory: Partial<Record<TransactionCategory, number>>;
  expensesByCategory: Partial<Record<TransactionCategory, number>>;
}

export function computeBudgetSummary(transactions: EconomyTransaction[]): BudgetSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeByCategory: Partial<Record<TransactionCategory, number>> = {};
  const expensesByCategory: Partial<Record<TransactionCategory, number>> = {};

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] ?? 0) + tx.amount;
    } else {
      totalExpenses += tx.amount;
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] ?? 0) + tx.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    recentTransactions: transactions.slice(-20).reverse(),
    incomeByCategory,
    expensesByCategory,
  };
}

// ── localStorage persistence ─────────────────────────────────

const ECONOMY_KEY = 'simbot-economy';

export interface EconomyData {
  transactions: EconomyTransaction[];
  purchasedRoomUpgrades: string[];
  purchasedFurniture: string[];
  purchasedAccessories: string[];
}

export function loadEconomyData(): EconomyData {
  try {
    const stored = localStorage.getItem(ECONOMY_KEY);
    return stored
      ? JSON.parse(stored)
      : { transactions: [], purchasedRoomUpgrades: [], purchasedFurniture: [], purchasedAccessories: [] };
  } catch {
    return { transactions: [], purchasedRoomUpgrades: [], purchasedFurniture: [], purchasedAccessories: [] };
  }
}

export function saveEconomyData(data: EconomyData) {
  try {
    // Keep only last 200 transactions to prevent storage bloat
    const trimmed = { ...data, transactions: data.transactions.slice(-200) };
    localStorage.setItem(ECONOMY_KEY, JSON.stringify(trimmed));
  } catch { /* ignore quota errors */ }
}
