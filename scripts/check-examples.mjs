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

  const ids = new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
  );
  for (const match of html.matchAll(/\bdata-open-dialog=["']([^"']+)["']/gi)) {
    if (!ids.has(match[1])) fail(file, `dialog opener targets missing id "${match[1]}"`);
  }
  for (const match of html.matchAll(/<[^>]*\bdata-dialog-backdrop=["']([^"']+)["'][^>]*>/gi)) {
    const tag = match[0];
    if (!ids.has(match[1])) fail(file, `dialog backdrop targets missing id "${match[1]}"`);
    if (!/\baria-hidden=["']true["']/i.test(tag)) {
      fail(file, `dialog backdrop "${match[1]}" must start with aria-hidden="true"`);
    }
    if (!/\binert(?:\s|=|>)/i.test(tag)) {
      fail(file, `dialog backdrop "${match[1]}" must start inert`);
    }
  }

  const permanent = html.match(/<dialog[^>]*\bdata-permanent-dialog\b[^>]*>/i);
  if (permanent) {
    const permanentStart = permanent.index;
    const permanentEnd = html.lastIndexOf('</dialog>');
    if (permanentEnd < permanentStart) fail(file, 'permanent dialog is not closed');
    for (const match of html.matchAll(/\bdata-dialog-backdrop=["']([^"']+)["']/gi)) {
      if (match.index < permanentStart || match.index > permanentEnd) {
        fail(file, `nested backdrop "${match[1]}" is outside the permanent dialog`);
      }
    }
    const permanentId = permanent[0].match(/\bid=["']([^"']+)["']/i)?.[1];
    if (permanentId &&
        new RegExp(`data-close-dialog=["']${permanentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html)) {
      fail(file, `permanent dialog "${permanentId}" must not expose a close control`);
    }
  }
}

if (failures) {
  console.error(`${failures} problem(s) across ${htmlFiles.length} page(s)`);
  process.exit(1);
}
console.log(`✓ ${htmlFiles.length} example page(s) OK: ${htmlFiles.join(', ')}`);
