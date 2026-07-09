import type { HistoryEntry } from './types';

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
