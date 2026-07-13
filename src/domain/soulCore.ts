import type { CharacterId } from './types';

export interface SoulCoreAssignment {
  monster: string;
  /** The character (by priority order) who should hunt this Soul Core, or null if everyone already has it. */
  assignedTo: CharacterId | null;
}

export function normalizeMonsterName(name: string): string {
  return name.trim().toLowerCase();
}

/** Splits pasted free-form text into a de-duplicated list of monster names, one per line/comma/semicolon. */
export function parseMonsterList(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(/[\n,;]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const key = normalizeMonsterName(trimmed);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * For each monster, walks the priority order and assigns it to the first
 * character who doesn't have that Soul Core yet. If every character in the
 * order already has it, assignedTo is null ("não é necessário").
 */
export function assignSoulCores(
  monsters: string[],
  priorityOrder: CharacterId[],
  doneByCharacter: Record<CharacterId, Set<string>>
): SoulCoreAssignment[] {
  return monsters.map((monster) => {
    const key = normalizeMonsterName(monster);
    const assignedTo = priorityOrder.find((characterId) => !doneByCharacter[characterId]?.has(key)) ?? null;
    return { monster, assignedTo };
  });
}
