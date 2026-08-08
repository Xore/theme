# Design reference analysis — external productivity app

Findings from a review of twelve screenshots of an external web and desktop
product (dark mode, July 2026): home screen, list pages, stats dashboard,
settings modal, profile menus, command palette, and a promo modal. This
document records what was observed and how `theme.css` was aligned with it.
Per the repository policy, no product names, logos, artwork, or copy text
were carried over — only design values and interaction patterns.

## Palette (sampled from the screenshots)

| Role | Sampled value | Token |
|---|---|---|
| Main canvas | `#20201f` | `--app-bg` |
| Sidebar | `#1f1f1e` | `--sidebar-bg` |
| Cards and inputs | `#2c2c2a` | `--surface-1` |
| Menus / dropdowns | `#383835` | `--surface-raised` |
| Menu hover | `#42423f` | `--surface-hover` |
| Settings modal nav | `#1a1a19` | recessed surface |
| Primary text | warm off-white | `--text-primary: #e9e6df` |
| Secondary text | `#8c8f8d` | `--text-muted` |
| Brand accent (asterisk) | `#d97757` | `--accent` (unchanged) |
| Inline links | `#6da7ec` | `--text-link` |
| Toggle on / solid badge | `#2a78d6` | `--switch-on` |
| Heatmap blues | `#86acea`–`#2566d0` | reference for charts |
| Primary button | white bg `#ffffff`, text `#0b0b0b` | `--btn-inverted-*` |

Notable: surfaces are extremely close to each other. Separation comes from
thin low-contrast borders, not from elevation or shadows. The accent coral is
used sparingly — the asterisk, small highlights — while links, toggles, and
focus rings are **blue**.

## Typography

- Big moments (greeting, "Chats", "Projects", promo headings) use a **serif
  display face** at regular weight; everything else is sans. Implemented as
  `--font-display` (system serif stack) applied via `.heading-serif`.
- Keyboard shortcuts appear inline, muted, right-aligned in menus (`Ctrl+N`,
  `Ctrl+,`), and as `kbd` chips in search fields.

## Geometry

- Radii are generous: ~9px controls, ~12–14px cards and menus, ~18px
  dialogs, fully rounded pills for suggestion chips. The theme scale was
  raised from 6/10/12 to 9/14/18.
- Modal backdrops **blur** the page behind them (`backdrop-filter: blur`).

## Components observed and their theme mapping

| Pattern in screenshots | Theme implementation |
|---|---|
| Inverted white primary button ("New chat", CTA) | `.btn-primary` now uses `--btn-inverted-*` |
| Suggestion pill chips under the prompt | new `.chip` |
| Chat/Cowork + appearance toggles | new `.segmented` |
| Blue toggle switches | `.switch` uses `--switch-on` |
| Menus with shortcut hints, dividers, submenu chevrons | `.dropdown__shortcut`, `__chevron`, `__item--accent` |
| Command palette with search and selected row | existing `.command-bar` |
| Two-pane settings dialog with search nav | existing `.modal__sidebar` / `__content` |
| Split promo modal with artwork panel | new `.modal--promo`, `.modal__body`, `__media` |
| Empty states: line icon, title, description, CTA | existing `.empty-state`, title now serif |
| Stats tiles | existing `.metric-grid` / `.metric` |
| Contribution heatmap | new `.heatmap` (row-labeled shaded-cell grid; see `docs/CSP.md`) |
| "New" solid blue badge | new `.badge--solid` |
| Table badges ("Included", "Local dev") | existing `.badge` variants |

## Interaction patterns for overlays

- **Promo modal**: centered, two columns (content left, artwork right on a
  cream panel), blurred backdrop, close X top-right, full-width CTA. Artwork
  hides on narrow screens.
- **Profile menu**: opens upward from the avatar; muted email header, icon
  items, right-aligned shortcuts, chevron opens a **submenu panel** beside
  it; dividers group sections; a blue accent item for the upsell; logout last.
- **Command palette**: centered top modal, search input with bottom border,
  result rows with type icons, selected row highlighted with an "Enter" hint,
  muted timestamps right-aligned.
- **App menu bar**: native-style dropdowns with right-aligned shortcuts.
- **Settings**: modal with darker nav pane (searchable), content rows with
  label + description left and control right; segmented appearance control.

## What was deliberately not copied

Product names, the asterisk logo, artwork, exact strings, and proprietary
typefaces. The serif stack falls back to locally available system serifs, and
the accent color was already the theme's own terracotta value.

## Live cross-check — reference login and plans pages

Verified against the reference product's public login page and plans section,
compared with the hosted theme at `xore.github.io/theme`:

| Pattern in the live reference | Theme status |
|---|---|
| Split login: form column left, artwork photo right | implemented as `.auth-split` (`examples/auth.html`) |
| Serif headline above the login card | `.heading-serif` on the auth headline |
| White card with large radius and soft shadow | `.auth-card` now uses `--surface-0` + `--shadow-raised` + `--radius-dialog` |
| Black full-width primary button | `--btn-inverted-*` in light mode |
| "OR" divider between actions | present in `auth.html` |
| Pill buttons in the top bar | new `.btn--pill` modifier |
| Segmented plan toggle (Individual/Team) | `.segmented` |
| Serif plan names, checkmark feature rows | covered by `.heading-serif` + list patterns |
| Logo top-left of the content column | `.auth-split__brand` |

## Artwork

The artwork panels ship with original, hand-authored SVG pieces in the
theme's own warm palette (terracotta on cream, paper-grain texture) —
deliberately echoing the *style* of the reference panels without borrowing
any artwork:

- `examples/assets/auth-artwork.svg` — low sun over layered dunes, shown in
  `.auth-split__aside` on the authentication page.
- `examples/assets/promo-artwork.svg` — concentric arches, shown in
  `.modal__media` in the promo dialog.

Both are plain SVG (no dependencies, scales cleanly) and can be replaced by
downstream apps with their own imagery via the same `<img>` slots.

## Changes from this pass

Scoped to the screenshot-review pass described above, not an ongoing
changelog -- see [`CHANGELOG.md`](../CHANGELOG.md) at the repo root for
what has changed since.

- Surface ramp, text, link, focus, and radius tokens aligned to the sampled
  values in dark, explicit-light, and system-light modes.
- `.btn-primary` inverted, `.switch` blue, `.heading-serif` on display stack,
  modal backdrop blur, dropdown/menu extras, `kbd`.
- New: `.chip`, `.segmented`, `.modal--promo`, `.badge--solid`, `.btn--pill`,
  `.auth-split`.
- Original SVG artworks for the auth and promo artwork panels.
- `docs/TOKENS.md` updated to match the new contract.
