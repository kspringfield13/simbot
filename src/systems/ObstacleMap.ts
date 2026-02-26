export interface Obstacle { x: number; z: number; r: number; }

export const OBSTACLES: Obstacle[] = [
  // LIVING ROOM
  { x: -14, z: -12, r: 2.5 },    // sofa
  { x: -11, z: -12, r: 1.5 },    // coffee table
  { x: -8, z: -18.5, r: 2 },     // tv stand

  // KITCHEN (back wall)
  { x: 2, z: -18.5, r: 1.5 },    // fridge
  { x: 6, z: -18.5, r: 1.5 },    // stove
  { x: 10, z: -18.5, r: 1.5 },   // sink

  // LAUNDRY
  { x: 10, z: -3.5, r: 2 },      // washer+dryer

  // BEDROOM
  { x: -8, z: 14, r: 3 },        // bed
  { x: -12, z: 14, r: 1 },       // nightstand
  { x: -2.5, z: 4, r: 1.5 },     // desk+chair

  // BATHROOM
  { x: 5, z: 1, r: 1 },          // sink
  { x: 14, z: 14, r: 2 },        // shower
  { x: 1.5, z: 10, r: 1 },       // toilet
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
