import { useState, useMemo } from 'react';
import { useStore } from '../../stores/useStore';
import { getEffectiveRooms } from '../../utils/homeLayout';
import {
  WALL_COLORS,
  FLOOR_OPTIONS,
  WALLPAPER_OPTIONS,
  type WallpaperOption,
} from '../../config/decorations';

type Tab = 'walls' | 'floors' | 'wallpaper';

function WallpaperSwatch({ wp, size = 32 }: { wp: WallpaperOption; size?: number }) {
  const patternLines = () => {
    const s = size;
    switch (wp.pattern) {
      case 'stripes':
        return (
          <>
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
              <line key={f} x1={s * f} y1={0} x2={s * f} y2={s} stroke={wp.patternColor} strokeWidth={2} />
            ))}
          </>
        );
      case 'checks':
        return (
          <>
            <rect x={0} y={0} width={s / 2} height={s / 2} fill={wp.patternColor} />
            <rect x={s / 2} y={s / 2} width={s / 2} height={s / 2} fill={wp.patternColor} />
          </>
        );
      case 'herringbone':
        return (
          <>
            <path d={`M0 ${s / 2} L${s / 4} 0 L${s / 2} ${s / 2} L${s * 3 / 4} 0 L${s} ${s / 2}`} stroke={wp.patternColor} strokeWidth={2} fill="none" />
            <path d={`M0 ${s} L${s / 4} ${s / 2} L${s / 2} ${s} L${s * 3 / 4} ${s / 2} L${s} ${s}`} stroke={wp.patternColor} strokeWidth={2} fill="none" />
          </>
        );
      case 'dots':
        return (
          <>
            {[0.25, 0.75].map((fx) =>
              [0.25, 0.75].map((fy) => (
                <circle key={`${fx}-${fy}`} cx={s * fx} cy={s * fy} r={s * 0.08} fill={wp.patternColor} />
              ))
            )}
          </>
        );
      case 'diamonds':
        return (
          <>
            <polygon points={`${s / 2},${s * 0.1} ${s * 0.9},${s / 2} ${s / 2},${s * 0.9} ${s * 0.1},${s / 2}`} fill={wp.patternColor} />
          </>
        );
    }
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded">
      <rect width={size} height={size} fill={wp.baseColor} />
      {patternLines()}
    </svg>
  );
}

export function DecoratePanel() {
  const decorateMode = useStore((s) => s.decorateMode);
  const selectedRoomId = useStore((s) => s.decorateSelectedRoomId);
  const roomDecorations = useStore((s) => s.roomDecorations);
  const setDecoration = useStore((s) => s.setRoomDecoration);
  const floorPlanId = useStore((s) => s.floorPlanId);
  const roomLayout = useStore((s) => s.roomLayout);
  const [tab, setTab] = useState<Tab>('walls');

  const rooms = useMemo(
    () => getEffectiveRooms(roomLayout.overrides, roomLayout.addedRooms, roomLayout.deletedRoomIds, floorPlanId),
    [roomLayout, floorPlanId],
  );

  if (!decorateMode || !selectedRoomId) return null;

  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return null;

  const deco = roomDecorations[selectedRoomId] ?? { wallColor: null, floorId: null, wallpaperId: null };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'walls', label: 'Walls', icon: '🎨' },
    { id: 'floors', label: 'Floors', icon: '🪵' },
    { id: 'wallpaper', label: 'Wallpaper', icon: '🖼' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <h3 className="text-sm font-semibold text-white">
              Decorating: <span className="text-pink-300">{room.name}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => useStore.getState().setDecorateSelectedRoomId(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-pink-500/30 text-pink-200'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[80px]">
          {tab === 'walls' && (
            <div>
              <p className="mb-2 text-[11px] text-white/40">Choose a wall color</p>
              <div className="flex flex-wrap gap-2">
                {/* Default / clear */}
                <button
                  type="button"
                  onClick={() => setDecoration(selectedRoomId, { wallColor: null, wallpaperId: null })}
                  className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all ${
                    !deco.wallColor && !deco.wallpaperId
                      ? 'border-pink-400 shadow-md shadow-pink-400/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  title="Default walls"
                >
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-gray-500 to-gray-700" />
                  {!deco.wallColor && !deco.wallpaperId && (
                    <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-400" />
                  )}
                </button>
                {WALL_COLORS.map((wc) => (
                  <button
                    key={wc.id}
                    type="button"
                    onClick={() => setDecoration(selectedRoomId, { wallColor: wc.color, wallpaperId: null })}
                    className={`group relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all ${
                      deco.wallColor === wc.color && !deco.wallpaperId
                        ? 'border-pink-400 shadow-md shadow-pink-400/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    title={wc.name}
                  >
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: wc.color }} />
                    {deco.wallColor === wc.color && !deco.wallpaperId && (
                      <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'floors' && (
            <div>
              <p className="mb-2 text-[11px] text-white/40">Choose a flooring style</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Default */}
                <button
                  type="button"
                  onClick={() => setDecoration(selectedRoomId, { floorId: null })}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all ${
                    !deco.floorId
                      ? 'border-pink-400 bg-pink-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="h-6 w-6 rounded" style={{ backgroundColor: room.color || '#4a4644' }} />
                  <span className="text-xs text-white/70">Default</span>
                </button>
                {FLOOR_OPTIONS.map((fl) => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setDecoration(selectedRoomId, { floorId: fl.id })}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all ${
                      deco.floorId === fl.id
                        ? 'border-pink-400 bg-pink-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded"
                      style={{
                        backgroundColor: fl.color,
                        boxShadow: fl.metalness > 0.08 ? 'inset 0 0 4px rgba(255,255,255,0.3)' : 'none',
                      }}
                    />
                    <span className="text-xs text-white/70">{fl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'wallpaper' && (
            <div>
              <p className="mb-2 text-[11px] text-white/40">Choose a wallpaper pattern</p>
              <div className="grid grid-cols-3 gap-2">
                {/* Clear wallpaper */}
                <button
                  type="button"
                  onClick={() => setDecoration(selectedRoomId, { wallpaperId: null })}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-all ${
                    !deco.wallpaperId
                      ? 'border-pink-400 bg-pink-500/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-xs text-white/30">
                    ✕
                  </div>
                  <span className="text-[10px] text-white/50">None</span>
                </button>
                {WALLPAPER_OPTIONS.map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setDecoration(selectedRoomId, { wallpaperId: wp.id, wallColor: null })}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-all ${
                      deco.wallpaperId === wp.id
                        ? 'border-pink-400 bg-pink-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <WallpaperSwatch wp={wp} />
                    <span className="text-[10px] text-white/50">{wp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
