import { useEffect, useState } from 'react';
import { fetchMiniWorldChangesHistory, type MiniWorldChangesRecord } from '../storage/miniWorldChangesHistory';

export function useMiniWorldChangesHistory() {
  const [history, setHistory] = useState<MiniWorldChangesRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchMiniWorldChangesHistory().then((records) => {
      if (!cancelled) setHistory(records);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return history;
}
