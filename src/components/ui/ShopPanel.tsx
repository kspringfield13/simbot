import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { UPGRADES, ROBOT_COLORS } from '../../config/shop';
import { ROOM_UPGRADES, FURNITURE_ITEMS, ROBOT_ACCESSORIES } from '../../systems/Economy';
import { ROBOT_CONFIGS } from '../../config/robots';
import type { RobotId } from '../../types';
import { ROBOT_IDS } from '../../types';

type Tab = 'upgrades' | 'rooms' | 'furniture' | 'accessories' | 'colors';

export function ShopPanel() {
  const showShop = useStore((s) => s.showShop);
  const setShowShop = useStore((s) => s.setShowShop);
  const coins = useStore((s) => s.coins);
  const purchasedUpgrades = useStore((s) => s.purchasedUpgrades);
  const robotColors = useStore((s) => s.robotColors);
  const purchaseUpgrade = useStore((s) => s.purchaseUpgrade);
  const purchaseColor = useStore((s) => s.purchaseColor);
  const purchasedRoomUpgrades = useStore((s) => s.purchasedRoomUpgrades);
  const purchasedFurniture = useStore((s) => s.purchasedFurniture);
  const purchasedAccessories = useStore((s) => s.purchasedAccessories);
  const purchaseRoomUpgrade = useStore((s) => s.purchaseRoomUpgrade);
  const purchaseFurnitureItem = useStore((s) => s.purchaseFurnitureItem);
  const purchaseAccessory = useStore((s) => s.purchaseAccessory);
  const recordTransaction = useStore((s) => s.recordTransaction);

  const [tab, setTab] = useState<Tab>('upgrades');
  const [colorRobot, setColorRobot] = useState<RobotId>('sim');
  const [flashItem, setFlashItem] = useState<string | null>(null);

  if (!showShop) return null;

  const flash = (id: string) => {
    setFlashItem(id);
    setTimeout(() => setFlashItem(null), 600);
  };

  const handleBuyUpgrade = (id: string, cost: number) => {
    const ok = purchaseUpgrade(id, cost);
    if (ok) {
      flash(id);
      recordTransaction('expense', 'upgrade', cost, `Upgrade: ${id}`);
    }
  };

  const handleBuyColor = (robotId: RobotId, hex: string, cost: number) => {
    const ok = purchaseColor(robotId, hex, cost);
    if (ok) {
      flash(`${robotId}-${hex}`);
      recordTransaction('expense', 'color', cost, `Color for ${robotId}`);
    }
  };

  const handleBuyRoom = (id: string, cost: number) => {
    const ok = purchaseRoomUpgrade(id, cost);
    if (ok) flash(id);
  };

  const handleBuyFurniture = (id: string, cost: number) => {
    const ok = purchaseFurnitureItem(id, cost);
    if (ok) flash(id);
  };

  const handleBuyAccessory = (id: string, cost: number) => {
    const ok = purchaseAccessory(id, cost);
    if (ok) flash(id);
  };

  const isOwned = (id: string) => purchasedUpgrades.includes(id);
  const isLocked = (u: typeof UPGRADES[number]) =>
    u.requires != null && !purchasedUpgrades.includes(u.requires);

  const tabConfig: { key: Tab; label: string; color: string }[] = [
    { key: 'upgrades', label: 'Upgrades', color: 'blue' },
    { key: 'rooms', label: 'Rooms', color: 'emerald' },
    { key: 'furniture', label: 'Furniture', color: 'amber' },
    { key: 'accessories', label: 'Gear', color: 'purple' },
    { key: 'colors', label: 'Colors', color: 'pink' },
  ];

  const tabColors: Record<string, string> = {
    blue: 'border-blue-400 text-blue-300',
    emerald: 'border-emerald-400 text-emerald-300',
    amber: 'border-amber-400 text-amber-300',
    purple: 'border-purple-400 text-purple-300',
    pink: 'border-pink-400 text-pink-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowShop(false)}
      />

      <div className="relative w-[460px] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛍️</span>
            <h2 className="text-lg font-semibold text-white">SimCoin Shop</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-bold text-yellow-300">{coins}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowShop(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabConfig.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                tab === t.key
                  ? `border-b-2 ${tabColors[t.color]}`
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {/* Upgrades tab */}
          {tab === 'upgrades' && (
            <div className="space-y-2">
              {(['speed', 'battery', 'efficiency'] as const).map((cat) => (
                <div key={cat}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    {cat === 'speed' ? '⚡ Speed' : cat === 'battery' ? '🔋 Battery' : '♻️ Efficiency'}
                  </div>
                  {UPGRADES.filter((u) => u.category === cat).map((u) => {
                    const owned = isOwned(u.id);
                    const locked = isLocked(u);
                    const canAfford = coins >= u.cost;
                    const isFlash = flashItem === u.id;

                    return (
                      <div
                        key={u.id}
                        className={`mb-1.5 flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                          owned
                            ? 'border-green-500/30 bg-green-500/10'
                            : locked
                              ? 'border-white/5 bg-white/[0.02] opacity-50'
                              : 'border-white/10 bg-white/5'
                        } ${isFlash ? 'scale-[1.02] border-yellow-400/50 bg-yellow-400/10' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{u.name}</span>
                            {owned && (
                              <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                                OWNED
                              </span>
                            )}
                            {locked && !owned && (
                              <span className="text-[10px] text-white/30">🔒</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-white/40">{u.description}</p>
                        </div>
                        {!owned && (
                          <button
                            type="button"
                            disabled={locked || !canAfford}
                            onClick={() => handleBuyUpgrade(u.id, u.cost)}
                            className={`ml-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              locked || !canAfford
                                ? 'cursor-not-allowed bg-white/5 text-white/20'
                                : 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 active:scale-95'
                            }`}
                          >
                            <span>🪙</span>
                            <span>{u.cost}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Room upgrades tab */}
          {tab === 'rooms' && (
            <div className="space-y-1.5">
              {ROOM_UPGRADES.map((item) => {
                const owned = purchasedRoomUpgrades.includes(item.id);
                const canAfford = coins >= item.cost;
                const isFlash = flashItem === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      owned
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    } ${isFlash ? 'scale-[1.02] border-yellow-400/50 bg-yellow-400/10' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          {owned && (
                            <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                              OWNED
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">{item.description}</p>
                      </div>
                    </div>
                    {!owned && (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleBuyRoom(item.id, item.cost)}
                        className={`ml-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          !canAfford
                            ? 'cursor-not-allowed bg-white/5 text-white/20'
                            : 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 active:scale-95'
                        }`}
                      >
                        <span>🪙</span>
                        <span>{item.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Furniture tab */}
          {tab === 'furniture' && (
            <div className="space-y-1.5">
              {FURNITURE_ITEMS.map((item) => {
                const owned = purchasedFurniture.includes(item.id);
                const canAfford = coins >= item.cost;
                const isFlash = flashItem === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      owned
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    } ${isFlash ? 'scale-[1.02] border-yellow-400/50 bg-yellow-400/10' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          {owned && (
                            <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                              OWNED
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">{item.description}</p>
                      </div>
                    </div>
                    {!owned && (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleBuyFurniture(item.id, item.cost)}
                        className={`ml-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          !canAfford
                            ? 'cursor-not-allowed bg-white/5 text-white/20'
                            : 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 active:scale-95'
                        }`}
                      >
                        <span>🪙</span>
                        <span>{item.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Accessories tab */}
          {tab === 'accessories' && (
            <div className="space-y-1.5">
              {ROBOT_ACCESSORIES.map((item) => {
                const owned = purchasedAccessories.includes(item.id);
                const canAfford = coins >= item.cost;
                const isFlash = flashItem === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      owned
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    } ${isFlash ? 'scale-[1.02] border-yellow-400/50 bg-yellow-400/10' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          {owned && (
                            <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                              OWNED
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">{item.description}</p>
                      </div>
                    </div>
                    {!owned && (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleBuyAccessory(item.id, item.cost)}
                        className={`ml-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          !canAfford
                            ? 'cursor-not-allowed bg-white/5 text-white/20'
                            : 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 active:scale-95'
                        }`}
                      >
                        <span>🪙</span>
                        <span>{item.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Colors tab */}
          {tab === 'colors' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {ROBOT_IDS.map((rid) => {
                  const cfg = ROBOT_CONFIGS[rid];
                  const currentColor = robotColors[rid] ?? cfg.color;
                  return (
                    <button
                      key={rid}
                      type="button"
                      onClick={() => setColorRobot(rid)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        colorRobot === rid
                          ? 'border-white/30 bg-white/10 text-white'
                          : 'border-white/5 bg-white/[0.03] text-white/40 hover:text-white/70'
                      }`}
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: currentColor }}
                      />
                      {cfg.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ROBOT_COLORS.map((c) => {
                  const isActive = robotColors[colorRobot] === c.hex;
                  const canAfford = coins >= c.cost;
                  const isFlash = flashItem === `${colorRobot}-${c.hex}`;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isActive || !canAfford}
                      onClick={() => handleBuyColor(colorRobot, c.hex, c.cost)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all ${
                        isActive
                          ? 'border-green-500/30 bg-green-500/10'
                          : canAfford
                            ? 'border-white/10 bg-white/5 hover:bg-white/10 active:scale-95'
                            : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50'
                      } ${isFlash ? 'scale-105 border-yellow-400/50 bg-yellow-400/10' : ''}`}
                    >
                      <span
                        className="inline-block h-6 w-6 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-medium text-white/70">{c.name}</span>
                      {isActive ? (
                        <span className="text-[10px] font-bold text-green-400">ACTIVE</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[11px] text-yellow-300/70">
                          🪙 {c.cost}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {robotColors[colorRobot] && (
                <button
                  type="button"
                  onClick={() => {
                    const state = useStore.getState();
                    const next = { ...state.robotColors };
                    delete next[colorRobot];
                    const shopData = { coins: state.coins, purchasedUpgrades: state.purchasedUpgrades, robotColors: next };
                    try { localStorage.setItem('simbot-shop', JSON.stringify(shopData)); } catch {}
                    useStore.setState({ robotColors: next });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Reset to default color
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            Earn SimCoins by completing tasks — harder tasks pay more
          </p>
        </div>
      </div>
    </div>
  );
}
