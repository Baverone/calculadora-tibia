// Shared guildstats.eu scraping + history-merging logic, used by both
// scrape-experience.mjs (the 3 main characters) and
// scrape-team-experience.mjs (the auto-tracked Equipa players). The two
// scripts were byte-for-byte duplicates of each other apart from their
// player list and output dir; keeping the logic here means a fix lands in
// both at once instead of needing a "keep in sync" comment.
//
// Endpoint discovered by inspecting guildstats.eu's own front-end JS: the
// character page loads its "Experience" tab via this internal AJAX route,
// which returns a small self-contained HTML fragment (no JS execution
// needed to read it).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';

// Same formula as src/domain/experienceTable.ts — duplicated here so these
// scripts stay standalone Node files with no build step. Keep in sync.
export function experienceForLevel(level) {
  return Math.round((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

export function levelForExperience(experience) {
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

/**
 * Only proceed once the Tibia server save (09:00 Lisbon) has happened today.
 * No upper bound — GitHub Actions "schedule" triggers can be delayed by
 * hours under load, and a narrow window (e.g. "only 9-10am") means a
 * delayed run silently misses the whole day. Safe to leave open-ended
 * because we only ever append dates we don't already have.
 */
export function isAfterLisbonServerSave() {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', hour12: false }).format(new Date())
  );
  return hour >= 9;
}

/**
 * Every experience row guildstats.eu exposes for this character (it serves
 * ~30 days, newest first), not just the latest one.
 *
 * Reading the whole table is what makes the scraper self-healing: any day
 * missed while the workflow was failing/paused gets backfilled on the next
 * successful run, as long as it's still inside guildstats' window. Reading
 * only the first row (the old behaviour) meant a missed day was lost
 * forever, since nothing ever looked back at it again.
 */
export async function fetchExperienceRows(nick) {
  const encodedNick = encodeURIComponent(nick).replace(/%20/g, '+');
  const url = `https://guildstats.eu/include/character/tab.php?nick=${encodedNick}&tab=experience`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'CalculadoraTibia-XP-Tracker/1.0 (personal use, 1 request/character/day)' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching experience tab for "${nick}"`);
  }

  const $ = cheerio.load(await response.text());
  const rows = $('table tbody tr');
  if (rows.length === 0) {
    throw new Error(`No experience history rows found for "${nick}" (page layout may have changed)`);
  }

  const parsed = [];
  rows.each((_, element) => {
    const cells = $(element).find('td');
    const date = cells.eq(0).find('span.hidden.md\\:inline').first().text().trim();
    // The level cell appends a "(+N)" level-up badge on days the character
    // leveled up (e.g. "1150            (+1)") — parseInt reads the leading
    // number and ignores that trailing text, where Number() would return NaN.
    const level = parseInt(cells.eq(3).text().trim(), 10);
    const experience = Number(cells.eq(4).text().trim().replace(/,/g, ''));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(level) || !Number.isFinite(experience)) return;
    parsed.push({ date, level, experience });
  });

  if (parsed.length === 0) {
    throw new Error(`Could not parse any experience row for "${nick}" (page layout may have changed)`);
  }

  return parsed;
}

function historyPath(dataDir, id) {
  return join(dataDir, `${id}.json`);
}

export function loadExistingHistory(dataDir, id) {
  const path = historyPath(dataDir, id);
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(dataDir, id, history) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(historyPath(dataDir, id), `${JSON.stringify(history, null, 2)}\n`);
}

/**
 * Scrapes one player and appends every day guildstats knows about that isn't
 * already in their history file. Existing entries are never overwritten —
 * the stored date wins — so re-running is always a safe no-op once caught up.
 */
async function syncPlayer({ id, nick, dataDir }) {
  const rows = await fetchExperienceRows(nick);
  const history = loadExistingHistory(dataDir, id);
  const knownDates = new Set(history.map((entry) => entry.date));

  const missing = rows.filter((row) => !knownDates.has(row.date)).sort((a, b) => a.date.localeCompare(b.date));

  if (missing.length === 0) {
    console.log(`[${id}] já está em dia (mais recente disponível: ${rows[0].date}) — nada a fazer.`);
    return 0;
  }

  const scrapedAt = new Date().toISOString();
  for (const row of missing) {
    const expectedLevel = levelForExperience(row.experience);
    if (expectedLevel !== row.level) {
      console.warn(
        `[${id}] aviso: nível reportado pelo guildstats (${row.level}) difere do calculado pela fórmula (${expectedLevel}) para ${row.experience} XP.`
      );
    }
    history.push({ ...row, scrapedAt });
  }

  history.sort((a, b) => a.date.localeCompare(b.date));
  saveHistory(dataDir, id, history);

  // Report the range, not the last appended entry's level — when backfilling
  // old gaps the newest row isn't the one we just added, and saying "agora no
  // nível X" for a level from two weeks ago is actively misleading.
  const range = missing.length === 1 ? missing[0].date : `${missing[0].date} a ${missing[missing.length - 1].date}`;
  const latest = rows[0];
  console.log(
    `[${id}] guardado(s) ${missing.length} dia(s): ${range}. Mais recente disponível: ${latest.date} (nível ${latest.level}).`
  );
  return missing.length;
}

/**
 * Runs the scrape for a list of players. A failure for one player never
 * blocks the others; the process only fails when every player failed.
 */
export async function runScraper({ players, dataDir }) {
  if (!isAfterLisbonServerSave() && process.env.FORCE_SCRAPE !== 'true') {
    console.log('Ainda não passou o server save das 9h em Lisboa — a ignorar esta execução.');
    return;
  }

  let addedTotal = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const player of players) {
    try {
      addedTotal += await syncPlayer({ ...player, dataDir });
      successCount++;
    } catch (error) {
      failureCount++;
      console.error(`[${player.id}] falhou: ${error.message}`);
    }
  }

  console.log(`\nResumo: ${successCount} jogador(es) ok, ${failureCount} falha(s), ${addedTotal} dia(s) novo(s) guardado(s).`);

  if (failureCount > 0 && successCount === 0) {
    process.exitCode = 1;
  }
}
