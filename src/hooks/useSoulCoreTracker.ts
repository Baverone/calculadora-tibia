import { useCallback, useMemo, useState } from 'react';
import type { CharacterId } from '../domain/types';
import { assignSoulCores, normalizeMonsterName, parseMonsterList } from '../domain/soulCore';
import {
  addDoneSoulCore,
  getDoneSoulCores,
  getSoulCorePriority,
  removeDoneSoulCore,
  saveSoulCorePriority,
} from '../storage/soulCoreStorage';

/** Owns the 3-character Soul Core priority order, each character's done list, and the pasted-list assignment. */
export function useSoulCoreTracker(defaultOrder: CharacterId[]) {
  const [priorityOrder, setPriorityOrderState] = useState(() => getSoulCorePriority(defaultOrder));
  const [doneByCharacter, setDoneByCharacter] = useState<Record<CharacterId, string[]>>(() =>
    Object.fromEntries(defaultOrder.map((id) => [id, getDoneSoulCores(id)]))
  );
  const [monsterListInput, setMonsterListInput] = useState('');

  const moveInPriority = useCallback((characterId: CharacterId, direction: -1 | 1) => {
    setPriorityOrderState((current) => {
      const index = current.indexOf(characterId);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return saveSoulCorePriority(next);
    });
  }, []);

  const addDone = useCallback((characterId: CharacterId, name: string) => {
    setDoneByCharacter((current) => ({ ...current, [characterId]: addDoneSoulCore(characterId, name) }));
  }, []);

  const removeDone = useCallback((characterId: CharacterId, name: string) => {
    setDoneByCharacter((current) => ({ ...current, [characterId]: removeDoneSoulCore(characterId, name) }));
  }, []);

  const doneSetsByCharacter = useMemo(() => {
    const sets: Record<CharacterId, Set<string>> = {};
    for (const [characterId, names] of Object.entries(doneByCharacter)) {
      sets[characterId] = new Set(names.map(normalizeMonsterName));
    }
    return sets;
  }, [doneByCharacter]);

  const assignments = useMemo(() => {
    const monsters = parseMonsterList(monsterListInput);
    return assignSoulCores(monsters, priorityOrder, doneSetsByCharacter);
  }, [monsterListInput, priorityOrder, doneSetsByCharacter]);

  return {
    priorityOrder,
    moveInPriority,
    doneByCharacter,
    addDone,
    removeDone,
    monsterListInput,
    setMonsterListInput,
    assignments,
  };
}
