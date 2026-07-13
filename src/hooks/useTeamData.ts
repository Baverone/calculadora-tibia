import { useCallback, useState } from 'react';
import * as teamStorage from '../storage/teamStorage';

/** Owns the team roster + daily EXP log, backed by localStorage. */
export function useTeamData() {
  const [players, setPlayers] = useState(() => teamStorage.getPlayers());
  const [records, setRecords] = useState(() => teamStorage.getRecords());

  const addPlayer = useCallback((name: string) => setPlayers(teamStorage.addPlayer(name)), []);

  const renamePlayer = useCallback(
    (playerId: string, newName: string) => setPlayers(teamStorage.renamePlayer(playerId, newName)),
    []
  );

  const removePlayer = useCallback((playerId: string) => {
    const result = teamStorage.removePlayer(playerId);
    setPlayers(result.players);
    setRecords(result.records);
  }, []);

  const upsertRecord = useCallback(
    (playerId: string, date: string, exp: number) => setRecords(teamStorage.upsertRecord(playerId, date, exp)),
    []
  );

  const deleteRecord = useCallback(
    (playerId: string, date: string) => setRecords(teamStorage.deleteRecord(playerId, date)),
    []
  );

  const importData = useCallback((json: string) => {
    const result = teamStorage.importTeamData(json);
    if (result.ok) {
      setPlayers(teamStorage.getPlayers());
      setRecords(teamStorage.getRecords());
    }
    return result;
  }, []);

  return { players, records, addPlayer, renamePlayer, removePlayer, upsertRecord, deleteRecord, importData };
}
