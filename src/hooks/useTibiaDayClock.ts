import { useEffect, useState } from 'react';
import { computeTibiaDayBoundary, type TibiaDayBoundary } from '../domain/tibiaDay';

export function useTibiaDayClock(): TibiaDayBoundary {
  const [state, setState] = useState(() => computeTibiaDayBoundary(Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setState(computeTibiaDayBoundary(Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
