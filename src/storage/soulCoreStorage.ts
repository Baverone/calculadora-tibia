import type { CharacterId } from '../domain/types';

// Persists, per character, which Soul Cores are already obtained, plus a
// shared priority order (which of the 3 tracked characters should farm a
// missing Soul Core first) used by the team assignment tool.

const DONE_PREFIX = 'tibia-xp-calc:soul-cores:';
const PRIORITY_KEY = 'tibia-xp-calc:soul-core-priority';

function doneKey(characterId: CharacterId): string {
  return `${DONE_PREFIX}${characterId}`;
}

export function getDoneSoulCores(characterId: CharacterId): string[] {
  try {
    const raw = localStorage.getItem(doneKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistDone(characterId: CharacterId, names: string[]): string[] {
  localStorage.setItem(doneKey(characterId), JSON.stringify(names));
  return names;
}

export function addDoneSoulCore(characterId: CharacterId, name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return getDoneSoulCores(characterId);

  const current = getDoneSoulCores(characterId);
  const key = trimmed.toLowerCase();
  if (current.some((n) => n.toLowerCase() === key)) return current;

  return persistDone(characterId, [...current, trimmed]);
}

export function removeDoneSoulCore(characterId: CharacterId, name: string): string[] {
  return persistDone(
    characterId,
    getDoneSoulCores(characterId).filter((n) => n !== name)
  );
}

export function getSoulCorePriority(defaultOrder: CharacterId[]): CharacterId[] {
  try {
    const raw = localStorage.getItem(PRIORITY_KEY);
    if (!raw) return defaultOrder;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === defaultOrder.length ? parsed : defaultOrder;
  } catch {
    return defaultOrder;
  }
}

export function saveSoulCorePriority(order: CharacterId[]): CharacterId[] {
  localStorage.setItem(PRIORITY_KEY, JSON.stringify(order));
  return order;
}
