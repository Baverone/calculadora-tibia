import { GITHUB_REPO } from '../config';

export interface ModifierRotationRecord {
  rotation: number;
  modifiers: string[];
  recordedAt: string;
}

const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/tibiadrome/modifiers-history.json`;

/**
 * Fetches the modifier-per-rotation history from the public GitHub repo
 * (appended by scripts/save-modifier-rotation.mjs, run locally). Never
 * throws — any failure (offline, nothing recorded yet) just yields an empty
 * array.
 */
export async function fetchModifiersHistory(): Promise<ModifierRotationRecord[]> {
  try {
    const response = await fetch(RAW_URL, { cache: 'no-store' });
    if (!response.ok) return [];

    const records = (await response.json()) as ModifierRotationRecord[];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}
