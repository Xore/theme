# Adopting the theme

## Minimal integration

Copy `theme.css` into the project's static asset directory and link it before
application-specific CSS:

```html
<link rel="stylesheet" href="/static/theme.css">
<link rel="stylesheet" href="/static/application.css">
```

The second stylesheet may define product layout, but should consume shared
tokens and components rather than restyling them.

## Optional behavior

Copy `theme.js` only when the project needs the included light/dark/system
preference, example tabs, or dialog helpers. Applications with existing state
management should implement those behaviors themselves.

All implementations must follow [`MODALS.md`](./MODALS.md). In particular,
application-managed confirmations must be descendants of a permanent native
settings dialog; a sibling `z-index` cannot escape the browser top layer.

Theme controls use:

```html
<button data-theme-value="system">System</button>
<button data-theme-value="dark">Dark</button>
<button data-theme-value="light">Light</button>
```

The preference is stored under `xore-theme`.

## Vendoring

For repositories that embed static assets:

1. Copy `theme.css` into the embedded asset directory.
2. Add a comment containing the source repository and commit SHA.
3. Add a CI check that the CSS parses and expected selectors exist.
4. Keep a `theme/` snapshot only when maintainers explicitly want the complete
   examples and migration documentation available offline.

## Application-specific CSS

Keep selectors in the application when they encode product data or behavior,
for example audit-table column widths, map sizing, or authentication form
layout. Move a selector into the shared theme only when its semantic contract
is reusable.

## Validation checklist

- Review all example pages at 1440×900, 1024×768, and 390×844.
- Review dark, light, and system modes.
- Navigate every control with a keyboard.
- Check visible focus and modal Escape behavior.
- Verify Save and Enter open the same visible configuration warning.
- Verify nested confirmation backdrops live inside permanent native dialogs.
- Verify confirmation runs once, Cancel runs nothing, and focus is restored.
- Confirm no horizontal page scroll at mobile widths.
- Confirm `prefers-reduced-motion` disables non-essential movement.
- Run an HTML validator and a CSS parser.
