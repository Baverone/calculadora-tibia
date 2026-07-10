// Daily scraper: pulls the latest "Experience" row from guildstats.eu for
// each tracked character and appends it to data/scraped-history/<id>.json.
//
// Runs from GitHub Actions (see .github/workflows/scrape-experience.yml) on
// a schedule near 10:00 Europe/Lisbon. Never deletes or overwrites existing
// history — only appends a new entry when the scraped date isn't already
// recorded. A failure for one character never blocks the others.
//
// Endpoint discovered by inspecting guildstats.eu's own front-end JS: the
// character page loads its "Experience" tab via this internal AJAX route,
// which returns a small self-contained HTML fragment (no JS execution
// needed to read it).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const CHARACTERS = [
  { id: 'elite-knight', nick: 'Serip Seomis' },
  { id: 'royal-paladin', nick: 'Baverone' },
  { id: 'exalted-monk', nick: 'Bluey The Cat' },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data', 'scraped-history');

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

/** Only proceed if it's currently ~10:00 in Lisbon, regardless of which of the two UTC cron triggers fired (handles DST without hardcoding transition dates). */
function isWithinLisbonMorningWindow() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', hour12: false }).format(new Date())
  );
  return hour === 9 || hour === 10;
}

async function scrapeCharacter(nick) {
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
  // The level cell appends a "(+N)" level-up badge on days the character
  // leveled up (e.g. "1150            (+1)") — parseInt reads the leading
  // number and ignores that trailing text, where Number() would return NaN.
  const level = parseInt(cells.eq(3).text().trim(), 10);
  const experience = Number(cells.eq(4).text().trim().replace(/,/g, ''));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(level) || !Number.isFinite(experience)) {
    throw new Error(`Could not parse row for "${nick}" (date="${date}", level=${level}, experience=${experience})`);
  }

  return { date, level, experience };
}

function loadExistingHistory(characterId) {
  const path = join(DATA_DIR, `${characterId}.json`);
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(characterId, history) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, `${characterId}.json`), `${JSON.stringify(history, null, 2)}\n`);
}

async function main() {
  if (!isWithinLisbonMorningWindow() && process.env.FORCE_SCRAPE !== 'true') {
    console.log('Fora da janela das ~10h em Lisboa — a ignorar esta execução.');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const { id, nick } of CHARACTERS) {
    try {
      const scraped = await scrapeCharacter(nick);
      const history = loadExistingHistory(id);

      if (history.some((entry) => entry.date === scraped.date)) {
        console.log(`[${id}] ${scraped.date} já estava registado — a ignorar.`);
        continue;
      }

      const expectedLevel = levelForExperience(scraped.experience);
      if (expectedLevel !== scraped.level) {
        console.warn(
          `[${id}] aviso: nível reportado pelo guildstats (${scraped.level}) difere do calculado pela fórmula (${expectedLevel}) para ${scraped.experience} XP.`
        );
      }

      history.push({ ...scraped, scrapedAt: new Date().toISOString() });
      history.sort((a, b) => a.date.localeCompare(b.date));
      saveHistory(id, history);

      console.log(`[${id}] guardado: ${scraped.date} — nível ${scraped.level}, ${scraped.experience.toLocaleString('pt-PT')} XP.`);
      successCount++;
    } catch (error) {
      failureCount++;
      console.error(`[${id}] falhou: ${error.message}`);
    }
  }

  console.log(`\nResumo: ${successCount} sucesso(s), ${failureCount} falha(s).`);

  if (failureCount > 0 && successCount === 0) {
    process.exitCode = 1;
  }
}

main();
