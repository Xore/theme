#!/usr/bin/env node
/*
 * Emits the generated theme-surface block into theme.css, between the
 * BEGIN/END markers. Run after editing scripts/theme-tokens.mjs.
 *
 *   node scripts/gen-themes.mjs           # rewrite theme.css in place
 *   node scripts/gen-themes.mjs --check   # fail if theme.css is stale
 *   node scripts/gen-themes.mjs --print   # print the block, touch nothing
 *
 * One block per theme, both modes, via light-dark() — instead of the three
 * near-identical blocks (:root, [data-theme="light"], and the
 * prefers-color-scheme media query) the stylesheet used to need per token
 * set. Shadow *colours* are tokens here; the geometry is shared in the base
 * block, because light-dark() takes <color> only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { THEMES, DEFAULT_THEME, buildMode, auditMode, isKnownException, assertIdentity } from './theme-tokens.mjs';

const BEGIN = '/* >>> GENERATED THEME SURFACES — scripts/gen-themes.mjs — do not edit by hand */';
const END = '/* <<< END GENERATED THEME SURFACES */';

const EMIT_ORDER = [
  'bg-000', 'bg-sidebar', 'bg-toolbar',
  'bg-100', 'bg-200', 'bg-300', 'bg-400', 'bg-500', 'bg-raised',
  'border-100', 'border-200', 'border-focus',
  'text-000', 'text-100', 'text-200', 'text-300',
  'accent', 'accent-hover', 'accent-pressed', 'accent-soft', 'accent-text-on-soft',
  'text-on-accent', 'text-link', 'text-link-hover', 'switch-on',
  'text-on-status', 'control-knob',
  'btn-inverted-bg', 'btn-inverted-bg-hover', 'btn-inverted-text',
  'overlay-bg',
  'success', 'success-soft', 'success-text-on-soft', 'success-badge-fill',
  'info', 'info-soft', 'info-text-on-soft', 'info-badge-fill',
  'warning', 'warning-soft', 'warning-text-on-soft', 'warning-badge-fill',
  'danger', 'danger-soft', 'danger-text-on-soft', 'danger-badge-fill',
  'critical', 'critical-soft', 'critical-text-on-soft',
  'terminal-bg', 'terminal-fg', 'framebuffer-bg', 'diagram-plate',
  'shadow-raised-near', 'shadow-raised-far', 'shadow-dialog-near', 'shadow-dialog-far',
  'shadow-inset-color', 'shadow-pill-color',
];

function pair(lightValue, darkValue) {
  return lightValue === darkValue ? lightValue : `light-dark(${lightValue}, ${darkValue})`;
}

function declarations(light, dark, keys) {
  return keys
    .filter((k) => light[k] !== undefined)
    .map((k) => `  --${k}: ${pair(light[k], dark[k])};`);
}

function themeBlock(name) {
  const light = buildMode(name, 'light').tokens;
  const dark = buildMode(name, 'dark').tokens;
  const meta = THEMES[name];

  /* The default also answers to a bare :root, so a consumer that sets no
     attribute at all still gets a complete token set. [data-hp-palette] is
     accepted alongside [data-hp-theme] so the attribute consumers already
     write keeps working before they migrate. */
  const selectors = name === DEFAULT_THEME
    ? [':root', `[data-hp-theme="${name}"]`, `[data-hp-palette="${name}"]`]
    : [`[data-hp-theme="${name}"]`, `[data-hp-palette="${name}"]`];

  return [
    `/* ${meta.label} — ${meta.note} */`,
    `${selectors.join(',\n')} {`,
    ...declarations(light, dark, EMIT_ORDER),
    '}',
  ].join('\n');
}

function header() {
  return [
    BEGIN,
    '/*',
    ' * Generated — edit scripts/theme-tokens.mjs and re-run',
    ' * `node scripts/gen-themes.mjs`. `node scripts/check-contrast.mjs`',
    ' * enforces WCAG AA across every theme and mode in CI.',
    ' *',
    ' * A theme owns the whole surface: ground, sidebar, toolbar, the surface',
    ' * ramp, borders, the text ramp, elevation and the accent family. The',
    ' * semantic status ramp (success/info/warning/danger/critical) is shared',
    ' * tuned per theme: each status keeps its meaning-bearing hue family',
    ' * (green reads as success, red as danger) but is nudged toward the',
    ' * theme\'s ground so it sits in the theme rather than on top of it.',
    ' *',
    ' * Mode is decided by color-scheme: :root declares `light dark`, so the',
    ' * system preference wins by default and [data-theme="light"|"dark"]',
    ' * pins it. That is why one block covers both modes.',
    ' *',
    ' * `claude` is the default; its values are byte-identical to the ones',
    ' * that shipped before this block became generated, and the generator',
    ' * asserts that identity on every run.',
    ' */',
  ].join('\n');
}

function render() {
  const parts = [header(), ''];
  for (const name of Object.keys(THEMES)) parts.push(themeBlock(name), '');
  parts.push(END);
  return parts.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const block = render();

  if (args.includes('--print')) {
    process.stdout.write(`${block}\n`);
    return;
  }

  const file = 'theme.css';
  const css = readFileSync(file, 'utf8');
  const start = css.indexOf(BEGIN);
  const end = css.indexOf(END);
  if (start === -1 || end === -1) {
    console.error(`${file}: generated-theme markers not found`);
    process.exit(1);
  }
  const next = css.slice(0, start) + block + css.slice(end + END.length);

  if (args.includes('--check')) {
    if (next !== css) {
      console.error('theme.css is stale — run `node scripts/gen-themes.mjs`');
      process.exit(1);
    }
    console.log(`theme.css generated block is up to date (${Object.keys(THEMES).length} themes)`);
    return;
  }

  writeFileSync(file, next);
  const drift = assertIdentity();
  if (drift.length) {
    console.error('the default theme drifted from its pinned values:');
    for (const d of drift) console.error(`  ${d}`);
    process.exit(1);
  }
  const failures = Object.keys(THEMES).flatMap((n) =>
    ['light', 'dark'].flatMap((m) =>
      auditMode(buildMode(n, m))
        .filter((r) => !r.pass && !isKnownException({ theme: n, mode: m, label: r.label }))
        .map((r) => `${n}/${m}: ${r.label}`)),
  );
  console.log(`theme.css updated — ${Object.keys(THEMES).length} themes x 2 modes`);
  if (failures.length) {
    console.error(`WARNING: ${failures.length} contrast check(s) below target:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
}

main();
