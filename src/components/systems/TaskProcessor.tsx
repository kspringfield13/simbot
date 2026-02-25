import { useTaskRunner } from '../../hooks/useTaskRunner';

/**
 * Headless component that runs the task processing loop.
 * Must be mounted in the React tree for tasks to execute.
 */
export function TaskProcessor() {
  useTaskRunner();
  return null;
}
