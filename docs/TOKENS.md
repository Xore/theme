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

Use `--accent` for the primary action and focus state. Use success, info,
warning, and danger only when the content carries that meaning. Every semantic
color has a matching `-soft` surface token.

## Geometry

- `--radius-control`: inputs, buttons, navigation items.
- `--radius-panel`: cards, metrics, command bar.
- `--radius-dialog`: floating application surfaces.
- `--toolbar-height`: global desktop toolbar.
- `--sidebar-width`: full desktop navigation.
- `--content-width`: normal reading/workspace column.

Large radii, thick outlines, gradients, and permanent card shadows are outside
the system. Floating layers may use `--shadow-raised` or `--shadow-dialog`.

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
