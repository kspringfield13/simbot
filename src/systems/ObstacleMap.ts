export interface Obstacle { x: number; z: number; r: number; }

const S = 2; // scale factor

export const OBSTACLES: Obstacle[] = [
  // LIVING ROOM
  { x: -7.2 * S, z: -6 * S, r: 1.0 * S },
  { x: -5.5 * S, z: -8 * S, r: 0.8 * S },
  { x: -5 * S, z: -6 * S, r: 0.6 * S },
  { x: -3.5 * S, z: -5 * S, r: 0.4 * S },
  { x: -3 * S, z: -8 * S, r: 0.5 * S },
  { x: -4.5 * S, z: -9.3 * S, r: 0.8 * S },
  { x: -7.5 * S, z: -9.3 * S, r: 0.3 * S },
  { x: -7.2 * S, z: -8.5 * S, r: 0.3 * S },
  { x: -7.5 * S, z: -2.8 * S, r: 0.7 * S },
  // KITCHEN
  { x: 0.8 * S, z: -9.4 * S, r: 0.5 * S },
  { x: 4 * S, z: -9.4 * S, r: 0.4 * S },
  { x: 6 * S, z: -9.4 * S, r: 0.4 * S },
  { x: 7.4 * S, z: -8.2 * S, r: 0.4 * S },
  { x: 3 * S, z: -6 * S, r: 0.5 * S },
  { x: 4.2 * S, z: -6 * S, r: 0.5 * S },
  { x: 5.4 * S, z: -6 * S, r: 0.5 * S },
  { x: 1.5 * S, z: -4 * S, r: 0.7 * S },
  // LAUNDRY
  { x: 4.5 * S, z: -1 * S, r: 0.5 * S },
  { x: 5.7 * S, z: -1 * S, r: 0.5 * S },
  // BEDROOM
  { x: -4 * S, z: 6.8 * S, r: 1.3 * S },
  { x: -6.5 * S, z: 6.8 * S, r: 0.4 * S },
  { x: -1.5 * S, z: 6.8 * S, r: 0.4 * S },
  { x: -0.8 * S, z: 2.5 * S, r: 0.6 * S },
  { x: -7.5 * S, z: 3.5 * S, r: 0.6 * S },
  { x: -4 * S, z: 5.2 * S, r: 0.5 * S },
  // BATHROOM
  { x: 3.2 * S, z: 0.8 * S, r: 0.4 * S },
  { x: 5 * S, z: 0.8 * S, r: 0.4 * S },
  { x: 5.5 * S, z: 7 * S, r: 0.9 * S },
  { x: 7 * S, z: 4 * S, r: 0.7 * S },
  { x: 1.2 * S, z: 7 * S, r: 0.4 * S },
  // HALLWAY
  { x: -5 * S, z: -1 * S, r: 0.5 * S },
  { x: -7.2 * S, z: -1 * S, r: 0.3 * S },
];

export function getAvoidanceForce(
  posX: number, posZ: number, dirX: number, dirZ: number, lookAhead: number = 1.5,
): [number, number] {
  let forceX = 0;
  let forceZ = 0;
  const robotRadius = 0.35;
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
        const strength = dist < minDist ? 2.5 : 1.2 / Math.max(dist - minDist, 0.1);
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }
  const mag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (mag > 2.5) { forceX = (forceX / mag) * 2.5; forceZ = (forceZ / mag) * 2.5; }
  return [forceX, forceZ];
}
