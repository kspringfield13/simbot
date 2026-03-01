import { useState, useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { computeBudgetSummary, computeDailyTrends } from '../../systems/Economy';
import type { TransactionCategory } from '../../systems/Economy';

type Tab = 'overview' | 'history' | 'trends';

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
          <button
            type="button"
            onClick={() => setTab('trends')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'trends'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Trends
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

          {tab === 'trends' && <TrendsView transactions={transactions} />}
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

// ── Trends sub-component ────────────────────────────────────

import type { EconomyTransaction } from '../../systems/Economy';

function TrendsView({ transactions }: { transactions: EconomyTransaction[] }) {
  const daily = useMemo(() => computeDailyTrends(transactions), [transactions]);

  // Compute weekly summaries (group days into 7-day chunks)
  const weekly = useMemo(() => {
    if (daily.length === 0) return [];
    const weeks: { week: number; income: number; expenses: number; net: number }[] = [];
    let i = 0;
    while (i < daily.length) {
      const chunk = daily.slice(i, i + 7);
      const income = chunk.reduce((s, d) => s + d.income, 0);
      const expenses = chunk.reduce((s, d) => s + d.expenses, 0);
      weeks.push({ week: weeks.length + 1, income, expenses, net: income - expenses });
      i += 7;
    }
    return weeks;
  }, [daily]);

  if (daily.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-white/30">
        No data yet. Complete tasks to see spending trends!
      </div>
    );
  }

  // Show last 7 days for daily chart
  const recentDays = daily.slice(-7);
  const maxDaily = Math.max(...recentDays.map((d) => Math.max(d.income, d.expenses)), 1);

  return (
    <div className="space-y-5">
      {/* Daily bar chart */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Daily (Last 7 Days)
        </div>
        <div className="space-y-1.5">
          {recentDays.map((d) => (
            <div key={d.day} className="flex items-center gap-2">
              <span className="w-10 text-right text-[10px] text-white/40">Day {d.day}</span>
              <div className="flex-1 space-y-0.5">
                {/* Income bar */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 rounded-full bg-emerald-500/70"
                    style={{ width: `${(d.income / maxDaily) * 100}%`, minWidth: d.income > 0 ? 4 : 0 }}
                  />
                  {d.income > 0 && (
                    <span className="text-[9px] text-emerald-400">+{d.income}</span>
                  )}
                </div>
                {/* Expense bar */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 rounded-full bg-red-500/70"
                    style={{ width: `${(d.expenses / maxDaily) * 100}%`, minWidth: d.expenses > 0 ? 4 : 0 }}
                  />
                  {d.expenses > 0 && (
                    <span className="text-[9px] text-red-400">-{d.expenses}</span>
                  )}
                </div>
              </div>
              <span className={`w-8 text-right text-[10px] font-semibold ${d.net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {d.net >= 0 ? '+' : ''}{d.net}
              </span>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-full bg-emerald-500/70" />
            <span className="text-[9px] text-white/30">Income</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-full bg-red-500/70" />
            <span className="text-[9px] text-white/30">Expenses</span>
          </div>
        </div>
      </div>

      {/* Weekly summary cards */}
      {weekly.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Weekly Summary
          </div>
          <div className="space-y-1.5">
            {weekly.slice(-4).map((w) => (
              <div key={w.week} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <span className="text-xs text-white/50">Week {w.week}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400">+{w.income}</span>
                  <span className="text-[10px] text-red-400">-{w.expenses}</span>
                  <span className={`text-xs font-semibold ${w.net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {w.net >= 0 ? '+' : ''}{w.net}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
