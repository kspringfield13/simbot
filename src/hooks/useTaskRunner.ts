import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { findTaskTarget } from '../utils/homeLayout';
import { getNavigationPath } from '../utils/pathfinding';
import { demoCommands } from '../utils/demoTasks';
import type { Task, TaskSource, TaskType } from '../types';

const ACTIVE_STATUSES = new Set(['queued', 'walking', 'working']);

const completionMessages: Record<TaskType, string> = {
  dishes: 'Dishes complete. Kitchen is reset.',
  cooking: 'Meal prep complete. Kitchen is warm and ready.',
  vacuuming: 'Vacuuming complete. Floor pass done.',
  cleaning: 'Cleanup complete. Area looks fresh.',
  'bed-making': 'Bed made. Bedroom looks reset.',
  laundry: 'Laundry cycle done and folded.',
  organizing: 'Organization complete. Items are back in place.',
  scrubbing: 'Bathroom scrub complete. Surfaces are spotless.',
  sweeping: 'Sweep complete. Walkways are clear.',
  'grocery-list': 'Inventory check complete. Grocery list generated.',
  general: 'Done. Awaiting next priority.',
};

const completionThoughts: Record<TaskType, string> = {
  dishes: 'Sink zone is clear now.',
  cooking: 'Kitchen routine complete.',
  vacuuming: 'Floors look better after that pass.',
  cleaning: 'That room feels balanced again.',
  'bed-making': 'Bed is tidy and ready.',
  laundry: 'Laundry stack reduced.',
  organizing: 'Everything is back to a stable state.',
  scrubbing: 'Bathroom reset complete.',
  sweeping: 'Traffic path is clean again.',
  'grocery-list': 'Inventory status updated.',
  general: 'Monitoring for the next need.',
};

export const useTaskRunner = () => {
  const tasks = useStore((state) => state.tasks);
  const robotPosition = useStore((state) => state.robotPosition);
  const demoMode = useStore((state) => state.demoMode);

  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const removeTask = useStore((state) => state.removeTask);
  const addMessage = useStore((state) => state.addMessage);

  const setRobotTarget = useStore((state) => state.setRobotTarget);
  const setRobotPath = useStore((state) => state.setRobotPath);
  const setRobotState = useStore((state) => state.setRobotState);
  const setCurrentPathIndex = useStore((state) => state.setCurrentPathIndex);
  const setCurrentAnimation = useStore((state) => state.setCurrentAnimation);
  const setRobotThought = useStore((state) => state.setRobotThought);
  const setRobotMood = useStore((state) => state.setRobotMood);
  const applyRoomTaskResult = useStore((state) => state.applyRoomTaskResult);
  const clearQueuedAiTasks = useStore((state) => state.clearQueuedAiTasks);
  const setOverrideUntil = useStore((state) => state.setOverrideUntil);

  const doorwayPauseTimerRef = useRef<number | null>(null);
  const doorwayPauseKeyRef = useRef<string | null>(null);
  const demoIndexRef = useRef(0);

  const submitCommand = useCallback((command: string, source: TaskSource = 'user') => {
    const trimmed = command.trim();
    if (!trimmed) return;

    const target = findTaskTarget(trimmed);

    if (!target) {
      addMessage({
        id: crypto.randomUUID(),
        sender: 'robot',
        text: 'I could not map that command to a task. Try: clean kitchen, vacuum living room, or make the bed.',
        timestamp: Date.now(),
      });
      setRobotThought('Command unclear. Waiting for a clearer instruction.');
      return;
    }

    const state = useStore.getState();

    if (source === 'user') {
      clearQueuedAiTasks();
      setOverrideUntil(state.simMinutes + 90);

      const blockingAiTasks = state.tasks.filter(
        (task) => task.source === 'ai' && (task.status === 'walking' || task.status === 'working'),
      );

      if (blockingAiTasks.length > 0) {
        for (const task of blockingAiTasks) {
          removeTask(task.id);
        }

        setRobotPath([]);
        setRobotTarget(null);
        setRobotState('idle');
        setCurrentAnimation('general');
      }
    }

    addMessage({
      id: crypto.randomUUID(),
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    });

    const task: Task = {
      id: crypto.randomUUID(),
      command: trimmed,
      source,
      targetRoom: target.roomId,
      targetPosition: target.position,
      status: 'queued',
      progress: 0,
      description: target.description,
      taskType: target.taskType,
      workDuration: target.workDuration,
      createdAt: Date.now(),
    };

    addTask(task);
    setRobotThought(target.thought);
    setRobotMood(source === 'ai' ? 'routine' : 'focused');

    addMessage({
      id: crypto.randomUUID(),
      sender: 'robot',
      text: target.response,
      timestamp: Date.now(),
    });
  }, [
    addMessage,
    addTask,
    clearQueuedAiTasks,
    removeTask,
    setCurrentAnimation,
    setOverrideUntil,
    setRobotMood,
    setRobotPath,
    setRobotState,
    setRobotTarget,
    setRobotThought,
  ]);

  useEffect(() => {
    const state = useStore.getState();
    const hasActiveTask = state.tasks.some((task) => task.status === 'walking' || task.status === 'working');
    if (hasActiveTask) return;

    const nextTask = state.tasks
      .filter((task) => task.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (!nextTask) return;

    const path = getNavigationPath(state.robotPosition, nextTask.targetPosition);
    if (path.length === 0) return;

    setRobotPath(path);
    setCurrentPathIndex(0);
    setRobotTarget(path[0].position);
    setRobotState('walking');
    setCurrentAnimation('general');
    setRobotThought(`Heading to ${nextTask.targetRoom.replace('-', ' ')}.`);
    setRobotMood('focused');
    updateTask(nextTask.id, { status: 'walking', progress: Math.max(nextTask.progress, 2) });
  }, [
    tasks,
    setCurrentAnimation,
    setCurrentPathIndex,
    setRobotMood,
    setRobotPath,
    setRobotState,
    setRobotTarget,
    setRobotThought,
    updateTask,
  ]);

  useEffect(() => {
    const state = useStore.getState();
    const activeTask = state.tasks.find((task) => task.status === 'walking');
    if (!activeTask) {
      doorwayPauseKeyRef.current = null;
      return;
    }

    const currentNode = state.robotPath[state.currentPathIndex];
    if (!currentNode) return;

    const dx = state.robotPosition[0] - currentNode.position[0];
    const dz = state.robotPosition[2] - currentNode.position[2];
    const distance = Math.hypot(dx, dz);

    if (distance > 0.26) return;

    const nextIndex = state.currentPathIndex + 1;

    if (nextIndex < state.robotPath.length) {
      const nextNode = state.robotPath[nextIndex];
      if (!nextNode) return;

      const pauseKey = `${activeTask.id}:${state.currentPathIndex}:${currentNode.id}`;

      if (currentNode.pauseAtDoorway && doorwayPauseKeyRef.current !== pauseKey) {
        doorwayPauseKeyRef.current = pauseKey;
        // Instead of stopping, immediately set next waypoint so robot
        // walks through doorways fluidly with only a brief slowdown
        setCurrentPathIndex(nextIndex);
        setRobotTarget(nextNode.position);

        // Small delay before clearing the pause key to prevent re-trigger
        if (doorwayPauseTimerRef.current) {
          window.clearTimeout(doorwayPauseTimerRef.current);
        }
        doorwayPauseTimerRef.current = window.setTimeout(() => {
          doorwayPauseKeyRef.current = null;
        }, 200 / Math.max(state.simSpeed, 1));

        return;
      }

      setCurrentPathIndex(nextIndex);
      setRobotTarget(nextNode.position);
      setRobotState('walking');
      return;
    }

    updateTask(activeTask.id, { status: 'working', progress: Math.max(activeTask.progress, 5) });
    setRobotState('working');
    setRobotTarget(null);
    setRobotPath([]);
    setCurrentPathIndex(0);
    setCurrentAnimation(activeTask.taskType);
    setRobotThought(activeTask.description);
    doorwayPauseKeyRef.current = null;
  }, [
    robotPosition,
    tasks,
    setCurrentAnimation,
    setCurrentPathIndex,
    setRobotPath,
    setRobotState,
    setRobotTarget,
    setRobotThought,
    updateTask,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const state = useStore.getState();
      const activeTask = state.tasks.find((task) => task.status === 'working');
      if (!activeTask) return;
      if (state.simSpeed === 0) return;

      const step = (100 / activeTask.workDuration) * 0.1 * state.simSpeed;
      const nextProgress = Math.min(100, activeTask.progress + step);

      updateTask(activeTask.id, { progress: nextProgress });

      if (nextProgress < 100) return;

      updateTask(activeTask.id, {
        status: 'completed',
        progress: 100,
      });

      applyRoomTaskResult(activeTask.targetRoom, activeTask.taskType);

      setCurrentAnimation('general');
      setRobotState('idle');
      setRobotTarget(null);
      setRobotMood('content');
      setRobotThought(completionThoughts[activeTask.taskType] ?? completionThoughts.general);

      addMessage({
        id: crypto.randomUUID(),
        sender: 'robot',
        text: completionMessages[activeTask.taskType] ?? completionMessages.general,
        timestamp: Date.now(),
      });

      window.setTimeout(() => {
        removeTask(activeTask.id);
      }, 1500);
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    addMessage,
    applyRoomTaskResult,
    removeTask,
    setCurrentAnimation,
    setRobotMood,
    setRobotState,
    setRobotTarget,
    setRobotThought,
    updateTask,
  ]);

  useEffect(() => {
    if (!demoMode) {
      demoIndexRef.current = 0;
      return;
    }

    submitCommand(demoCommands[0], 'demo');
    demoIndexRef.current = 1;

    const interval = window.setInterval(() => {
      const state = useStore.getState();
      const hasActiveTask = state.tasks.some((task) => ACTIVE_STATUSES.has(task.status));
      if (hasActiveTask || state.robotState !== 'idle') return;

      const nextCommand = demoCommands[demoIndexRef.current % demoCommands.length];
      submitCommand(nextCommand, 'demo');
      demoIndexRef.current += 1;
    }, 1800);

    return () => {
      window.clearInterval(interval);
    };
  }, [demoMode, submitCommand]);

  useEffect(() => () => {
    if (doorwayPauseTimerRef.current) {
      window.clearTimeout(doorwayPauseTimerRef.current);
    }
  }, []);

  return { submitCommand };
};
