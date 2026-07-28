# AI migration guide: Xore/auth-backend

## Objective

Migrate `Xore/auth-backend` to the shared `Xore/theme` repository while
preserving every authentication, administration, session, audit, and
configuration behavior.

This guide is written as an execution contract for an AI coding agent. Do not
redesign backend flows or deploy automatically unless the user asks.

Read [`MODALS.md`](./MODALS.md) before changing the permanent settings shell or
any confirmation behavior.

## Repositories

- Application: `https://github.com/Xore/auth-backend`
- Theme source: `https://github.com/Xore/theme`
- Runtime stylesheet: `forward-auth/ui/theme.css`

## Non-negotiable invariants

- Do not change route paths, form field names, CSRF headers, cookie behavior,
  WebAuthn requests, or administrator API payloads.
- Keep all static assets embedded in the Go binary.
- Do not add a CDN, web font request, npm runtime, or JavaScript framework.
- Preserve visible focus, responsive settings navigation, reduced motion, and
  the permanent logged-in settings surface.
- Preserve explicit warning dialogs for configuration saves, key rotations,
  credential resets, user deletion, and session invalidation.
- Keep `forward-auth/data/common-passwords.txt` unchanged. Words in that file
  are security data, not branding.

## Phase 1: establish the vendored runtime stylesheet

1. Confirm both worktrees are clean.
2. Record the full source commit:

   ```bash
   git -C ../theme rev-parse HEAD
   ```

3. Copy that revision's `theme.css` to `forward-auth/ui/theme.css` because the
   Go module and Docker build context embed assets from `forward-auth/ui`.
4. Record the source commit in `docs/THEME-GUIDE.md`.
5. When both repositories are checked out side by side, verify the copy:

   ```bash
   cmp ../theme/theme.css forward-auth/ui/theme.css
   ```

The complete portable package, examples, and migration documentation remain in
`Xore/theme`; do not duplicate them inside every consuming repository.

## Phase 2: remove legacy naming

1. Rename the old runtime stylesheet to `forward-auth/ui/theme.css`.
2. Rename the old design guide to `docs/THEME-GUIDE.md`.
3. Replace runtime links with `/static/theme.css` in:
   - `forward-auth/ui/app.html`
   - `forward-auth/ui/login.html` if present
   - `forward-auth/ui/verify.html` if present
   - `forward-auth/page.go`
   - any server-rendered passkey or recovery templates
4. Update comments in `forward-auth/static.go` and `forward-auth/page.go`.
5. Update README and roadmap cross-references.
6. Search for stale theme branding:

   ```bash
   rg -n -i '<previous-theme-name>' \
     --glob '!forward-auth/data/common-passwords.txt'
   ```

   The search must return no result. Do not edit the password dictionary.

## Phase 3: separate shared and application CSS

The shared stylesheet owns:

- tokens and theme modes;
- typography;
- buttons and form controls;
- cards, metrics, badges, alerts, tables, tabs, progress, empty states;
- toolbar/sidebar shell primitives;
- modal/settings/auth layout primitives;
- responsive and reduced-motion behavior.

Keep application-specific selectors in page-level nonce CSS when they encode:

- audit-table column widths;
- user action-menu positioning;
- settings field metadata;
- passkey row data;
- authentication step transitions;
- QR code dimensions;
- server-specific grids or status content.

Replace hard-coded colors, radii, and shadows in application CSS with shared
tokens. Do not move one-off selectors into `theme.css`.

## Phase 4: align the application visually

1. Use compact control geometry:
   - controls: 6px radius;
   - panels: 10px radius;
   - dialogs: 12px radius.
2. Use `--app-bg`, `--sidebar-bg`, and warm off-white text.
3. Remove permanent card shadows. Reserve shadows for menus and dialogs.
4. Use terracotta only for primary actions, focus, and selection.
5. Keep danger actions red and explicit.
6. Ensure the settings sidebar is approximately 224px on desktop.
7. Keep main content readable at normal desktop widths and responsive on
   390px-wide screens.

## Phase 5: documentation

Update:

- root `README.md` with the shared theme repository and sync policy;
- `docs/THEME-GUIDE.md` with the current token/component contract;
- `docs/UI-REDESIGN-GUIDE.md` to describe an inspired product layout without
  third-party product naming;
- `docs/ADMIN-UI-GUIDE.md`;
- `docs/AI-IMPLEMENTATION-ROADMAP.md`;
- any static asset examples.

Cross-link this migration guide and `Xore/theme/docs/ADOPTION.md`.

## Validation

Run:

```bash
cd forward-auth
gofmt -w '*.go'
go test ./...
go test -race ./...
go vet ./...
docker compose config --quiet
git diff --check
```

Extract the JavaScript from `ui/app.html`, replace Go template values with test
literals, and compile it with `new Function(...)`.

Browser acceptance:

- login page at desktop and mobile widths;
- account, passkeys, sessions, users, audit log, configuration, and system;
- edit values for more than one polling interval and confirm they remain;
- Enter opens the configuration warning and Enter again saves;
- dangerous actions keep their explicit warning;
- tables stay contained and readable;
- dark, light, and system examples in `theme/examples/`.

Network acceptance:

- no external font, CSS, icon, or script requests;
- `/static/theme.css` returns 200 with the expected content type;
- the old stylesheet URL is no longer referenced.

## Completion criteria

- Shared and embedded stylesheet copies are identical.
- No stale theme branding remains outside the password dictionary.
- All Go, race, vet, JavaScript, Compose, and diff checks pass.
- Browser review passes at 1440×900, 1024×768, and 390×844.
- Documentation names the source repository and exact vendored commit.
- Deployment, if requested, uses a persistent-volume backup and verifies public
  HTTPS health after the container is recreated.

## Rollback

Revert the migration commit. If a deployment was made, check out the previous
application commit and rebuild only `auth-portal`. Theme migration does not
require changes to `users.json`, settings, cookies, or signing keys.
