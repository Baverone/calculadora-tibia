import type { CharacterId } from '../domain/types';

// Persists which Acessos/Bosses/Úteis entries a character has been manually
// checked off as done, so the table survives reloads.

const STORAGE_PREFIX = 'tibia-xp-calc:access-boss-done:';

function storageKey(characterId: CharacterId): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function getCompletedEntries(characterId: CharacterId): string[] {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

function persist(characterId: CharacterId, entryIds: string[]): string[] {
  localStorage.setItem(storageKey(characterId), JSON.stringify(entryIds));
  return entryIds;
}

export function setEntryCompleted(characterId: CharacterId, entryId: string, completed: boolean): string[] {
  const current = new Set(getCompletedEntries(characterId));
  if (completed) {
    current.add(entryId);
  } else {
    current.delete(entryId);
  }
  return persist(characterId, [...current]);
}
