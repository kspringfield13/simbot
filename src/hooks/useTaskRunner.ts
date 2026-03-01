import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { findTaskTarget } from '../utils/homeLayout';
import { getNavigationPath } from '../utils/pathfinding';
import { demoCommands } from '../utils/demoTasks';
import { getTaskCoinReward, getShopSpeedMultiplier } from '../config/shop';
import { getDeployedRobotBonuses } from '../config/crafting';
import { generateDiaryEntry } from '../config/diary';
import type { Task, TaskSource, TaskType } from '../types';
import { ROBOT_IDS } from '../types';

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
  seasonal: 'Seasonal activity complete. That was festive!',
  mowing: 'Lawn mowed. Yard is looking sharp.',
  watering: 'Plants watered. Garden is refreshed.',
  'leaf-blowing': 'Leaves cleared. Yard is tidy.',
  weeding: 'Weeds pulled. Garden beds are clean.',
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
  seasonal: 'Seasonal task done. Love this time of year!',
  mowing: 'Lawn is freshly cut. Looks great.',
  watering: 'Garden is well-hydrated now.',
  'leaf-blowing': 'Yard cleared of leaves. Much better.',
  weeding: 'Garden beds are weed-free.',
};

export const useTaskRunner = () => {
  const tasks = useStore((state) => state.tasks);
  const robots = useStore((state) => state.robots);
  const activeRobotId = useStore((state) => state.activeRobotId);
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
  const updateRobotNeeds = useStore((state) => state.updateRobotNeeds);
  const applyRoomTaskResult = useStore((state) => state.applyRoomTaskResult);
  const clearQueuedAiTasks = useStore((state) => state.clearQueuedAiTasks);
  const setOverrideUntil = useStore((state) => state.setOverrideUntil);

  const doorwayPauseTimerRef = useRef<number | null>(null);
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
      setRobotThought(activeRobotId, 'Command unclear. Waiting for a clearer instruction.');
      return;
    }

    const state = useStore.getState();
    const rid = state.activeRobotId;

    if (source === 'user') {
      clearQueuedAiTasks(rid);
      setOverrideUntil(state.simMinutes + 90);
      // User interaction boosts social and happiness
      const needs = state.robots[rid].needs;
      updateRobotNeeds(rid, {
        social: Math.min(100, needs.social + 15),
        happiness: Math.min(100, needs.happiness + 5),
        boredom: Math.max(0, needs.boredom - 10),
      });

      const blockingAiTasks = state.tasks.filter(
        (task) => task.assignedTo === rid && task.source === 'ai' && (task.status === 'walking' || task.status === 'working'),
      );

      if (blockingAiTasks.length > 0) {
        for (const task of blockingAiTasks) {
          removeTask(task.id);
        }

        setRobotPath(rid, []);
        setRobotTarget(rid, null);
        setRobotState(rid, 'idle');
        setCurrentAnimation(rid, 'general');
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
      assignedTo: rid,
    };

    addTask(task);
    setRobotThought(rid, target.thought);
    setRobotMood(rid, source === 'ai' ? 'routine' : 'focused');

    addMessage({
      id: crypto.randomUUID(),
      sender: 'robot',
      text: target.response,
      timestamp: Date.now(),
    });
  }, [
    activeRobotId,
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
    updateRobotNeeds,
  ]);

  // Pick up queued tasks for each robot
  useEffect(() => {
    const state = useStore.getState();

    for (const rid of ROBOT_IDS) {
      const robotTasks = state.tasks.filter((t) => t.assignedTo === rid);
      const hasActive = robotTasks.some((task) => task.status === 'walking' || task.status === 'working');
      if (hasActive) continue;

      const nextTask = robotTasks
        .filter((task) => task.status === 'queued')
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (!nextTask) continue;

      const robotPos = state.robots[rid].position;
      const path = getNavigationPath(robotPos, nextTask.targetPosition);
      if (path.length === 0) continue;

      setRobotPath(rid, path);
      setCurrentPathIndex(rid, 0);
      setRobotTarget(rid, path[0].position);
      setRobotState(rid, 'walking');
      setCurrentAnimation(rid, 'general');
      setRobotThought(rid, `Heading to ${nextTask.targetRoom.replace('-', ' ')}.`);
      setRobotMood(rid, 'focused');
      updateTask(nextTask.id, { status: 'walking', progress: Math.max(nextTask.progress, 2) });
    }
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

  // Navigation waypoint tracking for all robots
  useEffect(() => {
    const state = useStore.getState();

    for (const rid of ROBOT_IDS) {
      const robotState = state.robots[rid];
      const activeTask = state.tasks.find((task) => task.assignedTo === rid && task.status === 'walking');
      if (!activeTask) continue;

      const currentNode = robotState.path[robotState.currentPathIndex];
      if (!currentNode) continue;

      const dx = robotState.position[0] - currentNode.position[0];
      const dz = robotState.position[2] - currentNode.position[2];
      const distance = Math.hypot(dx, dz);

      if (distance > 0.26) continue;

      const nextIndex = robotState.currentPathIndex + 1;

      if (nextIndex < robotState.path.length) {
        const nextNode = robotState.path[nextIndex];
        if (!nextNode) continue;

        setCurrentPathIndex(rid, nextIndex);
        setRobotTarget(rid, nextNode.position);
        setRobotState(rid, 'walking');
        continue;
      }

      updateTask(activeTask.id, { status: 'working', progress: Math.max(activeTask.progress, 5) });
      setRobotState(rid, 'working');
      setRobotTarget(rid, null);
      setRobotPath(rid, []);
      setCurrentPathIndex(rid, 0);
      setCurrentAnimation(rid, activeTask.taskType);
      setRobotThought(rid, activeTask.description);
    }
  }, [
    robots,
    tasks,
    setCurrentAnimation,
    setCurrentPathIndex,
    setRobotPath,
    setRobotState,
    setRobotTarget,
    setRobotThought,
    updateTask,
  ]);

  // Work progress timer
  useEffect(() => {
    const interval = window.setInterval(() => {
      const state = useStore.getState();
      if (state.simSpeed === 0) return;

      for (const rid of ROBOT_IDS) {
        const activeTask = state.tasks.find((task) => task.assignedTo === rid && task.status === 'working');
        if (!activeTask) continue;

        const craftingBonuses = getDeployedRobotBonuses(state.customRobots);
        const shopSpeedMult = getShopSpeedMultiplier(state.purchasedUpgrades, craftingBonuses.speedBonus);
        const step = (100 / activeTask.workDuration) * 0.1 * state.simSpeed / shopSpeedMult;
        const nextProgress = Math.min(100, activeTask.progress + step);

        updateTask(activeTask.id, { progress: nextProgress });

        if (nextProgress < 100) continue;

        updateTask(activeTask.id, { status: 'completed', progress: 100 });

        applyRoomTaskResult(activeTask.targetRoom, activeTask.taskType);
        state.recordTaskCompletion(activeTask.taskType);
        state.recordStats(activeTask.taskType, activeTask.targetRoom);
        state.recordRobotTaskCompletion(rid, activeTask.taskType, activeTask.workDuration);
        state.recordPersonalityTaskCompletion(rid, activeTask.taskType);

        // Award coins for completing the task
        const coinReward = getTaskCoinReward(activeTask.workDuration);
        state.addCoins(coinReward);

        // Generate diary entry
        const robot = state.robots[rid];
        const diaryEntry = generateDiaryEntry({
          robotId: rid,
          simMinutes: state.simMinutes,
          mood: robot.mood,
          battery: robot.battery,
          energy: robot.needs.energy,
          happiness: robot.needs.happiness,
          weather: state.weather,
          season: state.currentSeason,
          taskType: activeTask.taskType,
          roomId: activeTask.targetRoom,
        });
        state.addDiaryEntry(diaryEntry);

        setCurrentAnimation(rid, 'general');
        setRobotState(rid, 'idle');
        setRobotTarget(rid, null);
        setRobotMood(rid, 'content');
        setRobotThought(rid, completionThoughts[activeTask.taskType] ?? completionThoughts.general);

        addMessage({
          id: crypto.randomUUID(),
          sender: 'robot',
          text: completionMessages[activeTask.taskType] ?? completionMessages.general,
          timestamp: Date.now(),
        });

        window.setTimeout(() => {
          removeTask(activeTask.id);
        }, 1500);
      }
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

  // Demo mode
  useEffect(() => {
    if (!demoMode) {
      demoIndexRef.current = 0;
      return;
    }

    submitCommand(demoCommands[0], 'demo');
    demoIndexRef.current = 1;

    const interval = window.setInterval(() => {
      const state = useStore.getState();
      const rid = state.activeRobotId;
      const hasActiveTask = state.tasks.some((task) => task.assignedTo === rid && ACTIVE_STATUSES.has(task.status));
      if (hasActiveTask || state.robots[rid].state !== 'idle') return;

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
