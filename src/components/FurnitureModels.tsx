import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;

// ======= LIVING ROOM (x: -7 to 0, z: -5 to 0) =======
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sofa arrangement — facing TV wall */}
      <GLBModel url="/models/sofa-long.glb" position={[-5, 0, -3.5]} scale={2.0} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/sofa-corner.glb" position={[-3.5, 0, -4.2]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/ottoman.glb" position={[-2.5, 0, -3]} scale={1.6} />
      {/* Pillows on sofa */}
      <GLBModel url="/models/pillow.glb" position={[-5.5, 0.45, -3.2]} scale={1.2} rotation={[0, 0.3, 0]} />
      <GLBModel url="/models/pillow-long.glb" position={[-4.5, 0.45, -3.8]} scale={1.2} rotation={[0, -0.2, 0]} />
      {/* Coffee table */}
      <GLBModel url="/models/coffee-table.glb" position={[-3.5, 0, -2]} scale={1.8} />
      {/* TV setup */}
      <GLBModel url="/models/tv-stand.glb" position={[-3.5, 0, -0.3]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/tv.glb" position={[-3.5, 0.7, -0.3]} scale={2.0} rotation={[0, PI, 0]} />
      <GLBModel url="/models/speaker.glb" position={[-5.2, 0, -0.3]} scale={1.6} />
      <GLBModel url="/models/speaker.glb" position={[-1.8, 0, -0.3]} scale={1.6} />
      {/* Floor lamp */}
      <GLBModel url="/models/floor-lamp.glb" position={[-6.3, 0, -0.5]} scale={2.0} />
      {/* Bookcase wall */}
      <GLBModel url="/models/bookcase-wide.glb" position={[-6.5, 0, -2.5]} scale={1.8} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/books.glb" position={[-6.4, 0.65, -2.5]} scale={1.4} />
      {/* Rug */}
      <GLBModel url="/models/rug.glb" position={[-3.5, 0.005, -2.5]} scale={[4.0, 2.0, 3.0]} />
      {/* Plants */}
      <GLBModel url="/models/potted-plant.glb" position={[-6.5, 0, -4.5]} scale={1.6} />
      <GLBModel url="/models/plant2.glb" position={[-0.5, 0, -0.5]} scale={1.4} />
      {/* Side table with lamp */}
      <GLBModel url="/models/side-table.glb" position={[-6.2, 0, -3.5]} scale={1.4} />
      <GLBModel url="/models/table-lamp.glb" position={[-6.2, 0.5, -3.5]} scale={1.2} />
      {/* Lounge chair */}
      <GLBModel url="/models/lounge-chair.glb" position={[-1.5, 0, -3]} scale={1.8} rotation={[0, -PI / 3, 0]} />
    </Suspense>
  );
}

// ======= KITCHEN (x: 0 to 7, z: -5 to 0) =======
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Back wall counter run (z=-4.7) */}
      <GLBModel url="/models/cabinet.glb" position={[2, 0, -4.5]} scale={1.8} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[3, 0, -4.5]} scale={1.8} />
      <GLBModel url="/models/cabinet.glb" position={[4, 0, -4.5]} scale={1.8} />
      <GLBModel url="/models/cabinet.glb" position={[5, 0, -4.5]} scale={1.8} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[6, 0, -4.5]} scale={1.8} />
      {/* Upper cabinets */}
      <GLBModel url="/models/upper-cabinet.glb" position={[2.5, 1.3, -4.7]} scale={1.6} />
      <GLBModel url="/models/upper-cabinet.glb" position={[4, 1.3, -4.7]} scale={1.6} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5.5, 1.3, -4.7]} scale={1.6} />
      {/* Right wall cabinets */}
      <GLBModel url="/models/cabinet.glb" position={[6.5, 0, -3.5]} scale={1.8} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[6.5, 0, -2.5]} scale={1.8} rotation={[0, -PI / 2, 0]} />
      {/* Appliances */}
      <GLBModel url="/models/fridge.glb" position={[1.2, 0, -4.5]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/stove-electric.glb" position={[3.5, 0, -4.6]} scale={1.8} />
      <GLBModel url="/models/range-hood.glb" position={[3.5, 1.6, -4.7]} scale={1.8} />
      <GLBModel url="/models/kitchen-sink.glb" position={[5, 0, -4.5]} scale={1.8} />
      <GLBModel url="/models/microwave.glb" position={[6, 0.95, -4.5]} scale={1.5} />
      {/* Counter accessories */}
      <GLBModel url="/models/coffee-machine.glb" position={[2.5, 0.95, -4.5]} scale={1.3} />
      <GLBModel url="/models/toaster.glb" position={[4.5, 0.95, -4.5]} scale={1.3} />
      <GLBModel url="/models/blender.glb" position={[5.5, 0.95, -4.5]} scale={1.3} />
      {/* Kitchen island */}
      <GLBModel url="/models/kitchen-bar.glb" position={[3, 0, -2]} scale={1.8} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4, 0, -2]} scale={1.8} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5, 0, -2]} scale={1.8} />
      {/* Bar stools */}
      <GLBModel url="/models/bar-stool.glb" position={[3, 0, -1.2]} scale={1.6} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4, 0, -1.2]} scale={1.6} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5, 0, -1.2]} scale={1.6} rotation={[0, PI, 0]} />
      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[6.5, 0, -1]} scale={1.4} />
      {/* Plant */}
      <GLBModel url="/models/plant1.glb" position={[1, 0, -0.5]} scale={1.4} />
    </Suspense>
  );
}

// ======= BEDROOM (x: -7 to 0, z: 2 to 7) =======
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed against back wall */}
      <GLBModel url="/models/bed.glb" position={[-4.5, 0, 6]} scale={2.0} rotation={[0, PI, 0]} />
      {/* Pillows */}
      <GLBModel url="/models/pillow.glb" position={[-5, 0.6, 6.3]} scale={1.3} rotation={[0, 0.2, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4, 0.6, 6.3]} scale={1.3} rotation={[0, -0.15, 0]} />
      {/* Nightstands */}
      <GLBModel url="/models/nightstand.glb" position={[-6.2, 0, 5.8]} scale={1.5} />
      <GLBModel url="/models/nightstand.glb" position={[-2.8, 0, 5.8]} scale={1.5} />
      {/* Bedside lamps */}
      <GLBModel url="/models/table-lamp.glb" position={[-6.2, 0.55, 5.8]} scale={1.2} />
      <GLBModel url="/models/table-lamp.glb" position={[-2.8, 0.55, 5.8]} scale={1.2} />
      {/* Desk setup */}
      <GLBModel url="/models/desk.glb" position={[-1.5, 0, 3.5]} scale={1.8} rotation={[0, PI, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-1.5, 0, 4.2]} scale={1.7} rotation={[0, PI, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-1.8, 0.8, 3.3]} scale={1.4} rotation={[0, PI, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.5, 0.78, 3.6]} scale={1.4} rotation={[0, PI, 0]} />
      <GLBModel url="/models/laptop.glb" position={[-1, 0.78, 3.5]} scale={1.2} rotation={[0, PI * 0.8, 0]} />
      {/* Washer/dryer */}
      <GLBModel url="/models/washer.glb" position={[-6.3, 0, 3]} scale={1.5} />
      <GLBModel url="/models/dryer.glb" position={[-6.3, 0, 3.9]} scale={1.5} />
      {/* Bookcase */}
      <GLBModel url="/models/bookcase.glb" position={[-6.5, 0, 5]} scale={1.6} rotation={[0, PI / 2, 0]} />
      {/* Rug */}
      <GLBModel url="/models/rug-round.glb" position={[-4.5, 0.005, 4.5]} scale={2.5} />
      {/* Plant */}
      <GLBModel url="/models/potted-plant.glb" position={[-0.5, 0, 6.5]} scale={1.4} />
    </Suspense>
  );
}

// ======= BATHROOM (x: 0 to 7, z: 2 to 7) =======
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bathtub */}
      <GLBModel url="/models/bathtub.glb" position={[5.5, 0, 6]} scale={1.8} rotation={[0, -PI / 2, 0]} />
      {/* Shower */}
      <GLBModel url="/models/shower-round.glb" position={[6, 0, 3.5]} scale={1.8} rotation={[0, -PI / 2, 0]} />
      {/* Toilet */}
      <GLBModel url="/models/toilet.glb" position={[2, 0, 6]} scale={1.7} rotation={[0, PI / 2, 0]} />
      {/* Vanity area */}
      <GLBModel url="/models/bath-cabinet.glb" position={[3, 0, 3]} scale={1.7} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[4.2, 0, 3]} scale={1.7} rotation={[0, PI, 0]} />
      <GLBModel url="/models/mirror.glb" position={[3.6, 1.1, 2.6]} scale={1.8} rotation={[0, PI, 0]} />
      {/* Bath mat */}
      <GLBModel url="/models/rug.glb" position={[4, 0.005, 5]} scale={[1.5, 1.0, 1.0]} />
      {/* Trashcan */}
      <GLBModel url="/models/trashcan.glb" position={[1.5, 0, 3.5]} scale={1.2} />
      {/* Plant */}
      <GLBModel url="/models/plant1.glb" position={[1.2, 0, 6.5]} scale={1.2} />
      {/* Wall lamp */}
      <GLBModel url="/models/wall-lamp.glb" position={[3.6, 1.8, 2.5]} scale={1.4} rotation={[0, PI, 0]} />
    </Suspense>
  );
}

// ======= HALLWAY (x: -7 to 7, z: 0 to 2) =======
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/potted-plant.glb" position={[-5, 0, 1]} scale={1.5} />
      <GLBModel url="/models/potted-plant.glb" position={[5, 0, 1]} scale={1.5} />
      <GLBModel url="/models/bench.glb" position={[0, 0, 1.5]} scale={1.6} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, 1]} scale={[3.0, 1.5, 1.5]} />
    </Suspense>
  );
}
