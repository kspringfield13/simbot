import { useRef, useEffect } from 'react';
import { useStore } from '../../stores/useStore';

const S = 2;
const SIZE = 100;

const ROOMS = [
  { x: -8, z: -10, w: 8, h: 8 },
  { x: 0, z: -10, w: 8, h: 8 },
  { x: -8, z: -2, w: 11.5, h: 2 },
  { x: 3.5, z: -2, w: 3, h: 2 },
  { x: -8, z: 0, w: 8, h: 8 },
  { x: 0, z: 0, w: 8, h: 8 },
];

const WX = -8 * S, WW = 16 * S, WZ = -10 * S, WH = 18 * S;

function toCanvas(wx: number, wz: number): [number, number] {
  return [((wx - WX) / WW) * SIZE, ((wz - WZ) / WH) * SIZE];
}

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robotPosition = useStore((s) => s.robotPosition);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    for (const room of ROOMS) {
      const [rx, ry] = toCanvas(room.x * S, room.z * S);
      const rw = (room.w * S / WW) * SIZE;
      const rh = (room.h * S / WH) * SIZE;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(rx, ry, rw, rh);
    }

    const [bx, by] = toCanvas(robotPosition[0], robotPosition[2]);
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
    <div className="absolute left-3 bottom-20 z-20 rounded-lg border border-white/8 bg-black/60 p-1 backdrop-blur-md">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block" />
    </div>
  );
}
