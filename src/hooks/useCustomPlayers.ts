import { useCallback, useState } from 'react';
import type { TeamId } from '../domain/types';
import { addCustomPlayer, getCustomPlayers, removeCustomPlayer } from '../storage/customPlayerStorage';

export function useCustomPlayers() {
  const [customPlayers, setCustomPlayers] = useState(() => getCustomPlayers());

  const addPlayer = useCallback((name: string, teamId: TeamId) => {
    const updated = addCustomPlayer(name, teamId);
    setCustomPlayers(updated);
    return updated[updated.length - 1];
  }, []);

  const removePlayer = useCallback((id: string) => {
    setCustomPlayers(removeCustomPlayer(id));
  }, []);

  return { customPlayers, addPlayer, removePlayer };
}
