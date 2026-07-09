import type { CharacterId } from '../types';

export interface RevelationStage {
  stage: 1 | 2 | 3;
  pointsRequired: number;
  effect: string;
  confidence?: string;
}

export interface RevelationPerk {
  name: string;
  description: string;
  confidence?: string;
  stages: RevelationStage[];
}

export interface WheelDomain {
  id: string;
  revelationPerk: RevelationPerk;
}

export interface ConvictionPerk {
  name: string;
  description: string;
  confidence?: string;
}

export interface Augmentation {
  name: string;
  stage1: string;
  stage2: string;
}

export interface VocationWheelData {
  vocationId: CharacterId;
  vocationName: string;
  verifiedAt: string;
  sourceNote: string;
  domains: WheelDomain[];
  vocationConvictionPerks: ConvictionPerk[];
  augmentations: {
    confidence: string;
    abilities: Augmentation[];
  };
}

/** Points a user has manually allocated to one domain (0-1000). */
export interface DomainAllocation {
  domainId: string;
  points: number;
}

export interface DomainProgress {
  domainId: string;
  points: number;
  /** How many of each ring's slices (ring 1 = innermost) are fully filled. */
  slicesFilledPerRing: number[];
  /** Points already banked toward the next not-yet-filled slice in the current ring. */
  pointsBankedTowardNextSlice: number;
  revelationStageUnlocked: 0 | 1 | 2 | 3;
  nextRevelationThreshold: number | null;
  pointsToNextRevelationStage: number | null;
}

/** A saved Wheel of Destiny build for a character, persisted in localStorage. */
export interface WheelBuild {
  id: string;
  name: string;
  goal: string;
  allocations: DomainAllocation[];
  reasoning?: string;
  source: 'manual' | 'ai';
  createdAt: number;
}
