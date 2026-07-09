import { useCallback, useState } from 'react';
import type { CharacterId, SavedHunt } from '../domain/types';
import { deleteHunt, getHunts, saveHunt } from '../storage/huntStorage';

/** Owns the list of saved hunts for one character, backed by localStorage. */
export function useSavedHunts(characterId: CharacterId) {
  const [hunts, setHunts] = useState(() => getHunts(characterId));

  const addHunt = useCallback(
    (hunt: Omit<SavedHunt, 'id' | 'createdAt'>) => {
      setHunts(saveHunt(characterId, hunt));
    },
    [characterId]
  );

  const removeHunt = useCallback(
    (huntId: string) => {
      setHunts(deleteHunt(characterId, huntId));
    },
    [characterId]
  );

  return { hunts, addHunt, removeHunt };
}
