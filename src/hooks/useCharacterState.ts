import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HistoryEntry } from '../domain/types';
import { parseNonNegativeInteger } from '../domain/validation';
import { addHistoryEntry, getHistory } from '../storage/characterHistory';
import { fetchSharedHistory } from '../storage/sharedHistory';

/**
 * Owns everything about a single character/player panel: the draft XP
 * input, the persisted history, and the "commit" action that validates +
 * saves a new reading. Each panel gets its own instance, so tabs never
 * share state.
 *
 * History merges two sources: manual entries from localStorage (this
 * browser only) and the daily-scraped history fetched from the shared
 * GitHub repo. `fetchShared` defaults to the main 3-character dataset
 * (src/storage/sharedHistory.ts); pass `fetchTeamPlayerSharedHistory` for a
 * team-only player instead. The fetch is best-effort — if it fails or
 * hasn't been set up yet, the app just falls back to whatever's in
 * localStorage.
 */
export function useCharacterState(
  characterId: string,
  fetchShared: (id: string) => Promise<HistoryEntry[]> = fetchSharedHistory
) {
  const [localHistory, setLocalHistory] = useState(() => getHistory(characterId));
  const [sharedHistory, setSharedHistory] = useState<HistoryEntry[]>([]);
  const [inputValue, setInputValue] = useState<string>(() => {
    const latest = localHistory.at(-1);
    return latest ? String(latest.experience) : '';
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShared(characterId).then((entries) => {
      if (!cancelled) setSharedHistory(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [characterId, fetchShared]);

  const history = useMemo(() => {
    return [...localHistory, ...sharedHistory].sort((a, b) => a.timestamp - b.timestamp);
  }, [localHistory, sharedHistory]);

  const currentExperience = history.at(-1)?.experience ?? null;

  const commitExperience = useCallback(() => {
    const result = parseNonNegativeInteger(inputValue, 'a XP atual');
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    setLocalHistory(addHistoryEntry(characterId, result.value));
    return true;
  }, [characterId, inputValue]);

  return useMemo(
    () => ({ inputValue, setInputValue, error, history, currentExperience, commitExperience }),
    [inputValue, error, history, currentExperience, commitExperience]
  );
}
