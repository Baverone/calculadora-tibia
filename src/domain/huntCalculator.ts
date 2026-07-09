import { experienceForLevel } from './experienceTable';
import type { HuntBonusDefinition, HuntScenarioResult } from './types';

/**
 * The two bonus multipliers used everywhere in the hunt calculator: stamina
 * alone (150% total) and stamina stacked with an XP Boost (150% + 75% =
 * 225% total). Stamina is assumed to always be active while hunting — the
 * no-bonus (100%) case isn't modeled anywhere, only these two matter in
 * practice.
 */
export const STAMINA_MULTIPLIER = 1.5;
export const STAMINA_BOOST_MULTIPLIER = 2.25;

export const HUNT_BONUSES: HuntBonusDefinition[] = [
  { type: 'stamina', label: 'Stamina (150%)', multiplier: STAMINA_MULTIPLIER },
  { type: 'stamina-boost', label: 'Stamina + Boost (225%)', multiplier: STAMINA_BOOST_MULTIPLIER },
];

/**
 * Builds time-to-level estimates for each bonus scenario, given the
 * character's current total experience, the hunt's raw (unbuffed) exp/h,
 * and a list of user-chosen target levels (absolute, not relative to the
 * current level).
 *
 * Note: the boost scenario intentionally assumes the *entire* hunt is done
 * at the boosted rate, purely to answer "what if this whole session had the
 * boost active?" — it does not simulate the boost expiring after 1h.
 */
export function calculateHuntScenarios(
  currentExperience: number,
  rawExperiencePerHour: number,
  goalLevels: number[]
): HuntScenarioResult[] {
  if (!Number.isFinite(currentExperience) || currentExperience < 0) {
    throw new Error('currentExperience must be a non-negative number.');
  }
  if (!Number.isFinite(rawExperiencePerHour) || rawExperiencePerHour <= 0) {
    throw new Error('rawExperiencePerHour must be a positive number.');
  }

  const sortedGoals = [...new Set(goalLevels)].sort((a, b) => a - b);

  return HUNT_BONUSES.map((bonus) => {
    const effectiveExperiencePerHour = rawExperiencePerHour * bonus.multiplier;

    const milestones = sortedGoals.map((targetLevel) => {
      const rawExperienceNeeded = experienceForLevel(targetLevel) - currentExperience;
      const alreadyReached = rawExperienceNeeded <= 0;
      const experienceNeeded = Math.max(0, rawExperienceNeeded);
      const hoursNeeded = alreadyReached ? 0 : experienceNeeded / effectiveExperiencePerHour;

      return { targetLevel, experienceNeeded, hoursNeeded, alreadyReached };
    });

    return { bonus, effectiveExperiencePerHour, milestones };
  });
}

/** Formats a fractional hour count as "Xh Ym", used across the hunt UI. */
export function formatHoursAndMinutes(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return '—';

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) return `${minutes}m`;
  return `${wholeHours}h ${minutes}m`;
}
