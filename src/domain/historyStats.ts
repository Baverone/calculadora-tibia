import type { HistoryEntry } from './types';
import { levelForExperience } from './experienceTable';

export interface ExperienceGain {
  from: HistoryEntry;
  to: HistoryEntry;
  experienceGained: number;
  hoursElapsed: number;
  experiencePerHour: number;
}

/**
 * Turns a chronological list of XP readings into gain-per-interval stats.
 * Useful for "XP gained since last check" today, and feeds directly into a
 * future hunt-rate estimator (avg exp/h over the last N readings).
 */
export function computeExperienceGains(history: HistoryEntry[]): ExperienceGain[] {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const gains: ExperienceGain[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const from = sorted[i - 1];
    const to = sorted[i];
    const experienceGained = to.experience - from.experience;
    const hoursElapsed = (to.timestamp - from.timestamp) / (1000 * 60 * 60);
    const experiencePerHour = hoursElapsed > 0 ? experienceGained / hoursElapsed : 0;

    gains.push({ from, to, experienceGained, hoursElapsed, experiencePerHour });
  }

  return gains;
}

export interface DailyExperienceGain {
  /** Local midnight (ms) of the calendar day this gain is attributed to. */
  dayTimestamp: number;
  /** Cumulative XP at the end of this day (its last reading). */
  experience: number;
  /** XP gained versus the previous calendar day that has a reading. */
  experienceGained: number;
}

function localDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function localMidnight(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

interface DayReading {
  /** Local midnight (ms) of the calendar day. */
  dayTimestamp: number;
  /** Cumulative XP at the end of that day (its last reading). */
  experience: number;
}

/**
 * Collapses history to one cumulative-XP reading per calendar day — the last
 * reading of each day, so a day where a manual entry and the guildstats scrape
 * coexist counts once. Ascending by day.
 */
function collapseToDays(history: HistoryEntry[]): DayReading[] {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const byDay = new Map<string, DayReading>();
  for (const entry of sorted) {
    byDay.set(localDayKey(entry.timestamp), {
      dayTimestamp: localMidnight(entry.timestamp),
      experience: entry.experience,
    });
  }
  return [...byDay.values()].sort((a, b) => a.dayTimestamp - b.dayTimestamp);
}

/**
 * Day-over-day XP gained (the "XP feita por dia" series). The first day has no
 * previous day to compare against, so it is omitted (same convention as
 * computeExperienceGains). Gains can be negative (XP lost to deaths).
 */
export function computeDailyGains(history: HistoryEntry[]): DailyExperienceGain[] {
  const days = collapseToDays(history);
  const gains: DailyExperienceGain[] = [];
  for (let i = 1; i < days.length; i++) {
    gains.push({
      dayTimestamp: days[i].dayTimestamp,
      experience: days[i].experience,
      experienceGained: days[i].experience - days[i - 1].experience,
    });
  }
  return gains;
}

export interface DailyXpTrendPoint {
  /** Local midnight (ms) of the calendar day. */
  dayTimestamp: number;
  /** Level at that day's cumulative XP (lets a level line share this dataset). */
  level: number;
  /** XP gained that day (vs the previous calendar day with a reading). */
  dailyXp: number;
  /** Trailing 7-day average XP/day, or null before there's an earlier reading in the window. */
  avg7: number | null;
  /** Mean of the trailing 7/15/30-day averages (over whichever of them exist). */
  avgBlend: number | null;
}

/**
 * Per-day XP pace with smoothing lines for the "Nível & XP" chart: the raw
 * daily XP, a trailing 7-day average, and a "blended" average = the mean of
 * the trailing 7/15/30-day averages. Each trailing average is the net XP over
 * its window divided by the window's real span (same method as
 * computeRecentDailyRate), so gaps don't distort it; before a window is full
 * it just uses the span available. Omits the first day (no daily gain yet).
 */
export function computeDailyXpTrend(history: HistoryEntry[]): DailyXpTrendPoint[] {
  const days = collapseToDays(history);
  if (days.length < 2) return [];

  const msPerDay = 24 * 60 * 60 * 1000;

  /** Average XP/day over the last `windowDays` ending at day `i`, anchored to the earliest reading in that window. */
  const trailingAvg = (i: number, windowDays: number): number | null => {
    const windowStart = days[i].dayTimestamp - windowDays * msPerDay;
    let firstIdx = i;
    for (let j = 0; j <= i; j++) {
      if (days[j].dayTimestamp >= windowStart) {
        firstIdx = j;
        break;
      }
    }
    if (firstIdx >= i) return null;
    const spanDays = (days[i].dayTimestamp - days[firstIdx].dayTimestamp) / msPerDay;
    if (spanDays <= 0) return null;
    return (days[i].experience - days[firstIdx].experience) / spanDays;
  };

  const points: DailyXpTrendPoint[] = [];
  for (let i = 1; i < days.length; i++) {
    const avg7 = trailingAvg(i, 7);
    const avg15 = trailingAvg(i, 15);
    const avg30 = trailingAvg(i, 30);
    const known = [avg7, avg15, avg30].filter((v): v is number => v !== null);
    const avgBlend = known.length > 0 ? known.reduce((sum, v) => sum + v, 0) / known.length : null;
    points.push({
      dayTimestamp: days[i].dayTimestamp,
      level: levelForExperience(days[i].experience),
      dailyXp: days[i].experience - days[i - 1].experience,
      avg7,
      avgBlend,
    });
  }
  return points;
}
