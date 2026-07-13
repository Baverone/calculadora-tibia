import { GITHUB_REPO } from '../config';
import { AUTO_TRACKED_TEAM_PLAYERS, findAutoTrackedPlayer } from '../data/team/autoTrackedPlayers';
import type { ExpRecord, TeamData, TeamPlayer } from '../domain/team/types';

// Team roster + daily EXP log, persisted in this browser only — separate
// feature from the 3 fixed characters, so it gets its own player list.

const PLAYERS_KEY = 'tibia-xp-calc:team:players';
const RECORDS_KEY = 'tibia-xp-calc:team:records';

// Seeded once, only on a browser that has never touched this feature (the
// key is still completely unset — `localStorage.getItem` returns null, not
// "[]"). Once seeded (or once the user removes everyone, leaving a real "[]"),
// this never runs again — so it can't clobber someone's own roster.
const DEFAULT_PLAYER_NAMES = ['Baverone', 'Bigodes The Legend', 'Konczul', 'Sios Trader'];

function readJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPlayers(): TeamPlayer[] {
  if (localStorage.getItem(PLAYERS_KEY) === null) {
    return savePlayers(DEFAULT_PLAYER_NAMES.map((name) => ({ id: crypto.randomUUID(), name })));
  }
  return readJsonArray<TeamPlayer>(PLAYERS_KEY);
}

function savePlayers(players: TeamPlayer[]): TeamPlayer[] {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  return players;
}

export function getRecords(): ExpRecord[] {
  return readJsonArray<ExpRecord>(RECORDS_KEY);
}

function saveRecords(records: ExpRecord[]): ExpRecord[] {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  return records;
}

export function addPlayer(name: string): TeamPlayer[] {
  const trimmed = name.trim();
  return savePlayers([...getPlayers(), { id: crypto.randomUUID(), name: trimmed }]);
}

export function renamePlayer(playerId: string, newName: string): TeamPlayer[] {
  const trimmed = newName.trim();
  return savePlayers(getPlayers().map((p) => (p.id === playerId ? { ...p, name: trimmed } : p)));
}

export function removePlayer(playerId: string): { players: TeamPlayer[]; records: ExpRecord[] } {
  return {
    players: savePlayers(getPlayers().filter((p) => p.id !== playerId)),
    records: saveRecords(getRecords().filter((r) => r.playerId !== playerId)),
  };
}

/** Adds a new daily reading, or overwrites the existing one for that player+date instead of duplicating. */
export function upsertRecord(playerId: string, date: string, exp: number): ExpRecord[] {
  const existing = getRecords();
  const idx = existing.findIndex((r) => r.playerId === playerId && r.date === date);
  const next = idx === -1 ? [...existing, { playerId, date, exp }] : existing.map((r, i) => (i === idx ? { ...r, exp } : r));
  return saveRecords(next);
}

export function deleteRecord(playerId: string, date: string): ExpRecord[] {
  return saveRecords(getRecords().filter((r) => !(r.playerId === playerId && r.date === date)));
}

export function exportTeamData(): string {
  const data: TeamData = { players: getPlayers(), records: getRecords() };
  return JSON.stringify(data, null, 2);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
}

export function importTeamData(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Não consegui interpretar o ficheiro como JSON válido.' };
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as TeamData).players) || !Array.isArray((parsed as TeamData).records)) {
    return { ok: false, error: 'Formato inválido: esperava um objeto com "players" e "records".' };
  }

  const data = parsed as TeamData;
  const validPlayers = data.players.every((p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string');
  const validRecords = data.records.every(
    (r) => r && typeof r === 'object' && typeof r.playerId === 'string' && typeof r.date === 'string' && typeof r.exp === 'number'
  );
  if (!validPlayers || !validRecords) {
    return { ok: false, error: 'Formato inválido: jogadores ou registos com campos em falta.' };
  }

  savePlayers(data.players);
  saveRecords(data.records);
  return { ok: true };
}

interface ScrapedTeamRecord {
  date: string;
  level: number;
  experience: number;
  scrapedAt: string;
}

const TEAM_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/team-history`;

/**
 * Fetches the automated daily EXP history for a player, if they're one of
 * the fixed set the scraper tracks (scripts/scrape-team-experience.mjs).
 * Never throws — matches sharedHistory.ts's fail-soft behavior (offline,
 * nothing scraped yet, or a player not in the auto-tracked list all just
 * yield an empty array, and the manual "Update diário" log still works).
 */
export async function fetchAutoHistoryForPlayer(playerName: string): Promise<ExpRecord[]> {
  const tracked = findAutoTrackedPlayer(playerName);
  if (!tracked) return [];

  try {
    const response = await fetch(`${TEAM_RAW_BASE_URL}/${tracked.slug}.json`, { cache: 'no-store' });
    if (!response.ok) return [];

    const scraped = (await response.json()) as ScrapedTeamRecord[];
    if (!Array.isArray(scraped)) return [];

    return scraped.map((entry) => ({ playerId: '', date: entry.date, exp: entry.experience }));
  } catch {
    return [];
  }
}

/** Fetches auto-scraped history for every currently-tracked player at once, keyed by playerId. */
export async function fetchAutoHistoryForPlayers(players: TeamPlayer[]): Promise<Record<string, ExpRecord[]>> {
  const results = await Promise.all(
    players.map(async (player) => {
      const records = await fetchAutoHistoryForPlayer(player.name);
      return [player.id, records.map((r) => ({ ...r, playerId: player.id }))] as const;
    })
  );
  return Object.fromEntries(results.filter(([, records]) => records.length > 0));
}

export { AUTO_TRACKED_TEAM_PLAYERS };
