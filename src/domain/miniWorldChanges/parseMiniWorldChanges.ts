import { MINI_WORLD_CHANGE_EVENTS } from '../../data/miniWorldChanges/events';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ParseMiniWorldChangesResult {
  ok: boolean;
  events: string[];
  error?: string;
}

/**
 * Identifies which of the known Mini World Changes appear in pasted
 * Towncryer/World Board text. Unlike the Tibiadrome modifiers (always
 * exactly 2), any number of events can be active on a given day — anywhere
 * from 1 up. Only fails if it can't confidently identify at least 1.
 */
export function parseMiniWorldChangesFromAnnouncement(rawText: string): ParseMiniWorldChangesResult {
  const normalizedText = normalize(rawText);
  const matches: { name: string; index: number }[] = [];

  for (const event of MINI_WORLD_CHANGE_EVENTS) {
    const index = normalizedText.indexOf(normalize(event.name));
    if (index !== -1) {
      matches.push({ name: event.name, index });
    }
  }

  matches.sort((a, b) => a.index - b.index);
  const names = matches.map((m) => m.name);

  if (names.length === 0) {
    return {
      ok: false,
      events: [],
      error: 'Não consegui identificar nenhuma mini world change no texto colado, verifica e tenta novamente.',
    };
  }

  return { ok: true, events: names };
}
