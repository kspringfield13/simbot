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
      <GLBModel url="/models/sofa-long.glb" position={[-7, 0, -6]} scale={1.2} rotation={[0, PI / 2, 0]} />
      {/* Coffee table in front of sofa */}
      <GLBModel url="/models/coffee-table.glb" position={[-5, 0, -6]} scale={1.2} />
      {/* Lounge chair facing sofa */}
      <GLBModel url="/models/lounge-chair.glb" position={[-5, 0, -4]} scale={1.2} rotation={[0, PI, 0]} />
      {/* TV stand + TV on east-ish wall */}
      <GLBModel url="/models/tv-stand.glb" position={[-3, 0, -6]} scale={1.2} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/tv.glb" position={[-3, 0.55, -6]} scale={1.2} rotation={[0, -PI / 2, 0]} />
      {/* Floor lamp corner */}
      <GLBModel url="/models/floor-lamp.glb" position={[-7.3, 0, -9.3]} scale={1.2} />
      {/* Bookcase on north wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-6, 0, -9.3]} scale={1.2} />
      <GLBModel url="/models/books.glb" position={[-6, 0.5, -9.3]} scale={1.0} />
      {/* Side table + lamp by sofa */}
      <GLBModel url="/models/side-table.glb" position={[-7, 0, -8]} scale={1.0} />
      <GLBModel url="/models/table-lamp.glb" position={[-7, 0.4, -8]} scale={0.9} />
      {/* Rug under seating area */}
      <GLBModel url="/models/rug.glb" position={[-5, 0.005, -6]} scale={[3.5, 1.0, 3.0]} />
      {/* Plants in corners */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.5, 0, -3]} scale={1.1} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, -9.3]} scale={1.0} />
      {/* Ottoman */}
      <GLBModel url="/models/ottoman.glb" position={[-5, 0, -7.5]} scale={1.0} />
      {/* Speakers flanking TV */}
      <GLBModel url="/models/speaker.glb" position={[-3, 0, -4.5]} scale={1.0} />
      <GLBModel url="/models/speaker.glb" position={[-3, 0, -7.5]} scale={1.0} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN + DINING — x: 0 to 8, z: -10 to -2
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Counter run along north wall (z ≈ -9.5) */}
      <GLBModel url="/models/cabinet.glb" position={[1.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[2.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet.glb" position={[3.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[5.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/cabinet.glb" position={[6.5, 0, -9.5]} scale={1.1} />
      {/* Upper cabinets */}
      <GLBModel url="/models/upper-cabinet.glb" position={[2, 1.2, -9.6]} scale={1.1} />
      <GLBModel url="/models/upper-cabinet.glb" position={[3.5, 1.2, -9.6]} scale={1.1} />
      <GLBModel url="/models/upper-cabinet.glb" position={[6, 1.2, -9.6]} scale={1.1} />
      {/* Fridge against north wall */}
      <GLBModel url="/models/fridge.glb" position={[7.3, 0, -9.5]} scale={1.2} rotation={[0, PI, 0]} />
      {/* Stove + range hood */}
      <GLBModel url="/models/stove-electric.glb" position={[4.5, 0, -9.5]} scale={1.1} />
      <GLBModel url="/models/range-hood.glb" position={[4.5, 1.5, -9.6]} scale={1.1} />
      {/* Sink */}
      <GLBModel url="/models/kitchen-sink.glb" position={[5.5, 0, -9.5]} scale={1.1} />
      {/* East wall cabinets */}
      <GLBModel url="/models/cabinet.glb" position={[7.5, 0, -8]} scale={1.1} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[7.5, 0, -7]} scale={1.1} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/microwave.glb" position={[7.5, 0.75, -7.5]} scale={1.0} rotation={[0, -PI / 2, 0]} />
      {/* Kitchen island */}
      <GLBModel url="/models/kitchen-bar.glb" position={[3, 0, -6]} scale={1.2} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4, 0, -6]} scale={1.2} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5, 0, -6]} scale={1.2} />
      {/* Bar stools */}
      <GLBModel url="/models/bar-stool.glb" position={[3, 0, -5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4, 0, -5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5, 0, -5]} scale={1.1} rotation={[0, PI, 0]} />
      {/* Dining table near living room border */}
      <GLBModel url="/models/coffee-table.glb" position={[1.5, 0, -4.5]} scale={1.3} />
      <GLBModel url="/models/modern-chair.glb" position={[0.7, 0, -4.5]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[2.3, 0, -4.5]} scale={1.1} rotation={[0, -PI / 2, 0]} />
      {/* Counter accessories */}
      <GLBModel url="/models/coffee-machine.glb" position={[2.5, 0.75, -9.5]} scale={0.9} />
      <GLBModel url="/models/toaster.glb" position={[6.5, 0.75, -9.5]} scale={0.9} />
      {/* Trashcan by island */}
      <GLBModel url="/models/trashcan.glb" position={[7.3, 0, -5]} scale={1.0} />
      {/* Plant */}
      <GLBModel url="/models/plant1.glb" position={[0.5, 0, -9.3]} scale={1.0} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY CLOSET — x: 3.5 to 6.5, z: -2 to 0
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/washer.glb" position={[4.5, 0, -1.5]} scale={1.1} />
      <GLBModel url="/models/dryer.glb" position={[5.5, 0, -1.5]} scale={1.1} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5, 1.2, -1.7]} scale={1.0} />
    </Suspense>
  );
}

// ============================================================
// MASTER BEDROOM — x: -8 to 0, z: 0 to 8
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed centered against south wall */}
      <GLBModel url="/models/bed.glb" position={[-4, 0, 6.5]} scale={1.3} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4.5, 0.5, 7]} scale={1.0} />
      <GLBModel url="/models/pillow.glb" position={[-3.5, 0.5, 7]} scale={1.0} />
      {/* Nightstands */}
      <GLBModel url="/models/nightstand.glb" position={[-6, 0, 6.5]} scale={1.1} />
      <GLBModel url="/models/nightstand.glb" position={[-2, 0, 6.5]} scale={1.1} />
      {/* Bedside lamps */}
      <GLBModel url="/models/table-lamp.glb" position={[-6, 0.4, 6.5]} scale={0.9} />
      <GLBModel url="/models/table-lamp.glb" position={[-2, 0.4, 6.5]} scale={0.9} />
      {/* Desk on north wall */}
      <GLBModel url="/models/desk.glb" position={[-1.5, 0, 1]} scale={1.2} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-2.5, 0, 1]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-1.3, 0.65, 1]} scale={1.0} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.8, 0.62, 1]} scale={1.0} rotation={[0, -PI / 2, 0]} />
      {/* Dresser on west wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-7.3, 0, 3.5]} scale={1.2} rotation={[0, PI / 2, 0]} />
      {/* Rug beside bed */}
      <GLBModel url="/models/rug-round.glb" position={[-4, 0.005, 4.5]} scale={2.0} />
      {/* Bench at foot of bed */}
      <GLBModel url="/models/bench.glb" position={[-4, 0, 5]} scale={1.2} rotation={[0, PI / 2, 0]} />
      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-7.3, 0, 7.3]} scale={1.1} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, 7.3]} scale={0.9} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM — x: 0 to 8, z: 0 to 8
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Double vanity on north wall */}
      <GLBModel url="/models/bath-cabinet.glb" position={[2, 0, 0.5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[3, 0, 0.5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[4.5, 0, 0.5]} scale={1.1} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bath-cabinet.glb" position={[5.5, 0, 0.5]} scale={1.1} rotation={[0, PI, 0]} />
      {/* Mirror above vanity */}
      <GLBModel url="/models/mirror.glb" position={[3.8, 1.0, 0.3]} scale={1.3} rotation={[0, PI, 0]} />
      {/* Bathtub against south wall */}
      <GLBModel url="/models/bathtub.glb" position={[5.5, 0, 7]} scale={1.3} rotation={[0, -PI / 2, 0]} />
      {/* Shower on east wall */}
      <GLBModel url="/models/shower-round.glb" position={[7, 0, 3.5]} scale={1.3} rotation={[0, -PI / 2, 0]} />
      {/* Toilet tucked in corner */}
      <GLBModel url="/models/toilet.glb" position={[1, 0, 7]} scale={1.1} rotation={[0, PI / 2, 0]} />
      {/* Bath mat */}
      <GLBModel url="/models/rug.glb" position={[4, 0.005, 4]} scale={[1.5, 1.0, 1.0]} />
      {/* Plant */}
      <GLBModel url="/models/potted-plant.glb" position={[1, 0, 0.8]} scale={0.9} />
      <GLBModel url="/models/plant1.glb" position={[7.3, 0, 7]} scale={0.9} />
      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[1, 0, 3.5]} scale={0.9} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — x: -8 to 4, z: -2 to 0
// ============================================================
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bench.glb" position={[-4, 0, -1]} scale={1.1} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/potted-plant.glb" position={[-7, 0, -1]} scale={1.0} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, -1]} scale={[3.0, 1.0, 1.2]} />
      <GLBModel url="/models/wall-lamp.glb" position={[0, 1.6, -1.9]} scale={1.0} />
    </Suspense>
  );
}
