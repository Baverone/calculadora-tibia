import { useCallback, useEffect, useState } from 'react';
import type { Vocation } from '../domain/skillTraining';
import { fetchCharacterVocation, getCachedVocation, setCachedVocation } from '../storage/vocationLookup';

/**
 * Auto-detects a character's vocation via the TibiaData API instead of
 * asking the user. Cached in localStorage after the first successful
 * lookup. If the lookup fails (offline, API down) and there's no cache,
 * `vocation` stays null so the caller can fall back to manual selection.
 */
export function useCharacterVocation(characterId: string, characterName: string) {
  const [vocation, setVocation] = useState<Vocation | null>(() => getCachedVocation(characterId));
  const [loading, setLoading] = useState(false);

  const detect = useCallback(async () => {
    setLoading(true);
    const detected = await fetchCharacterVocation(characterName);
    setLoading(false);
    if (detected) {
      setCachedVocation(characterId, detected);
      setVocation(detected);
    }
    return detected;
  }, [characterId, characterName]);

  useEffect(() => {
    if (!getCachedVocation(characterId)) {
      detect();
    }
    // Only auto-detect once per mount/character — `detect` also covers manual re-tries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const setManualVocation = useCallback(
    (manual: Vocation) => {
      setCachedVocation(characterId, manual);
      setVocation(manual);
    },
    [characterId]
  );

  return { vocation, loading, detect, setManualVocation };
}
