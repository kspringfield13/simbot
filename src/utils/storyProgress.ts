const STORAGE_KEY = 'simbot-story-progress';

export interface StoryProgress {
  completedChapters: string[];
  activeChapterId: string | null;
  objectiveProgress: Record<string, number>; // objectiveId -> current count
  totalTasksAtStart: Record<string, number>; // chapterId -> tasks completed when started
  totalCoinsAtStart: Record<string, number>; // chapterId -> coins earned when started
  totalEmergenciesAtStart: Record<string, number>;
  totalUpgradesAtStart: Record<string, number>;
  chapterStartedAt: Record<string, number>; // timestamps
}

const DEFAULT_PROGRESS: StoryProgress = {
  completedChapters: [],
  activeChapterId: null,
  objectiveProgress: {},
  totalTasksAtStart: {},
  totalCoinsAtStart: {},
  totalEmergenciesAtStart: {},
  totalUpgradesAtStart: {},
  chapterStartedAt: {},
};

export function loadStoryProgress(): StoryProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveStoryProgress(progress: StoryProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* ignore quota errors */ }
}
