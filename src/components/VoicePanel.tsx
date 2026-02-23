import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { useVoice } from '../hooks/useVoice';
import { useTaskRunner } from '../hooks/useTaskRunner';
import { demoCommands } from '../utils/demoTasks';

export function VoicePanel() {
  const { messages, transcript, isListening, demoMode, setDemoMode } = useStore();
  const { isSupported, startListening, stopListening } = useVoice();
  const { submitCommand } = useTaskRunner();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const demoIndexRef = useRef(0);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Submit transcript when listening stops
  const prevListening = useRef(isListening);
  useEffect(() => {
    if (prevListening.current && !isListening && transcript.trim()) {
      submitCommand(transcript.trim());
    }
    prevListening.current = isListening;
  }, [isListening, transcript, submitCommand]);

  // Demo mode — waits for current task to finish before starting next
  useEffect(() => {
    if (!demoMode) return;
    // Start first task immediately
    submitCommand(demoCommands[0]);
    demoIndexRef.current = 1;

    const interval = setInterval(() => {
      const { tasks, robotState } = useStore.getState();
      const hasActive = tasks.some((t) => t.status === 'pending' || t.status === 'walking' || t.status === 'working');
      // Only advance when robot is idle and no active tasks
      if (!hasActive && robotState === 'idle') {
        const cmd = demoCommands[demoIndexRef.current % demoCommands.length];
        submitCommand(cmd);
        demoIndexRef.current++;
      }
    }, 2000); // check every 2s
    return () => clearInterval(interval);
  }, [demoMode, submitCommand]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-cyan-900/50">
        <h2 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          SimBot
        </h2>
        <p className="text-xs text-gray-500 mt-1">Voice-controlled home assistant</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-600 text-sm text-center mt-8">
            <p>👋 Hi! I'm SimBot.</p>
            <p className="mt-2">Press the mic and tell me what to do!</p>
            <p className="mt-1 text-xs">Try: "Clean the kitchen"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                msg.sender === 'user'
                  ? 'bg-cyan-900/60 text-cyan-100'
                  : 'bg-gray-800/80 text-gray-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Transcript */}
      {isListening && transcript && (
        <div className="px-4 py-2 bg-cyan-950/50 text-cyan-300 text-sm italic border-t border-cyan-900/30">
          {transcript}...
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-t border-cyan-900/50 space-y-3">
        {/* Mic Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
              : isSupported
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isListening ? '🔴 Listening...' : isSupported ? '🎤 Hold to Speak' : '🎤 Not Supported'}
        </button>

        {/* Demo toggle */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`w-full py-2 rounded-lg text-sm transition-all ${
            demoMode
              ? 'bg-purple-600/40 text-purple-300 border border-purple-500/50'
              : 'bg-gray-800/60 text-gray-400 hover:text-gray-300 border border-gray-700/50'
          }`}
        >
          {demoMode ? '⏹ Stop Demo' : '▶ Demo Mode'}
        </button>
      </div>
    </div>
  );
}
