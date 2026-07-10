// Records the 2 active modifiers for a Tibiadrome rotation and commits +
// pushes the update. Meant to be run locally (not in CI) — the app's
// "Copiar comando" button generates the exact invocation after parsing the
// pasted in-game announcement, so this is normally just paste-and-run:
//
//   node scripts/save-modifier-rotation.mjs 131 "Somersault" "Tanked Up"
//
// Never overwrites or deletes existing entries — only appends when the
// rotation number isn't already recorded, same idempotency rule as
// scrape-experience.mjs.
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Same 9 modifiers as src/data/tibiadrome/modifiers.ts — duplicated here so
// this script stays a standalone Node file with no build step.
const KNOWN_MODIFIERS = [
  'Somersault',
  'Going Down With Me',
  'Exploding Corpses',
  'That Escalated Quickly',
  'The Floor is Lava',
  'Beam me Up!',
  'Tanked Up',
  'Sown Sorrow',
  'Bad Roots',
];

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveModifierName(input) {
  const normalizedInput = normalize(input);
  const match = KNOWN_MODIFIERS.find((name) => normalize(name) === normalizedInput);
  if (!match) {
    throw new Error(
      `"${input}" não corresponde a nenhum dos 9 modificadores conhecidos: ${KNOWN_MODIFIERS.join(', ')}`
    );
  }
  return match;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'tibiadrome', 'modifiers-history.json');

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
  const [rotationArg, modifier1Arg, modifier2Arg] = process.argv.slice(2);

  if (!rotationArg || !modifier1Arg || !modifier2Arg) {
    console.error('Uso: node scripts/save-modifier-rotation.mjs <número da rotação> "<modificador 1>" "<modificador 2>"');
    process.exitCode = 1;
    return;
  }

  const rotation = Number(rotationArg);
  if (!Number.isInteger(rotation) || rotation <= 0) {
    console.error(`Número de rotação inválido: "${rotationArg}"`);
    process.exitCode = 1;
    return;
  }

  let modifiers;
  try {
    modifiers = [resolveModifierName(modifier1Arg), resolveModifierName(modifier2Arg)];
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const history = loadHistory();
  if (history.some((entry) => entry.rotation === rotation)) {
    console.log(`Rotação #${rotation} já estava registada — a ignorar.`);
    return;
  }

  history.push({ rotation, modifiers, recordedAt: new Date().toISOString() });
  history.sort((a, b) => a.rotation - b.rotation);
  saveHistory(history);

  console.log(`Rotação #${rotation} guardada: ${modifiers.join(', ')}.`);

  const repoRoot = join(__dirname, '..');
  execSync('git add data/tibiadrome/modifiers-history.json', { cwd: repoRoot, stdio: 'inherit' });
  execSync(`git commit -m "chore: registar modificadores da rotação #${rotation}"`, { cwd: repoRoot, stdio: 'inherit' });
  execSync('git push', { cwd: repoRoot, stdio: 'inherit' });
}

main();
