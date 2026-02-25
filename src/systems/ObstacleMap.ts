// Obstacle map for furniture collision avoidance
// Each obstacle is defined as a circle (x, z, radius) for simplicity

export interface Obstacle {
  x: number;
  z: number;
  r: number; // avoidance radius
}

// Derived from FurnitureModels.tsx positions
// Using circular approximations with padding for avoidance
export const OBSTACLES: Obstacle[] = [
  // === LIVING ROOM ===
  // Sofa
  { x: -7, z: -6, r: 0.7 },
  // Coffee table
  { x: -5, z: -6, r: 0.5 },
  // Lounge chair
  { x: -5, z: -4, r: 0.5 },
  // TV stand
  { x: -3, z: -6, r: 0.5 },
  // Floor lamp
  { x: -7.3, z: -9.3, r: 0.3 },
  // Bookcase
  { x: -6, z: -9.3, r: 0.6 },
  // Side table
  { x: -7, z: -8, r: 0.3 },
  // Ottoman
  { x: -5, z: -7.5, r: 0.4 },
  // Speakers
  { x: -3, z: -4.5, r: 0.25 },
  { x: -3, z: -7.5, r: 0.25 },
  // Plants
  { x: -7.5, z: -3, r: 0.3 },
  { x: -0.5, z: -9.3, r: 0.3 },

  // === KITCHEN ===
  // Counter run (north wall - treated as wall-adjacent, less avoidance needed)
  { x: 1.5, z: -9.5, r: 0.4 },
  { x: 2.5, z: -9.5, r: 0.4 },
  { x: 3.5, z: -9.5, r: 0.4 },
  { x: 5.5, z: -9.5, r: 0.4 },
  { x: 6.5, z: -9.5, r: 0.4 },
  // Fridge
  { x: 7.3, z: -9.5, r: 0.5 },
  // Stove
  { x: 4.5, z: -9.5, r: 0.4 },
  // East wall cabinets
  { x: 7.5, z: -8, r: 0.4 },
  { x: 7.5, z: -7, r: 0.4 },
  // Kitchen island
  { x: 3, z: -6, r: 0.5 },
  { x: 4, z: -6, r: 0.5 },
  { x: 5, z: -6, r: 0.5 },
  // Bar stools
  { x: 3, z: -5, r: 0.3 },
  { x: 4, z: -5, r: 0.3 },
  { x: 5, z: -5, r: 0.3 },
  // Dining table
  { x: 1.5, z: -4.5, r: 0.6 },
  // Trashcan
  { x: 7.3, z: -5, r: 0.25 },

  // === LAUNDRY ===
  { x: 4.5, z: -1.5, r: 0.4 },
  { x: 5.5, z: -1.5, r: 0.4 },

  // === BEDROOM ===
  // Bed (large obstacle)
  { x: -4, z: 6.5, r: 1.2 },
  // Nightstands
  { x: -6, z: 6.5, r: 0.35 },
  { x: -2, z: 6.5, r: 0.35 },
  // Desk
  { x: -1.5, z: 1, r: 0.5 },
  // Desk chair
  { x: -2.5, z: 1, r: 0.4 },
  // Dresser/bookcase
  { x: -7.3, z: 3.5, r: 0.5 },
  // Bench
  { x: -4, z: 5, r: 0.5 },
  // Plants
  { x: -7.3, z: 7.3, r: 0.3 },
  { x: -0.5, z: 7.3, r: 0.3 },

  // === BATHROOM ===
  // Vanity
  { x: 2, z: 0.5, r: 0.4 },
  { x: 3, z: 0.5, r: 0.4 },
  { x: 4.5, z: 0.5, r: 0.4 },
  { x: 5.5, z: 0.5, r: 0.4 },
  // Bathtub
  { x: 5.5, z: 7, r: 0.8 },
  // Shower
  { x: 7, z: 3.5, r: 0.7 },
  // Toilet
  { x: 1, z: 7, r: 0.4 },
  // Trashcan
  { x: 1, z: 3.5, r: 0.25 },

  // === HALLWAY ===
  // Bench
  { x: -4, z: -1, r: 0.5 },
  // Plant
  { x: -7, z: -1, r: 0.3 },
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
      // Check if we're moving toward this obstacle
      const toDirX = obs.x - posX;
      const toDirZ = obs.z - posZ;
      const dot = dirX * toDirX + dirZ * toDirZ;

      if (dot > 0 || dist < minDist) {
        // We're heading toward it or already overlapping
        const strength = dist < minDist
          ? 2.0  // strong push if overlapping
          : 1.0 / Math.max(dist - minDist, 0.1);

        // Push away from obstacle
        const nx = dx / Math.max(dist, 0.01);
        const nz = dz / Math.max(dist, 0.01);
        forceX += nx * strength;
        forceZ += nz * strength;
      }
    }
  }

  // Clamp force magnitude
  const forceMag = Math.sqrt(forceX * forceX + forceZ * forceZ);
  if (forceMag > 2.0) {
    forceX = (forceX / forceMag) * 2.0;
    forceZ = (forceZ / forceMag) * 2.0;
  }

  return [forceX, forceZ];
}
