import { GITHUB_REPO } from '../config';
import type { CharacterId, HistoryEntry } from '../domain/types';

interface ScrapedRecord {
  date: string;
  level: number;
  experience: number;
  scrapedAt: string;
}

/**
 * O histórico diário de um boneco, lido do repositório público no GitHub
 * (escrito por scripts/scrape-experience.mjs, a correr no PC).
 *
 * Nunca rebenta: qualquer falha — offline, repo por configurar, ficheiro
 * ainda sem dados — devolve uma lista vazia e a app mostra o estado vazio em
 * vez de partir.
 */
export async function fetchSharedHistory(characterId: CharacterId): Promise<HistoryEntry[]> {
  const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/scraped-history/${characterId}.json`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];

    const records = (await response.json()) as ScrapedRecord[];
    if (!Array.isArray(records)) return [];

    return records.map((record) => ({
      // O guildstats só dá precisão ao dia; meio-dia UTC mantém a ordenação
      // estável sem depender do horário de verão de Lisboa.
      timestamp: new Date(`${record.date}T12:00:00Z`).getTime(),
      experience: record.experience,
      source: 'guildstats' as const,
    }));
  } catch {
    return [];
  }
}
