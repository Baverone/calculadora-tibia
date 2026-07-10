import { useEffect, useState } from 'react';
import { fetchModifiersHistory, type ModifierRotationRecord } from '../storage/tibiadromeHistory';

export function useTibiadromeHistory() {
  const [history, setHistory] = useState<ModifierRotationRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchModifiersHistory().then((records) => {
      if (!cancelled) setHistory(records);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return history;
}
