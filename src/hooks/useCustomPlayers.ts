import { useCallback, useState } from 'react';
import type { TeamId } from '../domain/types';
import { addCustomPlayer, getCustomPlayers } from '../storage/customPlayerStorage';

export function useCustomPlayers() {
  const [customPlayers, setCustomPlayers] = useState(() => getCustomPlayers());

  const addPlayer = useCallback((name: string, teamId: TeamId) => {
    const updated = addCustomPlayer(name, teamId);
    setCustomPlayers(updated);
    return updated[updated.length - 1];
  }, []);

  return { customPlayers, addPlayer };
}
