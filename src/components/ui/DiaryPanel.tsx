import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_CONFIGS } from '../../config/robots';
import { getMoodEmoji } from '../../config/diary';
import { formatSimClock } from '../../systems/TimeSystem';
import { ROBOT_IDS } from '../../types';
import type { RobotId } from '../../types';
import { useRobotDisplayName, getRobotDisplayName } from '../../stores/useRobotNames';

const ROBOT_EMOJI: Record<RobotId, string> = {
  sim: '🤖',
  chef: '👨‍🍳',
  sparkle: '✨',
};

export function DiaryPanel() {
  const showDiary = useStore((s) => s.showDiary);
  const setShowDiary = useStore((s) => s.setShowDiary);
  const activeRobotId = useStore((s) => s.activeRobotId);
  const setActiveRobotId = useStore((s) => s.setActiveRobotId);
  const entries = useStore((s) => s.diaryEntries[s.activeRobotId] ?? []);
  const robotMood = useStore((s) => s.robots[s.activeRobotId].mood);
  const { dayText } = formatSimClock(useStore((s) => s.simMinutes));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDiary && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [showDiary, entries.length]);

  const activeDisplayName = useRobotDisplayName(activeRobotId);

  if (!showDiary) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowDiary(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setShowDiary(false); }}
        role="button"
        tabIndex={-1}
        aria-label="Close diary"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-[420px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amber-400">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span className="text-sm font-semibold text-white">{activeDisplayName}'s Diary</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">{dayText}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDiary(false)}
            className="text-white/50 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Robot tabs */}
        <div className="flex border-b border-white/10">
          {ROBOT_IDS.map((rid) => {
            const rc = ROBOT_CONFIGS[rid];
            const isActive = rid === activeRobotId;
            const entryCount = useStore.getState().diaryEntries[rid]?.length ?? 0;
            return (
              <button
                key={rid}
                type="button"
                onClick={() => setActiveRobotId(rid)}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs transition-all ${
                  isActive
                    ? 'border-b-2 bg-white/5 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
                style={isActive ? { borderBottomColor: rc.color } : undefined}
              >
                <span>{ROBOT_EMOJI[rid]}</span>
                <span>{getRobotDisplayName(rid)}</span>
                {entryCount > 0 && (
                  <span className="rounded-full bg-white/10 px-1.5 text-[9px] text-white/50">{entryCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current mood bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-2">
          <span className="text-xs text-white/40">Current mood:</span>
          <span className="text-sm">{getMoodEmoji(robotMood)}</span>
          <span className="text-xs capitalize text-white/60">{robotMood}</span>
          <span className="ml-auto text-[10px] text-white/30">{entries.length} entries today</span>
        </div>

        {/* Entries */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3" style={{ maxHeight: '50vh' }}>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-3xl">📓</span>
              <p className="text-sm text-white/30">No diary entries yet today.</p>
              <p className="text-xs text-white/20">{activeDisplayName} will write about their day as they complete tasks.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {entries.map((entry) => (
                <div key={entry.id} className="group rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.06]">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">{getMoodEmoji(entry.mood)}</span>
                    <div className="flex-1">
                      <p className="text-xs leading-relaxed text-white/80">{entry.text}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {entry.taskType && (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] text-amber-300/70">
                            {entry.taskType}
                          </span>
                        )}
                        <span className="text-[9px] text-white/20">
                          {entry.battery < 30 ? '🪫' : '🔋'} {Math.round(entry.battery)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-5 py-2">
          <p className="text-center text-[10px] text-white/20">
            Diary resets each new sim day
          </p>
        </div>
      </div>
    </div>
  );
}
