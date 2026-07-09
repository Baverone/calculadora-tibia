import { STAMINA_BOOST_MULTIPLIER, STAMINA_MULTIPLIER } from './huntCalculator';
import { levelForExperience } from './experienceTable';
import type { DailySimulationResult, SimulationCheckpoint, SimulationGranularity } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Above this many days, switch from one row per day to one row per week. */
export const MAX_DAILY_ROWS_DAYS = 30;
/** Above this many days, switch from one row per week to one row per calendar month. */
export const MAX_WEEKLY_ROWS_DAYS = 210;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** Builds the ascending, deduplicated list of day-offsets to render as table rows. */
function buildOffsets(start: Date, daysSimulated: number): { granularity: SimulationGranularity; offsets: number[] } {
  if (daysSimulated <= MAX_DAILY_ROWS_DAYS) {
    const offsets = [];
    for (let d = 0; d <= daysSimulated; d++) offsets.push(d);
    return { granularity: 'daily', offsets };
  }

  if (daysSimulated <= MAX_WEEKLY_ROWS_DAYS) {
    const offsets = [];
    for (let d = 0; d < daysSimulated; d += 7) offsets.push(d);
    offsets.push(daysSimulated);
    return { granularity: 'weekly', offsets };
  }

  const offsets = [0];
  let cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const endExclusive = addDays(start, daysSimulated);
  while (cursor.getTime() < endExclusive.getTime()) {
    offsets.push(daysBetween(start, cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  offsets.push(daysSimulated);
  return { granularity: 'monthly', offsets };
}

/**
 * Simulates day-by-day experience gain from `fromDate` to `targetDate`,
 * assuming the same daily routine (hours with/without Boost) repeats every
 * day, and returns one checkpoint row per day/week/month depending on how
 * long the range is (kept to a reasonable number of rows). The final target
 * date is always included as the last checkpoint, whichever granularity is
 * used. Non-boosted hours use the stamina-only rate (150%), boosted hours
 * use stamina stacked with Boost (225%) — matching the rest of the hunt
 * calculator's bonus model.
 */
export function simulateExperienceByDate(
  currentExperience: number,
  rawExperiencePerHour: number,
  hoursWithBoostPerDay: number,
  hoursWithoutBoostPerDay: number,
  targetDate: Date,
  fromDate: Date = new Date()
): DailySimulationResult {
  if (!Number.isFinite(currentExperience) || currentExperience < 0) {
    throw new Error('currentExperience must be a non-negative number.');
  }
  if (!Number.isFinite(rawExperiencePerHour) || rawExperiencePerHour <= 0) {
    throw new Error('rawExperiencePerHour must be a positive number.');
  }

  const start = startOfDay(fromDate);
  const daysSimulated = Math.max(0, daysBetween(start, targetDate));

  const dailyExperience =
    hoursWithBoostPerDay * rawExperiencePerHour * STAMINA_BOOST_MULTIPLIER +
    hoursWithoutBoostPerDay * rawExperiencePerHour * STAMINA_MULTIPLIER;

  const { granularity, offsets } = buildOffsets(start, daysSimulated);
  const uniqueSortedOffsets = [...new Set(offsets)].sort((a, b) => a - b);

  const checkpoints: SimulationCheckpoint[] = uniqueSortedOffsets.map((daysSinceStart) => {
    const totalExperienceGained = dailyExperience * daysSinceStart;
    const finalExperience = currentExperience + totalExperienceGained;

    return {
      date: addDays(start, daysSinceStart),
      daysSinceStart,
      totalExperienceGained,
      finalExperience,
      level: levelForExperience(finalExperience),
    };
  });

  return { daysSimulated, granularity, checkpoints };
}
