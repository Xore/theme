#!/usr/bin/env node
/*
 * Sanity checks for the example pages (the visual acceptance suite).
 *
 * Zero dependencies. For every examples/*.html file it verifies:
 *   - a doctype and <title> are present
 *   - the page links the shared ../theme.css
 *   - every relative href/src target exists on disk
 *
 * Usage: node scripts/check-examples.mjs [dir]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dir = process.argv[2] || 'examples';
const htmlFiles = readdirSync(dir).filter((name) => name.endsWith('.html'));
let failures = 0;

function fail(file, message) {
  failures += 1;
  console.error(`✗ ${file}: ${message}`);
}

if (!htmlFiles.length) {
  console.error(`✗ no HTML files found in ${dir}`);
  process.exit(1);
}

for (const name of htmlFiles) {
  const file = join(dir, name);
  const html = readFileSync(file, 'utf8');

  if (!/^\s*<!doctype html>/i.test(html)) fail(file, 'missing <!doctype html>');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(file, 'missing <title>');
  if (!/href=["']\.\.\/theme\.css["']/.test(html)) {
    fail(file, 'does not link the shared ../theme.css');
  }

  const attrPattern = /(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attrPattern)) {
    const target = match[1];
    if (/^(#|https?:|mailto:|tel:|data:|\/)/i.test(target)) continue;
    const [pathPart] = target.split(/[?#]/);
    const resolved = resolve(dirname(file), decodeURIComponent(pathPart));
    if (!existsSync(resolved)) fail(file, `broken local reference "${target}"`);
  }
}

if (failures) {
  console.error(`${failures} problem(s) across ${htmlFiles.length} page(s)`);
  process.exit(1);
}
console.log(`✓ ${htmlFiles.length} example page(s) OK: ${htmlFiles.join(', ')}`);
