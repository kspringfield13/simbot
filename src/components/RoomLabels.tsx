import { Html } from '@react-three/drei';
import { rooms } from '../utils/homeLayout';

export function RoomLabels() {
  return (
    <>
      {rooms.map((room) => (
        <Html
          key={room.id}
          position={[room.position[0], 2.5, room.position[2]]}
          center
          distanceFactor={12}
        >
          <div className="text-cyan-400/60 text-xs font-mono whitespace-nowrap select-none pointer-events-none">
            {room.name}
          </div>
        </Html>
      ))}
    </>
  );
}
