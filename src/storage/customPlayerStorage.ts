import type { TeamId } from '../domain/types';

// Players added by hand via the "+" button in a team's tab row — separate
// from the fixed PLAYERS roster in src/constants/players.tsx, so adding one
// never risks touching the 3 original characters' data. Manual-XP-only by
// default (no automatic guildstats.eu scraping — that requires a code
// change to add the name to the fixed daily-scraper list).

export interface CustomPlayer {
  id: string;
  name: string;
  teamId: TeamId;
}

const STORAGE_KEY = 'tibia-xp-calc:custom-players';

export function getCustomPlayers(): CustomPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPlayers(players: CustomPlayer[]): CustomPlayer[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  return players;
}

export function addCustomPlayer(name: string, teamId: TeamId): CustomPlayer[] {
  const trimmed = name.trim();
  const player: CustomPlayer = { id: `custom-${crypto.randomUUID()}`, name: trimmed, teamId };
  return saveCustomPlayers([...getCustomPlayers(), player]);
}
