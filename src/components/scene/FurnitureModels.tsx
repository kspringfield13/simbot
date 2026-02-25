import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;
const S = 1.8; // base scale for Kenney models

// ============================================================
// LIVING ROOM — west side of great room (x: -8 to 0, z: -10 to -2)
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* === Seating area — L-shaped sofa facing north wall === */}
      <GLBModel url="/models/sofa-long.glb" position={[-6, 0, -5.5]} scale={2.2} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/sofa-corner.glb" position={[-4.2, 0, -7.5]} scale={2.2} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-6.5, 0.5, -5]} scale={1.3} rotation={[0, 0.3, 0]} />
      <GLBModel url="/models/pillow-long.glb" position={[-5.5, 0.5, -5.8]} scale={1.3} />
      {/* Ottoman */}
      <GLBModel url="/models/ottoman.glb" position={[-3, 0, -5]} scale={S} />
      {/* Coffee table */}
      <GLBModel url="/models/coffee-table.glb" position={[-4, 0, -4.5]} scale={2.0} />
      {/* TV wall (north wall, z=-9.5) */}
      <GLBModel url="/models/tv-stand.glb" position={[-4, 0, -9]} scale={2.2} />
      <GLBModel url="/models/tv.glb" position={[-4, 0.75, -9.2]} scale={2.2} />
      <GLBModel url="/models/speaker.glb" position={[-6, 0, -9.2]} scale={S} />
      <GLBModel url="/models/speaker.glb" position={[-2, 0, -9.2]} scale={S} />
      {/* Floor lamp by sofa */}
      <GLBModel url="/models/floor-lamp.glb" position={[-7.3, 0, -7.5]} scale={2.0} />
      {/* Side table */}
      <GLBModel url="/models/side-table.glb" position={[-7.3, 0, -5.5]} scale={1.5} />
      <GLBModel url="/models/table-lamp.glb" position={[-7.3, 0.5, -5.5]} scale={1.2} />
      {/* Bookcase on west wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, -3.5]} scale={S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/books.glb" position={[-7.4, 0.7, -3.5]} scale={1.4} />
      {/* Accent chair */}
      <GLBModel url="/models/lounge-chair.glb" position={[-1.5, 0, -5.5]} scale={2.0} rotation={[0, -PI / 3, 0]} />
      {/* Rug under seating area */}
      <GLBModel url="/models/rug.glb" position={[-4, 0.005, -5.5]} scale={[5.0, 2.0, 4.0]} />
      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.5, 0, -9]} scale={1.6} />
      <GLBModel url="/models/plant2.glb" position={[-0.8, 0, -9]} scale={1.5} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN + DINING — east side of great room (x: 0 to 8, z: -10 to -2)
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* === Kitchen counters — L-shape along north + east walls === */}
      {/* North wall counter run (z ≈ -9.5) */}
      <GLBModel url="/models/cabinet.glb" position={[2, 0, -9.5]} scale={S} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[3, 0, -9.5]} scale={S} />
      <GLBModel url="/models/cabinet.glb" position={[4, 0, -9.5]} scale={S} />
      <GLBModel url="/models/cabinet.glb" position={[5, 0, -9.5]} scale={S} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[6, 0, -9.5]} scale={S} />
      <GLBModel url="/models/cabinet.glb" position={[7, 0, -9.5]} scale={S} />
      {/* Upper cabinets on north wall */}
      <GLBModel url="/models/upper-cabinet.glb" position={[2.5, 1.4, -9.7]} scale={1.6} />
      <GLBModel url="/models/upper-cabinet.glb" position={[4.5, 1.4, -9.7]} scale={1.6} />
      <GLBModel url="/models/upper-cabinet.glb" position={[6.5, 1.4, -9.7]} scale={1.6} />
      {/* East wall cabinets */}
      <GLBModel url="/models/cabinet.glb" position={[7.5, 0, -8]} scale={S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[7.5, 0, -7]} scale={S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet-corner.glb" position={[7.5, 0, -9]} scale={S} rotation={[0, PI, 0]} />
      {/* Appliances */}
      <GLBModel url="/models/fridge.glb" position={[1.2, 0, -9.5]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/stove-electric.glb" position={[4, 0, -9.6]} scale={S} />
      <GLBModel url="/models/range-hood.glb" position={[4, 1.7, -9.7]} scale={S} />
      <GLBModel url="/models/kitchen-sink.glb" position={[6, 0, -9.5]} scale={S} />
      <GLBModel url="/models/microwave.glb" position={[7.5, 0.95, -8]} scale={1.5} rotation={[0, -PI / 2, 0]} />
      {/* Counter accessories */}
      <GLBModel url="/models/coffee-machine.glb" position={[3, 0.95, -9.5]} scale={1.3} />
      <GLBModel url="/models/toaster.glb" position={[5, 0.95, -9.5]} scale={1.3} />
      {/* === Kitchen island (center) === */}
      <GLBModel url="/models/kitchen-bar.glb" position={[3.5, 0, -6]} scale={2.0} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4.5, 0, -6]} scale={2.0} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5.5, 0, -6]} scale={2.0} />
      {/* Bar stools on south side of island */}
      <GLBModel url="/models/bar-stool.glb" position={[3.5, 0, -5]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4.5, 0, -5]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5.5, 0, -5]} scale={S} rotation={[0, PI, 0]} />
      {/* === Dining area (between living and kitchen) === */}
      <GLBModel url="/models/coffee-table.glb" position={[1, 0, -4]} scale={2.2} />
      <GLBModel url="/models/modern-chair.glb" position={[0.2, 0, -4]} scale={S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.8, 0, -4]} scale={S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1, 0, -3.2]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1, 0, -4.8]} scale={S} />
      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[7.5, 0, -5.5]} scale={1.5} />
      {/* Plant */}
      <GLBModel url="/models/plant1.glb" position={[7.5, 0, -3]} scale={1.5} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY CLOSET (x: 3.5 to 6.5, z: -2 to 0)
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/washer.glb" position={[4.5, 0, -1]} scale={1.6} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/dryer.glb" position={[5.5, 0, -1]} scale={1.6} rotation={[0, PI / 2, 0]} />
      {/* Shelf above */}
      <GLBModel url="/models/upper-cabinet.glb" position={[5, 1.4, -1.5]} scale={1.4} />
    </Suspense>
  );
}

// ============================================================
// MASTER BEDROOM (x: -8 to 0, z: 0 to 8)
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed centered on south wall */}
      <GLBModel url="/models/bed.glb" position={[-4.5, 0, 6.5]} scale={2.2} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-5, 0.65, 7]} scale={1.4} rotation={[0, 0.2, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4, 0.65, 7]} scale={1.4} rotation={[0, -0.2, 0]} />
      {/* Nightstands */}
      <GLBModel url="/models/nightstand.glb" position={[-6.8, 0, 6.5]} scale={1.6} />
      <GLBModel url="/models/nightstand.glb" position={[-2.2, 0, 6.5]} scale={1.6} />
      {/* Bedside lamps */}
      <GLBModel url="/models/table-lamp.glb" position={[-6.8, 0.55, 6.5]} scale={1.3} />
      <GLBModel url="/models/table-lamp.glb" position={[-2.2, 0.55, 6.5]} scale={1.3} />
      {/* Desk area on east wall */}
      <GLBModel url="/models/desk.glb" position={[-1, 0, 2]} scale={2.0} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-2, 0, 2]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-0.8, 0.82, 2]} scale={1.5} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.2, 0.78, 2]} scale={1.4} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/laptop.glb" position={[-1, 0.78, 3]} scale={1.3} rotation={[0, PI * 0.8, 0]} />
      {/* Dresser on west wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, 3]} scale={S} rotation={[0, PI / 2, 0]} />
      {/* Rug */}
      <GLBModel url="/models/rug-round.glb" position={[-4.5, 0.005, 4.5]} scale={3.0} />
      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.5, 0, 7.5]} scale={1.6} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, 7.5]} scale={1.3} />
      {/* Bench at foot of bed */}
      <GLBModel url="/models/bench.glb" position={[-4.5, 0, 5]} scale={2.0} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM (x: 0 to 8, z: 0 to 8)
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Double vanity on north wall */}
      <GLBModel url="/models/bath-cabinet.glb" position={[2.5, 0, 1]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[3.5, 0, 1]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[5, 0, 1]} scale={S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bath-cabinet.glb" position={[6, 0, 1]} scale={S} rotation={[0, PI, 0]} />
      {/* Mirror */}
      <GLBModel url="/models/mirror.glb" position={[4.2, 1.2, 0.5]} scale={2.2} rotation={[0, PI, 0]} />
      {/* Wall lamps above mirror */}
      <GLBModel url="/models/wall-lamp.glb" position={[3, 1.8, 0.5]} scale={1.4} rotation={[0, PI, 0]} />
      <GLBModel url="/models/wall-lamp.glb" position={[5.5, 1.8, 0.5]} scale={1.4} rotation={[0, PI, 0]} />
      {/* Freestanding bathtub (feature piece, south wall) */}
      <GLBModel url="/models/bathtub.glb" position={[5.5, 0, 6.5]} scale={2.0} rotation={[0, -PI / 2, 0]} />
      {/* Walk-in shower (east wall) */}
      <GLBModel url="/models/shower-round.glb" position={[7, 0, 3.5]} scale={2.0} rotation={[0, -PI / 2, 0]} />
      {/* Toilet (tucked away) */}
      <GLBModel url="/models/toilet.glb" position={[1.5, 0, 6.5]} scale={S} rotation={[0, PI / 2, 0]} />
      {/* Bath mat */}
      <GLBModel url="/models/rug.glb" position={[4.5, 0.005, 4]} scale={[2.0, 1.0, 1.5]} />
      {/* Plant */}
      <GLBModel url="/models/potted-plant.glb" position={[1.2, 0, 1]} scale={1.3} />
      <GLBModel url="/models/plant1.glb" position={[7.5, 0, 7]} scale={1.2} />
      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[1.2, 0, 3.5]} scale={1.2} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY (x: -8 to 3.5, z: -2 to 0)
// ============================================================
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/potted-plant.glb" position={[-6, 0, -1]} scale={1.5} />
      <GLBModel url="/models/bench.glb" position={[-3, 0, -1]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, -1]} scale={[4.0, 1.5, 1.5]} />
      <GLBModel url="/models/wall-lamp.glb" position={[0, 1.8, -1.9]} scale={1.4} />
    </Suspense>
  );
}
