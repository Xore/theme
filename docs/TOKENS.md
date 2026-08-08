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
2. Add dark, explicit light, and system-light values.
3. Add it to this document.
4. Demonstrate it on an example page.
5. Verify contrast, keyboard focus, and reduced motion.
