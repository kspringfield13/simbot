import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useStore } from '../stores/useStore';
import { playDoorbell } from '../audio/SoundEffects';
import type { VisitorEventType } from '../types';

/** Position just inside the south wall — the "front door" */
export const FRONT_DOOR_POSITION: [number, number, number] = [0, 0, -18];

const VISITOR_EVENTS: VisitorEventType[] = ['doorbell', 'package', 'visitor'];

const EVENT_THOUGHTS: Record<VisitorEventType, { walking: string; working: string; done: string }> = {
  doorbell: {
    walking: 'Doorbell! Let me go check who it is.',
    working: 'Hmm, nobody there. Must have been a quick ring.',
    done: 'False alarm. Back to what I was doing.',
  },
  package: {
    walking: 'I hear the doorbell — might be a delivery!',
    working: 'A package! Let me bring this inside.',
    done: "Package secured. I wonder what's inside.",
  },
  visitor: {
    walking: "Someone's at the door! Let me go say hello.",
    working: 'Hello there! So nice to have a visitor.',
    done: 'That was a lovely visit. Back to my duties.',
  },
};

const TOAST_MESSAGES: Record<VisitorEventType, { trigger: string; done: string }> = {
  doorbell: {
    trigger: '🔔 Ding-dong! Someone rang the doorbell.',
    done: '🤖 Sim checked the door — nobody there!',
  },
  package: {
    trigger: '📦 A package was delivered to the front door!',
    done: '🤖 Sim picked up the package.',
  },
  visitor: {
    trigger: '👋 A visitor appeared at the front door!',
    done: '🤖 Sim greeted the visitor. They left happy!',
  },
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function VisitorSystem() {
  const nextEventRef = useRef(0);
  const visitorTaskIdRef = useRef<string | null>(null);
  const eventTypeRef = useRef<VisitorEventType | null>(null);
  const handledCompletionRef = useRef(false);

  useFrame(() => {
    const s = useStore.getState();
    if (s.simSpeed === 0) return;

    const now = s.simMinutes;

    // Initialize next event time
    if (nextEventRef.current === 0) {
      nextEventRef.current = now + rand(15, 35);
      return;
    }

    // Track current visitor task lifecycle
    if (visitorTaskIdRef.current && eventTypeRef.current) {
      const task = s.tasks.find((t) => t.id === visitorTaskIdRef.current);

      // Task completed — show done toast
      if (task && task.status === 'completed' && !handledCompletionRef.current) {
        handledCompletionRef.current = true;
        const toasts = TOAST_MESSAGES[eventTypeRef.current];
        const thoughts = EVENT_THOUGHTS[eventTypeRef.current];
        s.setVisitorToast(toasts.done);
        s.setRobotThought(thoughts.done);
        s.triggerEmoji('✨');

        // Social boost from visitor interaction
        s.updateRobotNeeds({
          social: Math.min(100, s.robotNeeds.social + 12),
          happiness: Math.min(100, s.robotNeeds.happiness + 8),
        });

        // Clear event after a delay
        setTimeout(() => {
          const current = useStore.getState();
          current.setVisitorEvent(null);
          current.setVisitorToast(null);
        }, 3000);
      }

      // Task fully removed from queue — reset for next event
      if (!task) {
        visitorTaskIdRef.current = null;
        eventTypeRef.current = null;
        handledCompletionRef.current = false;
        nextEventRef.current = now + rand(20, 50);
      }

      return;
    }

    // Don't fire events at night
    if (s.simPeriod === 'night') return;

    // Not time yet
    if (now < nextEventRef.current) return;

    // Don't interrupt user tasks
    if (s.tasks.some((t) => t.source === 'user' && (t.status === 'walking' || t.status === 'working'))) {
      nextEventRef.current = now + rand(3, 8);
      return;
    }

    // Wait until robot is idle
    if (s.robotState !== 'idle') {
      nextEventRef.current = now + rand(3, 8);
      return;
    }

    // Trigger a random visitor event
    triggerVisitorEvent(s, pick(VISITOR_EVENTS));
  });

  function triggerVisitorEvent(
    s: ReturnType<typeof useStore.getState>,
    type: VisitorEventType,
  ) {
    const thoughts = EVENT_THOUGHTS[type];
    const toasts = TOAST_MESSAGES[type];

    // Play doorbell sound
    if (!s.soundMuted) {
      playDoorbell();
    }

    // Set store state
    s.setVisitorEvent({ type });
    s.setVisitorToast(toasts.trigger);
    s.triggerEmoji(type === 'package' ? '📦' : type === 'visitor' ? '👋' : '🔔');

    // Clear queued AI tasks so robot prioritizes the door
    s.clearQueuedAiTasks();

    // Cancel active AI task if any
    const activeAiTask = s.tasks.find(
      (t) => t.source === 'ai' && (t.status === 'walking' || t.status === 'working'),
    );
    if (activeAiTask) {
      s.removeTask(activeAiTask.id);
      s.setRobotPath([]);
      s.setRobotTarget(null);
      s.setRobotState('idle');
      s.setCurrentAnimation('general');
    }

    // Create a task to walk to the front door
    const taskId = crypto.randomUUID();
    visitorTaskIdRef.current = taskId;
    eventTypeRef.current = type;
    handledCompletionRef.current = false;

    s.addTask({
      id: taskId,
      command: `Answer door (${type})`,
      source: 'ai',
      targetRoom: 'living-room',
      targetPosition: FRONT_DOOR_POSITION,
      status: 'queued',
      progress: 0,
      description: thoughts.working,
      taskType: 'general',
      workDuration: type === 'visitor' ? 8 : 5,
      createdAt: Date.now(),
    });

    s.setRobotThought(thoughts.walking);
    s.setRobotMood('curious');

    // Clear trigger toast after 4 seconds
    const triggerText = toasts.trigger;
    setTimeout(() => {
      const current = useStore.getState();
      if (current.visitorToast === triggerText) {
        current.setVisitorToast(null);
      }
    }, 4000);
  }

  return null;
}
