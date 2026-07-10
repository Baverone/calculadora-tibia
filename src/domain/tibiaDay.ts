const LISBON_TIMEZONE = 'Europe/Lisbon';

/** The Tibia server save happens at 09:00 Lisbon time — the "Tibia day" only advances after this, not at midnight. */
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

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export interface TibiaDayBoundary {
  /** Lisbon calendar date the current "Tibia day" corresponds to, as YYYY-MM-DD. */
  dateKey: string;
  /** 0 = Sunday ... 6 = Saturday, matching JS Date.getDay() convention. */
  weekdayIndex: number;
  /** Epoch ms of the next 09:00 Lisbon server save, when the Tibia day advances. */
  nextChangeAt: number;
}

/**
 * Before 09:00 Lisbon time, the "Tibia day" is still yesterday's — used by
 * both the Rashid Tracker (weekly schedule lookup) and the Mini World
 * Changes Tracker (daily history key), so both agree on what "today" means
 * without duplicating the DST-aware Lisbon time math.
 */
export function computeTibiaDayBoundary(now: number): TibiaDayBoundary {
  const wallClock = toLisbonWallClock(new Date(now));
  const hasPassedServerSave = wallClock.getUTCHours() >= SERVER_SAVE_HOUR;

  const tibiaDate = new Date(wallClock.getTime());
  if (!hasPassedServerSave) {
    tibiaDate.setUTCDate(tibiaDate.getUTCDate() - 1);
  }
  const dateKey = `${tibiaDate.getUTCFullYear()}-${pad2(tibiaDate.getUTCMonth() + 1)}-${pad2(tibiaDate.getUTCDate())}`;
  const weekdayIndex = tibiaDate.getUTCDay();

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

  return { dateKey, weekdayIndex, nextChangeAt };
}
