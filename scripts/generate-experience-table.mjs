// One-off generator: builds src/data/tibia_experience_table.json from the
// official Tibia experience formula. Re-run with `node scripts/generate-experience-table.mjs`
// if MAX_LEVEL ever needs to change.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MAX_LEVEL = 3500;

function experienceForLevel(level) {
  return Math.round((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

const table = [];
for (let level = 1; level <= MAX_LEVEL; level++) {
  table.push({ level, experience: experienceForLevel(level) });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'data', 'tibia_experience_table.json');

writeFileSync(outPath, JSON.stringify(table, null, 2));
console.log(`Wrote ${table.length} entries to ${outPath}`);
console.log('Sample:', table[0], table[1], table[table.length - 1]);
