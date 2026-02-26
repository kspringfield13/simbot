export interface Obstacle { x: number; z: number; r: number; }

const S = 2; // scale factor

export const OBSTACLES: Obstacle[] = [
  // LIVING ROOM — furniture against walls, center open
  { x: -7 * S, z: -6 * S, r: 1.2 * S },      // sofa
  { x: -5 * S, z: -6 * S, r: 0.7 * S },       // coffee table
  { x: -4.5 * S, z: -9.3 * S, r: 1.0 * S },   // tv stand + tv

  // KITCHEN — entire back wall as obstacles (robot must stay in open center)
  { x: 1 * S, z: -9.4 * S, r: 1.5 * S },      // fridge zone
  { x: 3.5 * S, z: -9.4 * S, r: 1.5 * S },    // stove zone
  { x: 6 * S, z: -9.4 * S, r: 1.5 * S },       // sink zone
  // Kitchen walls — prevent robot from going behind appliances or into walls
  { x: 0.3 * S, z: -6 * S, r: 0.8 * S },       // left wall buffer
  { x: 7.7 * S, z: -6 * S, r: 0.8 * S },       // right wall buffer

  // LAUNDRY
  { x: 4.5 * S, z: -1 * S, r: 0.6 * S },      // washer
  { x: 5.7 * S, z: -1 * S, r: 0.6 * S },      // dryer

  // BEDROOM — bed against back wall, desk against side
  { x: -4 * S, z: 6.8 * S, r: 1.5 * S },      // bed
  { x: -6.5 * S, z: 6.8 * S, r: 0.5 * S },    // nightstand
  { x: -0.8 * S, z: 2.5 * S, r: 0.7 * S },    // desk
  { x: -2 * S, z: 2.5 * S, r: 0.5 * S },      // desk chair

  // BATHROOM
  { x: 3.5 * S, z: 0.8 * S, r: 0.5 * S },     // sink
  { x: 7 * S, z: 4 * S, r: 1.0 * S },          // shower
  { x: 1.2 * S, z: 7 * S, r: 0.5 * S },        // toilet
];

/**
 * Check if a position is clear of obstacles.
 */
export function isPositionClear(x: number, z: number, margin: number = 0.6): boolean {
  for (const obs of OBSTACLES) {
    const dx = x - obs.x;
    const dz = z - obs.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < obs.r + margin) return false;
  }
  return true;
}

/**
 * Find nearest clear position using spiral search.
 */
export function findClearPosition(x: number, z: number, margin: number = 1.0): [number, number] {
  if (isPositionClear(x, z, margin)) return [x, z];
  
  for (let radius = 0.5; radius <= 6; radius += 0.5) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const nx = x + Math.cos(angle) * radius;
      const nz = z + Math.sin(angle) * radius;
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
  const robotRadius = 0.8;
  for (const obs of OBSTACLES) {
    const dx = posX - obs.x;
    const dz = posZ - obs.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = obs.r + robotRadius;
    if (dist < minDist + lookAhead) {
      const toDirX = obs.x - posX;
      const toDirZ = obs.z - posZ;
      const dot = dirX * toDirX + dirZ * toDirZ;
      if (dot > 0 || dist < minDist) {
        const strength = dist < minDist ? 3.0 : 1.5 / Math.max(dist - minDist, 0.1);
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }
  const mag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (mag > 3.0) { forceX = (forceX / mag) * 3.0; forceZ = (forceZ / mag) * 3.0; }
  return [forceX, forceZ];
}
