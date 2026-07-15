import { experienceForLevel, levelForExperience } from './experienceTable';
import type { HistoryEntry } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Default window (in days) used to estimate the recent XP rate. */
export const FORECAST_WINDOW_DAYS = 7;

export interface RecentXpRate {
  /** Average XP gained per day across the window. Can be negative (net XP loss from deaths). */
  averageDailyXp: number;
  /** Net XP gained across the window (last reading − first reading in the window). */
  totalXpGained: number;
  /** Actual span, in days, between the first and last reading used. */
  daysCovered: number;
  /** How many history readings fell inside the window. */
  readingsUsed: number;
  firstEntry: HistoryEntry;
  lastEntry: HistoryEntry;
}

/**
 * Average daily XP over the last `windowDays` days, derived from the stored
 * history (daily scrapes + manual entries) instead of a hand-typed exp/h.
 *
 * The window is anchored to the most recent reading (not "now"), so a couple
 * of stale days without a scrape don't shrink the estimate. Returns null when
 * there aren't at least two readings spanning a positive amount of time in the
 * window — there's nothing to extrapolate from in that case.
 */
export function computeRecentDailyRate(
  history: HistoryEntry[],
  windowDays: number = FORECAST_WINDOW_DAYS
): RecentXpRate | null {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const last = sorted[sorted.length - 1];
  const windowStart = last.timestamp - windowDays * MS_PER_DAY;
  const inWindow = sorted.filter((entry) => entry.timestamp >= windowStart);

  if (inWindow.length < 2) return null;

  const first = inWindow[0];
  const spanMs = last.timestamp - first.timestamp;
  if (spanMs <= 0) return null;

  const daysCovered = spanMs / MS_PER_DAY;
  const totalXpGained = last.experience - first.experience;

  return {
    averageDailyXp: totalXpGained / daysCovered,
    totalXpGained,
    daysCovered,
    readingsUsed: inWindow.length,
    firstEntry: first,
    lastEntry: last,
  };
}

export interface LevelForecast {
  level: number;
  /** XP still missing to reach this level, from the current experience. */
  experienceNeeded: number;
  /** Cumulative days from `from` to reach this level at the given daily rate. */
  daysToReach: number;
  estimatedDate: Date;
}

/**
 * Projects the estimated date to reach each of the next `count` levels,
 * assuming the given average daily XP keeps up. Requires a positive rate —
 * returns an empty list otherwise (no meaningful projection from a flat or
 * negative trend).
 */
export function forecastNextLevels(
  currentExperience: number,
  averageDailyXp: number,
  count: number = 10,
  from: Date = new Date()
): LevelForecast[] {
  if (!Number.isFinite(averageDailyXp) || averageDailyXp <= 0) return [];

  const currentLevel = levelForExperience(currentExperience);
  const forecasts: LevelForecast[] = [];

  for (let i = 1; i <= count; i++) {
    const level = currentLevel + i;
    const experienceNeeded = experienceForLevel(level) - currentExperience;
    const daysToReach = experienceNeeded / averageDailyXp;

    forecasts.push({
      level,
      experienceNeeded,
      daysToReach,
      estimatedDate: new Date(from.getTime() + daysToReach * MS_PER_DAY),
    });
  }

  return forecasts;
}
