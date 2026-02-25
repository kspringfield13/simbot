import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;

// ============================================================
// LIVING ROOM — x: -8 to 0, z: -10 to -2
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sofa against west wall, facing east toward TV */}
      <GLBModel url="/models/sofa-long.glb" position={[-7, 0, -6]} scale={1.3} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-7, 0.35, -6.5]} scale={0.9} />
      <GLBModel url="/models/pillow.glb" position={[-7, 0.35, -5.5]} scale={0.9} rotation={[0, 0.3, 0]} />

      {/* Coffee table in front of sofa */}
      <GLBModel url="/models/coffee-table.glb" position={[-5.5, 0, -6]} scale={1.1} />

      {/* Lounge chair across from sofa */}
      <GLBModel url="/models/lounge-chair.glb" position={[-4, 0, -8]} scale={1.2} rotation={[0, 0, 0]} />
      <GLBModel url="/models/ottoman.glb" position={[-4, 0, -7]} scale={1.0} />

      {/* TV + stand against north wall */}
      <GLBModel url="/models/tv-stand.glb" position={[-4, 0, -9.5]} scale={1.3} />
      <GLBModel url="/models/tv.glb" position={[-4, 0.55, -9.5]} scale={1.3} />
      <GLBModel url="/models/speaker.glb" position={[-5.5, 0, -9.5]} scale={1.0} />
      <GLBModel url="/models/speaker.glb" position={[-2.5, 0, -9.5]} scale={1.0} />

      {/* Floor lamp in corner */}
      <GLBModel url="/models/floor-lamp.glb" position={[-7.5, 0, -9.3]} scale={1.2} />

      {/* Side table + lamp by sofa */}
      <GLBModel url="/models/side-table.glb" position={[-7, 0, -8.5]} scale={1.0} />
      <GLBModel url="/models/table-lamp.glb" position={[-7, 0.4, -8.5]} scale={0.9} />

      {/* Bookcase on south wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, -2.8]} scale={1.2} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/books.glb" position={[-7.4, 0.5, -2.8]} scale={1.0} />

      {/* Rug under seating area */}
      <GLBModel url="/models/rug.glb" position={[-5.5, 0.005, -6]} scale={[3.5, 1.0, 3.0]} />

      {/* Corner plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-0.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, -2.8]} scale={1.0} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN + DINING — x: 0 to 8, z: -10 to -2
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* North wall counter run — fridge, cabinets, stove, sink */}
      <GLBModel url="/models/fridge.glb" position={[0.8, 0, -9.5]} scale={1.2} rotation={[0, PI, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[2, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[3, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/stove-electric.glb" position={[4, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/range-hood.glb" position={[4, 1.3, -9.6]} scale={1.1} />
      <GLBModel url="/models/cabinet.glb" position={[5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/kitchen-sink.glb" position={[6, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[7, 0, -9.5]} scale={1.1} />

      {/* Upper cabinets on north wall */}
      <GLBModel url="/models/upper-cabinet.glb" position={[2.5, 1.1, -9.6]} scale={1.0} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5.5, 1.1, -9.6]} scale={1.0} />
      <GLBModel url="/models/upper-cabinet.glb" position={[6.5, 1.1, -9.6]} scale={1.0} />

      {/* East wall cabinets */}
      <GLBModel url="/models/cabinet.glb" position={[7.5, 0, -8.5]} scale={1.1} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet-corner.glb" position={[7.5, 0, -9.2]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/microwave.glb" position={[7.5, 0.55, -8.5]} scale={1.0} rotation={[0, -PI / 2, 0]} />

      {/* Counter accessories */}
      <GLBModel url="/models/coffee-machine.glb" position={[2.5, 0.55, -9.5]} scale={0.9} />
      <GLBModel url="/models/toaster.glb" position={[5, 0.55, -9.5]} scale={0.9} />

      {/* Kitchen island */}
      <GLBModel url="/models/kitchen-bar.glb" position={[3.5, 0, -6.5]} scale={1.2} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4.5, 0, -6.5]} scale={1.2} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5.5, 0, -6.5]} scale={1.2} />

      {/* Bar stools on south side of island */}
      <GLBModel url="/models/bar-stool.glb" position={[3.5, 0, -5.5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4.5, 0, -5.5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5.5, 0, -5.5]} scale={1.1} rotation={[0, PI, 0]} />

      {/* Small dining table near living room border */}
      <GLBModel url="/models/coffee-table.glb" position={[1.5, 0, -4.5]} scale={1.3} />
      <GLBModel url="/models/modern-chair.glb" position={[0.7, 0, -4.5]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[2.3, 0, -4.5]} scale={1.1} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5, 0, -3.7]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5, 0, -5.3]} scale={1.1} />

      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[7.5, 0, -6]} scale={1.0} />

      {/* Plant */}
      <GLBModel url="/models/plant1.glb" position={[7.5, 0, -3]} scale={1.1} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY CLOSET — x: 3.5 to 6.5, z: -2 to 0
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/washer.glb" position={[4.5, 0, -1.2]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/dryer.glb" position={[5.5, 0, -1.2]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5, 1.1, -1.5]} scale={1.0} />
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
      <GLBModel url="/models/bed.glb" position={[-4, 0, 7]} scale={1.4} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4.5, 0.45, 7.3]} scale={1.0} />
      <GLBModel url="/models/pillow.glb" position={[-3.5, 0.45, 7.3]} scale={1.0} rotation={[0, -0.2, 0]} />

      {/* Nightstands */}
      <GLBModel url="/models/nightstand.glb" position={[-6.5, 0, 7]} scale={1.1} />
      <GLBModel url="/models/nightstand.glb" position={[-1.5, 0, 7]} scale={1.1} />

      {/* Bedside lamps */}
      <GLBModel url="/models/table-lamp.glb" position={[-6.5, 0.4, 7]} scale={0.9} />
      <GLBModel url="/models/table-lamp.glb" position={[-1.5, 0.4, 7]} scale={0.9} />

      {/* Desk area on east wall */}
      <GLBModel url="/models/desk.glb" position={[-0.8, 0, 3]} scale={1.2} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-1.8, 0, 3]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-0.6, 0.55, 3]} scale={1.0} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.0, 0.52, 3]} scale={0.9} rotation={[0, -PI / 2, 0]} />

      {/* Dresser on west wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5, 0, 4]} scale={1.2} rotation={[0, PI / 2, 0]} />

      {/* Bench at foot of bed */}
      <GLBModel url="/models/bench.glb" position={[-4, 0, 5.5]} scale={1.2} rotation={[0, PI / 2, 0]} />

      {/* Rug */}
      <GLBModel url="/models/rug-round.glb" position={[-4, 0.005, 4.5]} scale={2.0} />

      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.5, 0, 7.5]} scale={1.1} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, 7.5]} scale={0.9} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM — x: 0 to 8, z: 0 to 8
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Vanity on south wall (near door) */}
      <GLBModel url="/models/bath-cabinet.glb" position={[2, 0, 0.8]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[3, 0, 0.8]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[4.5, 0, 0.8]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bath-cabinet.glb" position={[5.5, 0, 0.8]} scale={1.1} rotation={[0, PI, 0]} />

      {/* Mirror above vanity */}
      <GLBModel url="/models/mirror.glb" position={[3.8, 0.9, 0.4]} scale={1.4} rotation={[0, PI, 0]} />

      {/* Wall lamps */}
      <GLBModel url="/models/wall-lamp.glb" position={[2.5, 1.4, 0.4]} scale={1.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/wall-lamp.glb" position={[5, 1.4, 0.4]} scale={1.0} rotation={[0, PI, 0]} />

      {/* Bathtub against north wall */}
      <GLBModel url="/models/bathtub.glb" position={[5.5, 0, 7]} scale={1.3} rotation={[0, -PI / 2, 0]} />

      {/* Shower on east wall */}
      <GLBModel url="/models/shower-round.glb" position={[7, 0, 4]} scale={1.3} rotation={[0, -PI / 2, 0]} />

      {/* Toilet tucked in corner */}
      <GLBModel url="/models/toilet.glb" position={[1, 0, 7]} scale={1.1} rotation={[0, PI / 2, 0]} />

      {/* Bath mat */}
      <GLBModel url="/models/rug.glb" position={[4, 0.005, 4]} scale={[1.5, 1.0, 1.0]} />

      {/* Plants + accessories */}
      <GLBModel url="/models/potted-plant.glb" position={[0.8, 0, 0.8]} scale={0.9} />
      <GLBModel url="/models/plant1.glb" position={[7.5, 0, 7.5]} scale={0.9} />
      <GLBModel url="/models/trashcan.glb" position={[0.8, 0, 3]} scale={0.9} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — x: -8 to 3.5, z: -2 to 0
// ============================================================
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bench.glb" position={[-5, 0, -1]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/potted-plant.glb" position={[-7, 0, -1]} scale={1.0} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, -1]} scale={[3.0, 1.0, 1.2]} />
      <GLBModel url="/models/wall-lamp.glb" position={[0, 1.4, -1.9]} scale={1.0} />
    </Suspense>
  );
}
