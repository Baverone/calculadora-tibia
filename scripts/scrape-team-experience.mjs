// Daily scraper for the "Equipa" tab's auto-tracked players — same logic as
// scrape-experience.mjs (both delegate to lib/guildstatsHistory.mjs), but
// for a fixed list of team members instead of the 3 main characters,
// writing to data/team-history/<slug>.json.
//
// The Equipa roster itself is dynamic (add/remove any player, client-side
// localStorage) — this script only knows about a fixed subset worth
// tracking automatically. Same list as src/data/team/autoTrackedPlayers.ts
// — keep both in sync. Adding a team player NOT in this list still works
// fine, it just stays manual-only (via the "Update diário" form).
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { runScraper } from './lib/guildstatsHistory.mjs';

const TEAM_PLAYERS = [{ id: 'baverone', nick: 'Baverone' }];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data', 'team-history');

await runScraper({ players: TEAM_PLAYERS, dataDir: DATA_DIR });
