import type { Vocation } from '../domain/skillTraining';

// Auto-detects a character's vocation from the official TibiaData API
// (api.tibiadata.com, community-run, reads tibia.com directly) instead of
// asking the user — one lookup per character, cached indefinitely since
// vocation essentially never changes once promoted.

const CACHE_PREFIX = 'tibia-xp-calc:vocation:';

function cacheKey(characterId: string): string {
  return `${CACHE_PREFIX}${characterId}`;
}

export function getCachedVocation(characterId: string): Vocation | null {
  try {
    const raw = localStorage.getItem(cacheKey(characterId));
    return raw ? (raw as Vocation) : null;
  } catch {
    return null;
  }
}

export function setCachedVocation(characterId: string, vocation: Vocation): void {
  localStorage.setItem(cacheKey(characterId), vocation);
}

/** Tibia vocation strings are always "[Rank] [BaseVocation]" (e.g. "Royal Paladin", "Master Sorcerer"). */
export function parseVocationString(raw: string): Vocation | null {
  const lower = raw.toLowerCase();
  if (lower.includes('paladin')) return 'paladin';
  if (lower.includes('knight')) return 'knight';
  if (lower.includes('monk')) return 'monk';
  if (lower.includes('druid')) return 'druid';
  if (lower.includes('sorcerer')) return 'sorcerer';
  return null;
}

/** Never throws — any failure (offline, API down, unknown character) just yields null so the UI can fall back to manual selection. */
export async function fetchCharacterVocation(characterName: string): Promise<Vocation | null> {
  try {
    const response = await fetch(`https://api.tibiadata.com/v4/character/${encodeURIComponent(characterName)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const data = await response.json();
    const raw = data?.character?.character?.vocation;
    return typeof raw === 'string' ? parseVocationString(raw) : null;
  } catch {
    return null;
  }
}
