import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotMood } from '../../types';
import {
  moodMusicEngine,
  getMoodCategory,
  MOOD_LABELS,
  type MoodCategory,
} from '../../systems/MoodMusicEngine';

/**
 * Calculate collective mood from all robots' current emotions.
 * Returns the most common mood category (majority vote).
 * Ties broken by priority: happy > curious > focused > bored > tired.
 */
function getCollectiveMood(moods: RobotMood[]): MoodCategory {
  const counts: Record<MoodCategory, number> = {
    happy: 0,
    focused: 0,
    tired: 0,
    curious: 0,
    bored: 0,
  };

  for (const mood of moods) {
    counts[getMoodCategory(mood)]++;
  }

  // Find the category with the most votes
  const priority: MoodCategory[] = ['happy', 'curious', 'focused', 'bored', 'tired'];
  let best: MoodCategory = 'happy';
  let bestCount = 0;

  for (const cat of priority) {
    if (counts[cat] > bestCount) {
      bestCount = counts[cat];
      best = cat;
    }
  }

  return best;
}

/**
 * MoodMusicSystem — monitors all robots' moods and drives the ambient
 * mood music layer. Calculates a collective mood and crossfades
 * between mood styles. Renders nothing.
 */
export function MoodMusicSystem() {
  const lastMoodRef = useRef<MoodCategory | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      moodMusicEngine.disable();
    };
  }, []);

  // Poll robot moods at a reasonable interval (every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();

      if (!state.moodMusicEnabled) return;

      // Gather all robot moods
      const moods: RobotMood[] = ROBOT_IDS.map((id) => state.robots[id].mood);
      const collective = getCollectiveMood(moods);

      if (collective !== lastMoodRef.current) {
        lastMoodRef.current = collective;
        moodMusicEngine.setMood(collective);
        state.setMoodMusicLabel(MOOD_LABELS[collective]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
