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

const REQUEST_HEADERS = {
  // guildstats.eu intermittently answers datacenter/CI IPs (like GitHub
  // Actions runners) with 403 for a plain bot User-Agent — a browser-like UA
  // plus these headers get through far more reliably. Combined with the
  // retries in fetchExperienceRows, a run rarely loses a player to a 403.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://guildstats.eu/',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndParse(nick) {
  const encodedNick = encodeURIComponent(nick).replace(/%20/g, '+');
  const url = `https://guildstats.eu/include/character/tab.php?nick=${encodedNick}&tab=experience`;

  let response;
  try {
    response = await fetch(url, { headers: REQUEST_HEADERS });
  } catch (networkError) {
    // DNS/connection blips are transient — worth a retry / not a real bug.
    networkError.transient = true;
    throw networkError;
  }
  if (!response.ok) {
    const httpError = new Error(`HTTP ${response.status}`);
    // 403 (guildstats blocking a CI IP), 429 and 5xx are transient upstream
    // conditions, not a bug in this scraper — flagged so the job can skip
    // instead of failing red. A 404 (bad nick) etc. stays non-transient.
    httpError.transient = response.status === 403 || response.status === 429 || response.status >= 500;
    throw httpError;
  }

  const $ = cheerio.load(await response.text());
  const rows = $('table tbody tr');
  if (rows.length === 0) {
    throw new Error('nenhuma linha de histórico (o layout pode ter mudado)');
  }

  const parsed = [];
  rows.each((_, element) => {
    const cells = $(element).find('td');
    // The date and experience cells each hold two spans: the full value for
    // desktop and a short mobile abbreviation ("08-23", "26.5B"). Take the
    // first span (the full value) — calling .text() on the whole cell glues
    // the abbreviation on, which broke the date regex and turned experience
    // into NaN when guildstats redesigned the page (2026-08). Using
    // `.find('span')` instead of a `.md\:inline` class selector also keeps
    // this robust across cheerio versions (newer css-select rejects the
    // escaped `:` in that class name).
    const date = cells.eq(0).find('span').first().text().trim() || cells.eq(0).text().trim();
    // The level cell appends a "(+N)" level-up badge on days the character
    // leveled up (e.g. "1150 (+1)") — parseInt reads the leading number and
    // ignores that trailing text, where Number() would return NaN.
    const level = parseInt(cells.eq(3).text().trim(), 10);
    const experienceText = cells.eq(4).find('span').first().text().trim() || cells.eq(4).text().trim();
    const experience = Number(experienceText.replace(/,/g, ''));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(level) || !Number.isFinite(experience)) return;
    parsed.push({ date, level, experience });
  });

  if (parsed.length === 0) {
    throw new Error('nenhuma linha parseável (o layout pode ter mudado)');
  }

  return parsed;
}

/**
 * Every experience row guildstats.eu exposes for this character (it serves
 * ~30 days, newest first), not just the latest one.
 *
 * Reading the whole table is what makes the scraper self-healing: any day
 * missed while the workflow was failing/paused gets backfilled on the next
 * successful run, as long as it's still inside guildstats' window. Reading
 * only the first row (the old behaviour) meant a missed day was lost forever.
 *
 * Retries a few times with a growing delay, because guildstats hands out
 * intermittent 403s to CI IPs — a later attempt almost always gets through.
 */
export async function fetchExperienceRows(nick, { attempts = 3, retryDelayMs = 4000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchAndParse(nick);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(retryDelayMs * attempt);
    }
  }
  const wrapped = new Error(`falhou após ${attempts} tentativas para "${nick}": ${lastError.message}`);
  wrapped.transient = lastError.transient === true;
  throw wrapped;
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
 * Runs the scrape for a list of players. One player failing never blocks the
 * others. The job only exits non-zero for an actionable failure (a bad nick,
 * or a guildstats layout change that breaks parsing); transient upstream 403s
 * (guildstats throttling the CI IP) are logged and skipped so they don't turn
 * the workflow red — the self-healing backfill recovers on a later run.
 */
export async function runScraper({ players, dataDir }) {
  if (!isAfterLisbonServerSave() && process.env.FORCE_SCRAPE !== 'true') {
    console.log('Ainda não passou o server save das 9h em Lisboa — a ignorar esta execução.');
    return;
  }

  let addedTotal = 0;
  let successCount = 0;
  let failureCount = 0;
  let nonTransientFailure = false;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    try {
      addedTotal += await syncPlayer({ ...player, dataDir });
      successCount++;
    } catch (error) {
      failureCount++;
      if (!error.transient) nonTransientFailure = true;
      console.error(`[${player.id}] falhou: ${error.message}`);
    }
    // Space requests out so guildstats is less likely to 403 the next one.
    if (i < players.length - 1) await sleep(2000);
  }

  console.log(`\nResumo: ${successCount} jogador(es) ok, ${failureCount} falha(s), ${addedTotal} dia(s) novo(s) guardado(s).`);

  // Fail the job only for a real, actionable problem — a bad nick, or a
  // guildstats layout change that breaks parsing (a non-transient failure). A
  // transient 403 (guildstats blocking the runner's IP) isn't the scraper's
  // fault and the backfill recovers it later, so we skip rather than turn the
  // workflow red over something we can't fix here.
  if (nonTransientFailure) {
    process.exitCode = 1;
  } else if (failureCount > 0 && successCount === 0) {
    console.warn(
      'Todos os pedidos falharam por causas transitórias (ex.: 403 do guildstats a bloquear o IP do runner) — ' +
        'a saltar esta execução; o próximo run recupera os dias em falta.'
    );
  }
}
