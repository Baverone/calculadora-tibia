import { useCallback, useEffect, useState } from 'react';
import { fetchCelestaHunts } from '../storage/celestaHunts';
import type { CelestaHuntsData } from '../domain/celestaHunts';

export type HuntsStatus = 'loading' | 'ready' | 'empty';

export function useCelestaHunts() {
  const [data, setData] = useState<CelestaHuntsData | null>(null);
  const [status, setStatus] = useState<HuntsStatus>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchCelestaHunts().then((result) => {
      if (cancelled) return;
      setData(result);
      setStatus(result ? 'ready' : 'empty');
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { data, status, reload };
}
