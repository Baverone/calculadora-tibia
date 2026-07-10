import { useEffect, useState } from 'react';
import { computeRashidState, type RashidState } from '../domain/rashid/rashidSchedule';

export function useRashidClock(): RashidState {
  const [state, setState] = useState(() => computeRashidState(Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setState(computeRashidState(Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
