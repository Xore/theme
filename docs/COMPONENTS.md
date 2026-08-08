# Component reference

One row per top-level component/class family in `theme.css`. "Wired"
means `theme.js` gives it behavior via attribute/class selectors (see
`theme.js`'s single `click`/`keydown`/`toggle` delegates); "CSS-only" means
a consumer must supply any interactivity itself. See `docs/TOKENS.md` for
the token contract these components consume, and `docs/CSP.md` for the
`--v`-driven pattern the data-viz components use instead of a `style=""`
attribute.

This is a hand-maintained map, not a generated one -- if you add or rename
a component, update this file in the same PR (`docs/TOKENS.md`'s own
"Adding a token" checklist asks the same for tokens).

## Layout & shell

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.app-shell`, `.app-toolbar`, `.app-sidebar`, `.app-main`, `.app-content` | Desktop application frame: fixed toolbar, independently-scrolling sidebar and main canvas | `.app-shell` > `.app-toolbar` + `.app-sidebar` + `.app-main` > `.app-content` | CSS-only (grid) | `workspace.html` |
| `.app-shell.hp-nav-open`, `.app-shell__nav-scrim`, `[data-nav-toggle]`, `[data-nav-scrim]` | Off-canvas mobile nav drawer (<=520px) with scrim, focus trap, and `inert` on `.app-main` | trigger button + `.app-sidebar` + `.app-shell__nav-scrim`, all inside `.app-shell` | Wired (open/close/focus/`aria-expanded`/Escape) | `workspace.html` |
| `.sidebar__item`, `.sidebar__section-label`, `.sidebar__search`, `.sidebar__profile` | Sidebar navigation list, section headers, search field, profile footer | flat list of `<button>`/`<div>` inside `.app-sidebar__body` | CSS-only | `workspace.html` |
| `.hp-brand`, `.hp-brand-mark`, `.hp-brand-text`, `.hp-brand-accent` | Product mark + wordmark in the sidebar/toolbar | `<a class="hp-brand">` wrapping an icon chip and text | CSS-only | `workspace.html` |
| `.settings-layout`, `.settings-layout__sidebar`, `.settings-layout__content`, `.settings-grid`, `.settings-field` | Two-pane settings surface (nav list + form fields) | `.settings-layout` > `.settings-layout__sidebar` + `.settings-layout__content` | CSS-only | `settings.html` |
| `.auth-split`, `.auth-split__main`, `.auth-split__aside`, `.auth-card`, `.auth-brand` | Split-screen sign-in layout (form column + artwork column) | `.auth-split` > `.auth-split__main` (containing `.auth-card`) + `.auth-split__aside` | CSS-only | `auth.html` |

## Cards & data display

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.card`, `.card__title`, `.card__desc`, `.card__content`, `.card__footer` | Flex-column card with chrome pinned top/bottom and a flexible middle region | `.card` > `.card__title` + `.card__content` (optional) + `.card__footer` (optional) | CSS-only | `components.html` |
| `.card__row`, `.card__label`, `.card__value`, `.card__value--mono` | Key/value row inside a card | `.card__row` > label block + value | CSS-only | `components.html` |
| `.card__scroll` | Bounded, internally-scrolling region for unbounded card content (nest inside `.card__content`) | `.card__content.card__scroll` | CSS-only | `components.html` |
| `.card--raised` | Elevated card variant (raised surface, stronger border, shadow) | `.card.card--raised` | CSS-only | `components.html` |
| `.metric`, `.metric-grid`, `.metric__label`, `.metric__value`, `.metric__trend`, `.metric__trend--up`/`--down` | KPI tile with an optional directional trend | `.metric-grid` > repeated `.metric` | CSS-only | `components.html`, `workspace.html` |
| `.data-table`, `.data-table--responsive`, `.table-scroll` | Table styling; the `--responsive` modifier stacks to label:value rows below 720px via each cell's `data-label` | `<table class="data-table">` inside `.table-scroll` | CSS-only | `components.html` |
| `.progress` | Single-value fill bar, width from `--v` (see `docs/CSP.md`) | `.progress` > `<span>` | CSS-only | `components.html` |
| `.empty-state`, `.empty-state__icon` | Centered "nothing here yet" card body with an icon, heading, copy, and CTA slot | `.card.empty-state` > icon + `<h3>` + `<p>` + button | CSS-only | `components.html`, `settings.html` |
| `.onboarding-card`, `.onboarding-card__step`, `.onboarding-card__progress` | Checklist-style onboarding card with step states and a progress count | `.onboarding-card` > `.onboarding-card__step` list | CSS-only | `components.html` |
| `.project-card`, `.project-grid`, `.catalog-card`, `.catalog-grid` | Browsable/addable item cards (icon, title, badges, description) | `.project-grid`/`.catalog-grid` > repeated card | CSS-only | `components.html` |
| `.timeline-block` | A single settling-in timeline/session-replay entry | `.card.timeline-block` | CSS-only (entrance animation) | `patterns.html` |
| `.skeleton`, `.skeleton-line` | Shimmering loading placeholders. `.skeleton` is a single rectangular block; `.skeleton-line` is a standalone bar for stacking as text-line placeholders | either class on its own, no wrapper required | CSS-only | `components.html` |
| `.diff-line`, `.diff-line--add`, `.diff-line--del` | Colored add/remove lines inside a `pre.code` diff view | `<span class="diff-line diff-line--add">` per line | CSS-only | `components.html` |
| `.mini-chart`, `.heatmap` | Data-viz primitives -- see the "Data visualization" section below | | | |

## Forms & controls

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.form-group`, `.form-label`, `.form-input`, `.form-help`, `.form-error` | Standard labeled field with help/error text | `.form-group` > label + input + help/error | CSS-only | `components.html` |
| `.search-field`, `.sidebar__search` | Icon + input + optional `<kbd>` shortcut hint | `label`/`div.search-field` > icon + `<input>` | CSS-only | `components.html` |
| `.check`, `.switch` | Checkbox/radio label row; toggle switch | `<label class="check"><input>...</label>`; `<span class="switch"><input type=checkbox><span></span></span>` | CSS-only | `components.html` |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-icon`, `.btn-sm`/`.btn-lg`, `.btn--pill` | Button variants and sizes | `<button class="btn btn-*">` | CSS-only | `components.html` |
| `.copy-field`, `[data-copy]` | Clipboard-copy affordance; any element with `data-copy="text"` (or relying on its own text content) copies on click and toggles `.is-copied` for a timed confirmation | any element + `data-copy` attribute | Wired (click delegate) | `components.html` |
| `[data-tip]` | CSS-only tooltip, text from the `data-tip` attribute via `attr()`. Add `tabindex="0"` if the host element isn't natively focusable | any element + `data-tip="text"` | CSS-only (no JS, no nonce) | `components.html` |

## Status & feedback

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.badge`, `.badge--accent`/`--success`/`--info`/`--warning`/`--danger`/`--critical`/`--muted`/`--current`/`--solid` (aliases: `--green`/`--blue`/`--orange`/`--red`) | Small semantic status/label chip | `<span class="badge badge--*">` | CSS-only | `components.html` |
| `.alert`, `.alert--info`/`--success`/`--warning`/`--danger`/`--critical` | Full-width severity banner | `<div class="alert alert--*">` | CSS-only | `components.html` |
| `.toast`, `.toast--slide-in-right` | Single notification card with an entrance animation | `<div class="toast">` | CSS-only (consumer owns show/hide timing) | `patterns.html` |
| `.hp-toast`, `.hp-toast-stack` | Dashboard's live-update toast variant (left accent stripe) and its fixed top-right stacking container | `.hp-toast-stack` > repeated `.toast.hp-toast` | CSS-only | `patterns.html` |
| `.hp-live-state`, `.hp-live-state--paused`, `.hp-live-state--stalled` | The dashboard's single global live/paused/reconnecting toggle | `<button class="hp-live-state">` + `.status-dot` + label span | CSS-only (consumer owns the click handler and polling) | `components.html` |
| `.wb-state`, `.wb-state--completed`/`--failed`/`--timed_out`/`--running`/`--claimed`/`--queued` | Workbench analyzer run-state color mapping, layered on `.badge` | `<span class="badge wb-state wb-state--*">` | CSS-only | `components.html` |
| `.status-dot` | Small filled circle, colored via `currentColor` | `<span class="status-dot">` inside a colored parent | CSS-only | `components.html` |

## Navigation

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.tabs`, `.tab`, `[role="tab"][data-tab-target]`, `[data-tab-panel]`, `[data-tabs]` | Tab strip -- also reusable as a generic step/panel switcher (any `[role="tab"][data-tab-target]` works, no `.tab` class required) | `[data-tabs]` wrapping the trigger group and the panels | Wired (click activates; ArrowLeft/Right/Home/End move focus and activate) | `components.html`, `auth.html` |
| `.breadcrumb` | Simple `/`-separated path | inline `<a>`/`<span>` list | CSS-only | `components.html` |
| `.pagination` | Prev/page-number/next button row | button group | CSS-only | `components.html` |
| `.chip` | Suggestion/filter pill button | `<button class="chip">` | CSS-only | `components.html` |
| `.segmented`, `.segmented--icon` | Grouped toggle-button control (e.g. mode/appearance switch) | `<span class="segmented" role="group"><button>...` | CSS-only -- no `theme.js` wiring, unlike `.tabs` | `components.html` |
| `.command-bar` | Docked bottom search/command input | fixed-position `<div>` | CSS-only | `patterns.html` |

## Overlays & dialogs

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `dialog.modal`, `.modal-backdrop`, `[data-open-dialog]`/`[data-close-dialog]`/`[data-dialog-backdrop]` | Base dialog contract: open/close, backdrop, focus, Escape. See `docs/MODALS.md` for the full contract including `data-permanent-dialog` | native `<dialog>` + a matching `.modal-backdrop` | Wired (open/close/focus-return/Escape) | `components.html` |
| `.modal--palette` | Top-anchored, content-sized command-palette dialog variant | `dialog.modal.modal--palette` | Wired (same as base dialog) | `patterns.html` |
| `.modal--promo` | Two-column announcement dialog (message + artwork panel) | `dialog.modal.modal--promo` | Wired (same as base dialog) | `components.html` |
| `.modal__header`, `.modal__sidebar`, `.modal__content` | Header-with-search-field + sidebar-nav + content-pane dialog shape | inside a `.modal` | Wired (same as base dialog) | `patterns.html` |
| `.hp-evidence-modal`, `.hp-evidence-body`, `.hp-evidence-count`, `.hp-evidence-note` | Single-pane investigative dialog: header search filters a scrollable text dump directly (not a sidebar-form) | `dialog.modal.hp-evidence-modal` | Wired (same as base dialog; filtering itself is consumer-owned) | `patterns.html` |
| `.dropdown`, `.dropdown__item`, `.dropdown__divider`, `.dropdown__shortcut` | Unpositioned menu chrome -- a consumer supplies position/size/trigger | `<div class="dropdown">` | CSS-only | `components.html` |
| `.action-menu`, `.action-menu__popover`, `.action-menu__item` | Kebab/overflow menu with full ARIA menu-button semantics | native `<details class="action-menu"><summary>` + `.action-menu__popover[role=menu]` | Wired (outside-click-close, close-siblings, Escape, arrow-key roving, focus-return) | `components.html` |
| `.popover`, `.popover__panel`, `--popover-width` | Generic floating panel for non-menu content, sharing `.action-menu__popover`'s chrome via a `--popover-width` custom property | native `<details class="popover"><summary>` + `.popover__panel` | Wired (same open/close mechanism as `.action-menu`) | `components.html` |
| `.danger-dialog__warning`, `.edit-dialog`, `.edit-dialog-backdrop` | Destructive-confirmation and inline-edit dialog variants | inside a `.modal`/dialog | Wired (same as base dialog) | `components.html` |

## Data visualization

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.mini-chart` | Minimal bar chart for hourly/periodic counts, height per bar from `--v` | `.mini-chart` > repeated `<span>` | CSS-only (values set via nonced `<style>`, see `docs/CSP.md`) | `workspace.html` |
| `.heatmap`, `.heatmap__row`, `.heatmap__cell`, `.heatmap__legend` | Row-labeled grid of shaded cells for a two-dimensional count, shade per cell from `--v` | `.heatmap` > repeated `.heatmap__row` > `.heatmap__cells` > repeated `.heatmap__cell` | CSS-only (values set via nonced `<style>`) | `workspace.html` |
| `.map-shell`, `.map-status`, `.map-fallback`, `.world` | Leaflet map shell chrome, plus a dependency-free offline SVG fallback (`.world` with `.land`/`.country-label`/`circle`) | `.map-shell` > `.leaflet-map` + `.map-status` + `.map-fallback` (containing `.world` svg) | CSS-only for the fallback; Leaflet itself is a consumer integration | `workspace.html` |

## Auth-specific

| Class(es) | Purpose | Markup shape | Wired? | Example |
|---|---|---|---|---|
| `.passkey-row`, `.passkey-row__name`, `.passkey-row__meta` | A single enrolled-credential row | repeated `.passkey-row` inside a `.card` | CSS-only | `settings.html` |
| `.user-edit-dialog`, `.user-edit-section`, `.user-edit-perm`, `.user-edit-perm-list` | Admin user-edit dialog with permission toggles | inside a `.modal` | Wired (same as base dialog) | `settings.html` |

## Dashboard-specific (`hp-*` / `wb-*`)

These were migrated in from `Xore/honeypot-stack`'s dashboard (see
`docs/MIGRATE-HONEYPOT-STACK.md`) and are shared here so both consumers get
fixes at once, even though several are single-consumer today.

| Class(es) | Purpose | Example |
|---|---|---|
| `.hp-account`, `.hp-account-menu`, `.hp-account-note` | Sidebar profile account menu | `settings.html` (via `.dropdown`/`.action-menu` composition) |
| `.hp-filterbar-field`, `.hp-filterbar-actions`, `.hp-filterbar-menu`, `.hp-filter-autocomplete` | Filter bar with an autocomplete dropdown | -- (see honeypot-stack) |
| `.hp-settings-modal`, `.hp-settings-pane`, `.hp-settings-frame`, `.hp-settings-external` | Settings modal that can embed an external iframe pane | `settings.html` |
| `.hp-open-in`, `.hp-open-in-menu`, `.hp-open-in-item` | "Open in..." link menu (composes `.action-menu` + `.dropdown`) | -- (see honeypot-stack) |
| `.hp-modal-status` | Fixed top-right transient status pill (e.g. save-in-progress/error) | -- (see honeypot-stack) |
| `.hp-toolbar-actions`, `.hp-head-actions`, `.hp-services-actions` | Toolbar/header action-button groupings | various |
| `.hp-cap-list`, `.hp-cfg-source`, `.hp-dash-settings` | Settings-page capability list and config-source display | `settings.html` |
| `.hp-rev-row`, `.hp-rev-meta` | Revision/comparison list row | -- (see honeypot-stack) |
| `.hp-audit-row`, `.hp-audit-filter` | Audit-log table row and its filter controls | -- (see honeypot-stack) |

## Utilities

| Class(es) | Purpose |
|---|---|
| `.mono`, `.text-danger`, `.text-secondary`, `.text-muted` | Text color/font utilities |
| `.sr-only` | Visually-hidden, screen-reader-only content |
| `.stagger-in`, `.flash`, `.timeline-block` (entrance) | Entrance/attention motion utilities -- automatically neutralized under `prefers-reduced-motion: reduce` |
| `.u-mt8`/`.u-mt12`/`.u-mt14` | Small margin-top spacing utilities |
