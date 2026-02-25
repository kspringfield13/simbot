import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';

export function ThoughtBubble() {
  const robotPosition = useStore((state) => state.robotPosition);
  const robotThought = useStore((state) => state.robotThought);
  const robotState = useStore((state) => state.robotState);

  const bubbleText = useMemo(() => {
    if (!robotThought.trim()) return 'Scanning home state...';
    return robotThought;
  }, [robotThought]);

  return (
    <group position={[robotPosition[0], robotPosition[1] + 2.25, robotPosition[2]]}>
      <Html center distanceFactor={9} transform>
        <div className="pointer-events-none max-w-[180px] rounded-xl border border-white/20 bg-black/55 px-3 py-2 text-[11px] leading-snug text-white backdrop-blur-md">
          <p className="font-medium text-cyan-200/90">Thought</p>
          <p className="text-white/85">{bubbleText}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/50">{robotState}</p>
        </div>
      </Html>
    </group>
  );
}
