import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { computeBudgetSummary } from '../../systems/Economy';
import type { TransactionCategory } from '../../systems/Economy';

type Tab = 'overview' | 'history';

const categoryLabels: Record<TransactionCategory, string> = {
  'task-reward': 'Task Rewards',
  bonus: 'Bonuses',
  upgrade: 'Upgrades',
  furniture: 'Furniture',
  accessory: 'Accessories',
  'room-upgrade': 'Room Upgrades',
  color: 'Colors',
};

const categoryIcons: Record<TransactionCategory, string> = {
  'task-reward': '🔧',
  bonus: '🎁',
  upgrade: '⚡',
  furniture: '🪑',
  accessory: '🎩',
  'room-upgrade': '🏠',
  color: '🎨',
};

function formatSimTime(simMinutes: number): string {
  const day = Math.floor(simMinutes / 1440) + 1;
  const hour = Math.floor((simMinutes % 1440) / 60);
  const min = simMinutes % 60;
  return `Day ${day} ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

export function BudgetPanel() {
  const show = useStore((s) => s.showBudgetPanel);
  const setShow = useStore((s) => s.setShowBudgetPanel);
  const coins = useStore((s) => s.coins);
  const transactions = useStore((s) => s.economyTransactions);
  const [tab, setTab] = useState<Tab>('overview');

  if (!show) return null;

  const summary = computeBudgetSummary(transactions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShow(false)}
      />

      <div className="relative w-[440px] max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-semibold text-white">Household Budget</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-bold text-yellow-300">{coins}</span>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'overview'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'border-b-2 border-blue-400 text-blue-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60">Income</div>
                  <div className="mt-1 text-lg font-bold text-emerald-300">+{summary.totalIncome}</div>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60">Expenses</div>
                  <div className="mt-1 text-lg font-bold text-red-300">-{summary.totalExpenses}</div>
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400/60">Balance</div>
                  <div className="mt-1 text-lg font-bold text-yellow-300">{coins}</div>
                </div>
              </div>

              {/* Income breakdown */}
              {Object.keys(summary.incomeByCategory).length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Income Sources
                  </div>
                  <div className="space-y-1">
                    {Object.entries(summary.incomeByCategory).map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{categoryIcons[cat as TransactionCategory]}</span>
                          <span className="text-xs text-white/60">{categoryLabels[cat as TransactionCategory]}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-300">+{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense breakdown */}
              {Object.keys(summary.expensesByCategory).length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Spending
                  </div>
                  <div className="space-y-1">
                    {Object.entries(summary.expensesByCategory).map(([cat, amount]) => (
                      <div key={cat} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{categoryIcons[cat as TransactionCategory]}</span>
                          <span className="text-xs text-white/60">{categoryLabels[cat as TransactionCategory]}</span>
                        </div>
                        <span className="text-xs font-semibold text-red-300">-{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {transactions.length === 0 && (
                <div className="py-8 text-center text-sm text-white/30">
                  No transactions yet. Complete tasks to earn SimCoins!
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-1">
              {summary.recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/30">
                  No transaction history yet.
                </div>
              ) : (
                summary.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{categoryIcons[tx.category]}</span>
                        <span className="truncate text-xs text-white/60">{tx.label}</span>
                      </div>
                      <div className="ml-7 text-[10px] text-white/25">{formatSimTime(tx.simMinutes)}</div>
                    </div>
                    <span className={`ml-2 text-xs font-semibold ${
                      tx.type === 'income' ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-center text-[11px] text-white/25">
            Harder tasks earn more SimCoins
          </p>
        </div>
      </div>
    </div>
  );
}
