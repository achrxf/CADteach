// Regenerates the precache list in sw.js from the files in the repo.
// Run after adding or renaming files:  node scripts/build-sw.mjs
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const include = ['index.html', 'manifest.webmanifest', 'css', 'js', 'fonts', 'icons', 'vendor', 'img', 'parts'];
const files = [];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).forEach((f) => walk(join(p, f))) : files.push(p));
include.forEach((p) => walk(join(root, p)));
const list = files.map((f) => './' + relative(root, f).split('\\').join('/')).sort();
const hash = createHash('sha1');
files.sort().forEach((f) => hash.update(readFileSync(f)));
const version = hash.digest('hex').slice(0, 10);
const sw = readFileSync(join(root, 'sw.js'), 'utf8')
  .replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`)
  .replace(/const FILES = \[[\s\S]*?\];/, `const FILES = ${JSON.stringify(['./', ...list], null, 2)};`);
writeFileSync(join(root, 'sw.js'), sw);
console.log(`sw.js: ${list.length} files, version ${version}`);
