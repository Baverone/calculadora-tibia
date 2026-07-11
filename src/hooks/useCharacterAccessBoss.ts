import { useCallback, useMemo, useState } from 'react';
import type { CharacterId } from '../domain/types';
import { getCompletedEntries, setEntryCompleted } from '../storage/accessBossStorage';

/** Owns which Acessos/Bosses/Úteis entries are checked off as done for one character, backed by localStorage. */
export function useCharacterAccessBoss(characterId: CharacterId) {
  const [completed, setCompleted] = useState(() => getCompletedEntries(characterId));
  const completedSet = useMemo(() => new Set(completed), [completed]);

  const toggleEntry = useCallback(
    (entryId: string, done: boolean) => {
      setCompleted(setEntryCompleted(characterId, entryId, done));
    },
    [characterId]
  );

  return { completedSet, toggleEntry };
}
