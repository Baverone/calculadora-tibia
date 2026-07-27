import { experienceForLevel, levelForExperience } from './experienceTable';
import { STAMINA_BOOST_MULTIPLIER, STAMINA_MULTIPLIER } from './huntCalculator';
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

/**
 * Converts a hunt's raw (unbuffed) exp/h into the XP/day that daily routine
 * would produce, so a respawn can be compared against the real 7-day pace on
 * the same axis (dates). Uses the same bonus model as the rest of the hunt
 * calculator: boosted hours at 225%, the remaining hours at stamina's 150%.
 */
export function dailyXpFromHunt(
  rawExperiencePerHour: number,
  hoursWithBoostPerDay: number,
  hoursWithoutBoostPerDay: number
): number {
  return (
    hoursWithBoostPerDay * rawExperiencePerHour * STAMINA_BOOST_MULTIPLIER +
    hoursWithoutBoostPerDay * rawExperiencePerHour * STAMINA_MULTIPLIER
  );
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

/** Look-back windows (in days) used by the per-Monday level forecast. */
export const WEEKLY_FORECAST_WINDOWS = [7, 15, 30] as const;

/**
 * Every Monday from the next one (or today, if today is already a Monday)
 * through Dec 31 of the current year — the horizon of the weekly level
 * forecast. Uses local calendar days so "Monday" matches the user's week.
 */
export function upcomingMondayDates(from: Date = new Date()): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const daysUntilMonday = (8 - start.getDay()) % 7; // 0 when `start` is already a Monday
  const yearEnd = new Date(from.getFullYear(), 11, 31);

  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + daysUntilMonday);

  const mondays: Date[] = [];
  while (cursor.getTime() <= yearEnd.getTime()) {
    mondays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return mondays;
}

/**
 * Projects the level (and the underlying XP) reached on `target` if
 * `averageDailyXp` holds from `from`. Returns null for a flat/negative rate —
 * there's no meaningful upward forecast then. XP is floored at 0 so a stale
 * negative rate can't underflow.
 */
export function projectedLevelAt(
  currentExperience: number,
  averageDailyXp: number,
  target: Date,
  from: Date = new Date()
): { level: number; experience: number } | null {
  if (!Number.isFinite(averageDailyXp) || averageDailyXp <= 0) return null;
  const days = (target.getTime() - from.getTime()) / MS_PER_DAY;
  const experience = Math.max(0, currentExperience + averageDailyXp * days);
  return { level: levelForExperience(experience), experience };
}
