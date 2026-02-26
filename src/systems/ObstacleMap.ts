export interface Obstacle { x: number; z: number; r: number; }

const S = 2;

// Only actual furniture — no invisible wall buffers
export const OBSTACLES: Obstacle[] = [
  // LIVING ROOM
  { x: -7 * S, z: -6 * S, r: 1.2 * S },      // sofa
  { x: -5 * S, z: -6 * S, r: 0.7 * S },       // coffee table
  { x: -4.5 * S, z: -9.3 * S, r: 1.0 * S },   // tv stand

  // KITCHEN — back wall appliances (generous radius to keep robot in open area)
  { x: 1 * S, z: -9.4 * S, r: 1.3 * S },      // fridge
  { x: 3.5 * S, z: -9.4 * S, r: 1.3 * S },    // stove
  { x: 6 * S, z: -9.4 * S, r: 1.3 * S },       // sink

  // LAUNDRY
  { x: 5.1 * S, z: -1 * S, r: 1.0 * S },      // washer+dryer combined

  // BEDROOM
  { x: -4 * S, z: 6.8 * S, r: 1.5 * S },      // bed
  { x: -6.5 * S, z: 6.8 * S, r: 0.5 * S },    // nightstand
  { x: -1.4 * S, z: 2.5 * S, r: 0.9 * S },    // desk+chair combined

  // BATHROOM
  { x: 3.5 * S, z: 0.8 * S, r: 0.5 * S },     // sink
  { x: 7 * S, z: 4 * S, r: 1.0 * S },          // shower
  { x: 1.2 * S, z: 7 * S, r: 0.5 * S },        // toilet
];

export function isPositionClear(x: number, z: number, margin: number = 0.5): boolean {
  for (const obs of OBSTACLES) {
    const dx = x - obs.x;
    const dz = z - obs.z;
    if (Math.sqrt(dx * dx + dz * dz) < obs.r + margin) return false;
  }
  return true;
}

export function findClearPosition(x: number, z: number, margin: number = 0.8): [number, number] {
  if (isPositionClear(x, z, margin)) return [x, z];
  for (let r = 0.5; r <= 8; r += 0.4) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const nx = x + Math.cos(a) * r;
      const nz = z + Math.sin(a) * r;
      if (isPositionClear(nx, nz, margin)) return [nx, nz];
    }
  }
  return [x, z];
}

export function getAvoidanceForce(
  posX: number, posZ: number, dirX: number, dirZ: number, lookAhead: number = 2.0,
): [number, number] {
  let forceX = 0;
  let forceZ = 0;
  const robotR = 0.6;
  for (const obs of OBSTACLES) {
    const dx = posX - obs.x;
    const dz = posZ - obs.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = obs.r + robotR;
    if (dist < minDist + lookAhead) {
      const dot = dirX * (obs.x - posX) + dirZ * (obs.z - posZ);
      if (dot > 0 || dist < minDist) {
        const strength = dist < minDist ? 3.5 : 1.5 / Math.max(dist - minDist, 0.1);
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }
  const mag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (mag > 3.5) { forceX = (forceX / mag) * 3.5; forceZ = (forceZ / mag) * 3.5; }
  return [forceX, forceZ];
}
