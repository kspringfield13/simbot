import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;
const S = 2; // environment scale factor matching homeLayout

// ============================================================
// LIVING ROOM — x: -16 to 0, z: -20 to -4
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/sofa-long.glb" position={[-7.2 * S, 0, -6 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/sofa-corner.glb" position={[-5.5 * S, 0, -8 * S]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-7.2 * S, 0.9 * S, -5.5 * S]} scale={1.6 * S} rotation={[0, 0.3, 0]} />
      <GLBModel url="/models/pillow-long.glb" position={[-7.2 * S, 0.9 * S, -6.8 * S]} scale={1.5 * S} />

      <GLBModel url="/models/coffee-table.glb" position={[-5 * S, 0, -6 * S]} scale={2.0 * S} />
      <GLBModel url="/models/ottoman.glb" position={[-3.5 * S, 0, -5 * S]} scale={1.8 * S} />
      <GLBModel url="/models/lounge-chair.glb" position={[-3 * S, 0, -8 * S]} scale={2.0 * S} rotation={[0, PI * 0.1, 0]} />

      <GLBModel url="/models/tv-stand.glb" position={[-4.5 * S, 0, -9.3 * S]} scale={2.2 * S} />
      <GLBModel url="/models/tv.glb" position={[-4.5 * S, 0.65 * S, -9.3 * S]} scale={2.2 * S} />
      <GLBModel url="/models/speaker.glb" position={[-6.5 * S, 0, -9.3 * S]} scale={1.8 * S} />
      <GLBModel url="/models/speaker.glb" position={[-2.5 * S, 0, -9.3 * S]} scale={1.8 * S} />

      <GLBModel url="/models/floor-lamp.glb" position={[-7.5 * S, 0, -9.3 * S]} scale={2.0 * S} />
      <GLBModel url="/models/side-table.glb" position={[-7.2 * S, 0, -8.5 * S]} scale={1.6 * S} />
      <GLBModel url="/models/table-lamp.glb" position={[-7.2 * S, 0.6 * S, -8.5 * S]} scale={1.4 * S} />

      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5 * S, 0, -2.8 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/books.glb" position={[-7.4 * S, 1.0 * S, -2.8 * S]} scale={1.6 * S} />

      <GLBModel url="/models/rug.glb" position={[-5 * S, 0.005, -6 * S]} scale={[4.5 * S, 2.0 * S, 4.0 * S]} />
      <GLBModel url="/models/potted-plant.glb" position={[-0.5 * S, 0, -9.3 * S]} scale={1.6 * S} />
      <GLBModel url="/models/plant2.glb" position={[-7.5 * S, 0, -3.8 * S]} scale={1.4 * S} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN + DINING — x: 0 to 16, z: -20 to -4
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/fridge.glb" position={[0.8 * S, 0, -9.4 * S]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/cabinet.glb" position={[2 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[3 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/stove-electric.glb" position={[4 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/range-hood.glb" position={[4 * S, 1.8 * S, -9.5 * S]} scale={1.8 * S} />
      <GLBModel url="/models/cabinet.glb" position={[5 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/kitchen-sink.glb" position={[6 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/cabinet-drawer.glb" position={[7 * S, 0, -9.4 * S]} scale={2.0 * S} />

      <GLBModel url="/models/upper-cabinet.glb" position={[2.5 * S, 1.5 * S, -9.6 * S]} scale={1.8 * S} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5.5 * S, 1.5 * S, -9.6 * S]} scale={1.8 * S} />
      <GLBModel url="/models/upper-cabinet.glb" position={[7 * S, 1.5 * S, -9.6 * S]} scale={1.8 * S} />

      <GLBModel url="/models/cabinet.glb" position={[7.4 * S, 0, -8.2 * S]} scale={2.0 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/cabinet-corner.glb" position={[7.4 * S, 0, -9 * S]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/microwave.glb" position={[7.4 * S, 0.9 * S, -8.2 * S]} scale={1.6 * S} rotation={[0, -PI / 2, 0]} />

      <GLBModel url="/models/coffee-machine.glb" position={[2.8 * S, 0.9 * S, -9.4 * S]} scale={1.4 * S} />
      <GLBModel url="/models/toaster.glb" position={[5 * S, 0.9 * S, -9.4 * S]} scale={1.4 * S} />

      <GLBModel url="/models/kitchen-bar.glb" position={[3 * S, 0, -6 * S]} scale={2.0 * S} />
      <GLBModel url="/models/kitchen-bar-mid.glb" position={[4.2 * S, 0, -6 * S]} scale={2.0 * S} />
      <GLBModel url="/models/kitchen-bar.glb" position={[5.4 * S, 0, -6 * S]} scale={2.0 * S} />

      <GLBModel url="/models/bar-stool.glb" position={[3 * S, 0, -5 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[4.2 * S, 0, -5 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bar-stool.glb" position={[5.4 * S, 0, -5 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />

      <GLBModel url="/models/coffee-table.glb" position={[1.5 * S, 0, -4 * S]} scale={2.2 * S} />
      <GLBModel url="/models/modern-chair.glb" position={[0.5 * S, 0, -4 * S]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[2.5 * S, 0, -4 * S]} scale={1.8 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5 * S, 0, -3.2 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/modern-chair.glb" position={[1.5 * S, 0, -4.8 * S]} scale={1.8 * S} />

      <GLBModel url="/models/trashcan.glb" position={[7.4 * S, 0, -5.5 * S]} scale={1.6 * S} />
      <GLBModel url="/models/plant1.glb" position={[7.4 * S, 0, -2.8 * S]} scale={1.5 * S} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY CLOSET — x: 7 to 13, z: -4 to 0
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/washer.glb" position={[4.5 * S, 0, -1 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/dryer.glb" position={[5.7 * S, 0, -1 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/upper-cabinet.glb" position={[5 * S, 1.5 * S, -1.6 * S]} scale={1.6 * S} />
    </Suspense>
  );
}

// ============================================================
// MASTER BEDROOM — x: -16 to 0, z: 0 to 16
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bed.glb" position={[-4 * S, 0, 6.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-4.6 * S, 0.7 * S, 7.2 * S]} scale={1.6 * S} rotation={[0, 0.2, 0]} />
      <GLBModel url="/models/pillow.glb" position={[-3.4 * S, 0.7 * S, 7.2 * S]} scale={1.6 * S} rotation={[0, -0.2, 0]} />

      <GLBModel url="/models/nightstand.glb" position={[-6.5 * S, 0, 6.8 * S]} scale={1.8 * S} />
      <GLBModel url="/models/nightstand.glb" position={[-1.5 * S, 0, 6.8 * S]} scale={1.8 * S} />
      <GLBModel url="/models/table-lamp.glb" position={[-6.5 * S, 0.7 * S, 6.8 * S]} scale={1.4 * S} />
      <GLBModel url="/models/table-lamp.glb" position={[-1.5 * S, 0.7 * S, 6.8 * S]} scale={1.4 * S} />

      <GLBModel url="/models/desk.glb" position={[-0.8 * S, 0, 2.5 * S]} scale={2.0 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-2 * S, 0, 2.5 * S]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/monitor.glb" position={[-0.6 * S, 0.78 * S, 2.5 * S]} scale={1.6 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/keyboard.glb" position={[-1.1 * S, 0.76 * S, 2.5 * S]} scale={1.4 * S} rotation={[0, -PI / 2, 0]} />

      <GLBModel url="/models/bookcase-wide.glb" position={[-7.5 * S, 0, 3.5 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/bench.glb" position={[-4 * S, 0, 5.2 * S]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/rug-round.glb" position={[-4 * S, 0.005, 4.5 * S]} scale={2.8 * S} />
      <GLBModel url="/models/potted-plant.glb" position={[-7.5 * S, 0, 7.5 * S]} scale={1.6 * S} />
      <GLBModel url="/models/plant2.glb" position={[-0.5 * S, 0, 7.5 * S]} scale={1.3 * S} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM — x: 0 to 16, z: 0 to 16
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bath-cabinet.glb" position={[2 * S, 0, 0.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[3.2 * S, 0, 0.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bathroom-sink.glb" position={[5 * S, 0, 0.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/bath-cabinet.glb" position={[6.2 * S, 0, 0.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />

      <GLBModel url="/models/mirror.glb" position={[4 * S, 1.1 * S, 0.3 * S]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/wall-lamp.glb" position={[2.5 * S, 1.6 * S, 0.3 * S]} scale={1.4 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/wall-lamp.glb" position={[5.5 * S, 1.6 * S, 0.3 * S]} scale={1.4 * S} rotation={[0, PI, 0]} />

      <GLBModel url="/models/bathtub.glb" position={[5.5 * S, 0, 7 * S]} scale={2.0 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/shower-round.glb" position={[7 * S, 0, 4 * S]} scale={1.9 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/toilet.glb" position={[1.2 * S, 0, 7 * S]} scale={1.2 * S} rotation={[0, PI / 2, 0]} />

      <GLBModel url="/models/rug.glb" position={[4.5 * S, 0.005, 4 * S]} scale={[2.0 * S, 1.0 * S, 1.5 * S]} />
      <GLBModel url="/models/potted-plant.glb" position={[0.8 * S, 0, 0.8 * S]} scale={1.3 * S} />
      <GLBModel url="/models/plant1.glb" position={[7.5 * S, 0, 7.5 * S]} scale={1.2 * S} />
      <GLBModel url="/models/trashcan.glb" position={[0.8 * S, 0, 3.5 * S]} scale={1.4 * S} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — x: -16 to 7, z: -4 to 0
// ============================================================
export function HallwayDecor() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bench.glb" position={[-5 * S, 0, -1 * S]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/potted-plant.glb" position={[-7.2 * S, 0, -1 * S]} scale={1.4 * S} />
      <GLBModel url="/models/rug.glb" position={[0, 0.005, -1 * S]} scale={[4.0 * S, 1.5 * S, 1.5 * S]} />
      <GLBModel url="/models/wall-lamp.glb" position={[0, 1.6 * S, -1.9 * S]} scale={1.4 * S} />
    </Suspense>
  );
}
