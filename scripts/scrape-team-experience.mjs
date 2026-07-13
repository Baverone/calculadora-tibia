// Daily scraper for the "Equipa" tab's auto-tracked players — mirrors
// scrape-experience.mjs exactly, but for a fixed list of team members
// instead of the 3 main characters, writing to data/team-history/<slug>.json.
//
// The Equipa roster itself is dynamic (add/remove any player, client-side
// localStorage) — this script only knows about a fixed subset worth
// tracking automatically. Same list as src/data/team/autoTrackedPlayers.ts
// — keep both in sync. Adding a team player NOT in this list still works
// fine, it just stays manual-only (via the "Update diário" form).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const TEAM_PLAYERS = [
  { slug: 'baverone', nick: 'Baverone' },
  { slug: 'bigodes-the-legend', nick: 'Bigodes The Legend' },
  { slug: 'konczul', nick: 'Konczul' },
  { slug: 'sios-trader', nick: 'Sios Trader' },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data', 'team-history');

// Same formula as src/domain/experienceTable.ts — duplicated here so this
// script stays a standalone Node file with no build step. Keep in sync.
function experienceForLevel(level) {
  return Math.round((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

function levelForExperience(experience) {
  let low = 1;
  let high = 1;
  while (experienceForLevel(high) <= experience) high *= 2;
  while (low < high) {
    const mid = low + Math.ceil((high - low) / 2);
    if (experienceForLevel(mid) <= experience) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** Same open-ended check as scrape-experience.mjs — see that file for why there's no upper bound. */
function isAfterLisbonServerSave() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', hour12: false }).format(new Date())
  );
  return hour >= 9;
}

async function scrapePlayer(nick) {
  const encodedNick = encodeURIComponent(nick).replace(/%20/g, '+');
  const url = `https://guildstats.eu/include/character/tab.php?nick=${encodedNick}&tab=experience`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'CalculadoraTibia-XP-Tracker/1.0 (personal use, 1 request/character/day)' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching experience tab for "${nick}"`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const firstRow = $('table tbody tr').first();
  if (firstRow.length === 0) {
    throw new Error(`No experience history rows found for "${nick}" (page layout may have changed)`);
  }

  const cells = firstRow.find('td');
  const date = cells.eq(0).find('span.hidden.md\\:inline').first().text().trim();
  // Same "(+N)" level-up badge quirk as the main scraper — parseInt skips it, Number() would NaN.
  const level = parseInt(cells.eq(3).text().trim(), 10);
  const experience = Number(cells.eq(4).text().trim().replace(/,/g, ''));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(level) || !Number.isFinite(experience)) {
    throw new Error(`Could not parse row for "${nick}" (date="${date}", level=${level}, experience=${experience})`);
  }

  return { date, level, experience };
}

function loadExistingHistory(slug) {
  const path = join(DATA_DIR, `${slug}.json`);
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(slug, history) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, `${slug}.json`), `${JSON.stringify(history, null, 2)}\n`);
}

async function main() {
  if (!isAfterLisbonServerSave() && process.env.FORCE_SCRAPE !== 'true') {
    console.log('Fora da janela das ~9h em Lisboa — a ignorar esta execução.');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const { slug, nick } of TEAM_PLAYERS) {
    try {
      const scraped = await scrapePlayer(nick);
      const history = loadExistingHistory(slug);

      if (history.some((entry) => entry.date === scraped.date)) {
        console.log(`[${slug}] ${scraped.date} já estava registado — a ignorar.`);
        continue;
      }

      const expectedLevel = levelForExperience(scraped.experience);
      if (expectedLevel !== scraped.level) {
        console.warn(
          `[${slug}] aviso: nível reportado pelo guildstats (${scraped.level}) difere do calculado pela fórmula (${expectedLevel}) para ${scraped.experience} XP.`
        );
      }

      history.push({ ...scraped, scrapedAt: new Date().toISOString() });
      history.sort((a, b) => a.date.localeCompare(b.date));
      saveHistory(slug, history);

      console.log(`[${slug}] guardado: ${scraped.date} — nível ${scraped.level}, ${scraped.experience.toLocaleString('pt-PT')} XP.`);
      successCount++;
    } catch (error) {
      failureCount++;
      console.error(`[${slug}] falhou: ${error.message}`);
    }
  }

  console.log(`\nResumo: ${successCount} sucesso(s), ${failureCount} falha(s).`);

  if (failureCount > 0 && successCount === 0) {
    process.exitCode = 1;
  }
}

main();
