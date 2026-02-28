import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { useStore } from '../../stores/useStore';

export function ThoughtBubble() {
  const robotPosition = useStore((s) => s.robots[s.activeRobotId].position);
  const robotThought = useStore((s) => s.robots[s.activeRobotId].thought);

  const text = useMemo(() => robotThought.trim() || '...', [robotThought]);

  return (
    <group position={[robotPosition[0], robotPosition[1] + 1.2, robotPosition[2]]}>
      <Html center distanceFactor={10} transform>
        <div className="pointer-events-none max-w-[160px] rounded-lg border border-white/10 bg-black/75 px-2.5 py-1.5 text-[10px] leading-snug text-white/70 backdrop-blur-md">
          {text}
        </div>
      </Html>
    </group>
  );
}
