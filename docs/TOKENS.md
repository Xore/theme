# Theme token contract

All shared components must use custom properties from `theme.css`. Downstream
applications may override tokens at `:root` or on an application container,
but should not redefine component internals.

## Surface hierarchy

| Token | Purpose |
|---|---|
| `--app-bg` | Main canvas |
| `--sidebar-bg` | Navigation and recessed regions |
| `--toolbar-bg` | Compact global toolbar |
| `--surface-0` | Dialogs and primary floating surfaces |
| `--surface-1` | Cards and form controls |
| `--surface-2` | Hover, search, and selected navigation |
| `--surface-3` | Pressed controls and stronger selection |
| `--surface-raised` | Menus, command bars, and toasts |

## Text hierarchy

- `--text-primary` for headings, values, and active controls.
- `--text-secondary` for body copy, labels, and inactive navigation.
- `--text-muted` for metadata, placeholders, and section labels.
- `--text-disabled` only for unavailable controls.

## Semantic color

`--accent` (terracotta) is the brand emphasis: progress, checked controls,
selected states, and decorative highlights. The primary action button is the
inverted `--btn-inverted-bg` / `--btn-inverted-text` pair, not the accent.
Links use `--text-link` / `--text-link-hover` (blue) and focus outlines use
`--border-focus`. Toggle switches use `--switch-on` when active. Use success,
info, warning, danger, and critical only when the content carries that
meaning. `--critical` is reserved for a severity strictly above danger --
e.g. confirmed active compromise or exfiltration, versus danger's general
"something is wrong." Every semantic color has a matching `-soft` surface
token.

Supporting component tokens:

- `--control-knob`: toggle thumb color.
- `--text-on-status`: text on solid semantic badges.
- `--artwork-bg`: fallback surface behind optional artwork.
- `--overlay-bg`: modal and nested-confirmation scrim.

## Geometry

- `--radius-control`: inputs, buttons, navigation items (9px).
- `--radius-panel`: cards, metrics, menus, command bar (14px).
- `--radius-dialog`: floating application surfaces (18px).
- `--radius-pill`: chips and fully rounded controls.
- `--toolbar-height`: global desktop toolbar.
- `--sidebar-width`: full desktop navigation.
- `--content-width`: normal reading/workspace column.

## Typography

- `--font-display` is the serif display stack for greetings, page titles, and
  announcement headings (`.heading-serif`). Interface text stays sans.
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
2. Add dark, explicit light, and system-light values.
3. Add it to this document.
4. Demonstrate it on an example page.
5. Verify contrast, keyboard focus, and reduced motion.
