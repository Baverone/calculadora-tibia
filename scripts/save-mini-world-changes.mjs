// Records the Mini World Changes active on a given Tibia day and commits +
// pushes the update. Meant to be run locally (not in CI) — the app's
// "Copiar comando" button generates the exact invocation after parsing the
// pasted Towncryer/World Board text, so this is normally just paste-and-run:
//
//   node scripts/save-mini-world-changes.mjs 2026-07-10 "Bank Robbery" "Thawing"
//
// Unlike the Tibiadrome modifiers (always exactly 2), any number of events
// (1 or more) can be active on a given day. Never overwrites or deletes
// existing entries — only appends when the date isn't already recorded.
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Same list as src/data/miniWorldChanges/events.ts — duplicated here so
// this script stays a standalone Node file with no build step.
const KNOWN_EVENTS = [
  'Bank Robbery',
  'Beaver Breakout',
  'Bibby Bloodbath',
  'Bored Witch',
  'Chakoya Iceberg',
  'Chyllfroest',
  "Devovorga's Essence",
  'Dworc Camp',
  'Forsaken',
  'Fury Gates',
  'Goroma Eruption',
  'Grimvale Moon',
  'Hive Outpost',
  'Hunter Camp',
  'Lumberjack',
  'Nightmare',
  'Nomads',
  'Noodles is Gone',
  'Poacher Caves',
  'Oriental Trader',
  'River Flood',
  'River Runs Deep',
  'Shipwrecked',
  "Spider's Nest",
  'Spirit Gate',
  'Stampede',
  'Thais Kingsday',
  'Thawing',
];

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveEventName(input) {
  const normalizedInput = normalize(input);
  const match = KNOWN_EVENTS.find((name) => normalize(name) === normalizedInput);
  if (!match) {
    throw new Error(`"${input}" não corresponde a nenhuma mini world change conhecida.`);
  }
  return match;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'mini-world-changes', 'history.json');

function loadHistory() {
  if (!existsSync(DATA_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, `${JSON.stringify(history, null, 2)}\n`);
}

function main() {
  const [dateArg, ...eventArgs] = process.argv.slice(2);

  if (!dateArg || eventArgs.length === 0) {
    console.error('Uso: node scripts/save-mini-world-changes.mjs <YYYY-MM-DD> "<evento 1>" ["<evento 2>" ...]');
    process.exitCode = 1;
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    console.error(`Data inválida: "${dateArg}" (formato esperado: YYYY-MM-DD)`);
    process.exitCode = 1;
    return;
  }

  let events;
  try {
    events = eventArgs.map(resolveEventName);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const history = loadHistory();
  if (history.some((entry) => entry.date === dateArg)) {
    console.log(`Dia ${dateArg} já estava registado — a ignorar.`);
    return;
  }

  history.push({ date: dateArg, events, recordedAt: new Date().toISOString() });
  history.sort((a, b) => a.date.localeCompare(b.date));
  saveHistory(history);

  console.log(`Dia ${dateArg} guardado: ${events.join(', ')}.`);

  const repoRoot = join(__dirname, '..');
  execSync('git add data/mini-world-changes/history.json', { cwd: repoRoot, stdio: 'inherit' });
  execSync(`git commit -m "chore: registar mini world changes de ${dateArg}"`, { cwd: repoRoot, stdio: 'inherit' });
  execSync('git push', { cwd: repoRoot, stdio: 'inherit' });
}

main();
