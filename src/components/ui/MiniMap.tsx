import { useRef, useEffect } from 'react';
import { useStore } from '../../stores/useStore';

const S = 2;
const SIZE = 100;

// Room bounds (pre-scale values)
const ROOMS = [
  { id: 'living-room', x: -8, z: -10, w: 8, h: 8, label: 'L' },
  { id: 'kitchen', x: 0, z: -10, w: 8, h: 8, label: 'K' },
  { id: 'hallway', x: -8, z: -2, w: 11.5, h: 2, label: '' },
  { id: 'laundry', x: 3.5, z: -2, w: 3, h: 2, label: '' },
  { id: 'bedroom', x: -8, z: 0, w: 8, h: 8, label: 'B' },
  { id: 'bathroom', x: 0, z: 0, w: 8, h: 8, label: 'Ba' },
] as const;

// Map world coords to canvas coords
const WORLD_MIN_X = -8 * S;
const WORLD_MAX_X = 8 * S;
const WORLD_MIN_Z = -10 * S;
const WORLD_MAX_Z = 8 * S;
const WORLD_W = WORLD_MAX_X - WORLD_MIN_X;
const WORLD_H = WORLD_MAX_Z - WORLD_MIN_Z;

function worldToCanvas(wx: number, wz: number): [number, number] {
  const cx = ((wx - WORLD_MIN_X) / WORLD_W) * SIZE;
  const cy = ((wz - WORLD_MIN_Z) / WORLD_H) * SIZE;
  return [cx, cy];
}

function getHealthColor(cleanliness: number): string {
  if (cleanliness > 70) return 'rgba(74, 222, 128, 0.4)';
  if (cleanliness > 40) return 'rgba(250, 204, 21, 0.4)';
  return 'rgba(248, 113, 113, 0.4)';
}

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robotPosition = useStore((s) => s.robotPosition);
  const roomStates = useStore((s) => s.roomNeeds);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw rooms
    for (const room of ROOMS) {
      const [rx, ry] = worldToCanvas(room.x * S, room.z * S);
      const rw = (room.w * S / WORLD_W) * SIZE;
      const rh = (room.h * S / WORLD_H) * SIZE;

      const state = roomStates[room.id as keyof typeof roomStates];
      const cleanliness = state?.cleanliness ?? 80;

      ctx.fillStyle = getHealthColor(cleanliness);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(rx, ry, rw, rh);
    }

    // Draw robot
    const [bx, by] = worldToCanvas(robotPosition[0], robotPosition[2]);
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  return (
    <div className="absolute left-3 bottom-3 z-20 rounded-lg border border-white/8 bg-black/60 p-1 backdrop-blur-md">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block" />
    </div>
  );
}
