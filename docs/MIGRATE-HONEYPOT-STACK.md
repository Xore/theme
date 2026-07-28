# AI migration guide: Xore/honeypot-stack

## Objective

Migrate the custom dashboard in `Xore/honeypot-stack` from its AdminLTE-adapted
shell to `Xore/theme` without removing or weakening any monitoring,
investigation, evidence, export, alerting, map, or accessibility behavior.

This is a staged frontend migration. Do not rewrite ingestion or analysis
services, and do not combine the desktop-client project with this task.

Read [`MODALS.md`](./MODALS.md) before adding settings, command palettes, or
destructive confirmations.

## Repositories and baseline

- Application: `https://github.com/Xore/honeypot-stack`
- Theme source: `https://github.com/Xore/theme`
- Existing UI plan: `docs/DASHBOARD-UI-REDESIGN-GUIDE.md`
- Server templates: `dashboard/page.go`
- Current shell adapter: `dashboard/static/hp-adminlte.js`
- Current application styling: `dashboard/static/hp-adminlte.css`
- Frontend contracts: `dashboard/frontend/`

Before editing:

```bash
git fetch origin --prune
git checkout main
git merge --ff-only origin/main
git status --short
```

Stop if the worktree is dirty. Never reset or overwrite unrelated sensor,
sandbox, pipeline, or infrastructure work.

## Non-negotiable invariants

- Every existing HTML route and JSON API remains available.
- Preserve all current filters, pagination, lazy loading, exports, external-tool
  links, report generation, alert acknowledgement, and download authorization.
- Preserve forward-auth user/role headers and administrator-only actions.
- Preserve map center, zoom, selected marker, and popup during live refresh.
- Preserve server-sent events and transient live-event notifications.
- Preserve accessible table sorting, selectable columns, expanded JSON, and
  load-more controls.
- Do not add CDN assets or external fonts.
- Do not copy product names, logos, proprietary artwork, or product-specific
  text into the dashboard.

## Phase 1: vendor and document the theme

1. Copy `theme.css` to `dashboard/static/theme.css`.
2. Record the exact `Xore/theme` commit in the dashboard README.
3. Serve the stylesheet from the dashboard binary using the existing embedded
   static asset mechanism.
4. Link it before dashboard-specific CSS.
5. Add a CI comparison or documented sync command against a local clone of
   `Xore/theme`.
6. Link this guide from `docs/DASHBOARD-UI-REDESIGN-GUIDE.md` and the root
   README dashboard section.

Do not copy `theme.js` when the existing TypeScript shell already owns theme
preference, navigation, tabs, modal state, or keyboard shortcuts.

## Phase 2: semantic server-rendered shell

Implement the shell directly in `dashboard/page.go` before migrating page
components:

```text
app-shell
  app-toolbar (32px)
  app-sidebar (224px)
  app-main
    page header
    route content
  command-bar
```

Requirements:

- The toolbar exists in initial HTML; no post-load white flash.
- Sidebar and main canvas scroll independently.
- The authenticated username and role populate the bottom profile row.
- Monitor and Investigate navigation groups retain every route.
- Recent investigations contain route/label/timestamp only; never store event
  bodies, credentials, commands, or payload content in local storage.
- Mobile navigation becomes an accessible off-canvas surface or compact rail.

Once the semantic shell is server-rendered, delete only the DOM-reconstruction
logic from `hp-adminlte.js`. Keep behavior that has not yet moved.

## Phase 3: map old selectors to shared primitives

| Existing concern | Shared primitive |
|---|---|
| AdminLTE wrapper/navbar/sidebar | `.app-shell`, `.app-toolbar`, `.app-sidebar`, `.app-main` |
| Info boxes | `.metric-grid`, `.metric` |
| Cards | `.card` |
| Bootstrap badges | `.badge` semantic modifiers |
| Form controls | `.form-label`, `.form-input` |
| Buttons | `.btn` variants |
| Tables | `.data-table`, `.table-scroll` |
| Nav pills | `.tabs`, `.tab` |
| Toasts/alerts | `.toast`, `.alert` |
| Settings | `.modal` or `.settings-layout` primitives |
| Global query | `.command-bar` |

Keep these dashboard-specific:

- Leaflet and map container sizing;
- charts and visualization compatibility;
- payload/evidence layouts;
- timeline and session replay;
- expandable normalized JSON;
- column selection and sorting;
- source-health grids;
- sandbox artifacts;
- PDF/export controls;
- lazy-list sentinel behavior.

## Phase 4: page migration order

Migrate in small reviewable commits:

1. global toolbar, sidebar, profile, command bar;
2. overview header, neutral metrics, activity, source health;
3. event explorer filters and table;
4. attacker, session, campaign, and cluster investigations;
5. commands, payloads, sandbox, alerts, health, history, dead letters;
6. settings, command palette, menus, toasts, and empty/error states;
7. remove unused AdminLTE and Bootstrap compatibility assets.

Do not remove AdminLTE until a repository-wide reference search proves every
required component has migrated.

## Phase 5: TypeScript behavior

Use `dashboard/frontend/` for:

- sidebar state;
- command/search palette;
- theme preference;
- menus and dialogs;
- table selection/sorting;
- lazy-list behavior;
- live-update reconciliation.

Keep API contracts strict. Do not expose raw unbounded backend objects to new
components. The production bundle must remain vendored and dependency-free at
runtime.

## Visual requirements

- Thin quiet borders, no gradients or glowing panels.
- 6px controls, 10px panels, 12px dialogs.
- Neutral metrics; severity appears in text/badges, not whole tiles.
- Warm off-white text and restrained terracotta focus/selection.
- Main content 960–1180px, detailed investigations up to 1360px.
- Large tables, maps, and evidence viewers may use full available width.
- Motion 120–160ms and disabled by reduced-motion preference.
- Dark, light, and system modes remain functional.

## Automated validation

Run repository-prescribed checks plus:

```bash
git diff --check
docker compose config --quiet
go test ./...
npm --prefix dashboard/frontend ci
npm --prefix dashboard/frontend run typecheck
npm --prefix dashboard/frontend run build
```

Use the exact scripts declared in `dashboard/frontend/package.json`; do not
invent missing script names.

Add tests for:

- initial shell HTML;
- every navigation route;
- role-aware actions;
- command routing;
- theme persistence;
- table and lazy-list state;
- live updates that preserve map and selection state;
- modal focus trapping and Escape behavior.

## Visual acceptance matrix

Capture each at 1440×900, 1024×768, and 390×844 in dark and light:

- overview;
- event explorer with results;
- event explorer empty state;
- attacker profile;
- session replay;
- campaigns;
- payload inventory and detail;
- sandbox queue/detail;
- alerts;
- source health;
- settings;
- open command palette;
- open destructive confirmation.

Compare against `Xore/theme/examples/workspace.html`,
`settings.html`, and `components.html`. Review spacing, hierarchy, focus,
overflow, loading, empty, warning, and error states.

## Completion criteria

- Theme commit is documented and `dashboard/static/theme.css` matches it.
- Every current route and critical action has an automated or manual check.
- No initial shell reconstruction or white flash remains.
- No external UI assets are requested.
- No unused AdminLTE/Bootstrap shell reference remains after the final phase.
- All Go, TypeScript, Compose, and repository CI checks pass.
- Visual acceptance matrix is reviewed before deployment.
- Production deployment is performed only when explicitly authorized.

## Rollback

Keep each phase independently revertible. Before the final asset-removal phase,
the previous AdminLTE assets remain available. Roll back the most recent phase
rather than resetting the repository or touching honeypot data volumes.
