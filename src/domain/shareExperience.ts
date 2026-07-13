export interface ShareExpRange {
  min: number;
  max: number;
}

/**
 * Level range within which a character can activate Shared Experience with
 * a party. Official Tibia rule (tibia.com support): "the lowest character
 * in a party may not have less than two-thirds of the levels of the
 * highest character" — i.e. lowestLevel >= highestLevel * 2/3. Solved for
 * both directions around a single reference level:
 *   min = ceil(level * 2/3)  (smallest partner level allowed if this
 *         character is the highest-level one)
 *   max = floor(level * 3/2) (largest partner level allowed if this
 *         character is the lowest-level one)
 * Verified against the official examples: level 40 shares with level 60
 * but not level 20; level 200 shares with level 300.
 */
export function getShareExpRange(level: number): ShareExpRange {
  return {
    min: Math.ceil((level * 2) / 3),
    max: Math.floor((level * 3) / 2),
  };
}
