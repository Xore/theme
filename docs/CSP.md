# Content Security Policy contract

This contract applies to every project that adopts the shared theme under a
strict Content-Security-Policy (CSP) — specifically a `style-src` and
`script-src` built on a per-request nonce with no `'unsafe-inline'`. It
covers what the theme itself requires, and the one pattern every consumer
must follow for its own dynamic, per-element styling.

## What the theme already requires

- `theme.js` needs no `'unsafe-inline'` for scripts. It ships as one external
  file, binds every behavior through `addEventListener`, and never writes an
  inline event-handler attribute (`onclick="..."` and friends) or calls
  `eval`/`Function`/`setTimeout` with a string body. Loading it as
  `<script src="theme.js" defer>` (or with a nonce, if a consumer's policy
  requires a nonce on every external script tag too) is sufficient.
- `theme.js` never reads or writes an element's `style` attribute — every
  state change it makes is a class toggle (`classList`) or a DOM attribute
  (`aria-*`, `data-*`, `open`, `inert`). None of that is affected by
  `style-src` at all.
- `theme.css`'s own components need no inline styles to work. Every example
  page links only `theme.css` (plus, where relevant, a page-local
  `<style>` for that page's own one-off layout) and never depends on a
  `style=""` attribute for a component to render correctly.

A minimal policy this contract is compatible with:

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<per-request-value>';
  style-src 'self' 'nonce-<per-request-value>';
  ...
```

## The one pattern every consumer needs: dynamic per-element values

Some UI is inherently per-request, per-element data that no shared
stylesheet can pre-compute — a chart bar's height, a progress meter's fill,
a positioned tooltip. The obvious way to express that is an inline
attribute:

```html
<!-- Do not do this under a strict style-src. -->
<span style="height:58%"></span>
```

**This is silently broken under exactly the CSP this document describes**,
and it will pass every manual check that doesn't specifically look for it:
the HTML is correct, the CSS rule for the class is correct, and the value
looks right in "View Source". It still renders wrong, identically in every
CSP-enforcing browser (Chromium, Firefox, WebKit all agree on this), because
a nonce is only ever valid on a `<style>` or `<link>` element — never on a
`style` attribute. `style-src-attr` (which governs the attribute) falls back
to `style-src` when unset, and `style-src 'nonce-x'` with no
`'unsafe-inline'` permits no attribute at all, nonce or not. The browser
drops the whole attribute and silently falls back to whatever the
stylesheet says, with no visible error unless something is specifically
watching the DevTools console for a CSP violation report.

This is not a hypothetical: it is exactly how `Xore/honeypot-stack`'s
activity chart broke in production. The data and the CSS were both
correct; the deploy was correct; nothing was cached anywhere. Only a real
CSP-enforcing browser rendering the real response headers reproduced it —
a bare local file (no CSP header at all) or a CSS-only review both looked
completely fine.

### The fix: a nonced `<style>` element, not a `style` attribute

Emit the dynamic values as CSS rules inside a `<style>` element that carries
the same nonce as the rest of the page, targeting each element with a
stable selector (`:nth-child()` is usually enough for a fixed list; a
`data-*` attribute selector works too):

```html
<div class="mini-chart">
  <span></span><span></span><span></span>
</div>
<style nonce="{{ .Nonce }}">
  .mini-chart span:nth-child(1) { --v: 20 }
  .mini-chart span:nth-child(2) { --v: 58 }
  .mini-chart span:nth-child(3) { --v: 100 }
</style>
```

`theme.css`'s `.mini-chart` component (see below) is built around exactly
this: each bar reads its height from a `--v` custom property with a `0`
default, so an unset bar renders as flat/empty instead of computing an
invalid height, and nothing about the component itself needs a `style`
attribute at any point.

This applies to *any* per-element dynamic value under this CSP, not just
`.mini-chart` — the same nonced-`<style>`-element pattern is the answer for
a positioned tooltip, a progress bar's fill, a heatmap cell's color, or
anything else a future component computes per request. Do not reach for
`'unsafe-inline'` or `'unsafe-hashes'` to route around this: those weaken
the policy for the whole page's styling, not just the one dynamic value,
and the nonced-element pattern above needs no policy change at all.

## `.mini-chart`

A minimal bar chart for hourly/periodic counts (see
`examples/workspace.html`). Height comes from `--v` (0–100) per bar, set the
way described above:

```css
.mini-chart { display: flex; align-items: flex-end; gap: 4px; height: 64px; }
.mini-chart span { --v: 0; flex: 1; height: calc(var(--v) * 1%); ... }
```

Wrap in a taller container and set `height` on `.mini-chart` directly (as
`examples/workspace.html` does) for a bigger chart; the 64px default is
just a sensible minimum, not a hard limit.
