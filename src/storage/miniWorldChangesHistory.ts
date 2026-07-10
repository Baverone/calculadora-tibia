import { GITHUB_REPO } from '../config';

export interface MiniWorldChangesRecord {
  date: string;
  events: string[];
  recordedAt: string;
}

const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/mini-world-changes/history.json`;

/**
 * Fetches the Mini World Changes history from the public GitHub repo
 * (appended by scripts/save-mini-world-changes.mjs, run locally). Never
 * throws — any failure (offline, nothing recorded yet) just yields an empty
 * array.
 */
export async function fetchMiniWorldChangesHistory(): Promise<MiniWorldChangesRecord[]> {
  try {
    const response = await fetch(RAW_URL, { cache: 'no-store' });
    if (!response.ok) return [];

    const records = (await response.json()) as MiniWorldChangesRecord[];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}
