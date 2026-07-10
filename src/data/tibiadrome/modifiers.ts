export interface TibiadromeModifier {
  name: string;
  description: string;
  /** Present when the description wasn't given verbatim by the user and
   * couldn't be verified against the literal in-game/official text — only
   * cross-referenced across independent community wiki sources. */
  confidence?: string;
}

const CROSS_REFERENCED_NOTE =
  'confirmado por pesquisa cruzada (TibiaWiki + fontes comunitárias), mas não verificado contra o texto exato do anúncio in-game';

// Reference list of the 9 Tibiadrome rotation modifiers. "Exploding
// Corpses" and "The Floor is Lava" descriptions were given verbatim by the
// user (ground truth); the rest were researched and cross-referenced across
// independent sources — see `confidence` for those.
export const TIBIADROME_MODIFIERS: TibiadromeModifier[] = [
  {
    name: 'Somersault',
    description: 'All melee monsters have a 15% chance to teleport to the furthest player.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'Going Down With Me',
    description:
      'Upon death, monsters trigger one last area-of-effect attack that hits the last hitter and all players around them for 40% of their current HP.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'Exploding Corpses',
    description:
      'On death each monster will explode in one last effort to dish out a great deal of damage to the fighters close to it.',
  },
  {
    name: 'That Escalated Quickly',
    description:
      'Monsters that drop below 25% HP increase their power as if they were 5 wave levels higher.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'The Floor is Lava',
    description:
      'Every few seconds tremendous damage will be dealt to fighters that do not move away from marked tiles in time.',
  },
  {
    name: 'Beam me Up!',
    description:
      'Every 15 seconds 100 random fields will be marked. After 3 seconds all players standing on them are teleported to a random position in the arena.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'Tanked Up',
    description:
      'Every 15 seconds 100 random fields will be marked. After 3 seconds all players standing on them become superdrunk for 10 seconds; while superdrunk, damage taken is increased by 10%.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'Sown Sorrow',
    description:
      'Every 20/17/14/11/8 seconds (depending on the number of participants) a seed will spawn. If no player steps on it within 6 seconds it explodes and fears all players for 2 seconds; while feared, damage taken is increased by 15%.',
    confidence: CROSS_REFERENCED_NOTE,
  },
  {
    name: 'Bad Roots',
    description:
      'Every 20/17/14/11/8 seconds (depending on the number of participants) a seed will spawn. If no player steps on it within 6 seconds it explodes and roots all players for 3 seconds; while rooted, damage taken is increased by 25%.',
    confidence: CROSS_REFERENCED_NOTE,
  },
];
