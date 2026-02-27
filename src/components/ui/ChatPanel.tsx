import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import type { RoomId, TaskType } from '../../types';

const ROOM_NAMES: Record<RoomId, string> = {
  'living-room': 'living room',
  kitchen: 'kitchen',
  hallway: 'hallway',
  laundry: 'laundry room',
  bedroom: 'bedroom',
  bathroom: 'bathroom',
};

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

const ROOM_CENTERS: Record<RoomId, [number, number, number]> = {
  kitchen: [-5, 0, -4],
  'living-room': [5, 0, -4],
  hallway: [0, 0, -1],
  laundry: [-5, 0, 3],
  bedroom: [5, 0, 3],
  bathroom: [0, 0, 3],
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
  const robotState = useStore((s) => s.robotState);
  const currentAnimation = useStore((s) => s.currentAnimation);
  const robotThought = useStore((s) => s.robotThought);
  const roomNeeds = useStore((s) => s.roomNeeds);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const setRobotThought = useStore((s) => s.setRobotThought);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

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
              <span className="text-sm font-medium text-white">SimBot</span>
              <span className={`h-2 w-2 rounded-full ${robotState === 'working' ? 'bg-orange-400' : robotState === 'walking' ? 'bg-blue-400' : 'bg-green-400'}`} />
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
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-cyan-500/30 text-cyan-100'
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
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-400/50"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/30 text-sm transition-colors hover:bg-cyan-500/50"
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
