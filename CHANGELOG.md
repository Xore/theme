# Changelog

Notable changes to `theme.css` / `theme.js`, newest first. Each entry links
the PR that shipped it. Seeded from #22 onward; maintain it as part of the
normal PR process going forward -- add an entry in the same PR as the
change, not as a follow-up.

## Unreleased

- **`.data-table--responsive` cards no longer let a long single-line value
  escape the card at phone widths.** The `@media (max-width: 720px)` block
  already sets `white-space: normal` on the cell, but the desktop rule
  `td.v a, td.n { white-space: nowrap; }` targets the anchor/cell inside it
  and had no phone-width exception, so a long value (a user-agent string, an
  AS name) stayed on one line and ran off the card with no way to scroll to
  the rest of it. `.data-table--responsive td.v a, .data-table--responsive
  td.n` now get `white-space: normal; overflow-wrap: anywhere` inside that
  same media block (`anywhere` rather than `break-word` because these are
  single unbroken tokens with no natural wrap point).

- **`theme.js` now suppresses the transition flash on theme and mode
  swaps.** `.hp-theme-switching` (`transition: none !important`) has been in
  the stylesheet since APIARY#1830, but nothing ever wrote the class, so a
  full-surface swap animated through every intermediate colour on its way to
  the new theme. `applyTheme()`/`applyHpTheme()` wrap their attribute writes
  in the class now and release it on the second painted frame -- the first
  shows the new theme, the second confirms it stuck -- falling back to a
  synchronous release where `requestAnimationFrame` is unavailable, because
  a class that is never released would suppress transitions forever.

- Examples: brought every page current with the generated-theme refactor and
  #1753's follow-ups. `components.html` gains the static theme-gallery
  reference, the full surface-ramp swatch row, and a render-first skeleton
  doctrine -- placeholders drawn as the anatomy they will be swapped for at
  the size the data will occupy, with a live rig showing reserve, hydrate,
  and shrink-to-fit -- plus the shape-matched placeholder primitives.
  `settings.html` gains an interactive Appearance card built from the same
  gallery tiles (radiogroup semantics; the page mirrors the stored theme
  onto `aria-checked`, which theme.js does not manage). `workspace.html`
  adopts `.sidebar__investigate`, `.sidebar__recent`, `.metric__delta` and
  `.metric__spark`. Captions naming retired tokens (`--surface-raised`,
  `--border-strong`) and radio pairs demoing a density axis the theme does
  not have are fixed, and `docs/TOKENS.md` / `docs/COMPONENTS.md` /
  `README.md` drift (blue links, `--artwork-bg`, the 9px/14px/18px radius
  ladder, "seven themes") is corrected.

- **Nine themes.** `ocean` and `rose` are promoted to full surface families
  alongside `claude`, `slate`, `sage`, `lavender`, `lime`, `amber` and
  `neon`, rather than remaining accent-only presets.

- **The status ramp is theme-scoped.** `--success`/`--info`/`--warning`/
  `--danger`/`--critical` and their `-soft`, `-text-on-soft` and
  `-badge-fill` families are generated per theme instead of shared. Each
  keeps its meaning-bearing hue family -- green reads as success, red as
  danger -- but is nudged 14% of the way toward its theme's ground hue,
  along the short way round the wheel, then AA-tuned against that theme's
  own surfaces. The pull is deliberately small: severity colour has to stay
  learnable across themes, so this harmonises it rather than reassigning it.

- **Backgrounds, text and borders are numbered ramps.** `--app-bg` becomes
  `--bg-000`, `--surface-0..3` become `--bg-100..400`, `--surface-hover`
  becomes `--bg-500`, and `--surface-raised`/`--sidebar-bg`/`--toolbar-bg`
  become `--bg-raised`/`--bg-sidebar`/`--bg-toolbar`. `--text-primary`,
  `--text-secondary`, `--text-muted`, `--text-disabled` become
  `--text-000..300`; `--border-subtle`/`--border-strong` become
  `--border-100`/`--border-200`. The number is elevation, so a theme author
  fills a ramp instead of recalling which of seven surface nouns goes where.

  **Breaking, with no compatibility aliases**, by request. `docs/TOKENS.md`
  carries the full mapping.

- **The default theme's links are derived from its accent.** `claude`'s link
  family was blue rather than accent-derived, and the light value measured
  3.95:1 against the card surface -- failing AA on every link on every page
  (#103). Links, hover, switch fill and the focus ring are generated and
  AA-tuned like every other theme's now, so the exception list is empty
  again. The rest of `claude` stays pinned and byte-identical.

- **The `tw:*` utility classes are gone.** They were the residue of a
  Tailwind build dropped in #191, kept on as 55 hand-written rules. They are
  not a design system and do not belong in one. Consumers should use real
  classes or their own layout CSS.

- Fixed a bug the tinted grounds introduced: the ground's saturation
  multiplier was also applied to the text ramp, driving every non-default
  theme's body text to fully saturated pastel (`#c9e0ff` for slate,
  `#cbfdd0` for sage). Those still clear AA against a dark ground, so no
  contrast check caught it -- it simply looked wrong. Text is re-hued at the
  reference saturation now.

- **Themes are now full surface families, not accent swaps.** `data-hp-theme`
  selects one of seven themes -- `claude` (default), `slate`, `sage`,
  `lavender`, `lime`, `amber`, `neon` -- and each one owns the whole surface:
  ground, sidebar, toolbar, the `--surface-*` ramp, borders, the text ramp,
  elevation and the accent family, in both light and dark. Previously a
  preset could only reach eight accent/link tokens, so switching "theme"
  recoloured buttons on an identical warm-grey shell. Ground hues follow the
  same 2026 dashboard colour research the original presets were derived from
  -- the half of it (elevated neutrals, zinc/slate grounds, cool whites,
  "avoid grey-on-grey fatigue") that the old token contract made
  unreachable. `data-theme` (`light`/`dark`/absent) stays a separate,
  orthogonal axis, and `data-hp-palette` is accepted as an alias for
  `data-hp-theme` so existing consumers keep working.

- **One block per theme instead of three.** Token sets used to be written
  three times -- `:root` for dark, `[data-theme="light"]`, and a
  `prefers-color-scheme: light` copy of the second, with a comment asking
  the next editor to keep them in sync (they had already drifted:
  `--border-100`/`--border-200` differed between the two light
  blocks). Both modes now live in one `light-dark()` declaration, resolved
  by `color-scheme`. Seven themes in two modes would have been 42 blocks
  under the old shape.

- **Theme values are generated and contrast is enforced in CI.**
  `scripts/theme-tokens.mjs` holds the ground hue, saturation profile and
  accent seeds per theme; `scripts/gen-themes.mjs` emits the block and
  `scripts/check-contrast.mjs` asserts WCAG AA (4.5:1 text, 3:1 non-text)
  across every theme and mode, compositing alpha so a `-soft` token is
  measured as it actually renders. 422 pairs are checked on every run.
  Contrast used to be verified by hand and recorded as prose next to the
  tokens; that does not scale past two token sets, and it had already let
  regressions ship. `claude` is pinned rather than derived -- its values are
  hand-tuned in ways a generator should not second-guess -- and the
  generator asserts byte identity for all 29 of its tokens on every run.

  One pre-existing failure is recorded in `KNOWN_EXCEPTIONS` rather than
  silently fixed or silently tolerated: the default theme's light link blue
  (`#2a78d6`) measures 3.95:1 against `--bg-200`, below the AA floor.
  Moving a brand colour is a design decision, so it is tracked and printed
  on every run.

- **Six hardcoded black box-shadows now follow the theme.** `.card`,
  `.tab.active`, `.app-toolbar::before`, `.sidebar__item.active`,
  `.hp-row-actions` and `.hp-scroll-more` hardcoded `rgba(0, 0, 0, ...)`
  and so ignored the mode-aware shadow tokens sitting right next to them --
  visibly wrong in light mode long before themes existed. Adds
  `--shadow-inset` and `--shadow-pill` for the tighter elevations those
  rules needed.

- **The basemap filter and the brand-mark swap read intent tokens.**
  `.leaflet-tile-pane`'s dark-tile inversion and the `.theme-art--*` image
  swap both enumerated the literal strings `light` and `dark`, so any third
  theme silently got bright white map tiles inside a dark shell and the
  wrong brand mark on every page. They now read `--basemap-filter` and
  `--theme-art-*-display`, which the theme declares.

- `--artwork-bg` no longer pretends to be a theme token while never varying.
  It was a single cream value repeated in all three token blocks, so a promo
  or auth illustration flashed a light plate into a dark shell before its
  image loaded. Renamed to `--artwork-plate` (the old name is kept as a
  deprecated alias) and made mode-aware, keeping the brand cream in light.

- Adds `.diagram-plate` / `--diagram-plate`, a themed plate for
  black-on-transparent generated diagrams (graphviz call graphs) that carry
  no background of their own and are illegible on a dark ground.
  `.tw\:bg-white` stays literally white -- it is a generic utility whose
  name promises exactly that.

- **The terminal and framebuffer surfaces are tokens.** `.hp-tty-term` was a
  fixed `#16181d`/`#e6e6e6` slab and `.hp-vnc-canvas-wrap` a fixed `#000`,
  both outside the token system entirely. Now `--terminal-bg`,
  `--terminal-fg` and `--framebuffer-bg`, so a light-grounded theme does not
  get a black slab dropped into a paper-white page.

- **Fonts load via `<link>`, not `@import`.** The `@import` on line 7 put
  three serial round trips to a third-party host on the critical path for
  first paint, on every page load. Consumers now add two lines to `<head>`
  (see `docs/ADOPTION.md`); `examples/` carry them, and `check-css.mjs`
  rejects any `@import` in the stylesheet.

- `ocean` and `rose` are no longer offered as themes. They were fillers
  added to reach the original brief's "at least 8" and carry no
  colour-research backing, so they were not promoted to full surface
  families. They remain as deprecated accent-only presets so stored
  operator preferences do not silently lose their accent.

- Gave `.chip` a selected state (`background: var(--accent-soft)`,
  `border-color: var(--accent)`), the same accent-outline treatment
  `.segmented button[aria-pressed="true"]` and the reports gallery's
  `.hp-rp-template[aria-pressed="true"]` already use. It matches on both
  `[aria-pressed="true"]` and `.is-active`, because chips carry this state
  for two different reasons: a real toggle sets `aria-pressed`, while a chip
  that only *represents* something already applied -- an active filter
  scope, a non-zero count -- is not a toggle and should not claim to be one
  in the accessibility tree, so it opts in with `.is-active` instead. Hover
  is pinned to the same colours so a selected chip does not appear to
  deselect under the cursor. Found live in `Xore/APIARY`'s dashboard, where
  nine controls (analyzer selection in the payload workbench, report element
  selection, the live-tail toggle, applied filter scopes) rendered their
  selected state identically to their unselected one.

- Added reusable render-first data-surface primitives for shaped card, table,
  project-grid, and code placeholders; made `.skeleton-line` work on inline
  elements; and gave `.card__scroll` matching horizontal overflow and
  scrollbar affordance for wide bounded datasets.
- Fixed `.hp-brand-mark`'s dark/light theme-art toggle showing both images
  at once in dark mode: `.theme-art--light`'s own base-hide rule
  (specificity 0,1,0) loses to any container that styles its own
  `<img>`/`<picture>` children directly (e.g. `.hp-brand-mark img`,
  specificity 0,1,1). Light mode already had a high-enough-specificity
  override (`[data-theme="light"] .theme-art--dark`, 0,2,1) to hide the
  wrong image; nothing symmetric existed for dark mode. Added
  `[data-theme="dark"] .theme-art--light` and the matching
  `prefers-color-scheme: dark` no-override case. Found live in
  `Xore/honeypot-stack`'s dashboard sidebar logo.
- Fixed a real WCAG 2 AA contrast failure (1.4.3): light mode's `--accent`/
  `--accent-hover`/`--accent-pressed` were too light against `--text-on-accent`
  (3.76:1 on the base color, needs 4.5:1) -- found live by an axe scan against
  `Xore/auth-backend`'s login theme's primary button. Deepened all three
  stops (`#c76548`/`#b9583c`/`#a74b33` → `#af593f`/`#a34d35`/`#93422d`),
  preserving the same hue and the existing base/hover/pressed darkening
  order; all three now clear 4.5:1 against `--text-on-accent` with margin
  (4.68/5.50/6.62:1). Dark mode's accent tokens were already compliant
  (5.49:1) and are unchanged. `--accent-soft`/`--accent-text-on-soft`
  (translucent/badge pairings, a different contrast context) are unaffected.
- Dashboard ownership: moved APIARY's remaining static report, payload,
  sandbox, VNC, TTY, and IP-filter rules into the shared stylesheet; added
  compact theme-aware raster-brand and mobile-toolbar primitives. (#68)
- Typography: replaced the inherited Inter/Iowan/Palatino stacks with shared
  Xore font tokens and web-loaded Google Fonts: Space Grotesk for display,
  Fira Sans for interface text, and Fira Code for monospace evidence, with
  platform-native fallbacks.
- Docs: added this changelog, corrected `docs/CSP.md`'s inaccurate
  no-`style=""`-attribute claim and gave `.progress` a `--v`-driven fill
  (closing the one component that still needed a `style=""` attribute),
  added a status header to `docs/MIGRATE-HONEYPOT-STACK.md`, removed the
  stale `docs/SCREENSHOTS.md`, and added `docs/COMPONENTS.md`.
- Examples: demonstrated four real `Xore/auth-backend` SSO patterns
  (field-error + lockout states, a two-step identity/credential flow, the
  password-recovery sequence, and the passkeys zero-credential state) that
  had no coverage in `examples/`. (#65)
- Examples: demonstrated five real `Xore/honeypot-stack` dashboard patterns
  (the offline map fallback paired with `.heatmap`, all `.wb-state--*`
  colors, all `.hp-live-state` states, a stacked `.hp-toast-stack` demo,
  and `.hp-evidence-modal`) that had no coverage in `examples/`. (#64)
- `h3` now has a real size step above body copy; `.card--raised` gained the
  border every other raised-surface component already carries plus a
  stronger light-mode shadow; adopted the previously-unused `--space-*`
  scale for five components' padding. (#63)
- Added `[data-tip]` (CSS-only tooltip), `.popover`/`.popover__panel`
  (generic floating panel, built on the same `<details>` mechanism as
  `.action-menu`), `[data-copy]`/`.copy-field` (clipboard-copy primitive),
  `.skeleton`/`.skeleton-line` (loading placeholders), `.diff-line`/`--add`/
  `--del` (colored diff lines), and `.metric__trend--up`/`--down`. (#62)
- `.action-menu` now closes on Escape with arrow-key roving and
  focus-return to the trigger; `.tabs` gained ArrowLeft/ArrowRight/Home/End
  navigation; the `hp-nav-open` off-canvas drawer shipped a real
  `data-nav-toggle`/`data-nav-scrim` JS contract with a scrim, focus
  management, and `inert`/`aria-hidden` on the main region while open. (#61)
- Raised `--border-focus`, `--text-200`, `.badge--*`, and `.alert--*`
  contrast to WCAG minimums in both themes; added `--*-text-on-soft`
  tokens. (#60)
- `.card__value` gained `word-break` handling for long unbroken values
  (hashes, imphashes). (#29)
- `card: unified title/content/footer structure with fixed chrome +
  flexible content` -- `.card` is now a flex column with a pinned
  `.card__footer` and a scrollable `.card__content`/`.card__scroll`
  region. (#26, closing #24)
- Removed an app-specific `body { overflow: hidden }` hack that had leaked
  into the shared stylesheet. (#23)

## Earlier

See `git log` for the full history before #22 -- token/component additions
including `.mini-chart`, `.heatmap`, `.modal--palette`, the CSP contract,
critical severity tier, entrance/attention motion utilities, and the
initial fold-in of `Xore/honeypot-stack`'s and `Xore/auth-backend`'s
app-specific CSS into the shared file.
