import { Suspense } from 'react';
import { GLBModel } from './GLBModel';

const PI = Math.PI;
const S = 2;

// ============================================================
// LIVING ROOM — walls: left x=-16, right x=0(open), back z=-20, front z=-4
// ============================================================
export function LivingRoomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sofa against left wall (x=-16), centered in room z */}
      <GLBModel url="/models/sofa-long.glb" position={[-14.5, 0, -12]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      {/* Coffee table in front of sofa */}
      <GLBModel url="/models/coffee-table.glb" position={[-11.5, 0, -12]} scale={2.0 * S} />
      {/* TV stand against back wall (z=-20) */}
      <GLBModel url="/models/tv-stand.glb" position={[-8, 0, -19]} scale={2.0 * S} />
      <GLBModel url="/models/tv.glb" position={[-8, 1.3, -19]} scale={2.0 * S} />
    </Suspense>
  );
}

// ============================================================
// KITCHEN — walls: left x=0(open), right x=16, back z=-20, front z=-4
// ============================================================
export function KitchenFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Appliances along back wall (z=-20), with 0.5 offset from wall */}
      <GLBModel url="/models/fridge.glb" position={[3, 0, -19]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/stove-electric.glb" position={[7, 0, -19]} scale={2.0 * S} />
      <GLBModel url="/models/range-hood.glb" position={[7, 3.6, -19.3]} scale={1.8 * S} />
      <GLBModel url="/models/kitchen-sink.glb" position={[11, 0, -19]} scale={2.0 * S} />
    </Suspense>
  );
}

// ============================================================
// LAUNDRY — walls: left x=7, right x=13, back z=-4, front z=0
// ============================================================
export function LaundryClosetFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Washer+dryer against back wall (z=-4), offset 0.5 */}
      <GLBModel url="/models/washer.glb" position={[8.5, 0, -3.2]} scale={2.0 * S} rotation={[0, PI, 0]} />
      <GLBModel url="/models/dryer.glb" position={[11.5, 0, -3.2]} scale={2.0 * S} rotation={[0, PI, 0]} />
    </Suspense>
  );
}

// ============================================================
// BEDROOM — walls: left x=-16, right x=0, back z=16, front z=0
// ============================================================
export function BedroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Bed against back wall (z=16), centered x */}
      <GLBModel url="/models/bed.glb" position={[-8, 0, 14.5]} scale={1.8 * S} rotation={[0, PI, 0]} />
      {/* Nightstand to left of bed */}
      <GLBModel url="/models/nightstand.glb" position={[-12.5, 0, 14.5]} scale={1.8 * S} />
      {/* Desk against left wall (x=-16), near front */}
      <GLBModel url="/models/desk.glb" position={[-14.5, 0, 3]} scale={2.0 * S} rotation={[0, PI / 2, 0]} />
      <GLBModel url="/models/desk-chair.glb" position={[-12.5, 0, 3]} scale={1.8 * S} rotation={[0, -PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// BATHROOM — walls: left x=0, right x=16, back z=16, front z=0
// ============================================================
export function BathroomFurniture() {
  return (
    <Suspense fallback={null}>
      {/* Sink against front wall (z=0), offset 0.8 */}
      <GLBModel url="/models/bathroom-sink.glb" position={[6, 0, 1.2]} scale={1.8 * S} rotation={[0, PI, 0]} />
      {/* Shower in back-right corner */}
      <GLBModel url="/models/shower-round.glb" position={[14, 0, 14]} scale={1.9 * S} />
      {/* Toilet against left wall (x=0), midway */}
      <GLBModel url="/models/toilet.glb" position={[1.5, 0, 8]} scale={1.2 * S} rotation={[0, PI / 2, 0]} />
    </Suspense>
  );
}

// ============================================================
// HALLWAY — empty
// ============================================================
export function HallwayDecor() {
  return null;
}
