// Team players covered by the automated daily scraper
// (scripts/scrape-team-experience.mjs) — keep both lists in sync. Matched
// against a local player's name (case/whitespace-insensitive); any other
// player added to the roster just stays manual-only.
export interface AutoTrackedPlayer {
  name: string;
  slug: string;
}

export const AUTO_TRACKED_TEAM_PLAYERS: AutoTrackedPlayer[] = [{ name: 'Baverone', slug: 'baverone' }];

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function findAutoTrackedPlayer(name: string): AutoTrackedPlayer | undefined {
  const normalized = normalizeName(name);
  return AUTO_TRACKED_TEAM_PLAYERS.find((p) => normalizeName(p.name) === normalized);
}
