import mechanicsData from '../../data/wheel/mechanics.json';
import type { DomainAllocation, DomainProgress } from './types';

export const RING_POINT_COSTS: number[] = mechanicsData.domainRings.ringPointCostPerSlice;
export const RING_SLICE_COUNTS: number[] = mechanicsData.domainRings.slicesPerRing;
export const DOMAIN_MAX_POINTS: number = mechanicsData.domainRings.pointsToMaxDomain;
export const REVELATION_THRESHOLDS: number[] = mechanicsData.revelationPerks.stageThresholds;
export const POINTS_STARTING_LEVEL: number = mechanicsData.pointsPerLevel.startingLevel;
export const MAX_POINTS_OVERALL: number = mechanicsData.maxPointsOverall;

/** Raw mechanics data (dedication categories, generic conviction perks, gem atelier info) for direct display in the UI. */
export const WHEEL_MECHANICS = mechanicsData;

/**
 * Base promotion points available from level alone (1 point/level from
 * level 51+, premium). Does not include bonus points from Promotion
 * Scrolls, the Way of the Monk Quest, the Hunting Task Shop, or Mod
 * upgrades — those depend on content progress, not level, so they aren't
 * derivable here. See src/data/wheel/mechanics.json for the source note.
 */
export function pointsAvailableFromLevel(level: number): number {
  if (!Number.isFinite(level) || level < POINTS_STARTING_LEVEL) return 0;
  return Math.min(level - (POINTS_STARTING_LEVEL - 1), MAX_POINTS_OVERALL);
}

/**
 * Computes how a domain's allocated points break down: how many slices per
 * ring are filled (rings must be filled center-out, matching the game's
 * rule that a ring only opens up once the previous one is fully filled),
 * and which Revelation Perk stage that unlocks.
 */
export function computeDomainProgress(domainId: string, points: number): DomainProgress {
  const clampedPoints = Math.max(0, Math.min(points, DOMAIN_MAX_POINTS));

  const slicesFilledPerRing: number[] = [];
  let remaining = clampedPoints;
  let pointsBankedTowardNextSlice = 0;

  for (let ring = 0; ring < RING_POINT_COSTS.length; ring++) {
    const costPerSlice = RING_POINT_COSTS[ring];
    const maxSlices = RING_SLICE_COUNTS[ring];
    const filled = Math.min(maxSlices, Math.floor(remaining / costPerSlice));
    slicesFilledPerRing.push(filled);
    remaining -= filled * costPerSlice;

    if (filled < maxSlices) {
      pointsBankedTowardNextSlice = remaining;
      for (let r = ring + 1; r < RING_POINT_COSTS.length; r++) slicesFilledPerRing.push(0);
      break;
    }
  }

  const revelationStageUnlocked = REVELATION_THRESHOLDS.filter((threshold) => clampedPoints >= threshold)
    .length as 0 | 1 | 2 | 3;
  const nextThreshold = REVELATION_THRESHOLDS.find((threshold) => clampedPoints < threshold) ?? null;

  return {
    domainId,
    points: clampedPoints,
    slicesFilledPerRing,
    pointsBankedTowardNextSlice,
    revelationStageUnlocked,
    nextRevelationThreshold: nextThreshold,
    pointsToNextRevelationStage: nextThreshold === null ? null : nextThreshold - clampedPoints,
  };
}

export function totalAllocatedPoints(allocations: DomainAllocation[]): number {
  return allocations.reduce((sum, allocation) => sum + allocation.points, 0);
}

export interface AllocationValidation {
  ok: boolean;
  error?: string;
}

/** Checks that no domain exceeds the 1000-point cap and the total doesn't exceed the points available. */
export function validateAllocations(allocations: DomainAllocation[], pointsAvailable: number): AllocationValidation {
  for (const allocation of allocations) {
    if (allocation.points < 0 || allocation.points > DOMAIN_MAX_POINTS) {
      return { ok: false, error: `Cada domínio aceita entre 0 e ${DOMAIN_MAX_POINTS} pontos.` };
    }
  }

  const total = totalAllocatedPoints(allocations);
  if (total > pointsAvailable) {
    return { ok: false, error: `Distribuíste ${total} pontos, mas só tens ${pointsAvailable} disponíveis.` };
  }

  return { ok: true };
}
