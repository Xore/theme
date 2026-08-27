# Theme token contract

All shared components must use custom properties from `theme.css`. Downstream
applications may override tokens at `:root` or on an application container,
but should not redefine component internals.

## Themes and modes are separate axes

Two independent attributes on `<html>`:

| attribute | values | meaning |
|---|---|---|
| `data-hp-theme` | `claude` (default), `slate`, `sage`, `lavender`, `lime`, `amber`, `ocean`, `rose`, `neon` | the whole surface family — ground, chrome, surfaces, borders, text ramp, accent |
| `data-theme` | `light`, `dark`, or absent | pins the mode; absent follows the operating system |

They compose: `data-hp-theme="slate" data-theme="light"` is slate in light
mode. Setting neither gives the default theme following the system.

`data-hp-palette` is accepted as an alias for `data-hp-theme` so consumers
that already write it keep working. Prefer `data-hp-theme` in new code.

### What a theme owns

Three tiers. A theme **must** define the first, **may** retune the second,
and must **not** touch the third.

**Theme-scoped — the surface family.** Grounds (`--bg-000`, `--bg-sidebar`,
`--bg-toolbar`), the surface ramp (`--bg-100`…`--bg-400`, `--bg-500`,
`--bg-raised`), borders (`--border-100`, `--border-200`,
`--border-focus`), the text ramp (`--text-000`, `--text-100`,
`--text-200`, `--text-300`), the accent family, `--overlay-bg`, the
inverted-button pair, elevation colours, and the terminal/framebuffer
surfaces.

**Shared and semantic — not a theme's to repurpose.**
`--success`/`--info`/`--warning`/`--danger`/`--critical` and their `-soft`,
`-text-on-soft` and `-badge-fill` families. Status colour is meaning, not
decoration: danger must read as danger whichever theme is active. A theme may
retune a status colour for its own ground, but may not reassign what it
means.

**Not theme-scoped — proportions, not palette.** The spacing scale
(`--space-*`), radii (`--radius-*`), type scale (`--font-size-*`,
`--font-*`), motion (`--ease-out`, `--transition*`) and layout dimensions
(`--toolbar-height`, `--sidebar-width*`, `--content-width`). These are the
product's proportions and are identical across every theme.

### How a theme is authored

Theme values are **generated, not hand-written**. Edit
`scripts/theme-tokens.mjs` — which holds the ground hue, saturation profile
and accent seeds per theme — then run:

```sh
node scripts/gen-themes.mjs      # rewrite the generated block in theme.css
node scripts/check-contrast.mjs  # WCAG AA across every theme and mode
```

Each theme is emitted as **one block covering both modes** using
`light-dark()`, rather than the three near-identical blocks (`:root`,
`[data-theme="light"]`, and a `prefers-color-scheme` copy) the stylesheet
previously needed per token set. Mode is decided by `color-scheme`: `:root`
declares `light dark` so the system preference wins by default, and
`[data-theme]` pins it.

That mechanism is also the stylesheet's browser floor: `light-dark()` needs
Chrome/Edge 123+, Firefox 120+, or Safari 17.5+. Older browsers fall back to
the platform-native font stacks and unstyled custom properties — the theme
does not polyfill it.

`claude` is the default and is **pinned, not derived** — its ground, ramp and
accent values are hand-tuned (`--accent-soft` sits at 0.14/0.12 where
generated themes use 0.16/0.13) and the generator asserts byte identity on
every run. Its link/focus/switch family is the one part that *is* generated:
it is derived from the accent and AA-tuned like every other theme's, which
fixed a 3.95:1 light-mode link failure the hand-written blue had shipped
with.

Values that are not colours cannot use `light-dark()`, so the few that vary
by mode are exposed as intent tokens instead: `--basemap-filter` and
`--theme-art-dark-display` / `--theme-art-light-display`. Rules read the
token rather than matching `[data-theme="dark"]` themselves, so a theme
beyond light/dark cannot silently miss them.

### Contrast

`scripts/check-contrast.mjs` runs in CI and enforces WCAG AA (4.5:1 text,
3:1 non-text) across every theme and mode, compositing alpha so a `-soft`
token is measured as it actually renders. Deliberate exceptions are listed
in `KNOWN_EXCEPTIONS` with a reason and printed on every run — the checker
never silently tolerates a failure.

## Surface hierarchy

Backgrounds are a numbered ramp. The number is elevation: `000` is the page
ground, and each step sits one level above it. Two chrome regions sit outside
the ladder because they are places, not elevations.

| Token | Purpose | Previously |
|---|---|---|
| `--bg-000` | Main canvas | `--app-bg` |
| `--bg-100` | Dialogs and primary floating surfaces | `--surface-0` |
| `--bg-200` | Cards and form controls | `--surface-1` |
| `--bg-300` | Hover, search, and selected navigation | `--surface-2` |
| `--bg-400` | Pressed controls and stronger selection | `--surface-3` |
| `--bg-500` | Hover fill | `--surface-hover` |
| `--bg-raised` | Menus, command bars, and toasts | `--surface-raised` |
| `--bg-sidebar` | Navigation and recessed regions | `--sidebar-bg` |
| `--bg-toolbar` | Compact global toolbar | `--toolbar-bg` |

Text and borders follow the same shape — `000` is the most prominent:

| Token | Purpose | Previously |
|---|---|---|
| `--text-000` | Headings, values, active controls | `--text-primary` |
| `--text-100` | Body copy, labels, inactive navigation | `--text-secondary` |
| `--text-200` | Metadata, placeholders, section labels | `--text-muted` |
| `--text-300` | Unavailable controls only | `--text-disabled` |
| `--border-100` | Hairlines | `--border-subtle` |
| `--border-200` | Emphasised separation | `--border-strong` |

**This rename is breaking, with no compatibility aliases.** Consumers reading
the old names must migrate; the mapping above is the whole of it.

The one-off `tw:*` utility classes are also gone. They were the residue of a
Tailwind build dropped in an earlier issue, kept as hand-written CSS; they are
not part of a design system and consumers should use real classes or their own
layout CSS.

## Text hierarchy

See the table above. In short: `--text-000` for anything that must be read
first, `--text-100` for body copy, `--text-200` for metadata, and `--text-300`
only for controls that are unavailable — it is deliberately below the AA
contrast floor, which WCAG permits for disabled controls and nothing else.

## Semantic color

`--accent` (terracotta) is the brand emphasis: progress, checked controls,
selected states, and decorative highlights. The primary action button is the
inverted `--btn-inverted-bg` / `--btn-inverted-text` pair, not the accent.
Links use `--text-link` / `--text-link-hover`, generated per theme from its
accent and AA-tuned; focus outlines use
`--border-focus`. Toggle switches use `--switch-on` when active. Use success,
info, warning, danger, and critical only when the content carries that
meaning. `--critical` is reserved for a severity strictly above danger --
e.g. confirmed active compromise or exfiltration, versus danger's general
"something is wrong." Every semantic color has a matching `-soft` surface
token.

Supporting component tokens:

- `--control-knob`: toggle thumb color.
- `--text-on-status`: text on solid semantic badges.
- `--artwork-plate`: fallback surface behind optional artwork (the old
  `--artwork-bg` name still works as a deprecated alias).
- `--overlay-bg`: modal and nested-confirmation scrim.

## Geometry

- `--radius-xs`: tight chips, sparkline bars, small inline controls (6px).
- `--radius-control`: inputs, buttons, navigation items (12px).
- `--radius-panel`: cards, metrics, menus, command bar (16px).
- `--radius-dialog`: floating application surfaces (24px).
- `--radius-pill`: chips and fully rounded controls (999px).
- `--toolbar-height`: global desktop toolbar.
- `--sidebar-width`: full desktop navigation.
- `--content-width`: normal reading/workspace column.

## Spacing

A 7-step scale for padding, margin, and gap: `--space-xs` (4px), `--space-sm`
(8px), `--space-md` (12px), `--space-lg` (16px), `--space-xl` (24px),
`--space-2xl` (32px), `--space-3xl` (40px). Use the nearest step rather than a
hand-typed pixel value so spacing reads as one system instead of drifting
component-by-component; land between two steps only when a component has a
concrete reason (e.g. matching an unrelated fixed dimension elsewhere on the
same element) to sit off-scale.

## Typography

- `--font-sans` is the interface stack and uses web-loaded Fira Sans.
- `--font-display` is the display stack for greetings, page titles, and
  announcement headings. It uses web-loaded Space Grotesk; `.heading-serif`
  remains as a backwards-compatible class name.
- `--font-mono` uses web-loaded Fira Code for evidence, identifiers, keyboard
  hints, and code.
- All three stacks include platform-native fallbacks for offline use or a
  blocked font request.
- `kbd` renders inline keyboard hints inside menus, search fields, and copy.

Gradients and permanent card shadows are outside the system. Floating layers
may use `--shadow-raised` or `--shadow-dialog`, and modal backdrops may blur
the page behind them.

## Compatibility aliases

The stylesheet exposes aliases such as `--bg`, `--green`, `--red`,
`--radius-md`, and `--shadow-modal` for existing Xore applications. New shared
components should use the canonical token names above.

## Adding a token

1. Confirm that at least two components need it.
2. Add one value per token using `light-dark()` for the two modes; if the
   value cannot be a color, expose it as an intent token the theme declares
   (the way `--basemap-filter` works) rather than enumerating modes in the
   rule.
3. Add it to this document.
4. Demonstrate it on an example page.
5. Verify contrast, keyboard focus, and reduced motion.
