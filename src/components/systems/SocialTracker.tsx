import { useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { ROBOT_IDS } from '../../types';
import type { RobotId, ActiveChat } from '../../types';
import { getRoomFromPoint } from '../../utils/homeLayout';
import { getFriendshipKey, getConversation, SOCIAL_THOUGHTS } from '../../config/conversations';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Headless component that:
 * 1. Detects when robots are in the same room
 * 2. Occasionally triggers chat interactions between them
 * 3. Updates friendship levels after chats
 * 4. Higher friendship = more frequent chats
 * 5. High friendship robots may follow each other to the same room
 */
export function SocialTracker() {
  const lastCheckRef = useRef(0);
  const followCooldownRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const { simMinutes, simSpeed, robots, friendships, activeChats } = state;
      if (simSpeed === 0) return;

      // Only check every ~3 sim-minutes
      if (simMinutes - lastCheckRef.current < 3) return;
      lastCheckRef.current = simMinutes;

      // ── Advance / end active chats ──
      for (const chat of activeChats) {
        if (simMinutes >= chat.nextLineAt) {
          if (chat.currentLineIndex < chat.lines.length - 1) {
            state.advanceChatLine(chat.robotA, chat.robotB);
            // Next line appears after 4-6 sim-minutes
            const nextChat = state.activeChats.find(
              (c) => c.robotA === chat.robotA && c.robotB === chat.robotB,
            );
            if (nextChat) {
              // Mutating the store directly via advanceChatLine already handled index,
              // but we need to set the nextLineAt — we'll do that via a re-start
              state.endChat(chat.robotA, chat.robotB);
              state.startChat({
                ...chat,
                currentLineIndex: chat.currentLineIndex + 1,
                nextLineAt: simMinutes + 4 + Math.random() * 2,
              });
            }
          } else {
            // Chat finished — boost friendship and social needs
            state.endChat(chat.robotA, chat.robotB);
            const key = getFriendshipKey(chat.robotA, chat.robotB);
            const friendship = friendships[key];
            const boost = friendship && friendship.level >= 50 ? 2 : 3;
            state.updateFriendship(key, boost, simMinutes);

            // Boost social needs for both robots
            const needsA = robots[chat.robotA].needs;
            const needsB = robots[chat.robotB].needs;
            state.updateRobotNeeds(chat.robotA, {
              social: Math.min(100, needsA.social + 12),
              happiness: Math.min(100, needsA.happiness + 4),
              boredom: Math.max(0, needsA.boredom - 8),
            });
            state.updateRobotNeeds(chat.robotB, {
              social: Math.min(100, needsB.social + 12),
              happiness: Math.min(100, needsB.happiness + 4),
              boredom: Math.max(0, needsB.boredom - 8),
            });

            // Post-chat thought
            state.setRobotThought(chat.robotA, pick(SOCIAL_THOUGHTS.after));
            state.setRobotThought(chat.robotB, pick(SOCIAL_THOUGHTS.after));
          }
        }
      }

      // ── Detect co-located robots and maybe start chats ──
      const robotRooms: Record<RobotId, string | null> = {} as any;
      for (const id of ROBOT_IDS) {
        const r = robots[id];
        robotRooms[id] = getRoomFromPoint(r.position[0], r.position[2]);
      }

      // Check each pair
      for (let i = 0; i < ROBOT_IDS.length; i++) {
        for (let j = i + 1; j < ROBOT_IDS.length; j++) {
          const a = ROBOT_IDS[i];
          const b = ROBOT_IDS[j];
          const roomA = robotRooms[a];
          const roomB = robotRooms[b];

          if (!roomA || !roomB || roomA !== roomB) continue;

          // Both in same room — check if they can chat
          const key = getFriendshipKey(a, b);
          const friendship = friendships[key];
          if (!friendship) continue;

          // Already chatting?
          const alreadyChatting = activeChats.some(
            (c) => (c.robotA === a && c.robotB === b) || (c.robotA === b && c.robotB === a),
          );
          if (alreadyChatting) continue;

          // Either robot busy?
          if (robots[a].state === 'working' || robots[b].state === 'working') continue;
          if (robots[a].isCharging || robots[b].isCharging) continue;

          // Cooldown based on friendship: higher friendship = shorter cooldown
          const cooldown = friendship.level >= 60 ? 15 : friendship.level >= 30 ? 30 : 50;
          if (simMinutes - friendship.lastChatAt < cooldown) continue;

          // Random chance to start chat: higher friendship = higher chance
          const chatChance = friendship.level >= 60 ? 0.35 : friendship.level >= 30 ? 0.2 : 0.12;
          if (Math.random() > chatChance) continue;

          // Start a conversation!
          const convo = getConversation(a, b, friendship.level);
          const chat: ActiveChat = {
            robotA: a,
            robotB: b,
            lines: convo,
            currentLineIndex: 0,
            startedAt: simMinutes,
            nextLineAt: simMinutes + 4 + Math.random() * 2,
          };
          state.startChat(chat);

          // Set social thoughts on both robots
          state.setRobotThought(a, pick(SOCIAL_THOUGHTS.during));
          state.setRobotThought(b, pick(SOCIAL_THOUGHTS.during));
          state.setRobotMood(a, 'happy');
          state.setRobotMood(b, 'happy');
        }
      }

      // ── Follow behavior: high-friendship robots occasionally follow friends ──
      for (let i = 0; i < ROBOT_IDS.length; i++) {
        for (let j = i + 1; j < ROBOT_IDS.length; j++) {
          const a = ROBOT_IDS[i];
          const b = ROBOT_IDS[j];
          const key = getFriendshipKey(a, b);
          const friendship = friendships[key];
          if (!friendship || friendship.level < 50) continue;

          // Only follow if in different rooms and both idle
          const roomA = robotRooms[a];
          const roomB = robotRooms[b];
          if (roomA === roomB) continue;
          if (robots[a].state !== 'idle' || robots[b].state !== 'idle') continue;

          // Cooldown on follow attempts per pair
          const followKey = key;
          const lastFollow = followCooldownRef.current[followKey] ?? 0;
          if (simMinutes - lastFollow < 60) continue;

          // Chance to follow: friendship 50-69 = 8%, 70-89 = 15%, 90+ = 25%
          const followChance = friendship.level >= 90 ? 0.25 : friendship.level >= 70 ? 0.15 : 0.08;
          if (Math.random() > followChance) continue;

          // Pick the follower (the one with lower social need follows the other)
          const follower = robots[a].needs.social < robots[b].needs.social ? a : b;
          const leader = follower === a ? b : a;
          const leaderPos = robots[leader].position;

          // Create a task for the follower to go to the leader's room
          const offsetX = (Math.random() - 0.5) * 2;
          const offsetZ = (Math.random() - 0.5) * 2;
          const leaderRoom = robotRooms[leader];
          if (!leaderRoom) continue;

          state.addTask({
            id: crypto.randomUUID(),
            command: `Following ${leader}`,
            source: 'ai',
            targetRoom: leaderRoom,
            targetPosition: [leaderPos[0] + offsetX, 0, leaderPos[2] + offsetZ],
            status: 'queued',
            progress: 0,
            description: `Going to hang out with ${leader}.`,
            taskType: 'general',
            workDuration: 5,
            createdAt: Date.now(),
            assignedTo: follower,
          });

          state.setRobotThought(follower, pick(SOCIAL_THOUGHTS.following));
          state.setRobotMood(follower, 'happy');

          followCooldownRef.current[followKey] = simMinutes;
        }
      }
    }, 3000); // check every 3 real seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
