import { roomAttentionLabel, roomOutlineColor } from '../../systems/RoomState';
import { useStore } from '../../stores/useStore';
import { rooms } from '../../utils/homeLayout';

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-white/10">
      <div
        className="h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function RoomStatus() {
  const selectedRoomId = useStore((state) => state.selectedRoomId);
  const setSelectedRoomId = useStore((state) => state.setSelectedRoomId);
  const roomNeed = useStore((state) => (selectedRoomId ? state.roomNeeds[selectedRoomId] : null));

  if (!selectedRoomId || !roomNeed) return null;

  const room = rooms.find((entry) => entry.id === selectedRoomId);
  if (!room) return null;

  const cleanlinessColor = roomOutlineColor(roomNeed.cleanliness);

  return (
    <div className="pointer-events-auto absolute left-3 right-3 top-[84px] z-20 sm:left-auto sm:right-3 sm:w-72">
      <div className="rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">{room.name}</p>
            <p className="text-[11px] text-white/70">{roomAttentionLabel(roomNeed.cleanliness)}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRoomId(null)}
            className="h-9 min-w-9 rounded-lg bg-white/10 px-2 text-xs text-white/80"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>Cleanliness</span>
              <span>{roomNeed.cleanliness.toFixed(0)}%</span>
            </div>
            <MetricBar value={roomNeed.cleanliness} color={cleanlinessColor} />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>Tidiness</span>
              <span>{roomNeed.tidiness.toFixed(0)}%</span>
            </div>
            <MetricBar value={roomNeed.tidiness} color="#60a5fa" />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>Routine</span>
              <span>{roomNeed.routine.toFixed(0)}%</span>
            </div>
            <MetricBar value={roomNeed.routine} color="#a78bfa" />
          </div>
        </div>
      </div>
    </div>
  );
}
