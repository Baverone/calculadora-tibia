export const ROTATION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

/** Display timezone for all rotation dates — handles WEST/WET DST transitions automatically. */
export const TIBIADROME_TIMEZONE = 'Europe/Lisbon';

export interface RotationAnchor {
  /** The rotation number active at `startAt`. */
  number: number;
  /** ISO datetime with explicit UTC offset, e.g. "2026-07-03T10:00:00+01:00". */
  startAt: string;
}

export interface RotationState {
  number: number;
  startAt: number;
  endAt: number;
}

/**
 * Derives the currently active rotation purely from the one-time anchor and
 * the current time — no mutable state to keep in sync. Each rotation is
 * exactly ROTATION_DURATION_MS long and chains immediately from the one
 * before it, so the rotation number and window are just anchor + however
 * many full periods have elapsed since.
 */
export function computeRotationState(anchor: RotationAnchor, now: number): RotationState {
  const anchorStart = new Date(anchor.startAt).getTime();
  const periodsElapsed = Math.floor((now - anchorStart) / ROTATION_DURATION_MS);
  const startAt = anchorStart + periodsElapsed * ROTATION_DURATION_MS;
  const endAt = startAt + ROTATION_DURATION_MS;

  return { number: anchor.number + periodsElapsed, startAt, endAt };
}

/** Formats a non-negative duration as "Xd HH:MM:SS" (omits the day segment when zero). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((n) => n.toString().padStart(2, '0')).join(':');
  return days > 0 ? `${days}d ${clock}` : clock;
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  timeZone: TIBIADROME_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatRotationDate(epochMs: number): string {
  return dateFormatter.format(new Date(epochMs));
}
