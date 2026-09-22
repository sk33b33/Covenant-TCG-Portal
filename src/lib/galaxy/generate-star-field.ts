import type { GalaxyData } from "@/lib/galaxy/milky-way-data";

export type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  color: string;
};

export type ArmField = {
  name: string;
  color: string;
  isSolarHome: boolean;
  stars: Star[];
};

export type GalaxyStarField = {
  arms: ArmField[];
  core: Star[];
  halo: Star[];
  sun: { x: number; y: number; armName: string };
};

/** Deterministic PRNG (mulberry32) so the field is stable across re-renders/resizes. */
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform for a roughly Gaussian sample with the given standard deviation. */
function gaussian(rng: () => number, std: number) {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std;
}

const ARM_STAR_BUDGET = 3200;
const CORE_STAR_COUNT = 1400;
const HALO_STAR_COUNT = 900;
const REVOLUTIONS = 2.1;

/**
 * Builds a star field for the galaxy using the logarithmic spiral
 * `R = A * e^(B * theta)`, with a Gaussian profile across arm width and the
 * thickness (Z) axis. Coordinates are normalized to roughly [-1, 1] so callers
 * can scale freely to any canvas size.
 */
export function generateGalaxyStarField(data: GalaxyData, seed = 1337): GalaxyStarField {
  const rng = createRng(seed);
  const { radiusLightYears, coreRadius, thickness } = data.dimensions;

  const thetaMax = REVOLUTIONS * 2 * Math.PI;
  const startRadius = coreRadius * 0.35;
  const growthRate = Math.log(radiusLightYears / startRadius) / thetaMax;

  const radiusAt = (theta: number) => startRadius * Math.exp(growthRate * theta);

  const arms = data.majorArms.map((arm) => {
    const starCount = Math.round(ARM_STAR_BUDGET * arm.starDensity);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      // Sample radius with uniform density per unit area (R = Rmax * sqrt(u))
      // so stars populate the whole disk instead of piling up near the
      // core, then invert the spiral equation to find the matching angle.
      const baseRadius = startRadius + (radiusLightYears - startRadius) * Math.sqrt(rng());
      const theta = Math.log(baseRadius / startRadius) / growthRate;
      const angle = theta + arm.angleOffset;

      const centerX = Math.cos(angle) * baseRadius;
      const centerY = Math.sin(angle) * baseRadius;

      // Stars scatter around the spiral's centerline with a Gaussian
      // profile; the arm stays fairly narrow so the curve reads clearly.
      const armWidth = 0.045 * baseRadius + 250;
      const x = (centerX + gaussian(rng, armWidth)) / radiusLightYears;
      const y = (centerY + gaussian(rng, armWidth)) / radiusLightYears;
      const z = gaussian(rng, thickness / 2) / radiusLightYears;

      // Gentle brightness/size falloff toward the rim — arms should stay
      // legible across the whole disk instead of fading into the halo.
      const distanceFalloff = 1 - (baseRadius / radiusLightYears) * 0.5;
      const alpha = Math.min(1, Math.max(0.45, distanceFalloff * (0.85 + rng() * 0.3)));
      const size = 1.1 + rng() * 1.7 * distanceFalloff;

      stars.push({ x, y, z, size, alpha, color: arm.color });
    }

    return {
      name: arm.name,
      color: arm.color,
      isSolarHome: Boolean(arm.isSolarHome),
      stars,
    };
  });

  // Dense, bright galactic bulge at the core.
  const core: Star[] = [];
  for (let i = 0; i < CORE_STAR_COUNT; i++) {
    const angle = rng() * 2 * Math.PI;
    // Power-biased radius so stars cluster tightly toward the center.
    const radius = coreRadius * Math.pow(rng(), 1.8);
    const x = (Math.cos(angle) * radius) / radiusLightYears;
    const y = (Math.sin(angle) * radius) / radiusLightYears;
    const z = gaussian(rng, thickness) / radiusLightYears;
    const alpha = 0.55 + rng() * 0.45;
    const size = 0.6 + rng() * 1.4;
    const warmth = rng();
    const color = warmth > 0.5 ? "#fff4d6" : "#ffe9b3";
    core.push({ x, y, z, size, alpha, color });
  }

  // Sparse faint halo stars filling out the rest of the disk.
  const halo: Star[] = [];
  for (let i = 0; i < HALO_STAR_COUNT; i++) {
    const angle = rng() * 2 * Math.PI;
    const radius = Math.sqrt(rng()) * radiusLightYears * 1.05;
    const x = (Math.cos(angle) * radius) / radiusLightYears;
    const y = (Math.sin(angle) * radius) / radiusLightYears;
    const z = gaussian(rng, thickness) / radiusLightYears;
    const alpha = 0.1 + rng() * 0.25;
    const size = 0.4 + rng() * 0.8;
    halo.push({ x, y, z, size, alpha, color: "#e6ecff" });
  }

  // Place the Sun on its home spur at a realistic ~55% of the galactic radius.
  const solarArm = data.majorArms.find((arm) => arm.isSolarHome) ?? data.majorArms[0];
  const sunTheta = thetaMax * 0.62;
  const sunRadius = radiusAt(sunTheta);
  const sunAngle = sunTheta + solarArm.angleOffset;
  const sun = {
    x: (Math.cos(sunAngle) * sunRadius) / radiusLightYears,
    y: (Math.sin(sunAngle) * sunRadius) / radiusLightYears,
    armName: solarArm.name,
  };

  return { arms, core, halo, sun };
}
