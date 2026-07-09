import { GITHUB_REPO } from '../config';
import type { CharacterId, HistoryEntry } from '../domain/types';

interface ScrapedRecord {
  date: string;
  level: number;
  experience: number;
  scrapedAt: string;
}

const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/scraped-history`;

/**
 * Fetches the daily-scraped XP history for a character from the public
 * GitHub repo (populated by .github/workflows/scrape-experience.yml).
 * Never throws — any failure (offline, repo not set up yet, no data for
 * this character yet) just yields an empty array, so the app degrades
 * gracefully to whatever's in localStorage.
 */
export async function fetchSharedHistory(characterId: CharacterId): Promise<HistoryEntry[]> {
  try {
    const response = await fetch(`${RAW_BASE_URL}/${characterId}.json`, { cache: 'no-store' });
    if (!response.ok) return [];

    const records = (await response.json()) as ScrapedRecord[];
    if (!Array.isArray(records)) return [];

    return records.map((record) => ({
      // Day-level precision is all guildstats.eu gives us; noon UTC keeps
      // ordering stable without caring about Lisbon's DST offset.
      timestamp: new Date(`${record.date}T12:00:00Z`).getTime(),
      experience: record.experience,
      source: 'guildstats' as const,
    }));
  } catch {
    return [];
  }
}
