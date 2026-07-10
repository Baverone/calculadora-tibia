import { RASHID_WEEKLY_SCHEDULE, type RashidLocation } from '../../data/rashid/schedule';

const LISBON_TIMEZONE = 'Europe/Lisbon';

/** The Tibia server save happens at 09:00 Lisbon time — the "Tibia day" (and Rashid's location) only advances after this. */
export const SERVER_SAVE_HOUR = 9;

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LISBON_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** How far ahead of UTC Lisbon's wall clock reads at this instant (0 for WET, 1h for WEST) — auto-adjusts for DST. */
function getLisbonOffsetMs(date: Date): number {
  const parts = offsetFormatter.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - date.getTime();
}

/** A Date whose UTC getters (getUTCDay, getUTCHours, ...) read as Lisbon's local wall-clock time. */
function toLisbonWallClock(date: Date): Date {
  return new Date(date.getTime() + getLisbonOffsetMs(date));
}

export interface RashidState {
  /** 0 = Sunday ... 6 = Saturday, matching RASHID_WEEKLY_SCHEDULE's indexing. */
  tibiaDayIndex: number;
  location: RashidLocation;
  /** Epoch ms of the next 09:00 Lisbon server save, when Rashid moves on. */
  nextChangeAt: number;
}

/**
 * Before 09:00 Lisbon time, the "Tibia day" is still yesterday's — Rashid
 * hasn't moved to today's city yet. From 09:00 onward it's today's.
 */
export function computeRashidState(now: number): RashidState {
  const wallClock = toLisbonWallClock(new Date(now));
  const hasPassedServerSave = wallClock.getUTCHours() >= SERVER_SAVE_HOUR;
  const wallClockDayIndex = wallClock.getUTCDay();
  const tibiaDayIndex = hasPassedServerSave ? wallClockDayIndex : (wallClockDayIndex + 6) % 7;

  let nextChangeWallClockMs = Date.UTC(
    wallClock.getUTCFullYear(),
    wallClock.getUTCMonth(),
    wallClock.getUTCDate(),
    SERVER_SAVE_HOUR,
    0,
    0
  );
  if (wallClock.getTime() >= nextChangeWallClockMs) {
    nextChangeWallClockMs += 24 * 60 * 60 * 1000;
  }
  const nextChangeAt = nextChangeWallClockMs - getLisbonOffsetMs(new Date(now));

  return { tibiaDayIndex, location: RASHID_WEEKLY_SCHEDULE[tibiaDayIndex], nextChangeAt };
}
