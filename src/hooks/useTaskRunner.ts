import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { findTaskTarget } from '../utils/homeLayout';
import type { Task } from '../types';

export const useTaskRunner = () => {
  const { tasks, addTask, updateTask, removeTask, setRobotTarget, setRobotState, robotPosition, addMessage } = useStore();
  const timerRef = useRef<number | null>(null);

  const submitCommand = useCallback(
    (command: string) => {
      const target = findTaskTarget(command);
      if (!target) {
        addMessage({ id: crypto.randomUUID(), sender: 'robot', text: "I'm not sure what to do with that. Try asking me to clean a room!", timestamp: Date.now() });
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
      };

      addTask(task);
      addMessage({ id: crypto.randomUUID(), sender: 'robot', text: `Got it! I'll ${command.toLowerCase()}. On my way!`, timestamp: Date.now() });
    },
    [addTask, addMessage]
  );

  // Process tasks
  useEffect(() => {
    const currentTask = tasks.find((t) => t.status === 'pending' || t.status === 'walking' || t.status === 'working');
    if (!currentTask) {
      setRobotState('idle');
      setRobotTarget(null);
      return;
    }

    if (currentTask.status === 'pending') {
      updateTask(currentTask.id, { status: 'walking' });
      setRobotTarget(currentTask.targetPosition);
      setRobotState('walking');
    }
  }, [tasks, setRobotTarget, setRobotState, updateTask]);

  // Check if robot arrived at target
  useEffect(() => {
    const currentTask = tasks.find((t) => t.status === 'walking');
    if (!currentTask) return;

    const dx = robotPosition[0] - currentTask.targetPosition[0];
    const dz = robotPosition[2] - currentTask.targetPosition[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      updateTask(currentTask.id, { status: 'working' });
      setRobotState('working');
      setRobotTarget(null);

      // Simulate work progress
      let progress = 0;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        progress += 2;
        if (progress >= 100) {
          updateTask(currentTask.id, { status: 'completed', progress: 100 });
          addMessage({ id: crypto.randomUUID(), sender: 'robot', text: `Done! Finished: ${currentTask.command}`, timestamp: Date.now() });
          if (timerRef.current) clearInterval(timerRef.current);
          // Remove after delay
          setTimeout(() => removeTask(currentTask.id), 2000);
        } else {
          updateTask(currentTask.id, { progress });
        }
      }, 100);
    }
  }, [robotPosition, tasks, updateTask, setRobotState, setRobotTarget, addMessage, removeTask]);

  return { submitCommand };
};
