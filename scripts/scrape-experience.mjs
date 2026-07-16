// Daily scraper: pulls every experience day guildstats.eu still exposes for
// each of the 3 main characters and appends the ones missing from
// data/scraped-history/<id>.json.
//
// Runs from GitHub Actions (see .github/workflows/scrape-experience.yml)
// hourly from 09:00 UTC. Never deletes or overwrites existing history — it
// only appends dates that aren't recorded yet, so any day missed while the
// workflow was down is backfilled automatically on the next run (guildstats
// keeps ~30 days). All the actual logic lives in lib/guildstatsHistory.mjs,
// shared with scrape-team-experience.mjs.
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { runScraper } from './lib/guildstatsHistory.mjs';

const CHARACTERS = [
  { id: 'elite-knight', nick: 'Serip Seomis' },
  { id: 'royal-paladin', nick: 'Baverone' },
  { id: 'exalted-monk', nick: 'Bluey The Cat' },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data', 'scraped-history');

await runScraper({ players: CHARACTERS, dataDir: DATA_DIR });
