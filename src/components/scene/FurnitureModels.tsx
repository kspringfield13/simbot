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
      <GLBModel url="/models/sofa-long.glb" position={[-7 * S, 0, -6 * S]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/coffee-table.glb" position={[-5 * S, 0, -6 * S]} scale={2.0 * S} />
      <GLBModel url="/models/tv-stand.glb" position={[-4.5 * S, 0, -9.3 * S]} scale={2.2 * S} />
      <GLBModel url="/models/tv.glb" position={[-4.5 * S, 0.65 * S, -9.3 * S]} scale={2.2 * S} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN — x: 0 to 16, z: -20 to -4
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Back wall counter — fridge, stove, sink in a line */}
      <GLBModel url="/models/fridge.glb" position={[1 * S, 0, -9.4 * S]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/stove-electric.glb" position={[3.5 * S, 0, -9.4 * S]} scale={2.0 * S} />
      <GLBModel url="/models/range-hood.glb" position={[3.5 * S, 1.8 * S, -9.5 * S]} scale={1.8 * S} />
      <GLBModel url="/models/kitchen-sink.glb" position={[6 * S, 0, -9.4 * S]} scale={2.0 * S} />
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
      <GLBModel url="/models/nightstand.glb" position={[-6.5 * S, 0, 6.8 * S]} scale={1.8 * S} />
      <GLBModel url="/models/desk.glb" position={[-0.8 * S, 0, 2.5 * S]} scale={2.0 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-2 * S, 0, 2.5 * S]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// MASTER BATHROOM — x: 0 to 16, z: 0 to 16
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      <GLBModel url="/models/bathroom-sink.glb" position={[3.5 * S, 0, 0.8 * S]} scale={1.8 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/shower-round.glb" position={[7 * S, 0, 4 * S]} scale={1.9 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/toilet.glb" position={[1.2 * S, 0, 7 * S]} scale={1.2 * S} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — empty, just open space
// ============================================================
export function HallwayDecor() {
  return null;
}
