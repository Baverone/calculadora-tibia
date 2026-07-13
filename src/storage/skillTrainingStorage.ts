import type { CharacterId } from '../domain/types';
import type { TrainableSkill, Vocation } from '../domain/skillTraining';

// Persists the Skill Training Calculator's inputs per character, so the
// vocation choice and per-skill level/% draft survive reloads and tab
// switches (this panel is always mounted, never unmounted, like the rest
// of the app).

export interface SkillEntryInput {
  level: string;
  percent: string;
}

export interface SkillTrainingConfig {
  vocation: Vocation | null;
  knightWeapons: ('axe' | 'sword' | 'club')[];
  skills: Partial<Record<TrainableSkill, SkillEntryInput>>;
  specialDummy: boolean;
  /** Account's Loyalty bonus (0, 5, 10, ... 50), since it inflates the displayed skill level. */
  loyaltyBonusPercent: number;
}

const STORAGE_PREFIX = 'tibia-xp-calc:skill-training:';

const DEFAULT_CONFIG: SkillTrainingConfig = {
  vocation: null,
  knightWeapons: [],
  skills: {},
  specialDummy: false,
  loyaltyBonusPercent: 0,
};

function storageKey(characterId: CharacterId): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function getSkillTrainingConfig(characterId: CharacterId): SkillTrainingConfig {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveSkillTrainingConfig(characterId: CharacterId, config: SkillTrainingConfig): SkillTrainingConfig {
  localStorage.setItem(storageKey(characterId), JSON.stringify(config));
  return config;
}
