# Xore Theme

A framework-free visual system for Xore web applications. It provides the
warm, quiet geometry of a desktop productivity tool without copying product
names, logos, artwork, or text from another service.

The repository is intentionally portable: copy `theme.css` and, if desired,
`theme.js` into any project. There is no package manager, build step, external
font request, or CDN dependency.

## What is included

- `theme.css` — tokens, dark/light/system modes, controls, cards, tables,
  status components, application shell, settings layout, dialogs, and auth
  layout.
- `theme.js` — optional theme persistence, tabs, and example dialog behavior.
- `examples/` — focused pages for the component catalog, workspace shell,
  settings surface, and authentication.
- `docs/TOKENS.md` — token contract and customization rules.
- `docs/ADOPTION.md` — generic copy/vendor instructions.
- `docs/MODALS.md` — modal top-layer, focus, keyboard, and confirmation
  behavior contract.
- `docs/MIGRATE-AUTH-BACKEND.md` — AI-ready migration plan for
  `Xore/auth-backend`.
- `docs/MIGRATE-HONEYPOT-STACK.md` — AI-ready migration plan for
  `Xore/honeypot-stack`.

## Preview locally

From this repository:

```bash
python -m http.server 8080
```

Open `http://127.0.0.1:8080/examples/`.

The examples intentionally use ordinary HTML classes rather than a framework.
They are the visual acceptance suite for changes to the shared theme.

## Install by copying

```text
your-project/
  static/
    theme.css
    theme.js
```

```html
<link rel="stylesheet" href="/static/theme.css">
<script src="/static/theme.js" defer></script>
```

`theme.js` is optional. Applications with their own theme state, tabs, or
dialog controller should include only the stylesheet.

## Source-of-truth policy

1. Propose token or shared-component changes in this repository.
2. Review every page under `examples/` in dark, light, and system mode.
3. Copy the released `theme.css` into downstream repositories.
4. Keep application-specific layout rules next to the application; do not add
   one-off product selectors to the shared stylesheet.
5. Record the source commit in the downstream README or vendoring comment.

## Design principles

- Warm neutral surfaces and off-white text.
- Compact 6–10px geometry rather than oversized rounded cards.
- Thin, low-contrast borders; shadows only for floating layers.
- Terracotta for focus and primary actions, not decoration.
- Color communicates state and severity, never whole-panel branding.
- Independent scrolling for the sidebar and main canvas.
- Keyboard-visible focus, reduced-motion support, and responsive layouts.
- Permanent settings dialogs contain every application-managed nested overlay
  so browser top-layer behavior cannot hide confirmations.
- Locally available system fonts by default.

## Repository integrations

- [`Xore/auth-backend`](https://github.com/Xore/auth-backend) vendors the
  stylesheet for its embedded Go UI.
- [`Xore/honeypot-stack`](https://github.com/Xore/honeypot-stack) can migrate
  its dashboard shell in phases while preserving server-rendered routes and
  investigation behavior.
