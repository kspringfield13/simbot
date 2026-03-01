// @ts-nocheck
// ── Neighborhood Map ────────────────────────────────────────
// Simple top-down mini-map showing houses on the street.
// Appears in the bottom-left corner when not in street view.

import { useStore } from '../../stores/useStore';

const HOUSE_POSITIONS = [
  { streetPos: -2, label: 'FL' },
  { streetPos: -1, label: 'L' },
  { streetPos: 0, label: 'You' },
  { streetPos: 1, label: 'R' },
  { streetPos: 2, label: 'FR' },
];

export function NeighborhoodMap() {
  const neighborHouses = useStore((s) => s.neighborHouses);
  const streetView = useStore((s) => s.streetView);
  const visitingHouseId = useStore((s) => s.visitingHouseId);
  const activeVisits = useStore((s) => s.activeVisits);
  const setStreetView = useStore((s) => s.setStreetView);
  const setVisitingHouseId = useStore((s) => s.setVisitingHouseId);
  const returnToPlayerHouse = useStore((s) => s.returnToPlayerHouse);

  // Map layout: 4 houses along a street line
  const allHouses = [
    ...neighborHouses.filter((h) => h.streetPosition === -2).map((h) => ({ ...h, isPlayer: false })),
    ...neighborHouses.filter((h) => h.streetPosition === -1).map((h) => ({ ...h, isPlayer: false })),
    { id: 'player', name: 'Your House', streetPosition: 0, isPlayer: true, style: { wallColor: '#d4c5a9', roofColor: '#5a4a3a' }, visitingRobots: [] as string[] },
    ...neighborHouses.filter((h) => h.streetPosition === 1).map((h) => ({ ...h, isPlayer: false })),
    ...neighborHouses.filter((h) => h.streetPosition === 2).map((h) => ({ ...h, isPlayer: false })),
  ];

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-30">
      <div className="rounded-xl border border-white/10 bg-black/70 p-2 backdrop-blur-md">
        <div className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/40">
          Neighborhood
        </div>

        {/* Street line */}
        <div className="relative flex items-center gap-1">
          {/* Road */}
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-600/50" />
          {/* Dashed center line */}
          <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 border-t border-dashed border-yellow-500/30" />

          {allHouses.map((house) => {
            const isActive = house.isPlayer
              ? !streetView && !visitingHouseId
              : visitingHouseId === house.id;
            const hasVisitors = !house.isPlayer && activeVisits.some((v) => v.houseId === house.id);

            return (
              <button
                key={house.id}
                type="button"
                onClick={() => {
                  if (house.isPlayer) {
                    returnToPlayerHouse();
                  } else {
                    setVisitingHouseId(house.id);
                  }
                }}
                className={`relative z-10 flex flex-col items-center rounded-lg px-2 py-1 transition-all ${
                  isActive
                    ? 'bg-cyan-500/30 ring-1 ring-cyan-400/50'
                    : 'hover:bg-white/10'
                }`}
                title={house.name}
              >
                {/* House icon */}
                <div
                  className="mb-0.5 h-5 w-7 rounded-t-md border border-white/20"
                  style={{ backgroundColor: house.style.wallColor }}
                >
                  {/* Roof triangle via CSS */}
                  <div
                    className="mx-auto -mt-2 h-0 w-0"
                    style={{
                      borderLeft: '14px solid transparent',
                      borderRight: '14px solid transparent',
                      borderBottom: `8px solid ${house.style.roofColor}`,
                    }}
                  />
                </div>
                <span className={`text-[8px] font-medium ${house.isPlayer ? 'text-amber-300' : 'text-white/60'}`}>
                  {house.isPlayer ? 'You' : house.name.replace('The ', '').slice(0, 6)}
                </span>
                {/* Visit indicator */}
                {hasVisitors && (
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Street view shortcut */}
        <button
          type="button"
          onClick={() => setStreetView(!streetView)}
          className={`mt-1.5 w-full rounded-md px-2 py-0.5 text-[9px] font-medium transition-all ${
            streetView
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
          }`}
        >
          {streetView ? 'Exit Street View' : 'Street View'}
        </button>
      </div>
    </div>
  );
}
