// Obstacle map for furniture collision avoidance
// Each obstacle is defined as a circle (x, z, radius) for simplicity
// Updated to match FurnitureModels.tsx positions (human-scale, 2.0x Kenney)

export interface Obstacle {
  x: number;
  z: number;
  r: number; // avoidance radius
}

export const OBSTACLES: Obstacle[] = [
  // === LIVING ROOM (x: -8 to 0, z: -10 to -2) ===
  { x: -7.2, z: -6, r: 1.0 },    // Sofa-long (west wall)
  { x: -5.5, z: -8, r: 0.8 },    // Sofa-corner
  { x: -5, z: -6, r: 0.6 },      // Coffee table
  { x: -3.5, z: -5, r: 0.4 },    // Ottoman
  { x: -3, z: -8, r: 0.5 },      // Lounge chair
  { x: -4.5, z: -9.3, r: 0.8 },  // TV stand + TV
  { x: -6.5, z: -9.3, r: 0.3 },  // Speaker L
  { x: -2.5, z: -9.3, r: 0.3 },  // Speaker R
  { x: -7.5, z: -9.3, r: 0.3 },  // Floor lamp
  { x: -7.2, z: -8.5, r: 0.3 },  // Side table
  { x: -7.5, z: -2.8, r: 0.7 },  // Bookcase
  { x: -0.5, z: -9.3, r: 0.3 },  // Plant
  { x: -7.5, z: -3.8, r: 0.3 },  // Plant

  // === KITCHEN (x: 0 to 8, z: -10 to -2) ===
  { x: 0.8, z: -9.4, r: 0.5 },   // Fridge
  { x: 2, z: -9.4, r: 0.4 },     // Cabinet
  { x: 3, z: -9.4, r: 0.4 },     // Cabinet-drawer
  { x: 4, z: -9.4, r: 0.4 },     // Stove
  { x: 5, z: -9.4, r: 0.4 },     // Cabinet
  { x: 6, z: -9.4, r: 0.4 },     // Sink
  { x: 7, z: -9.4, r: 0.4 },     // Cabinet-drawer
  { x: 7.4, z: -8.2, r: 0.4 },   // East wall cabinet
  { x: 7.4, z: -9, r: 0.4 },     // Corner cabinet
  { x: 3, z: -6, r: 0.5 },       // Island L
  { x: 4.2, z: -6, r: 0.5 },     // Island mid
  { x: 5.4, z: -6, r: 0.5 },     // Island R
  { x: 3, z: -5, r: 0.3 },       // Bar stool
  { x: 4.2, z: -5, r: 0.3 },     // Bar stool
  { x: 5.4, z: -5, r: 0.3 },     // Bar stool
  { x: 1.5, z: -4, r: 0.7 },     // Dining table + chairs
  { x: 7.4, z: -5.5, r: 0.25 },  // Trashcan
  { x: 7.4, z: -2.8, r: 0.3 },   // Plant

  // === LAUNDRY (x: 3.5 to 6.5, z: -2 to 0) ===
  { x: 4.5, z: -1, r: 0.5 },     // Washer
  { x: 5.7, z: -1, r: 0.5 },     // Dryer

  // === BEDROOM (x: -8 to 0, z: 0 to 8) ===
  { x: -4, z: 6.8, r: 1.3 },     // Bed (large)
  { x: -6.5, z: 6.8, r: 0.4 },   // Nightstand L
  { x: -1.5, z: 6.8, r: 0.4 },   // Nightstand R
  { x: -0.8, z: 2.5, r: 0.6 },   // Desk
  { x: -2, z: 2.5, r: 0.4 },     // Desk chair
  { x: -7.5, z: 3.5, r: 0.6 },   // Dresser/bookcase
  { x: -4, z: 5.2, r: 0.5 },     // Bench
  { x: -7.5, z: 7.5, r: 0.3 },   // Plant
  { x: -0.5, z: 7.5, r: 0.3 },   // Plant

  // === BATHROOM (x: 0 to 8, z: 0 to 8) ===
  { x: 2, z: 0.8, r: 0.4 },      // Bath cabinet
  { x: 3.2, z: 0.8, r: 0.4 },    // Sink L
  { x: 5, z: 0.8, r: 0.4 },      // Sink R
  { x: 6.2, z: 0.8, r: 0.4 },    // Bath cabinet
  { x: 5.5, z: 7, r: 0.9 },      // Bathtub
  { x: 7, z: 4, r: 0.7 },        // Shower
  { x: 1.2, z: 7, r: 0.4 },      // Toilet
  { x: 0.8, z: 3.5, r: 0.25 },   // Trashcan

  // === HALLWAY (x: -8 to 3.5, z: -2 to 0) ===
  { x: -5, z: -1, r: 0.5 },      // Bench
  { x: -7.2, z: -1, r: 0.3 },    // Plant
];

/**
 * Calculate avoidance steering force given current position and movement direction.
 * Returns [dx, dz] force to add to movement, or [0, 0] if no obstacles nearby.
 */
export function getAvoidanceForce(
  posX: number,
  posZ: number,
  dirX: number,
  dirZ: number,
  lookAhead: number = 1.0,
): [number, number] {
  let forceX = 0;
  let forceZ = 0;
  const robotRadius = 0.25;

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
        const strength = dist < minDist
          ? 2.5  // strong push if overlapping
          : 1.2 / Math.max(dist - minDist, 0.1);

        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }

  const forceMag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (forceMag > 2.5) {
    forceX = (forceX / forceMag) * 2.5;
    forceZ = (forceZ / forceMag) * 2.5;
  }

  return [forceX, forceZ];
}
