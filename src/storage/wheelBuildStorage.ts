import type { CharacterId } from '../domain/types';
import type { WheelBuild } from '../domain/wheel/types';

// Persists Wheel of Destiny builds a user has saved per character, so they survive reloads.

const STORAGE_PREFIX = 'tibia-xp-calc:wheel-builds:';

function storageKey(characterId: CharacterId): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

export function getWheelBuilds(characterId: CharacterId): WheelBuild[] {
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as WheelBuild[];
  } catch {
    return [];
  }
}

function persist(characterId: CharacterId, builds: WheelBuild[]): WheelBuild[] {
  localStorage.setItem(storageKey(characterId), JSON.stringify(builds));
  return builds;
}

export function saveWheelBuild(characterId: CharacterId, build: Omit<WheelBuild, 'id' | 'createdAt'>): WheelBuild[] {
  const newBuild: WheelBuild = { ...build, id: crypto.randomUUID(), createdAt: Date.now() };
  return persist(characterId, [...getWheelBuilds(characterId), newBuild]);
}

export function deleteWheelBuild(characterId: CharacterId, buildId: string): WheelBuild[] {
  return persist(characterId, getWheelBuilds(characterId).filter((build) => build.id !== buildId));
}
