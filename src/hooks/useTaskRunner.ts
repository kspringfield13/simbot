import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { findTaskTarget } from '../utils/homeLayout';
import { getNavigationPath } from '../utils/pathfinding';
import type { Task } from '../types';

export const useTaskRunner = () => {
  const {
    tasks, addTask, updateTask, removeTask,
    setRobotTarget, setRobotState, setRobotPath, setCurrentAnimation,
    robotPosition, addMessage,
  } = useStore();
  const timerRef = useRef<number | null>(null);

  const submitCommand = useCallback(
    (command: string) => {
      const target = findTaskTarget(command);
      if (!target) {
        addMessage({ id: crypto.randomUUID(), sender: 'robot', text: "I'm not sure what to do with that. Try asking me to clean, vacuum, do dishes, or make the bed!", timestamp: Date.now() });
        return;
      }

      addMessage({ id: crypto.randomUUID(), sender: 'user', text: command, timestamp: Date.now() });

      const task: Task = {
        id: crypto.randomUUID(),
        command,
        targetRoom: target.roomId,
        targetPosition: target.position,
        status: 'pending',
        progress: 0,
        description: target.description,
        taskType: target.taskType,
        workDuration: target.workDuration,
      };

      addTask(task);
      addMessage({ id: crypto.randomUUID(), sender: 'robot', text: target.response, timestamp: Date.now() });
    },
    [addTask, addMessage]
  );

  // Process pending tasks — calculate path
  useEffect(() => {
    const currentTask = tasks.find((t) => t.status === 'pending');
    if (!currentTask) return;

    // Calculate navigation path through doorways
    const path = getNavigationPath(robotPosition, currentTask.targetPosition);
    setRobotPath(path);
    setRobotTarget(path[0]);
    setRobotState('walking');
    updateTask(currentTask.id, { status: 'walking' });
  }, [tasks, setRobotTarget, setRobotState, updateTask, robotPosition, setRobotPath]);

  // Check if robot arrived at current path waypoint
  useEffect(() => {
    const currentTask = tasks.find((t) => t.status === 'walking');
    if (!currentTask) return;

    const { robotPath, currentPathIndex } = useStore.getState();
    if (robotPath.length === 0) return;

    const target = robotPath[currentPathIndex];
    if (!target) return;

    const dx = robotPosition[0] - target[0];
    const dz = robotPosition[2] - target[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.4) {
      // Arrived at waypoint — next waypoint or start working
      const nextIndex = currentPathIndex + 1;
      if (nextIndex < robotPath.length) {
        useStore.getState().setCurrentPathIndex(nextIndex);
        setRobotTarget(robotPath[nextIndex]);
      } else {
        // Arrived at destination — start working
        updateTask(currentTask.id, { status: 'working' });
        setRobotState('working');
        setRobotTarget(null);
        setCurrentAnimation(currentTask.taskType);

        // Work progress based on task duration
        let progress = 0;
        const increment = 100 / (currentTask.workDuration * 10);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          progress += increment;
          if (progress >= 100) {
            updateTask(currentTask.id, { status: 'completed', progress: 100 });
            setCurrentAnimation('general');

            // Contextual completion messages
            const completionMsgs: Record<string, string> = {
              'dishes': 'Dishes are done! Everything is clean and put away. ✨',
              'cooking': 'Meal is ready! Smells great in here. 🍳',
              'vacuuming': 'Finished vacuuming! Floors are spotless. 🧹',
              'cleaning': 'All cleaned up! Looking fresh. ✨',
              'bed-making': 'Bed is made! Crisp sheets and fluffy pillows. 🛏️',
              'laundry': 'Laundry is sorted and folded! 👕',
              'organizing': 'Everything is organized and in its place! 📋',
              'scrubbing': 'Bathroom is sparkling clean! 🚿',
              'sweeping': 'Floors are swept! Nice and tidy. 🧹',
              'grocery-list': 'Checked the fridge — here\'s what we need: milk, eggs, bread, veggies, and chicken. Want me to add anything? 🛒',
              'general': 'Done! What\'s next? 👍',
            };
            addMessage({
              id: crypto.randomUUID(),
              sender: 'robot',
              text: completionMsgs[currentTask.taskType] || 'Done!',
              timestamp: Date.now(),
            });
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => removeTask(currentTask.id), 3000);
          } else {
            updateTask(currentTask.id, { progress });
          }
        }, 100);
      }
    }
  }, [robotPosition, tasks, updateTask, setRobotState, setRobotTarget, addMessage, removeTask, setCurrentAnimation]);

  return { submitCommand };
};
