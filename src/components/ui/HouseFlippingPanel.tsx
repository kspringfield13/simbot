import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import {
  generateHousesForSale,
  calculateCurrentValue,
  calculateProfit,
  getTotalRenovationCost,
  getRenovationProgress,
  getCategoryProgress,
  getConditionConfig,
  CATEGORY_INFO,
  type HouseForSale,
  type OwnedHouse,
  type HouseFeature,
  type FlipHistoryEntry,
} from '../../config/houseFlipping';
import {
  loadHouseFlippingData,
  saveHouseFlippingData,
  getFlipStats,
  type HouseFlippingData,
} from '../../utils/houseFlippingProgress';

type View = 'market' | 'owned' | 'renovate' | 'history';

// ── Condition Badge ─────────────────────────────────

function ConditionBadge({ condition }: { condition: string }) {
  const config = getConditionConfig(condition as 'condemned' | 'rundown' | 'dated' | 'fair');
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${config.color}25`, color: config.color, border: `1px solid ${config.color}40` }}
    >
      {config.label}
    </span>
  );
}

// ── Progress Bar ─────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Renovation Timer ────────────────────────────────

function RenovationTimer({ completesAt, onComplete }: { completesAt: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, completesAt - Date.now());
      setRemaining(left);
      if (left <= 0) onComplete();
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [completesAt, onComplete]);

  const secs = Math.ceil(remaining / 1000);
  return (
    <span className="font-mono text-sm text-amber-300">
      {secs > 0 ? `${secs}s` : 'Done!'}
    </span>
  );
}

// ── Main Panel ──────────────────────────────────────

export function HouseFlippingPanel() {
  const show = useStore((s) => s.showHouseFlipping);
  const setShow = useStore((s) => s.setShowHouseFlipping);
  const coins = useStore((s) => s.coins);
  const addCoins = useStore((s) => s.addCoins);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addNotification = useStore((s) => s.addNotification);

  const [view, setView] = useState<View>('market');
  const [data, setData] = useState<HouseFlippingData>(() => loadHouseFlippingData());
  const [ownedHouses, setOwnedHouses] = useState<OwnedHouse[]>([]);
  const [houses, setHouses] = useState<HouseForSale[]>([]);
  const [selectedOwned, setSelectedOwned] = useState<OwnedHouse | null>(null);
  const [confirmSell, setConfirmSell] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load owned houses from data
  useEffect(() => {
    try {
      setOwnedHouses(JSON.parse(data.ownedHousesJson));
    } catch {
      setOwnedHouses([]);
    }
  }, [data.ownedHousesJson]);

  // Generate market houses
  useEffect(() => {
    setHouses(generateHousesForSale(data.marketSeed, 6));
  }, [data.marketSeed]);

  // Persist changes
  const persist = useCallback((updated: HouseFlippingData, updatedOwned?: OwnedHouse[]) => {
    const toSave = {
      ...updated,
      ownedHousesJson: JSON.stringify(updatedOwned ?? ownedHouses),
    };
    setData(toSave);
    saveHouseFlippingData(toSave);
  }, [ownedHouses]);

  // Tick active renovations
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOwnedHouses((prev) => {
        let changed = false;
        const next = prev.map((oh) => {
          if (oh.activeRenovation && Date.now() >= oh.activeRenovation.completesAt) {
            changed = true;
            return {
              ...oh,
              renovatedFeatures: [...oh.renovatedFeatures, oh.activeRenovation.featureId],
              activeRenovation: null,
            };
          }
          return oh;
        });
        if (changed) {
          const d = { ...data, ownedHousesJson: JSON.stringify(next) };
          setData(d);
          saveHouseFlippingData(d);
        }
        return changed ? next : prev;
      });
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [data]);

  // Buy a house
  const buyHouse = useCallback((house: HouseForSale) => {
    if (coins < house.price) return;
    if (ownedHouses.length >= 3) {
      addNotification({ type: 'warning', title: 'House Limit', message: 'You can own a maximum of 3 houses at a time!' });
      return;
    }

    addCoins(-house.price);
    recordTransaction('expense', 'furniture', house.price, `Bought: ${house.name}`);

    const owned: OwnedHouse = {
      house,
      purchasedAt: Date.now(),
      renovatedFeatures: [],
      activeRenovation: null,
      listed: false,
      soldAt: null,
      soldPrice: null,
    };

    const newOwned = [...ownedHouses, owned];
    setOwnedHouses(newOwned);

    // Remove from market and regenerate
    const newSeed = data.marketSeed + 1;
    const updated = { ...data, marketSeed: newSeed, ownedHousesJson: JSON.stringify(newOwned) };
    persist(updated, newOwned);

    addNotification({ type: 'success', title: 'House Purchased', message: `Purchased ${house.name} for ${house.price} coins!` });
    setView('owned');
  }, [coins, ownedHouses, data, addCoins, recordTransaction, addNotification, persist]);

  // Start renovation on a feature
  const startRenovation = useCallback((owned: OwnedHouse, feature: HouseFeature) => {
    if (coins < feature.renovationCost) return;
    if (owned.activeRenovation) return;
    if (owned.renovatedFeatures.includes(feature.id)) return;

    addCoins(-feature.renovationCost);
    recordTransaction('expense', 'furniture', feature.renovationCost, `Renovate: ${feature.name}`);

    const updated: OwnedHouse = {
      ...owned,
      activeRenovation: {
        featureId: feature.id,
        startedAt: Date.now(),
        completesAt: Date.now() + feature.workTime * 1000,
      },
    };

    const newOwned = ownedHouses.map((oh) => oh.house.id === owned.house.id ? updated : oh);
    setOwnedHouses(newOwned);
    setSelectedOwned(updated);
    persist({ ...data, ownedHousesJson: JSON.stringify(newOwned) }, newOwned);
  }, [coins, ownedHouses, data, addCoins, recordTransaction, persist]);

  // Sell a house
  const sellHouse = useCallback((owned: OwnedHouse) => {
    const salePrice = calculateCurrentValue(owned);
    const profit = calculateProfit(owned, salePrice);
    const renovationCost = getTotalRenovationCost(owned);

    addCoins(salePrice);
    recordTransaction('income', 'bonus', salePrice, `Sold: ${owned.house.name}`);

    const entry: FlipHistoryEntry = {
      houseId: owned.house.id,
      houseName: owned.house.name,
      purchasePrice: owned.house.price,
      totalRenovationCost: renovationCost,
      salePrice,
      profit,
      completedAt: Date.now(),
    };

    const newOwned = ownedHouses.filter((oh) => oh.house.id !== owned.house.id);
    setOwnedHouses(newOwned);
    setSelectedOwned(null);
    setConfirmSell(false);

    const updated: HouseFlippingData = {
      ...data,
      history: [entry, ...data.history],
      ownedHousesJson: JSON.stringify(newOwned),
    };
    persist(updated, newOwned);

    const emoji = profit >= 0 ? '📈' : '📉';
    addNotification({ type: profit >= 0 ? 'success' : 'warning', title: `${emoji} House Sold`, message: `Sold ${owned.house.name} for ${salePrice} coins (${profit >= 0 ? '+' : ''}${profit} profit)!` });
    setView('owned');
  }, [ownedHouses, data, addCoins, recordTransaction, addNotification, persist]);

  // Refresh market
  const refreshMarket = useCallback(() => {
    const newSeed = Date.now();
    const updated = { ...data, marketSeed: newSeed, lastRefreshedAt: Date.now() };
    persist(updated);
    setHouses(generateHousesForSale(newSeed, 6));
  }, [data, persist]);

  if (!show) return null;

  const stats = getFlipStats(data.history);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow(false)} />

      {/* Panel */}
      <div className="relative w-[580px] max-h-[85vh] overflow-hidden rounded-2xl border border-emerald-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h2 className="text-lg font-semibold text-white">House Flipping</h2>
              <p className="text-xs text-gray-400">Buy, renovate, sell for profit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm font-medium text-yellow-300">
              🪙 {coins}
            </span>
            <button
              onClick={() => setShow(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {([
            ['market', '🏘️ Market', houses.length],
            ['owned', '🔑 My Houses', ownedHouses.length],
            ['history', '📊 History', data.history.length],
          ] as [View, string, number][]).map(([v, label, count]) => (
            <button
              key={v}
              onClick={() => { setView(v); setSelectedOwned(null); setConfirmSell(false); }}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                view === v ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label} <span className="text-xs opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {view === 'market' && (
            <MarketView
              houses={houses}
              coins={coins}
              ownedCount={ownedHouses.length}
              onBuy={buyHouse}
              onRefresh={refreshMarket}
            />
          )}
          {view === 'owned' && !selectedOwned && (
            <OwnedListView
              owned={ownedHouses}
              onSelect={(oh) => { setSelectedOwned(oh); setView('renovate'); }}
            />
          )}
          {view === 'owned' && selectedOwned && (
            <RenovateView
              owned={selectedOwned}
              coins={coins}
              onStartRenovation={startRenovation}
              onSell={() => setConfirmSell(true)}
              onBack={() => { setSelectedOwned(null); }}
              confirmSell={confirmSell}
              onConfirmSell={() => sellHouse(selectedOwned)}
              onCancelSell={() => setConfirmSell(false)}
            />
          )}
          {view === 'renovate' && selectedOwned && (
            <RenovateView
              owned={selectedOwned}
              coins={coins}
              onStartRenovation={startRenovation}
              onSell={() => setConfirmSell(true)}
              onBack={() => { setSelectedOwned(null); setView('owned'); }}
              confirmSell={confirmSell}
              onConfirmSell={() => sellHouse(selectedOwned)}
              onCancelSell={() => setConfirmSell(false)}
            />
          )}
          {view === 'history' && (
            <HistoryView history={data.history} stats={stats} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Market View ─────────────────────────────────────

function MarketView({
  houses, coins, ownedCount, onBuy, onRefresh,
}: {
  houses: HouseForSale[];
  coins: number;
  ownedCount: number;
  onBuy: (h: HouseForSale) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {ownedCount}/3 houses owned
        </p>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/10"
        >
          🔄 New Listings
        </button>
      </div>

      {houses.map((house) => {
        const config = getConditionConfig(house.condition);
        const canAfford = coins >= house.price;
        const canBuy = canAfford && ownedCount < 3;
        const potentialProfit = house.marketValue - house.price -
          house.features.reduce((s, f) => s + f.renovationCost, 0);

        return (
          <div
            key={house.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.08]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{house.emoji}</span>
                <div>
                  <h3 className="font-semibold text-white">{house.name}</h3>
                  <p className="text-xs text-gray-400">{house.address}</p>
                </div>
              </div>
              <ConditionBadge condition={house.condition} />
            </div>

            <p className="mt-2 text-xs text-gray-400">{house.description}</p>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-300">
              <span>🏠 {house.rooms} rooms</span>
              <span>📐 {house.sqft.toLocaleString()} sqft</span>
              <span>🔨 {house.features.length} renovations</span>
              <span style={{ color: config.color }}>
                📈 ~{potentialProfit > 0 ? '+' : ''}{potentialProfit} potential profit
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {house.features.map((f) => (
                <span
                  key={f.id}
                  className="rounded px-1.5 py-0.5 text-[10px]"
                  style={{
                    backgroundColor: `${CATEGORY_INFO[f.category].color}20`,
                    color: CATEGORY_INFO[f.category].color,
                  }}
                >
                  {CATEGORY_INFO[f.category].icon} {f.name}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-yellow-300">🪙 {house.price}</span>
                <span className="ml-2 text-xs text-gray-500">Market value: {house.marketValue}</span>
              </div>
              <button
                onClick={() => onBuy(house)}
                disabled={!canBuy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  canBuy
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500'
                }`}
              >
                {ownedCount >= 3 ? 'Max Owned' : !canAfford ? 'Can\'t Afford' : 'Buy'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Owned List View ─────────────────────────────────

function OwnedListView({
  owned, onSelect,
}: {
  owned: OwnedHouse[];
  onSelect: (oh: OwnedHouse) => void;
}) {
  if (owned.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="text-4xl">🏠</span>
        <p className="mt-3 text-gray-400">No houses owned yet.</p>
        <p className="text-sm text-gray-500">Browse the market to buy your first flip!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {owned.map((oh) => {
        const progress = getRenovationProgress(oh);
        const currentValue = calculateCurrentValue(oh);
        const profit = calculateProfit(oh, currentValue);

        return (
          <button
            key={oh.house.id}
            onClick={() => onSelect(oh)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/[0.08]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{oh.house.emoji}</span>
                <div>
                  <h3 className="font-semibold text-white">{oh.house.name}</h3>
                  <p className="text-xs text-gray-400">{oh.house.address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-yellow-300">🪙 {currentValue}</div>
                <div className={`text-xs ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profit >= 0 ? '+' : ''}{profit} profit
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-gray-400">
                <span>Renovation: {Math.round(progress * 100)}%</span>
                <span>{oh.renovatedFeatures.length}/{oh.house.features.length}</span>
              </div>
              <ProgressBar progress={progress} color="#34d399" />
            </div>

            {oh.activeRenovation && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                <span className="animate-pulse">🔨</span>
                <span>Renovating: {oh.house.features.find((f) => f.id === oh.activeRenovation!.featureId)?.name}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Renovate View ───────────────────────────────────

function RenovateView({
  owned, coins, onStartRenovation, onSell, onBack,
  confirmSell, onConfirmSell, onCancelSell,
}: {
  owned: OwnedHouse;
  coins: number;
  onStartRenovation: (oh: OwnedHouse, feature: HouseFeature) => void;
  onSell: () => void;
  onBack: () => void;
  confirmSell: boolean;
  onConfirmSell: () => void;
  onCancelSell: () => void;
}) {
  const progress = getRenovationProgress(owned);
  const currentValue = calculateCurrentValue(owned);
  const profit = calculateProfit(owned, currentValue);
  const catProgress = getCategoryProgress(owned);

  const handleRenovationComplete = useCallback(() => {
    // Timer tick will handle the state update
  }, []);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
      >
        ← Back to houses
      </button>

      {/* House header */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{owned.house.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{owned.house.name}</h3>
              <p className="text-xs text-gray-400">{owned.house.address}</p>
            </div>
          </div>
          <ConditionBadge condition={owned.house.condition} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-gray-400">Bought For</div>
            <div className="mt-0.5 font-bold text-yellow-300">🪙 {owned.house.price}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-gray-400">Current Value</div>
            <div className="mt-0.5 font-bold text-emerald-300">🪙 {currentValue}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="text-gray-400">Profit</div>
            <div className={`mt-0.5 font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profit >= 0 ? '+' : ''}{profit}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Overall Progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar progress={progress} color="#34d399" />
        </div>

        {/* Category progress */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.entries(catProgress) as [string, { done: number; total: number }][])
            .filter(([, v]) => v.total > 0)
            .map(([cat, v]) => {
              const info = CATEGORY_INFO[cat as keyof typeof CATEGORY_INFO];
              return (
                <span
                  key={cat}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: `${info.color}20`, color: info.color }}
                >
                  {info.icon} {v.done}/{v.total}
                </span>
              );
            })}
        </div>
      </div>

      {/* Active renovation */}
      {owned.activeRenovation && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-xl">🔨</span>
              <div>
                <div className="text-sm font-medium text-amber-200">Renovating...</div>
                <div className="text-xs text-amber-300/70">
                  {owned.house.features.find((f) => f.id === owned.activeRenovation!.featureId)?.name}
                </div>
              </div>
            </div>
            <RenovationTimer
              completesAt={owned.activeRenovation.completesAt}
              onComplete={handleRenovationComplete}
            />
          </div>
        </div>
      )}

      {/* Features to renovate */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300">Renovation Checklist</h4>
        {owned.house.features.map((feature) => {
          const isDone = owned.renovatedFeatures.includes(feature.id);
          const isActive = owned.activeRenovation?.featureId === feature.id;
          const canStart = !isDone && !isActive && !owned.activeRenovation && coins >= feature.renovationCost;
          const info = CATEGORY_INFO[feature.category];

          return (
            <div
              key={feature.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                isDone
                  ? 'border-emerald-400/20 bg-emerald-400/5'
                  : isActive
                  ? 'border-amber-400/20 bg-amber-400/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${isDone ? 'opacity-50' : ''}`}>{feature.icon}</span>
                <div>
                  <div className={`text-sm font-medium ${isDone ? 'text-emerald-400 line-through' : 'text-white'}`}>
                    {feature.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span style={{ color: info.color }}>{info.label}</span>
                    <span>+{feature.valueAdd} value</span>
                    <span>{feature.workTime}s work</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDone && <span className="text-emerald-400">✓</span>}
                {isActive && (
                  <RenovationTimer
                    completesAt={owned.activeRenovation!.completesAt}
                    onComplete={handleRenovationComplete}
                  />
                )}
                {!isDone && !isActive && (
                  <button
                    onClick={() => onStartRenovation(owned, feature)}
                    disabled={!canStart}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      canStart
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'cursor-not-allowed bg-gray-700 text-gray-500'
                    }`}
                  >
                    🪙 {feature.renovationCost}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sell button */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {!confirmSell ? (
          <button
            onClick={onSell}
            className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-400"
          >
            💰 Sell for 🪙 {currentValue}
            <span className={`ml-2 text-xs ${profit >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
              ({profit >= 0 ? '+' : ''}{profit} profit)
            </span>
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-300">
              Sell <strong>{owned.house.name}</strong> for <strong className="text-yellow-300">🪙 {currentValue}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCancelSell}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmSell}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                Confirm Sale
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── History View ────────────────────────────────────

function HistoryView({
  history, stats,
}: {
  history: FlipHistoryEntry[];
  stats: ReturnType<typeof getFlipStats>;
}) {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="text-4xl">📊</span>
        <p className="mt-3 text-gray-400">No flips completed yet.</p>
        <p className="text-sm text-gray-500">Buy, renovate, and sell a house to see your history!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          ['Total Flips', stats.totalFlips, '🏠'],
          ['Total Profit', stats.totalProfit, '💰'],
          ['Best Flip', `+${stats.bestFlip}`, '🏆'],
          ['Win Rate', stats.totalFlips > 0 ? `${Math.round((stats.profitable / stats.totalFlips) * 100)}%` : '—', '📈'],
        ].map(([label, value, icon]) => (
          <div key={label as string} className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-lg">{icon as string}</div>
            <div className="mt-1 text-sm font-bold text-white">{value as string}</div>
            <div className="text-[10px] text-gray-400">{label as string}</div>
          </div>
        ))}
      </div>

      {/* History list */}
      <div className="space-y-2">
        {history.map((entry, i) => (
          <div key={`${entry.houseId}-${i}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{entry.houseName}</div>
                <div className="text-[10px] text-gray-400">
                  {new Date(entry.completedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${entry.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.profit >= 0 ? '+' : ''}{entry.profit}
                </div>
                <div className="text-[10px] text-gray-400">
                  Bought: {entry.purchasePrice} → Sold: {entry.salePrice}
                </div>
              </div>
            </div>
            {entry.totalRenovationCost > 0 && (
              <div className="mt-1 text-[10px] text-gray-500">
                Renovation costs: {entry.totalRenovationCost} coins
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
