import { useEffect, useState } from 'react';
import { computeRotationState, type RotationAnchor, type RotationState } from '../domain/tibiadrome/rotation';

export function useRotationClock(anchor: RotationAnchor): RotationState {
  const [state, setState] = useState(() => computeRotationState(anchor, Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setState(computeRotationState(anchor, Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [anchor]);

  return state;
}
