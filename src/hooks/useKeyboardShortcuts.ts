import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import type { SimSpeed } from '../stores/useStore';

export function useKeyboardShortcuts() {
  const cycleCameraMode = useStore((s) => s.cycleCameraMode);
  const setSimSpeed = useStore((s) => s.setSimSpeed);
  const setShowStats = useStore((s) => s.setShowStats);
  const showStats = useStore((s) => s.showStats);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'c':
        case 'C':
          cycleCameraMode();
          break;
        case '0':
          setSimSpeed(0 as SimSpeed);
          break;
        case '1':
          setSimSpeed(1 as SimSpeed);
          break;
        case '2':
          setSimSpeed(10 as SimSpeed);
          break;
        case '3':
          setSimSpeed(60 as SimSpeed);
          break;
        case 's':
        case 'S':
          setShowStats(!showStats);
          break;
        case ' ':
          e.preventDefault();
          setSimSpeed(useStore.getState().simSpeed === 0 ? 1 as SimSpeed : 0 as SimSpeed);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleCameraMode, setSimSpeed, setShowStats, showStats]);
}
