import type { CharacterId } from '../../domain/types';

/**
 * First-load defaults, confirmed by the user from in-game screenshots
 * (2026-07-13). Only applied once, the first time a character's "done"
 * list is read and localStorage has nothing for it yet — after that the
 * grid is the source of truth. "Deepling Master Spellsinger" (unsure name,
 * as reported) doesn't exist in the Bestiary; the closest real match is
 * "Deepling Master Librarian", used here — worth double-checking in-game.
 */
export const SOUL_CORE_SEED: Partial<Record<CharacterId, string[]>> = {
  'royal-paladin': [
    'Crimson Frog',
    'Orchid Frog',
    'Crab',
    'Quara Constrictor',
    'Quara Mantassin',
    'Quara Mantassin Scout',
    'Quara Hydromancer',
    'Quara Hydromancer Scout',
    'Deepling Scout',
    'Deepling Warrior',
    'Deepling Spellsinger',
    'Deepling Master Librarian',
  ],
  // Confirmed 2026-07-14 from in-game screenshots (Aquatic family only so
  // far, all 3 pages) — more families to be added as they're checked.
  'exalted-monk': ['Northern Pike (Creature)'],
};
