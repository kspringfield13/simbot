import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;
const S = 2;

// ============================================================
// LIVING ROOM — bounds: x(-16,0) z(-20,-4). Center: (-8,-12)
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sofa against left wall, facing right */}
      <GLBModel url="/models/sofa-long.glb" position={[-14, 0, -12]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      {/* Coffee table in front of sofa */}
      <GLBModel url="/models/coffee-table.glb" position={[-11, 0, -12]} scale={2.0 * S} />
      {/* TV stand against back wall */}
      <GLBModel url="/models/tv-stand.glb" position={[-8, 0, -18.5]} scale={2.0 * S} />
      <GLBModel url="/models/tv.glb" position={[-8, 1.3, -18.5]} scale={2.0 * S} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN — bounds: x(0,16) z(-20,-4). Center: (8,-12)
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Appliances along back wall (z=-19.5), facing into room */}
      <GLBModel url="/models/fridge.glb" position={[2, 0, -18.5]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/stove-electric.glb" position={[6, 0, -18.5]} scale={2.0 * S} />
      <GLBModel url="/models/range-hood.glb" position={[6, 3.6, -18.8]} scale={1.8 * S} />
      <GLBModel url="/models/kitchen-sink.glb" position={[10, 0, -18.5]} scale={2.0 * S} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY — bounds: x(7,13) z(-4,0). Center: (10,-2)
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Washer+dryer against back wall */}
      <GLBModel url="/models/washer.glb" position={[9, 0, -3.5]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/dryer.glb" position={[11, 0, -3.5]} scale={2.0 * S} rotation={[0, PI, 0]} />
    </Suspense>
  );
}

// ============================================================
// BEDROOM — bounds: x(-16,0) z(0,16). Center: (-8,8)
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed against back wall, centered */}
      <GLBModel url="/models/bed.glb" position={[-8, 0, 14]} scale={1.8 * S} rotation={[0, PI, 0]} />
      {/* Nightstand next to bed */}
      <GLBModel url="/models/nightstand.glb" position={[-12, 0, 14]} scale={1.8 * S} />
      {/* Desk against right wall, facing left */}
      <GLBModel url="/models/desk.glb" position={[-1.5, 0, 4]} scale={2.0 * S} rotation={[0, -PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-3.5, 0, 4]} scale={1.8 * S} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// BATHROOM — bounds: x(0,16) z(0,16). Center: (8,8)
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sink against top wall, facing into room */}
      <GLBModel url="/models/bathroom-sink.glb" position={[5, 0, 1]} scale={1.8 * S} rotation={[0, PI, 0]} />
      {/* Shower in far corner */}
      <GLBModel url="/models/shower-round.glb" position={[14, 0, 14]} scale={1.9 * S} />
      {/* Toilet against left wall */}
      <GLBModel url="/models/toilet.glb" position={[1.5, 0, 10]} scale={1.2 * S} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — empty
// ============================================================
export function HallwayDecor() {
  return null;
}
