# Changelog

Notable changes to `theme.css` / `theme.js`, newest first. Each entry links
the PR that shipped it. Seeded from #22 onward; maintain it as part of the
normal PR process going forward -- add an entry in the same PR as the
change, not as a follow-up.

## Unreleased

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
- Raised `--border-focus`, `--text-muted`, `.badge--*`, and `.alert--*`
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
