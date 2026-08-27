#!/usr/bin/env node
/*
 * The --space-* scale must stay load-bearing (#105).
 *
 * The scale was defined and then barely used: 16 references against 454
 * literal spacing declarations. That made it decorative, and decorative in
 * a way nothing catches -- the tokens exist, the file passes every other
 * check, and redefining --space-md simply does not move the page.
 *
 * It matters because rescaling layout is a feature, not a nicety. The
 * density control in Xore/APIARY#1759 is `[data-hp-density="compact"] {
 * --space-md: 9px }` and nothing more, which works only if the tokens are
 * what actually produce the spacing. Half-converted is the worst outcome:
 * some things tighten, most do not, and it reads as a rendering bug rather
 * than an unimplemented feature.
 *
 * So this asserts the property directly rather than trusting review, and
 * fails when it slips -- a hundred new literal paddings would otherwise
 * accumulate one component at a time, exactly as they did before.
 *
 * Deliberately not counted as failures: 1-3px values, which are hairlines
 * and optical nudges rather than rhythm, and anything past the top step,
 * which has nothing to snap to.
 *
 * Also not counted, but by explicit declaration: spans bracketed by paired
 * `space-scale: exempt-start` / `exempt-end` comments hold spacing migrated
 * verbatim from a consuming repository -- Xore/APIARY vendors this
 * stylesheet byte-for-byte, so snapping it here would fork the vendor copy
 * (#138). Their declarations leave both totals, so coverage keeps measuring
 * what this file authors, and every run prints how many rules ride outside
 * the gate inside them.
 *
 * Usage: node scripts/check-space-scale.mjs [file]
 */
import { readFileSync } from 'node:fs'

// Relative to the working directory, like the sibling checks: CI runs
// them all from the repository root.
const FILE = process.argv[2] ?? 'theme.css'
const MIN_COVERAGE = 78 // catches downward drift only; rises with real adoption

const PROPS =
  '(?:padding|margin)(?:-(?:top|right|bottom|left))?' +
  '|(?:padding|margin)-(?:block|inline)(?:-(?:start|end))?' +
  '|gap|row-gap|column-gap'

const css = readFileSync(FILE, 'utf8')
const declaration = new RegExp(`(?<![\\w-])(${PROPS})\\s*:\\s*([^;{}]+);`, 'g')

// Exempt spans must come in pairs: an unpaired start would otherwise blank
// the rest of the file and look like a clean pass, so refuse to run rather
// than guess (#138). A marker is any comment whose body opens with
// `space-scale: exempt-start` or `space-scale: exempt-end` -- whatever
// follows within the comment is annotation.
const events = []
for (const comment of css.matchAll(/\/\*[\s\S]*?\*\//g)) {
  const body = comment[0].slice(2)
  if (/^\s*space-scale:\s*exempt-start/.test(body)) events.push(['open', comment])
  if (/^\s*space-scale:\s*exempt-end/.test(body)) events.push(['close', comment])
}

let expectingOpen = true
for (const [kind] of events) {
  if ((kind === 'open') !== expectingOpen) {
    console.error('space scale: unbalanced space-scale: exempt-start / exempt-end markers')
    process.exit(1)
  }
  expectingOpen = !expectingOpen
}

/* The spans are blanked line-for-line, never cut, so byte offsets -- and
   therefore reported line numbers -- stay real for everything around them.
   Their declarations drop from BOTH counts: coverage keeps meaning "share
   of what this file authors", and what rides outside the gate is printed,
   never hidden. */
let exempted = 0
let scanCss = ''
let cursor = 0
let spanFrom = 0
for (const [kind, comment] of events) {
  if (kind === 'open') {
    spanFrom = comment.index
    scanCss += css.slice(cursor, comment.index)
    cursor = comment.index
  } else {
    const through = comment.index + comment[0].length
    exempted += [...css.slice(spanFrom, through).matchAll(declaration)].length
    scanCss += css.slice(cursor, through).replace(/[^\n]/g, ' ')
    cursor = through
  }
}
scanCss += css.slice(cursor)

let total = 0
let tokenised = 0
const offenders = []

for (const match of scanCss.matchAll(declaration)) {
  const [, property, value] = match
  total += 1
  if (value.includes('var(--space')) {
    tokenised += 1
    continue
  }
  // A literal that is a rhythm value rather than a hairline or a one-off.
  const rhythm = [...value.matchAll(/(\d+(?:\.\d+)?)px/g)]
    .map((m) => Number(m[1]))
    .filter((px) => px >= 4 && px <= 40)
  if (rhythm.length > 0) {
    const line = css.slice(0, match.index).split('\n').length
    offenders.push(`  theme.css:${line}  ${property}: ${value.trim()};`)
  }
}

const coverage = Math.floor((tokenised * 100) / total)
if (coverage < MIN_COVERAGE || offenders.length > 0) {
  console.error(
    `space scale: ${tokenised}/${total} spacing declarations use var(--space-*) (${coverage}%), ` +
      `want at least ${MIN_COVERAGE}% and no rhythm-sized literals` +
      (exempted > 0 ? `; another ${exempted} sit inside declared exempt spans.` : '.'),
  )
  if (offenders.length > 0) {
    console.error('\nliteral spacing that should use the scale:')
    console.error(offenders.slice(0, 40).join('\n'))
    if (offenders.length > 40) console.error(`  ... and ${offenders.length - 40} more`)
  }
  console.error(
    '\nSnap to the nearest step rather than adding one: 4 8 12 16 24 32 40.\n' +
      'A value that is genuinely a constraint (a hairline, an icon box, a fixed\n' +
      'panel width) belongs outside these properties or outside 4-40px.',
  )
  process.exit(1)
}

console.log(
  `✓ space scale: ${tokenised}/${total} spacing declarations use var(--space-*) (${coverage}%)` +
    (exempted > 0 ? `, plus ${exempted} inside declared exempt spans` : ''),
)
