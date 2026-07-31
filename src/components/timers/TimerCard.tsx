import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { announce, playBeep } from '../../domain/timers/alerts';

export interface TimerAlert {
  /** Fires once, the first time remaining time drops to this many seconds or below. */
  atSeconds: number;
  message: string;
}

interface TimerCardProps {
  name: string;
  durationSeconds: number;
  color: string;
  /** Voice announcements at specific points during the countdown (e.g. "1 minute left"). Optional. */
  alerts?: TimerAlert[];
  /** Spoken when the timer hits zero — defaults to "{name} terminado". */
  finishMessage?: string;
}

export interface TimerCardHandle {
  start: () => void;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const TimerCard = forwardRef<TimerCardHandle, TimerCardProps>(function TimerCard(
  { name, durationSeconds, color, alerts, finishMessage },
  ref
) {
  const timer = useCountdownTimer(durationSeconds, () => {
    playBeep();
    announce(finishMessage ?? `${name} terminado`);
  });

  useImperativeHandle(ref, () => ({ start: timer.start }));

  // Mid-countdown voice alerts (e.g. "1 minute left"). Each one fires at most
  // once per cycle — the fired set is cleared whenever a new cycle starts.
  const firedAlertsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (timer.isRunning) firedAlertsRef.current.clear();
  }, [timer.isRunning]);

  useEffect(() => {
    if (!alerts || !timer.isRunning) return;
    for (const alert of alerts) {
      if (timer.remainingMs <= alert.atSeconds * 1000 && !firedAlertsRef.current.has(alert.atSeconds)) {
        firedAlertsRef.current.add(alert.atSeconds);
        announce(alert.message);
      }
    }
  }, [timer.remainingMs, timer.isRunning, alerts]);

  const progress = timer.remainingMs / (durationSeconds * 1000);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-card">
      <div className="timer-card__ring-wrap">
        <svg viewBox="0 0 120 120" className="timer-card__ring">
          <circle cx={60} cy={60} r={RADIUS} className="timer-card__ring-track" />
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            stroke={color}
            className="timer-card__ring-progress"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-card__center">
          {timer.justFinished ? (
            <span className="timer-card__finished">Terminado!</span>
          ) : (
            <span className="timer-card__time">{formatClock(timer.remainingMs)}</span>
          )}
        </div>
      </div>
      <h4 style={{ color }}>{name}</h4>
      <div className="timer-card__actions">
        <button type="button" style={{ borderColor: color, color }} onClick={timer.toggle} disabled={timer.justFinished}>
          {timer.isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button type="button" className="timer-card__reset" onClick={timer.reset}>
          Reiniciar
        </button>
      </div>
    </div>
  );
});
