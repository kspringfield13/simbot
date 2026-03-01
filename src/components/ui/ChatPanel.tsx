import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../stores/useStore';
import { useVoice } from '../../hooks/useVoice';
import {
  parseVoiceCommand,
  ROOM_CENTERS,
  ROOM_DISPLAY_NAMES,
} from '../../systems/VoiceCommands';
import type { RoomId, TaskType } from '../../types';
import { getRobotDisplayName } from '../../stores/useRobotNames';

const ROOM_NAMES: Record<RoomId, string> = ROOM_DISPLAY_NAMES;

const TASK_NAMES: Record<string, string> = {
  vacuum: 'vacuuming',
  sweep: 'sweeping',
  dishes: 'doing the dishes',
  cook: 'cooking',
  laundry: 'doing laundry',
  dust: 'dusting',
  mop: 'mopping',
  polish: 'polishing surfaces',
  organize: 'organizing',
  spray: 'cleaning with spray',
};

function parseRoomFromInput(input: string): RoomId | null {
  const lower = input.toLowerCase();
  if (lower.includes('kitchen')) return 'kitchen';
  if (lower.includes('living')) return 'living-room';
  if (lower.includes('hallway') || lower.includes('hall')) return 'hallway';
  if (lower.includes('laundry')) return 'laundry';
  if (lower.includes('bedroom') || lower.includes('bed room')) return 'bedroom';
  if (lower.includes('bathroom') || lower.includes('bath room')) return 'bathroom';
  return null;
}

function generateResponse(
  input: string,
  robotState: string,
  _currentAnimation: TaskType,
  _robotThought: string,
  roomNeeds: Record<string, { cleanliness: number }>,
  tasks: { status: string; targetRoom: RoomId; taskType: TaskType }[],
  addTask: (task: any) => void,
  setRobotThought: (t: string) => void,
): string {
  const lower = input.toLowerCase().trim();
  const activeTask = tasks.find((t) => t.status === 'active');

  // What are you doing?
  if (lower.includes('what') && (lower.includes('doing') || lower.includes('up to'))) {
    if (robotState === 'working' && activeTask) {
      const taskName = TASK_NAMES[activeTask.taskType] || activeTask.taskType;
      const roomName = ROOM_NAMES[activeTask.targetRoom] || activeTask.targetRoom;
      return `I'm ${taskName} in the ${roomName}! 🧹`;
    }
    if (robotState === 'walking') {
      return `I'm heading to my next task. Always on the move! 🚶`;
    }
    return `Just taking a breather and scanning the house for what needs attention. 🤖`;
  }

  // How clean / status
  if (lower.includes('clean') || lower.includes('status') || lower.includes('how') && lower.includes('house')) {
    const entries = Object.entries(roomNeeds) as [string, { cleanliness: number }][];
    const avg = entries.reduce((sum, [, r]) => sum + r.cleanliness, 0) / entries.length;
    const worst = entries.reduce<[string, number]>((w, [id, r]) => (r.cleanliness < w[1] ? [id, r.cleanliness] : w), ['', 100]);
    const avgPct = Math.round(avg);
    let response = `House is at ${avgPct}% average cleanliness.`;
    if (worst[1] < 50) {
      response += ` The ${ROOM_NAMES[worst[0] as RoomId] || worst[0]} needs the most attention (${Math.round(worst[1])}%).`;
    } else {
      response += ` Looking pretty good! ✨`;
    }
    return response;
  }

  // Go to room
  if (lower.includes('go to') || lower.includes('head to') || lower.includes('clean the') || lower.includes('check the')) {
    const room = parseRoomFromInput(input);
    if (room) {
      const center = ROOM_CENTERS[room];
      addTask({
        id: `chat-${Date.now()}`,
        command: `go to ${room}`,
        source: 'user' as const,
        targetRoom: room,
        targetPosition: center,
        status: 'queued' as const,
        progress: 0,
        description: `User requested: go to ${ROOM_NAMES[room]}`,
        taskType: 'vacuum' as TaskType,
        workDuration: 8,
        createdAt: Date.now(),
      });
      setRobotThought(`Roger that! Heading to the ${ROOM_NAMES[room]}!`);
      return `On my way to the ${ROOM_NAMES[room]}! 🏃`;
    }
    return `Which room? I know: kitchen, living room, bedroom, bathroom, laundry, hallway.`;
  }

  // Hello / greetings
  if (lower.match(/^(hi|hello|hey|sup|yo|howdy)/)) {
    const greetings = [
      'Hey there! Need anything? 👋',
      'Hi! I\'m SimBot, your home cleaning buddy! 🤖',
      'Hey! What can I do for you?',
      'Yo! Ready to clean or chat! 💪',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // How are you / feeling
  if (lower.includes('how are you') || lower.includes('how do you feel')) {
    if (robotState === 'working') return 'Busy but happy! Nothing beats a clean room. 😊';
    if (robotState === 'idle') return 'Feeling great! A bit restless though — I like staying busy! 🤖';
    return 'On the go! Love keeping the house tidy. 🏠';
  }

  // Help
  if (lower.includes('help') || lower === '?') {
    return 'Try: "What are you doing?", "How clean is the house?", "Go to kitchen", "How are you?", or just chat! 💬';
  }

  // Thank you
  if (lower.includes('thank') || lower.includes('good job') || lower.includes('nice work')) {
    return ['Aw, thanks! 😊', 'Just doing my job! 🤖', 'Happy to help! ✨'][Math.floor(Math.random() * 3)];
  }

  // Fallback
  const fallbacks = [
    `Hmm, not sure about that. Try asking what I'm doing or how clean the house is! 🤔`,
    `I'm better at cleaning than conversations 😅 Try "help" to see what I can do!`,
    `Beep boop! I didn't quite get that. Ask me about the house or tell me where to go! 🤖`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const robotState = useStore((s) => s.robots[s.activeRobotId].state);
  const currentAnimation = useStore((s) => s.robots[s.activeRobotId].currentAnimation);
  const robotThought = useStore((s) => s.robots[s.activeRobotId].thought);
  const roomNeeds = useStore((s) => s.roomNeeds);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const activeRobotId = useStore((s) => s.activeRobotId);
  const _setRobotThought = useStore((s) => s.setRobotThought);
  const setRobotThought = (t: string) => _setRobotThought(activeRobotId, t);
  const transcript = useStore((s) => s.transcript);

  // Voice command actions
  const setSimSpeed = useStore((s) => s.setSimSpeed);
  const setActiveRobotId = useStore((s) => s.setActiveRobotId);
  const setShowShop = useStore((s) => s.setShowShop);
  const setShowCrafting = useStore((s) => s.setShowCrafting);
  const setShowDiary = useStore((s) => s.setShowDiary);
  const setShowLeaderboard = useStore((s) => s.setShowLeaderboard);
  const setShowPersonality = useStore((s) => s.setShowPersonality);
  const setShowDevicePanel = useStore((s) => s.setShowDevicePanel);
  const setShowSchedulePanel = useStore((s) => s.setShowSchedulePanel);
  const setSoundMuted = useStore((s) => s.setSoundMuted);
  const simSpeed = useStore((s) => s.simSpeed);

  const handleVoiceCommand = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Open the chat panel to show feedback
    setIsOpen(true);

    // Add user message (marked as voice)
    addMessage({
      id: `v-${Date.now()}`,
      sender: 'user',
      text: `🎤 ${trimmed}`,
      timestamp: Date.now(),
    });

    const cmd = parseVoiceCommand(trimmed);
    let response = '';

    switch (cmd.type) {
      case 'pause': {
        setSimSpeed(0);
        setRobotThought('Pausing... standing by!');
        response = 'Simulation paused. Say "resume" to continue. ⏸️';
        break;
      }
      case 'resume': {
        setSimSpeed(1);
        setRobotThought('Back in action!');
        response = 'Simulation resumed! Let\'s get back to work. ▶️';
        break;
      }
      case 'speed_up': {
        const nextSpeed = simSpeed === 0 ? 1 : simSpeed === 1 ? 10 : 60;
        setSimSpeed(nextSpeed as 0 | 1 | 10 | 60);
        response = `Speed set to ${nextSpeed}x! ⏩`;
        break;
      }
      case 'slow_down': {
        const prevSpeed = simSpeed === 60 ? 10 : simSpeed === 10 ? 1 : 1;
        setSimSpeed(prevSpeed as 0 | 1 | 10 | 60);
        response = `Speed set to ${prevSpeed}x. 🐢`;
        break;
      }
      case 'mute': {
        setSoundMuted(true);
        response = 'Sound muted. 🔇';
        break;
      }
      case 'unmute': {
        setSoundMuted(false);
        response = 'Sound on! 🔊';
        break;
      }
      case 'switch_robot': {
        if (cmd.robotId) {
          setActiveRobotId(cmd.robotId);
          response = `Switched to ${cmd.robotId}! 🤖`;
        }
        break;
      }
      case 'open_panel': {
        const panelMap: Record<string, () => void> = {
          shop: () => setShowShop(true),
          crafting: () => setShowCrafting(true),
          diary: () => setShowDiary(true),
          leaderboard: () => setShowLeaderboard(true),
          personality: () => setShowPersonality(true),
          devices: () => setShowDevicePanel(true),
          schedule: () => setShowSchedulePanel(true),
        };
        const open = cmd.panel && panelMap[cmd.panel];
        if (open) {
          open();
          response = `Opening ${cmd.panel}! 📋`;
        }
        break;
      }
      case 'close_panel': {
        const closeMap: Record<string, () => void> = {
          shop: () => setShowShop(false),
          crafting: () => setShowCrafting(false),
          diary: () => setShowDiary(false),
          leaderboard: () => setShowLeaderboard(false),
          personality: () => setShowPersonality(false),
          devices: () => setShowDevicePanel(false),
          schedule: () => setShowSchedulePanel(false),
        };
        const close = cmd.panel && closeMap[cmd.panel];
        if (close) {
          close();
          response = `Closed ${cmd.panel}. ✅`;
        }
        break;
      }
      case 'clean_room': {
        if (cmd.room) {
          const center = ROOM_CENTERS[cmd.room];
          if (center) {
            addTask({
              id: `voice-${Date.now()}`,
              command: `clean ${cmd.room}`,
              source: 'user' as const,
              targetRoom: cmd.room,
              targetPosition: center,
              status: 'queued' as const,
              progress: 0,
              description: `Voice command: ${cmd.taskType || 'clean'} ${ROOM_NAMES[cmd.room] || cmd.room}`,
              taskType: (cmd.taskType || 'cleaning') as TaskType,
              workDuration: 8,
              createdAt: Date.now(),
              assignedTo: activeRobotId,
            });
            setRobotThought(`Voice command received! Heading to ${ROOM_NAMES[cmd.room] || cmd.room}!`);
            response = `On it! ${cmd.taskType || 'Cleaning'} the ${ROOM_NAMES[cmd.room] || cmd.room}. 🧹`;
          }
        }
        break;
      }
      case 'send_to_room': {
        if (cmd.room) {
          const center = ROOM_CENTERS[cmd.room];
          if (center) {
            addTask({
              id: `voice-${Date.now()}`,
              command: `go to ${cmd.room}`,
              source: 'user' as const,
              targetRoom: cmd.room,
              targetPosition: center,
              status: 'queued' as const,
              progress: 0,
              description: `Voice command: go to ${ROOM_NAMES[cmd.room] || cmd.room}`,
              taskType: 'cleaning' as TaskType,
              workDuration: 8,
              createdAt: Date.now(),
              assignedTo: activeRobotId,
            });
            setRobotThought(`Roger that! Heading to the ${ROOM_NAMES[cmd.room] || cmd.room}!`);
            response = `Heading to the ${ROOM_NAMES[cmd.room] || cmd.room}! 🏃`;
          }
        }
        break;
      }
      case 'status_query': {
        if (cmd.room) {
          const need = roomNeeds[cmd.room];
          if (need) {
            const pct = Math.round(need.cleanliness);
            response = `The ${ROOM_NAMES[cmd.room] || cmd.room} is at ${pct}% cleanliness. ${pct < 50 ? 'Needs attention! 😬' : 'Looking good! ✨'}`;
          }
        } else {
          // General status — use existing logic
          response = generateResponse(
            'how clean is the house',
            robotState,
            currentAnimation,
            robotThought,
            roomNeeds as any,
            tasks as any,
            addTask,
            setRobotThought,
          );
        }
        break;
      }
      case 'help': {
        response = 'Voice commands: "clean the kitchen", "go to bedroom", "pause", "resume", "speed up", "open shop", "switch to chef", "what\'s the status?" 🎤';
        break;
      }
      case 'greet': {
        response = generateResponse(
          trimmed,
          robotState,
          currentAnimation,
          robotThought,
          roomNeeds as any,
          tasks as any,
          addTask,
          setRobotThought,
        );
        break;
      }
      default: {
        // Fall back to the existing text chat response
        response = generateResponse(
          trimmed,
          robotState,
          currentAnimation,
          robotThought,
          roomNeeds as any,
          tasks as any,
          addTask,
          setRobotThought,
        );
      }
    }

    if (response) {
      setTimeout(() => {
        addMessage({
          id: `r-${Date.now()}`,
          sender: 'robot',
          text: response,
          timestamp: Date.now(),
        });
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addMessage, addTask, activeRobotId, roomNeeds, robotState,
    currentAnimation, robotThought, tasks, simSpeed,
    setSimSpeed, setActiveRobotId, setShowShop, setShowCrafting,
    setShowDiary, setShowLeaderboard, setShowPersonality,
    setShowDevicePanel, setShowSchedulePanel, setSoundMuted,
  ]);

  const { isSupported, isListening, startListening, stopListening } = useVoice(handleVoiceCommand);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setIsOpen(true);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isListening) inputRef.current?.focus();
  }, [isOpen, isListening]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user' as const, text: trimmed, timestamp: Date.now() };
    addMessage(userMsg);

    const response = generateResponse(trimmed, robotState, currentAnimation, robotThought, roomNeeds as any, tasks as any, addTask, setRobotThought);

    setTimeout(() => {
      addMessage({ id: `r-${Date.now()}`, sender: 'robot' as const, text: response, timestamp: Date.now() });
    }, 300 + Math.random() * 400);

    setInput('');
  };

  return (
    <>
      {/* Mic button — separate from chat, always visible when supported */}
      {isSupported && (
        <button
          type="button"
          onClick={toggleVoice}
          className={`pointer-events-auto fixed bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border text-xl shadow-lg backdrop-blur-md transition-all ${
            isListening
              ? 'border-red-400/50 bg-red-500/40 hover:bg-red-500/60'
              : 'border-white/10 bg-black/60 hover:bg-black/80'
          }`}
          style={{
            right: '4.5rem',
            marginBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          title={isListening ? 'Stop listening' : 'Hey SimBot — voice commands'}
        >
          {isListening ? (
            <span className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-red-400 opacity-40" />
              <span className="text-lg">🎤</span>
            </span>
          ) : (
            <span className="text-lg">🎙️</span>
          )}
        </button>
      )}

      {/* Listening indicator bar */}
      {isListening && (
        <div
          className="pointer-events-none fixed bottom-[4.5rem] right-4 z-40 flex items-center gap-2 rounded-xl border border-red-400/30 bg-black/80 px-3 py-2 backdrop-blur-md"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="text-xs text-red-300">
            {transcript || 'Listening...'}
          </span>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border text-xl shadow-lg backdrop-blur-md transition-all ${
          isOpen
            ? 'border-cyan-400/50 bg-cyan-500/30 hover:bg-cyan-500/50'
            : 'border-white/10 bg-black/60 hover:bg-black/80'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        title="Chat with robot"
      >
        💬
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="pointer-events-auto fixed bottom-20 right-4 z-40 flex w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl"
          style={{ maxHeight: '400px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <span className="text-sm font-medium text-white">{getRobotDisplayName(activeRobotId)}</span>
              <span className={`h-2 w-2 rounded-full ${robotState === 'working' ? 'bg-orange-400' : robotState === 'walking' ? 'bg-blue-400' : 'bg-green-400'}`} />
              {isListening && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  VOICE
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/50 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: '280px' }}>
            {messages.length === 0 && (
              <div className="py-8 text-center text-xs text-white/30">
                Say hi to SimBot! 👋
                {isSupported && (
                  <div className="mt-1 text-white/20">
                    Tap 🎙️ for voice commands
                  </div>
                )}
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    msg.sender === 'user'
                      ? msg.text.startsWith('🎤')
                        ? 'bg-red-500/20 text-red-100'
                        : 'bg-cyan-500/30 text-cyan-100'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Type a message...'}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400/50"
                disabled={isListening}
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isListening
                      ? 'bg-red-500/40 hover:bg-red-500/60'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? (
                    <span className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-red-400 opacity-30" />
                      <span className="text-xs">🎤</span>
                    </span>
                  ) : (
                    <span className="text-xs">🎙️</span>
                  )}
                </button>
              )}
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/30 text-sm transition-colors hover:bg-cyan-500/50"
                disabled={isListening}
              >
                ↑
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
