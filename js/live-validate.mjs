// js/live-validate.mjs
// Usage: node js/live-validate.mjs
// Checks data/live.json before a push. Exits 1 on any problem.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateLive } from './live-schema.mjs';

const file = fileURLToPath(new URL('../data/live.json', import.meta.url));

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`live.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

const { ok, errors } = validateLive(data);
if (!ok) {
  console.error('live.json has problems:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('live.json OK');
