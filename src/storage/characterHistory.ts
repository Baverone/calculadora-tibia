import type { CharacterId, HistoryEntry } from '../domain/types';

// All persistence for the app lives behind this module. If we ever swap
// localStorage for IndexedDB or a backend, only this file should need to change.

const STORAGE_PREFIX = 'tibia-xp-calc:history:';

function storageKey(characterId: CharacterId): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function getHistory(characterId: CharacterId): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

/** Appends a new XP reading and persists it. Returns the updated history, sorted by time. */
export function addHistoryEntry(characterId: CharacterId, experience: number): HistoryEntry[] {
  const history = getHistory(characterId);
  const entry: HistoryEntry = { timestamp: Date.now(), experience, source: 'manual' };
  const updated = [...history, entry].sort((a, b) => a.timestamp - b.timestamp);

  localStorage.setItem(storageKey(characterId), JSON.stringify(updated));
  return updated;
}

export function getLatestExperience(characterId: CharacterId): number | null {
  const history = getHistory(characterId);
  if (history.length === 0) return null;
  return history[history.length - 1].experience;
}
