import { GITHUB_REPO } from '../config';
import type { HistoryEntry } from '../domain/types';

interface ScrapedRecord {
  date: string;
  level: number;
  experience: number;
  scrapedAt: string;
}

async function fetchScrapedHistory(url: string): Promise<HistoryEntry[]> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
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

/**
 * Fetches the daily-scraped XP history for one of the 3 original characters
 * from the public GitHub repo (populated by
 * .github/workflows/scrape-experience.yml, scripts/scrape-experience.mjs).
 * Never throws — any failure (offline, repo not set up yet, no data for
 * this character yet) just yields an empty array, so the app degrades
 * gracefully to whatever's in localStorage.
 */
export function fetchSharedHistory(characterId: string): Promise<HistoryEntry[]> {
  return fetchScrapedHistory(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/scraped-history/${characterId}.json`);
}

/**
 * Same as fetchSharedHistory, but for a team-only player tracked by
 * scripts/scrape-team-experience.mjs (data/team-history/<slug>.json)
 * instead of the main 3-character scraper.
 */
export function fetchTeamPlayerSharedHistory(slug: string): Promise<HistoryEntry[]> {
  return fetchScrapedHistory(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/team-history/${slug}.json`);
}
