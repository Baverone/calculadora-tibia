import { TIBIADROME_MODIFIERS } from '../../data/tibiadrome/modifiers';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ParseModifiersResult {
  ok: boolean;
  modifiers: string[];
  error?: string;
}

/**
 * Identifies which of the 9 known modifiers appear in a pasted in-game
 * announcement. Tolerant of punctuation/line-break/whitespace differences
 * (matches on normalized, diacritic-stripped text), but requires exactly 2
 * matches — anything else is treated as an unreliable parse rather than a
 * guess.
 */
export function parseModifiersFromAnnouncement(rawText: string): ParseModifiersResult {
  const normalizedText = normalize(rawText);
  const matches: { name: string; index: number }[] = [];

  for (const modifier of TIBIADROME_MODIFIERS) {
    const index = normalizedText.indexOf(normalize(modifier.name));
    if (index !== -1) {
      matches.push({ name: modifier.name, index });
    }
  }

  matches.sort((a, b) => a.index - b.index);
  const names = matches.map((m) => m.name);

  if (names.length !== 2) {
    const found = names.length > 0 ? `: ${names.join(', ')}` : '';
    return {
      ok: false,
      modifiers: names,
      error: `Não consegui identificar 2 modificadores no texto colado (encontrei ${names.length}${found}), verifica e tenta novamente.`,
    };
  }

  return { ok: true, modifiers: names };
}
