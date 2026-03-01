import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import { STORY_CHAPTERS, type StoryChapter, type StoryObjective } from '../../config/storyMode';
import { loadStoryProgress, saveStoryProgress, type StoryProgress } from '../../utils/storyProgress';

type View = 'chapters' | 'cutscene-intro' | 'playing' | 'cutscene-outro';

export function StoryModePanel() {
  const show = useStore((s) => s.showStoryMode);
  const setShow = useStore((s) => s.setShowStoryMode);
  const addCoins = useStore((s) => s.addCoins);
  const addCoinAnimation = useStore((s) => s.addCoinAnimation);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const addNotification = useStore((s) => s.addNotification);

  const [progress, setProgress] = useState<StoryProgress>(loadStoryProgress);
  const [view, setView] = useState<View>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<StoryChapter | null>(null);
  const [cutscenePhase, setCutscenePhase] = useState(0); // 0=fade-in, 1=text, 2=fade-out
  const [narrativeText, setNarrativeText] = useState('');

  // Reload progress when panel opens
  useEffect(() => {
    if (show) {
      setProgress(loadStoryProgress());
      setView('chapters');
      setSelectedChapter(null);
    }
  }, [show]);

  // Check objective completion for active chapter
  useEffect(() => {
    if (!show || view !== 'playing' || !selectedChapter) return;

    const interval = setInterval(() => {
      const s = useStore.getState();
      const p = loadStoryProgress();
      const ch = selectedChapter;

      const allComplete = ch.objectives.every((obj) => {
        const current = getObjectiveProgress(obj, s, p, ch.id);
        return current >= obj.target;
      });

      if (allComplete) {
        clearInterval(interval);
        completeChapter(ch);
      }

      // Update progress display
      setProgress(loadStoryProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, [show, view, selectedChapter]);

  const getObjectiveProgress = useCallback(
    (obj: StoryObjective, state: ReturnType<typeof useStore.getState>, prog: StoryProgress, chId: string): number => {
      switch (obj.type) {
        case 'tasks': {
          const startCount = prog.totalTasksAtStart[chId] ?? 0;
          return state.totalTasksCompleted - startCount;
        }
        case 'coins': {
          const startCoins = prog.totalCoinsAtStart[chId] ?? 0;
          const totalEarned = state.economyTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          return totalEarned - startCoins;
        }
        case 'emergencies': {
          const startEmergencies = prog.totalEmergenciesAtStart[chId] ?? 0;
          return state.disasterHistory.length - startEmergencies;
        }
        case 'upgrades': {
          const startUpgrades = prog.totalUpgradesAtStart[chId] ?? 0;
          return state.purchasedUpgrades.length - startUpgrades;
        }
        case 'robots': {
          // For 'robots' type: check how many unique robots have completed tasks
          // target=3 means all 3 robots used, target=30 means min battery check
          if (obj.target <= 3) {
            const robotsUsed = new Set<string>();
            for (const rid of ['sim', 'chef', 'sparkle'] as const) {
              if (state.robots[rid]?.state === 'working' || state.totalTasksCompleted > 0) {
                robotsUsed.add(rid);
              }
            }
            return robotsUsed.size;
          }
          // Battery check: count robots above target battery
          let count = 0;
          for (const rid of ['sim', 'chef', 'sparkle'] as const) {
            if (state.robots[rid]?.battery >= obj.target) count++;
          }
          return count;
        }
        default:
          return prog.objectiveProgress[obj.id] ?? 0;
      }
    },
    [],
  );

  const startChapter = (chapter: StoryChapter) => {
    const state = useStore.getState();
    const p = loadStoryProgress();

    const totalEarned = state.economyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    p.activeChapterId = chapter.id;
    p.totalTasksAtStart[chapter.id] = state.totalTasksCompleted;
    p.totalCoinsAtStart[chapter.id] = totalEarned;
    p.totalEmergenciesAtStart[chapter.id] = state.disasterHistory.length;
    p.totalUpgradesAtStart[chapter.id] = state.purchasedUpgrades.length;
    p.chapterStartedAt[chapter.id] = Date.now();

    saveStoryProgress(p);
    setProgress(p);
    setSelectedChapter(chapter);
    setNarrativeText(chapter.narrativeIntro);
    setCutscenePhase(0);
    setView('cutscene-intro');

    // Animate cutscene
    setTimeout(() => setCutscenePhase(1), 600);
  };

  const closeCutsceneIntro = () => {
    setCutscenePhase(2);
    setTimeout(() => setView('playing'), 500);
  };

  const completeChapter = (chapter: StoryChapter) => {
    const p = loadStoryProgress();
    if (!p.completedChapters.includes(chapter.id)) {
      p.completedChapters.push(chapter.id);
    }
    p.activeChapterId = null;
    saveStoryProgress(p);
    setProgress(p);

    // Show outro cutscene
    setNarrativeText(chapter.narrativeOutro);
    setCutscenePhase(0);
    setView('cutscene-outro');
    setTimeout(() => setCutscenePhase(1), 600);

    // Award coins
    addCoins(chapter.reward);
    addCoinAnimation(chapter.reward);
    recordTransaction('income', 'task-reward', chapter.reward, `Story: ${chapter.title}`);
    addNotification({
      type: 'achievement',
      title: 'Chapter Complete!',
      message: `${chapter.emoji} "${chapter.title}" — earned ${chapter.reward} coins!`,
    });
  };

  const closeCutsceneOutro = () => {
    setCutscenePhase(2);
    setTimeout(() => {
      setView('chapters');
      setSelectedChapter(null);
    }, 500);
  };

  const isChapterUnlocked = (chapter: StoryChapter): boolean => {
    if (!chapter.unlockRequirement) return true;
    return progress.completedChapters.includes(chapter.unlockRequirement);
  };

  const isChapterCompleted = (chapter: StoryChapter): boolean => {
    return progress.completedChapters.includes(chapter.id);
  };

  const isChapterActive = (chapter: StoryChapter): boolean => {
    return progress.activeChapterId === chapter.id;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow(false)} />

      {/* Cutscene overlay */}
      {(view === 'cutscene-intro' || view === 'cutscene-outro') && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center transition-all duration-500"
          style={{ opacity: cutscenePhase === 0 ? 0 : cutscenePhase === 2 ? 0 : 1 }}
        >
          <div className="absolute inset-0 bg-black/90" />
          <div className="relative z-10 mx-auto max-w-2xl px-8">
            {selectedChapter && (
              <div className="text-center">
                <div className="mb-4 text-5xl">{selectedChapter.emoji}</div>
                <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-amber-400/80">
                  Chapter {selectedChapter.number}
                </h2>
                <h3 className="mb-8 text-3xl font-bold text-white">{selectedChapter.title}</h3>
                <p className="mb-10 text-base leading-relaxed text-white/80">{narrativeText}</p>
                {view === 'cutscene-intro' && cutscenePhase === 1 && (
                  <button
                    onClick={closeCutsceneIntro}
                    className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-8 py-3 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-400/20"
                  >
                    Begin Chapter
                  </button>
                )}
                {view === 'cutscene-outro' && cutscenePhase === 1 && (
                  <div>
                    <div className="mb-6 flex items-center justify-center gap-2 text-yellow-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="text-lg font-bold">+{selectedChapter.reward} coins</span>
                    </div>
                    <button
                      onClick={closeCutsceneOutro}
                      className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-8 py-3 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-400/20"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main panel */}
      {(view === 'chapters' || view === 'playing') && (
        <div className="relative w-[540px] max-h-[85vh] overflow-hidden rounded-2xl border border-amber-400/20 bg-gray-900/95 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📖</span>
              <h2 className="text-lg font-semibold text-white">
                {view === 'playing' && selectedChapter ? `Ch.${selectedChapter.number}: ${selectedChapter.title}` : 'Story Mode'}
              </h2>
            </div>
            <button
              onClick={() => setShow(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(85vh - 65px)' }}>
            {view === 'chapters' && <ChapterList progress={progress} onStart={startChapter} isUnlocked={isChapterUnlocked} isCompleted={isChapterCompleted} isActive={isChapterActive} />}
            {view === 'playing' && selectedChapter && (
              <ActiveChapter
                chapter={selectedChapter}
                getObjectiveProgress={getObjectiveProgress}
                onBackToChapters={() => { setView('chapters'); setSelectedChapter(null); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterList({
  progress,
  onStart,
  isUnlocked,
  isCompleted,
  isActive,
}: {
  progress: StoryProgress;
  onStart: (ch: StoryChapter) => void;
  isUnlocked: (ch: StoryChapter) => boolean;
  isCompleted: (ch: StoryChapter) => boolean;
  isActive: (ch: StoryChapter) => boolean;
}) {
  const completedCount = progress.completedChapters.length;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="mb-4 rounded-lg border border-white/5 bg-white/5 p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-white/50">Campaign Progress</span>
          <span className="font-medium text-amber-300">{completedCount}/{STORY_CHAPTERS.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
            style={{ width: `${(completedCount / STORY_CHAPTERS.length) * 100}%` }}
          />
        </div>
      </div>

      {STORY_CHAPTERS.map((chapter) => {
        const unlocked = isUnlocked(chapter);
        const completed = isCompleted(chapter);
        const active = isActive(chapter);

        return (
          <div
            key={chapter.id}
            className={`rounded-xl border p-4 transition-all ${
              completed
                ? 'border-emerald-400/20 bg-emerald-500/5'
                : active
                  ? 'border-amber-400/30 bg-amber-500/10'
                  : unlocked
                    ? 'border-white/10 bg-white/5 hover:border-amber-400/20 hover:bg-white/8'
                    : 'border-white/5 bg-white/[0.02] opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Chapter icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                  completed
                    ? 'bg-emerald-500/20'
                    : active
                      ? 'bg-amber-500/20'
                      : unlocked
                        ? 'bg-white/10'
                        : 'bg-white/5'
                }`}
              >
                {completed ? '✅' : unlocked ? chapter.emoji : '🔒'}
              </div>

              {/* Chapter info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                    Chapter {chapter.number}
                  </span>
                  {completed && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Complete
                    </span>
                  )}
                  {active && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                      In Progress
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white">{chapter.title}</h3>

                {/* Objectives preview */}
                <div className="mt-2 space-y-1">
                  {chapter.objectives.map((obj) => (
                    <div key={obj.id} className="flex items-center gap-1.5 text-xs text-white/40">
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span>{obj.description}</span>
                    </div>
                  ))}
                </div>

                {/* Reward */}
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-300/60">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span>{chapter.reward} coins</span>
                </div>

                {/* Action */}
                {unlocked && !completed && (
                  <button
                    onClick={() => onStart(chapter)}
                    className={`mt-3 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                        : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {active ? 'Resume Chapter' : 'Start Chapter'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {completedCount === STORY_CHAPTERS.length && (
        <div className="mt-4 rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 p-4 text-center">
          <div className="mb-2 text-3xl">👑</div>
          <h3 className="text-sm font-bold text-yellow-300">Master Bot Certified!</h3>
          <p className="mt-1 text-xs text-white/50">
            You&apos;ve completed every chapter. The house runs like a dream.
          </p>
        </div>
      )}
    </div>
  );
}

function ActiveChapter({
  chapter,
  getObjectiveProgress,
  onBackToChapters,
}: {
  chapter: StoryChapter;
  getObjectiveProgress: (obj: StoryObjective, state: ReturnType<typeof useStore.getState>, prog: StoryProgress, chId: string) => number;
  onBackToChapters: () => void;
}) {
  const [liveProgress, setLiveProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const update = () => {
      const state = useStore.getState();
      const prog = loadStoryProgress();
      const map: Record<string, number> = {};
      for (const obj of chapter.objectives) {
        map[obj.id] = getObjectiveProgress(obj, state, prog, chapter.id);
      }
      setLiveProgress(map);
    };

    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [chapter, getObjectiveProgress]);

  return (
    <div className="space-y-4">
      <button onClick={onBackToChapters} className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All Chapters
      </button>

      <div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">{chapter.emoji}</span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-amber-400/60">Chapter {chapter.number}</div>
            <h3 className="text-base font-bold text-white">{chapter.title}</h3>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-white/50">{chapter.narrativeIntro.slice(0, 120)}...</p>
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-white/30">Objectives</h4>
        {chapter.objectives.map((obj) => {
          const current = Math.min(liveProgress[obj.id] ?? 0, obj.target);
          const done = current >= obj.target;
          const pct = Math.min(100, (current / obj.target) * 100);

          return (
            <div
              key={obj.id}
              className={`rounded-lg border p-3 transition-all ${done ? 'border-emerald-400/20 bg-emerald-500/5' : 'border-white/5 bg-white/[0.03]'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${done ? 'text-emerald-400' : 'text-white/30'}`}>{done ? '✓' : '○'}</span>
                  <span className={`text-xs ${done ? 'text-emerald-300' : 'text-white/70'}`}>{obj.description}</span>
                </div>
                <span className={`text-xs font-mono ${done ? 'text-emerald-400' : 'text-white/40'}`}>
                  {current}/{obj.target}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-amber-400/60'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reward preview */}
      <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-400/10 bg-yellow-400/5 py-2 text-xs text-yellow-300/60">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span>Reward: {chapter.reward} coins on completion</span>
      </div>

      <p className="text-center text-[10px] text-white/30">
        Complete objectives by playing the game — progress tracks automatically
      </p>
    </div>
  );
}
