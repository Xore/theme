#!/usr/bin/env node
/*
 * WCAG AA enforcement for every theme in every mode.
 *
 * Contrast in this stylesheet used to be verified by hand and recorded as
 * prose next to the tokens ("measured 4.6-4.7:1 against a real rendered
 * page… one shade from failing"). That was careful work, but nothing read
 * it, and the ratios drifted more than once — the *-badge-fill family
 * exists because a regression shipped and an operator reported a
 * country-code badge they could not read.
 *
 * With seven themes across two modes that approach stops being viable, so
 * the pair table lives in scripts/theme-tokens.mjs (auditMode) and this
 * runs it. It reports measured ratios and margins, so a near-miss is
 * visible before it becomes a bug.
 *
 * Alpha is composited, not compared raw: a *-soft token is measured as it
 * actually renders — flattened over --surface-1 over the page ground —
 * which is precisely what the original a11y pass found failing.
 *
 *   node scripts/check-contrast.mjs            # summary, non-zero on failure
 *   node scripts/check-contrast.mjs --verbose  # every measured pair
 *   node scripts/check-contrast.mjs --margins  # the ten thinnest passes
 */
import { THEMES, LEGACY_ACCENTS, buildMode, buildLegacyAccent, auditMode, contrast, composite, REFERENCE, KNOWN_EXCEPTIONS, isKnownException, assertIdentity } from './theme-tokens.mjs';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const margins = args.includes('--margins');

const rows = [];
for (const theme of Object.keys(THEMES)) {
  for (const mode of ['light', 'dark']) {
    for (const row of auditMode(buildMode(theme, mode))) rows.push({ theme, mode, ...row });
  }
}

/* The legacy accent-only presets inherit the default theme's surfaces, so
   they are measured against those rather than against a surface family of
   their own. */
for (const name of Object.keys(LEGACY_ACCENTS)) {
  for (const mode of ['light', 'dark']) {
    const t = buildLegacyAccent(name, mode);
    const s1 = REFERENCE[mode]['surface-1'];
    const softAlpha = mode === 'dark' ? 0.16 : 0.13;
    const check = (label, fg, bg, target) => {
      const ratio = contrast(fg, bg);
      rows.push({ theme: `${name} (legacy)`, mode, label, ratio, target, pass: ratio >= target });
    };
    check('accent-text-on-soft vs accent-soft over surface-1', t['accent-text-on-soft'], composite(t.accent, softAlpha, s1), 4.5);
    check('text-link vs surface-1', t['text-link'], s1, 4.5);
    check('text-on-accent vs accent', t['text-on-accent'], t.accent, 4.5);
    check('border-focus vs surface-1', t['border-focus'], s1, 3);
  }
}

const identityDrift = assertIdentity();
if (identityDrift.length) {
  console.error('✗ the default theme drifted from its pinned values:\n');
  for (const d of identityDrift) console.error(`  ${d}`);
  process.exit(1);
}

const failures = rows.filter((r) => !r.pass && !isKnownException(r));
const excepted = rows.filter((r) => !r.pass && isKnownException(r));

if (verbose) {
  let current = '';
  for (const r of rows) {
    const key = `${r.theme}/${r.mode}`;
    if (key !== current) {
      current = key;
      console.log(`\n${key}`);
    }
    const mark = r.pass ? '  ok ' : ' FAIL';
    console.log(`${mark} ${r.ratio.toFixed(2).padStart(6)}:1  (>= ${r.target})  ${r.label}`);
  }
  console.log('');
}

if (margins) {
  const thinnest = rows.filter((r) => r.pass).sort((a, b) => (a.ratio - a.target) - (b.ratio - b.target)).slice(0, 10);
  console.log('\nThinnest passing margins:');
  for (const r of thinnest) {
    console.log(`  +${(r.ratio - r.target).toFixed(2)}  ${r.ratio.toFixed(2)}:1  ${r.theme}/${r.mode}  ${r.label}`);
  }
  console.log('');
}

if (failures.length) {
  console.error(`✗ ${failures.length} of ${rows.length} contrast checks below target:\n`);
  for (const r of failures) {
    console.error(`  ${r.theme}/${r.mode}: ${r.label}`);
    console.error(`      measured ${r.ratio.toFixed(2)}:1, needs ${r.target}:1`);
  }
  console.error('\nAdjust scripts/theme-tokens.mjs and re-run `node scripts/gen-themes.mjs`.');
  process.exit(1);
}

if (excepted.length) {
  console.log(`\n${excepted.length} documented exception(s) — failing, and shipping anyway:`);
  for (const r of excepted) {
    const note = KNOWN_EXCEPTIONS.find((e) => e.theme === r.theme && e.mode === r.mode && e.label === r.label);
    console.log(`  ${r.theme}/${r.mode}: ${r.label} — ${r.ratio.toFixed(2)}:1, needs ${r.target}:1`);
    console.log(`      ${note.reason}`);
  }
  console.log('');
}

const themeCount = Object.keys(THEMES).length;
const legacyCount = Object.keys(LEGACY_ACCENTS).length;
const thinnest = rows.filter((r) => r.pass).reduce((m, r) => Math.min(m, r.ratio - r.target), Infinity);
console.log(
  `✓ ${rows.length - excepted.length} of ${rows.length} contrast checks pass across ${themeCount} themes + ${legacyCount} legacy accents x 2 modes `
  + `(thinnest margin +${thinnest.toFixed(2)})`,
);
