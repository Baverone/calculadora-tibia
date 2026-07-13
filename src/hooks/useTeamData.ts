import { useCallback, useEffect, useMemo, useState } from 'react';
import * as teamStorage from '../storage/teamStorage';
import type { ExpRecord } from '../domain/team/types';
import { mergeManualAndAutoRecords } from '../domain/team/calculations';

/**
 * Owns the team roster + daily EXP log. Manual entries are backed by
 * localStorage; players that match the fixed auto-tracked list (see
 * src/data/team/autoTrackedPlayers.ts) also get their daily EXP fetched
 * from the shared GitHub-scraped history and merged in — manual entries
 * win on any date both have, so a bad reading can always be corrected.
 */
export function useTeamData() {
  const [players, setPlayers] = useState(() => teamStorage.getPlayers());
  const [manualRecords, setManualRecords] = useState(() => teamStorage.getRecords());
  const [autoRecordsByPlayer, setAutoRecordsByPlayer] = useState<Record<string, ExpRecord[]>>({});

  useEffect(() => {
    let cancelled = false;
    teamStorage.fetchAutoHistoryForPlayers(players).then((result) => {
      if (!cancelled) setAutoRecordsByPlayer(result);
    });
    return () => {
      cancelled = true;
    };
  }, [players]);

  const records = useMemo(() => {
    const autoRecords = Object.values(autoRecordsByPlayer).flat();
    return mergeManualAndAutoRecords(manualRecords, autoRecords);
  }, [manualRecords, autoRecordsByPlayer]);

  const addPlayer = useCallback((name: string) => setPlayers(teamStorage.addPlayer(name)), []);

  const renamePlayer = useCallback(
    (playerId: string, newName: string) => setPlayers(teamStorage.renamePlayer(playerId, newName)),
    []
  );

  const removePlayer = useCallback((playerId: string) => {
    const result = teamStorage.removePlayer(playerId);
    setPlayers(result.players);
    setManualRecords(result.records);
  }, []);

  const upsertRecord = useCallback(
    (playerId: string, date: string, exp: number) => setManualRecords(teamStorage.upsertRecord(playerId, date, exp)),
    []
  );

  const deleteRecord = useCallback(
    (playerId: string, date: string) => setManualRecords(teamStorage.deleteRecord(playerId, date)),
    []
  );

  const importData = useCallback((json: string) => {
    const result = teamStorage.importTeamData(json);
    if (result.ok) {
      setPlayers(teamStorage.getPlayers());
      setManualRecords(teamStorage.getRecords());
    }
    return result;
  }, []);

  return { players, records, addPlayer, renamePlayer, removePlayer, upsertRecord, deleteRecord, importData };
}
