import { useEffect, useRef, useState } from 'react';

const FINISHED_DISPLAY_MS = 3000;
const TICK_MS = 100;

export interface CountdownTimer {
  remainingMs: number;
  isRunning: boolean;
  justFinished: boolean;
  start: () => void;
  toggle: () => void;
  reset: () => void;
}

/**
 * A countdown timer that survives tab backgrounding without drifting (it
 * tracks a target end timestamp rather than counting ticks). On reaching
 * zero it fires onFinish, holds a "justFinished" flag for a few seconds so
 * the UI can show a finished state, then auto-resets and resumes counting
 * down on its own — timers here run in a continuous loop, not one-shot.
 */
export function useCountdownTimer(durationSeconds: number, onFinish: () => void): CountdownTimer {
  const durationMs = durationSeconds * 1000;
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = endTimeRef.current - Date.now();
      if (remaining <= 0) {
        clearInterval(id);
        setRemainingMs(0);
        setIsRunning(false);
        setJustFinished(true);
        onFinishRef.current();
      } else {
        setRemainingMs(remaining);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (!justFinished) return;
    const id = setTimeout(() => {
      setJustFinished(false);
      setRemainingMs(durationMs);
      endTimeRef.current = Date.now() + durationMs;
      setIsRunning(true);
    }, FINISHED_DISPLAY_MS);
    return () => clearTimeout(id);
  }, [justFinished, durationMs]);

  function start() {
    if (justFinished) return;
    endTimeRef.current = Date.now() + remainingMs;
    setIsRunning(true);
  }

  function toggle() {
    if (isRunning) {
      setIsRunning(false);
    } else {
      start();
    }
  }

  function reset() {
    setIsRunning(false);
    setJustFinished(false);
    setRemainingMs(durationMs);
    endTimeRef.current = null;
  }

  return { remainingMs, isRunning, justFinished, start, toggle, reset };
}
