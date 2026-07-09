import type { CharacterId, SavedHunt } from '../domain/types';

// Persists the hunts a user has added per character, so they survive reloads.

const STORAGE_PREFIX = 'tibia-xp-calc:hunts:';

function storageKey(characterId: CharacterId): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function getHunts(characterId: CharacterId): SavedHunt[] {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedHunt[];
  } catch {
    return [];
  }
}

function persist(characterId: CharacterId, hunts: SavedHunt[]): SavedHunt[] {
  localStorage.setItem(storageKey(characterId), JSON.stringify(hunts));
  return hunts;
}

export function saveHunt(characterId: CharacterId, hunt: Omit<SavedHunt, 'id' | 'createdAt'>): SavedHunt[] {
  const newHunt: SavedHunt = { ...hunt, id: crypto.randomUUID(), createdAt: Date.now() };
  return persist(characterId, [...getHunts(characterId), newHunt]);
}

export function deleteHunt(characterId: CharacterId, huntId: string): SavedHunt[] {
  return persist(characterId, getHunts(characterId).filter((hunt) => hunt.id !== huntId));
}
