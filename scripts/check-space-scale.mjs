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
 * Usage: node scripts/check-space-scale.mjs [file]
 */
import { readFileSync } from 'node:fs'

// Relative to the working directory, like the sibling checks: CI runs
// them all from the repository root.
const FILE = process.argv[2] ?? 'theme.css'
const MIN_COVERAGE = 78 // current is 81%; this catches drift, not rounding

const PROPS =
  '(?:padding|margin)(?:-(?:top|right|bottom|left))?' +
  '|(?:padding|margin)-(?:block|inline)(?:-(?:start|end))?' +
  '|gap|row-gap|column-gap'

const css = readFileSync(FILE, 'utf8')
const declaration = new RegExp(`(?<![\\w-])(${PROPS})\\s*:\\s*([^;{}]+);`, 'g')

let total = 0
let tokenised = 0
const offenders = []

for (const match of css.matchAll(declaration)) {
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
      `want at least ${MIN_COVERAGE}% and no rhythm-sized literals.`,
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
  `✓ space scale: ${tokenised}/${total} spacing declarations use var(--space-*) (${coverage}%)`,
)
