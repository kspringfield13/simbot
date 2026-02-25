import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;

/*
 * Kenney Furniture Kit models are roughly half real-world scale:
 *   sofa-long: 0.98w x 0.46h x 0.82d  → real sofa ~2m x 0.9m x 0.9m → scale ~2.0
 *   bed:       0.95w x 0.38h x 1.13d   → real bed ~1.5m x 0.6m x 2m  → scale ~1.8
 *   fridge:    0.52w x 0.92h x 0.36d   → real fridge ~0.8m x 1.8m    → scale ~2.0
 *   cabinet:   0.43w x 0.45h x 0.45d   → real counter ~0.6m x 0.9m   → scale ~2.0
 *   toilet:    1.01w x 0.95h x 0.66d   → already near scale, ~1.2
 *   shower:    0.56w x 1.09h x 0.56d   → real shower ~1m x 2.1m      → scale ~1.9
 *
 * Room layout (1 unit ≈ ~0.5m at model scale):
 *   Living Room:  x: -8 to 0,   z: -10 to -2  (8x8 = ~4m x 4m)
 *   Kitchen:      x:  0 to 8,   z: -10 to -2  (8x8)
 *   Hallway:      x: -8 to 3.5, z:  -2 to  0  (11.5x2)
 *   Laundry:      x: 3.5 to 6.5,z:  -2 to  0  (3x2)
 *   Bedroom:      x: -8 to 0,   z:   0 to  8  (8x8)
 *   Bathroom:     x:  0 to 8,   z:   0 to  8  (8x8)
 *
 * Floor at y=0. All floor-standing models have base at origin.
 */

// ============================================================
// LIVING ROOM — x: -8 to 0, z: -10 to -2
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* L-shaped sofa — long piece against west wall, corner piece going south */}
      <GLBModel url="/models/sofa-long.glb" position={[-7.2, 0, -6]} scale={2.0} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/sofa-corner.glb" position={[-5.5, 0, -8]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-7.2, 0.9, -5.5]} scale={1.6} rotation={[0, 0.3, 0]} />
      <GLBModel url="/models/pillow-long.glb" position={[-7.2, 0.9, -6.8]} scale={1.5} />

      {/* Coffee table centered in front of sofa */}
      <GLBModel url="/models/coffee-table.glb" position={[-5, 0, -6]} scale={2.0} />

      {/* Ottoman */}
      <GLBModel url="/models/ottoman.glb" position={[-3.5, 0, -5]} scale={1.8} />

      {/* Accent chair facing sofa */}
      <GLBModel url="/models/lounge-chair.glb" position={[-3, 0, -8]} scale={2.0} rotation={[0, PI * 0.1, 0]} />

      {/* TV wall — north wall (z ≈ -9.5) */}
      <GLBModel url="/models/tv-stand.glb" position={[-4.5, 0, -9.3]} scale={2.2} />
      <GLBModel url="/models/tv.glb" position={[-4.5, 0.65, -9.3]} scale={2.2} />
      <GLBModel url="/models/speaker.glb" position={[-6.5, 0, -9.3]} scale={1.8} />
      <GLBModel url="/models/speaker.glb" position={[-2.5, 0, -9.3]} scale={1.8} />

      {/* Floor lamp in corner */}
      <GLBModel url="/models/floor-lamp.glb" position={[-7.5, 0, -9.3]} scale={2.0} />

      {/* Side table + lamp near sofa arm */}
      <GLBModel url="/models/side-table.glb" position={[-7.2, 0, -8.5]} scale={1.6} />
      <GLBModel url="/models/table-lamp.glb" position={[-7.2, 0.6, -8.5]} scale={1.4} />

      {/* Bookcase on south wall near hallway */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, -2.8]} scale={2.0} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/books.glb" position={[-7.4, 1.0, -2.8]} scale={1.6} />

      {/* Rug under seating */}
      <GLBModel url="/models/rug.glb" position={[-5, 0.005, -6]} scale={[4.5, 2.0, 4.0]} />

      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-0.5, 0, -9.3]} scale={1.6} />
      <GLBModel url="/models/plant2.glb" position={[-7.5, 0, -3.8]} scale={1.4} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN + DINING — x: 0 to 8, z: -10 to -2
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* === North wall counter run (z ≈ -9.5) — L along north + east === */}
      <GLBModel url="/models/fridge.glb" position={[0.8, 0, -9.4]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[2, 0, -9.4]} scale={2.0} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[3, 0, -9.4]} scale={2.0} />
      <GLBModel url="/models/stove-electric.glb" position={[4, 0, -9.4]} scale={2.0} />
      <GLBModel url="/models/range-hood.glb" position={[4, 1.8, -9.5]} scale={1.8} />
      <GLBModel url="/models/cabinet.glb" position={[5, 0, -9.4]} scale={2.0} />
      <GLBModel url="/models/kitchen-sink.glb" position={[6, 0, -9.4]} scale={2.0} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[7, 0, -9.4]} scale={2.0} />

      {/* Upper cabinets on north wall */}
      <GLBModel url="/models/upper-cabinet.glb" position={[2.5, 1.5, -9.6]} scale={1.8} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5.5, 1.5, -9.6]} scale={1.8} />
      <GLBModel url="/models/upper-cabinet.glb" position={[7, 1.5, -9.6]} scale={1.8} />

      {/* East wall L-return */}
      <GLBModel url="/models/cabinet.glb" position={[7.4, 0, -8.2]} scale={2.0} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet-corner.glb" position={[7.4, 0, -9]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/microwave.glb" position={[7.4, 0.9, -8.2]} scale={1.6} rotation={[0, -PI / 2, 0]} />

      {/* Counter accessories */}
      <GLBModel url="/models/coffee-machine.glb" position={[2.8, 0.9, -9.4]} scale={1.4} />
      <GLBModel url="/models/toaster.glb" position={[5, 0.9, -9.4]} scale={1.4} />

      {/* Kitchen island — center of kitchen */}
      <GLBModel url="/models/kitchen-bar.glb" position={[3, 0, -6]} scale={2.0} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4.2, 0, -6]} scale={2.0} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5.4, 0, -6]} scale={2.0} />

      {/* Bar stools — south side of island */}
      <GLBModel url="/models/bar-stool.glb" position={[3, 0, -5]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4.2, 0, -5]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5.4, 0, -5]} scale={1.8} rotation={[0, PI, 0]} />

      {/* Dining table between kitchen and living */}
      <GLBModel url="/models/coffee-table.glb" position={[1.5, 0, -4]} scale={2.2} />
      <GLBModel url="/models/modern-chair.glb" position={[0.5, 0, -4]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[2.5, 0, -4]} scale={1.8} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5, 0, -3.2]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5, 0, -4.8]} scale={1.8} />

      {/* Trashcan + plant */}
      <GLBModel url="/models/trashcan.glb" position={[7.4, 0, -5.5]} scale={1.6} />
      <GLBModel url="/models/plant1.glb" position={[7.4, 0, -2.8]} scale={1.5} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY CLOSET — x: 3.5 to 6.5, z: -2 to 0
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/washer.glb" position={[4.5, 0, -1]} scale={2.0} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/dryer.glb" position={[5.7, 0, -1]} scale={2.0} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5, 1.5, -1.6]} scale={1.6} />
    </Suspense>
  );
}

// ============================================================
// MASTER BEDROOM — x: -8 to 0, z: 0 to 8
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed centered against north wall */}
      <GLBModel url="/models/bed.glb" position={[-4, 0, 6.8]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4.6, 0.7, 7.2]} scale={1.6} rotation={[0, 0.2, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-3.4, 0.7, 7.2]} scale={1.6} rotation={[0, -0.2, 0]} />

      {/* Nightstands flanking bed */}
      <GLBModel url="/models/nightstand.glb" position={[-6.5, 0, 6.8]} scale={1.8} />
      <GLBModel url="/models/nightstand.glb" position={[-1.5, 0, 6.8]} scale={1.8} />

      {/* Bedside lamps */}
      <GLBModel url="/models/table-lamp.glb" position={[-6.5, 0.7, 6.8]} scale={1.4} />
      <GLBModel url="/models/table-lamp.glb" position={[-1.5, 0.7, 6.8]} scale={1.4} />

      {/* Desk area on east wall */}
      <GLBModel url="/models/desk.glb" position={[-0.8, 0, 2.5]} scale={2.0} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-2, 0, 2.5]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-0.6, 0.78, 2.5]} scale={1.6} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.1, 0.76, 2.5]} scale={1.4} rotation={[0, -PI / 2, 0]} />

      {/* Dresser/bookcase on west wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, 3.5]} scale={2.0} rotation={[0, PI / 2, 0]} />

      {/* Bench at foot of bed */}
      <GLBModel url="/models/bench.glb" position={[-4, 0, 5.2]} scale={1.8} rotation={[0, PI / 2, 0]} />

      {/* Rug beside bed */}
      <GLBModel url="/models/rug-round.glb" position={[-4, 0.005, 4.5]} scale={2.8} />

      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.5, 0, 7.5]} scale={1.6} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, 7.5]} scale={1.3} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM — x: 0 to 8, z: 0 to 8
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Double vanity on south wall near door */}
      <GLBModel url="/models/bath-cabinet.glb" position={[2, 0, 0.8]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[3.2, 0, 0.8]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[5, 0, 0.8]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bath-cabinet.glb" position={[6.2, 0, 0.8]} scale={1.8} rotation={[0, PI, 0]} />

      {/* Mirror above vanity */}
      <GLBModel url="/models/mirror.glb" position={[4, 1.1, 0.3]} scale={2.0} rotation={[0, PI, 0]} />

      {/* Wall lamps flanking mirror */}
      <GLBModel url="/models/wall-lamp.glb" position={[2.5, 1.6, 0.3]} scale={1.4} rotation={[0, PI, 0]} />
      <GLBModel url="/models/wall-lamp.glb" position={[5.5, 1.6, 0.3]} scale={1.4} rotation={[0, PI, 0]} />

      {/* Freestanding bathtub — north wall */}
      <GLBModel url="/models/bathtub.glb" position={[5.5, 0, 7]} scale={2.0} rotation={[0, -PI / 2, 0]} />

      {/* Walk-in shower — east wall */}
      <GLBModel url="/models/shower-round.glb" position={[7, 0, 4]} scale={1.9} rotation={[0, -PI / 2, 0]} />

      {/* Toilet — tucked in northwest corner */}
      <GLBModel url="/models/toilet.glb" position={[1.2, 0, 7]} scale={1.2} rotation={[0, PI / 2, 0]} />

      {/* Bath mat */}
      <GLBModel url="/models/rug.glb" position={[4.5, 0.005, 4]} scale={[2.0, 1.0, 1.5]} />

      {/* Accessories */}
      <GLBModel url="/models/potted-plant.glb" position={[0.8, 0, 0.8]} scale={1.3} />
      <GLBModel url="/models/plant1.glb" position={[7.5, 0, 7.5]} scale={1.2} />
      <GLBModel url="/models/trashcan.glb" position={[0.8, 0, 3.5]} scale={1.4} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — x: -8 to 3.5, z: -2 to 0
// ============================================================
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bench.glb" position={[-5, 0, -1]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/potted-plant.glb" position={[-7.2, 0, -1]} scale={1.4} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, -1]} scale={[4.0, 1.5, 1.5]} />
      <GLBModel url="/models/wall-lamp.glb" position={[0, 1.6, -1.9]} scale={1.4} />
    </Suspense>
  );
}
