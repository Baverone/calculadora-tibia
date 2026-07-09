import { experienceForLevel, levelForExperience } from './experienceTable';
import { STAMINA_BOOST_MULTIPLIER, STAMINA_MULTIPLIER } from './huntCalculator';
import type { LevelPlanStep } from './types';

/**
 * Builds a level-by-level plan from the character's current experience up to
 * (and including) a target level, one row per level gained. Each row shows
 * both bonus scenarios (Stamina 150%, Stamina + Boost 225%) side by side so
 * they can be compared directly. The first row accounts for however much
 * experience is already banked into the current level (mirrors the "XP em
 * falta" logic in levelProgress.ts).
 */
export function buildLevelPlan(
  currentExperience: number,
  targetLevel: number,
  rawExperiencePerHour: number
): LevelPlanStep[] {
  if (!Number.isFinite(currentExperience) || currentExperience < 0) {
    throw new Error('currentExperience must be a non-negative number.');
  }
  if (!Number.isFinite(rawExperiencePerHour) || rawExperiencePerHour <= 0) {
    throw new Error('rawExperiencePerHour must be a positive number.');
  }

  const currentLevel = levelForExperience(currentExperience);
  const steps: LevelPlanStep[] = [];
  let cumulativeHoursAtStamina = 0;
  let cumulativeHoursAtStaminaBoost = 0;

  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    const experienceAtStepStart = level === currentLevel + 1 ? currentExperience : experienceForLevel(level - 1);
    const experienceNeeded = experienceForLevel(level) - experienceAtStepStart;

    const hoursAtStamina = experienceNeeded / (rawExperiencePerHour * STAMINA_MULTIPLIER);
    const hoursAtStaminaBoost = experienceNeeded / (rawExperiencePerHour * STAMINA_BOOST_MULTIPLIER);
    cumulativeHoursAtStamina += hoursAtStamina;
    cumulativeHoursAtStaminaBoost += hoursAtStaminaBoost;

    steps.push({
      level,
      experienceNeeded,
      hoursAtStamina,
      cumulativeHoursAtStamina,
      hoursAtStaminaBoost,
      cumulativeHoursAtStaminaBoost,
    });
  }

  return steps;
}
