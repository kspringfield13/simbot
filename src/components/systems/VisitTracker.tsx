// @ts-nocheck
// ── Visit Tracker ────────────────────────────────────────
// Ticks visit progress every 100ms, handling visit completion
// with rewards. Headless component — mount in React tree.

import { useEffect } from 'react';
import { useStore } from '../../stores/useStore';

export function VisitTracker() {
  const tickVisitProgress = useStore((s) => s.tickVisitProgress);
  const activeVisits = useStore((s) => s.activeVisits);

  useEffect(() => {
    if (activeVisits.length === 0) return;
    const interval = window.setInterval(tickVisitProgress, 100);
    return () => window.clearInterval(interval);
  }, [activeVisits.length, tickVisitProgress]);

  return null;
}
