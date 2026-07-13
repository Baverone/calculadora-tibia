import { experienceForLevel, levelForExperience } from '../experienceTable';
import type { ExpRecord } from './types';

function toUtcNoonMs(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getTime();
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDateKey: string, toDateKey: string): number {
  return Math.round((toUtcNoonMs(toDateKey) - toUtcNoonMs(fromDateKey)) / (24 * 60 * 60 * 1000));
}

export function recordsForPlayer(records: ExpRecord[], playerId: string): ExpRecord[] {
  return records.filter((r) => r.playerId === playerId).sort((a, b) => a.date.localeCompare(b.date));
}

export function latestRecord(records: ExpRecord[], playerId: string): ExpRecord | null {
  const sorted = recordsForPlayer(records, playerId);
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

export interface BaselineResult {
  record: ExpRecord;
  wasExact: boolean;
}

/** The record at exactly `baselineDate`, or the nearest later one if there isn't one (flags which happened). */
export function findBaselineRecord(records: ExpRecord[], playerId: string, baselineDate: string): BaselineResult | null {
  const sorted = recordsForPlayer(records, playerId);
  const exact = sorted.find((r) => r.date === baselineDate);
  if (exact) return { record: exact, wasExact: true };
  const later = sorted.find((r) => r.date > baselineDate);
  return later ? { record: later, wasExact: false } : null;
}

export interface PlayerPeriodStats {
  playerId: string;
  currentExp: number;
  currentDate: string;
  currentLevel: number;
  /** 0-100, progress towards currentLevel + 1 */
  progressPercent: number;
  baselineExp: number;
  baselineDate: string;
  baselineWasExact: boolean;
  daysElapsed: number;
  expGained: number;
  avgPerDay: number;
}

export type PlayerStatsResult =
  | { ok: true; stats: PlayerPeriodStats }
  | { ok: false; reason: 'no-records' | 'no-baseline' };

export function computePlayerPeriodStats(records: ExpRecord[], playerId: string, baselineDate: string): PlayerStatsResult {
  const latest = latestRecord(records, playerId);
  if (!latest) return { ok: false, reason: 'no-records' };

  const baseline = findBaselineRecord(records, playerId, baselineDate);
  if (!baseline) return { ok: false, reason: 'no-baseline' };

  const currentLevel = levelForExperience(latest.exp);
  const thisLevelExp = experienceForLevel(currentLevel);
  const nextLevelExp = experienceForLevel(currentLevel + 1);
  const progressPercent =
    nextLevelExp > thisLevelExp
      ? Math.min(100, Math.max(0, ((latest.exp - thisLevelExp) / (nextLevelExp - thisLevelExp)) * 100))
      : 100;

  const daysElapsed = daysBetween(baseline.record.date, latest.date);
  const expGained = latest.exp - baseline.record.exp;
  // Baseline lands on (or after) the latest record — no meaningful daily rate to compute.
  const avgPerDay = daysElapsed > 0 ? expGained / daysElapsed : 0;

  return {
    ok: true,
    stats: {
      playerId,
      currentExp: latest.exp,
      currentDate: latest.date,
      currentLevel,
      progressPercent,
      baselineExp: baseline.record.exp,
      baselineDate: baseline.record.date,
      baselineWasExact: baseline.wasExact,
      daysElapsed,
      expGained,
      avgPerDay,
    },
  };
}

/** Days until currentLevel + 1 at the given avg EXP/day. null when the rate is 0 or negative (never reaches it). */
export function daysToNextLevel(currentExp: number, currentLevel: number, avgPerDay: number): number | null {
  if (avgPerDay <= 0) return null;
  const remaining = experienceForLevel(currentLevel + 1) - currentExp;
  return remaining <= 0 ? 0 : Math.ceil(remaining / avgPerDay);
}

/** Every Monday from the next one (or today, if today is already a Monday) through Dec 31 of that year. */
export function upcomingMondays(fromDateKey: string): string[] {
  const from = new Date(`${fromDateKey}T12:00:00Z`);
  const yearEnd = new Date(Date.UTC(from.getUTCFullYear(), 11, 31, 12));

  const dayOfWeek = from.getUTCDay(); // 0=Sun..6=Sat
  const daysUntilMonday = (8 - dayOfWeek) % 7; // 0 if `from` is already a Monday
  const cursor = new Date(from.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);

  const mondays: string[] = [];
  while (cursor.getTime() <= yearEnd.getTime()) {
    mondays.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return mondays;
}

export interface ProjectionPoint {
  date: string;
  projectedExp: number;
  projectedLevel: number;
  /** true if projectedLevel is higher than the previous point's (or the current level, for the first point). */
  leveledUp: boolean;
}

/** Projects EXP/level forward at a constant avgPerDay rate. EXP is clamped at 0 (a sustained negative rate can't go below it). */
export function projectPlayerLevels(
  currentExp: number,
  currentDate: string,
  currentLevel: number,
  avgPerDay: number,
  mondays: string[]
): ProjectionPoint[] {
  let previousLevel = currentLevel;
  return mondays.map((date) => {
    const days = daysBetween(currentDate, date);
    const projectedExp = Math.max(0, currentExp + avgPerDay * days);
    const projectedLevel = levelForExperience(projectedExp);
    const leveledUp = projectedLevel > previousLevel;
    previousLevel = projectedLevel;
    return { date, projectedExp, projectedLevel, leveledUp };
  });
}
