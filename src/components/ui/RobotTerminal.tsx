import { useEffect, useRef, useState } from 'react';
import { useActiveRobot } from '../../stores/activeRobot';

/**
 * Terminal-style typewriter overlay — top-left corner.
 * Shows robot thoughts/actions with typing animation,
 * then fades out after a delay.
 */

export function RobotTerminal() {
  const robotThought = useActiveRobot((r) => r.thought);
  const robotState = useActiveRobot((r) => r.state);
  const currentAnimation = useActiveRobot((r) => r.currentAnimation);

  const [lines, setLines] = useState<{ id: number; text: string; opacity: number }[]>([]);
  const [typed, setTyped] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const lineIdRef = useRef(0);
  const lastThoughtRef = useRef('');
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cursor blink
  useEffect(() => {
    const iv = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(iv);
  }, []);

  // When thought changes, start typewriter
  useEffect(() => {
    const thought = robotThought.trim();
    if (!thought || thought === '...' || thought === lastThoughtRef.current) return;
    lastThoughtRef.current = thought;

    // Build display text
    const prefix = robotState === 'walking' ? '> navigating: '
      : robotState === 'working' ? `> ${currentAnimation || 'working'}: `
      : '> ';
    const fullText = prefix + thought;

    setTyped('');

    // Clear any existing typing
    if (typingRef.current) clearInterval(typingRef.current);

    let charIdx = 0;
    typingRef.current = setInterval(() => {
      charIdx++;
      if (charIdx <= fullText.length) {
        setTyped(fullText.slice(0, charIdx));
      } else {
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = null;

        // After typing complete, add to history and fade out
        const id = ++lineIdRef.current;
        setLines((prev) => [...prev.slice(-4), { id, text: fullText, opacity: 1 }]);
        setTyped('');

        // Start fade out after 3s
        setTimeout(() => {
          setLines((prev) =>
            prev.map((l) => (l.id === id ? { ...l, opacity: 0 } : l))
          );
        }, 3000);

        // Remove after fade
        setTimeout(() => {
          setLines((prev) => prev.filter((l) => l.id !== id));
        }, 4500);
      }
    }, 35); // typing speed

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [robotThought, robotState, currentAnimation]);

  const hasContent = typed || lines.length > 0;
  if (!hasContent) return null;

  return (
    <div className="pointer-events-none fixed left-4 top-14 z-30 max-w-[340px] rounded-md bg-black/80 px-3 py-2 font-mono text-xs">
      {/* History lines */}
      {lines.map((line) => (
        <div
          key={line.id}
          className="mb-0.5 text-emerald-400/70"
          style={{
            opacity: line.opacity,
            transition: 'opacity 1.5s ease-out',
          }}
        >
          {line.text}
        </div>
      ))}
      {/* Currently typing line */}
      {typed && (
        <div className="mb-0.5 text-emerald-400">
          {typed}
          <span
            className="inline-block w-[6px] bg-emerald-400"
            style={{ opacity: showCursor ? 1 : 0, height: '12px', verticalAlign: 'text-bottom' }}
          />
        </div>
      )}
    </div>
  );
}
