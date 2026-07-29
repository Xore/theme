# Modal behavior contract

This contract applies to every project that adopts the shared theme. It covers
DOM placement, top-layer behavior, focus, keyboard handling, confirmation, and
responsive presentation. Visual styling alone is not a complete modal
implementation.

## Modal types

- **Temporary dialog** — opened for a focused task and closed when that task is
  completed or cancelled.
- **Permanent settings dialog** — the authenticated application surface. It is
  opened on load, fills the viewport, has no close button, and remains open
  until navigation or logout.
- **Nested confirmation** — a warning, edit form, or destructive confirmation
  opened above a permanent settings dialog.

## Top-layer invariant

Browsers place a native `<dialog>` opened with `showModal()` in the top layer.
Ordinary sibling elements cannot render or receive input above it, regardless
of their `z-index`.

Therefore, a project must use one of two valid strategies:

1. Make the nested confirmation another native `<dialog>` and open it with
   `showModal()`. Use its native `::backdrop`; do not pair it with an ordinary
   sibling backdrop.
2. Keep the confirmation application-managed and place its backdrop and panel
   **inside** the permanent native dialog.

Never place an application-managed confirmation backdrop beside a permanent
native dialog:

```html
<!-- Incorrect: the backdrop is outside the browser top layer. -->
<dialog id="settings" data-permanent-dialog>...</dialog>
<div class="edit-dialog-backdrop">...</div>
```

Use descendant containment instead:

```html
<dialog id="settings" class="modal modal--permanent" data-permanent-dialog>
  <aside class="modal__sidebar">...</aside>
  <main class="modal__content">...</main>

  <div class="edit-dialog-backdrop" id="save-confirmation"
       aria-hidden="true" inert>
    <section class="edit-dialog" role="alertdialog" aria-modal="true"
             aria-labelledby="save-confirmation-title">
      <h2 id="save-confirmation-title">Save configuration?</h2>
      <p>Review the operational consequences before continuing.</p>
      <button type="button" data-cancel>Cancel</button>
      <button type="button" data-confirm>Save configuration</button>
    </section>
  </div>
</dialog>
```

The permanent dialog must be the nearest modal ancestor of every
application-managed nested overlay.

## Permanent settings behavior

A permanent settings dialog:

- opens immediately after an authenticated page loads;
- fills `100vw × 100dvh` and owns page scrolling;
- does not expose a close button;
- prevents the native `cancel` event from closing the settings surface;
- stays open when Escape closes a nested menu or confirmation;
- keeps sidebar and content scrolling independent where the viewport permits;
- collapses to a single-column layout on narrow screens; and
- routes legacy account/admin pages into the relevant settings pane.

When `theme.js` is used, mark the dialog with `data-permanent-dialog`. The
shared controller opens it automatically and protects it from both native
`cancel` events and document-level Escape handling.

The browser URL may identify the initial pane, for example
`/auth/app?pane=passkeys`. Unknown pane names must fall back to a safe default.

## Confirmation behavior

Actions that can invalidate credentials, sessions, keys, users, stored
configuration, or external connectivity require an explicit confirmation.

The sequence is:

1. The initiating button or Enter key opens a warning.
2. The warning names the action and describes its consequences.
3. Focus moves to the confirmation control.
4. Cancel closes only the nested confirmation and returns focus to the
   initiating control.
5. Confirm closes the warning, runs the action once, and reports success or
   failure visibly.

Do not submit a dangerous operation from the first click or key press.
Confirmation callbacks must be cleared before execution so repeated Enter,
double-clicks, or delayed events cannot run them twice.

## Keyboard rules

- Tab and Shift+Tab remain within the active modal layer.
- Escape closes the deepest temporary layer first.
- Escape never closes a permanent settings dialog.
- Enter in a configuration field opens the same warning as the Save button.
- Enter while the warning is active confirms it, except when focus is on
  Cancel or a multiline control.
- Enter in a multiline field inserts a newline unless the product explicitly
  documents another shortcut.
- Focus must remain visibly outlined in every theme mode.

## State and accessibility

For application-managed overlays:

- closed state: `aria-hidden="true"` and `inert`;
- open state: remove `inert`, set `aria-hidden="false"`, then move focus;
- use `role="dialog"` for editing and `role="alertdialog"` for consequential
  confirmation;
- set `aria-modal="true"` and provide `aria-labelledby`;
- restore focus when closing; and
- expose a live status message after asynchronous completion.

Never rely on opacity alone to close an overlay. A visually hidden layer must
also stop receiving pointer and keyboard input.

## Responsive and motion rules

- Dialog panels use `--radius-dialog` and `--shadow-dialog`.
- Permanent settings surfaces become square, borderless, full-viewport
  surfaces on compact screens.
- Nested panels leave at least 16px of viewport space and scroll internally
  when their content is taller than the viewport.
- Disable non-essential entrance animation under
  `prefers-reduced-motion: reduce`.

## Required regression checks

Every consuming repository should automate its DOM invariant and exercise the
behavior in a browser:

- every application-managed nested backdrop is a descendant of the permanent
  native dialog;
- Save opens a visible confirmation with non-zero dimensions;
- Enter in a configuration input opens the same confirmation;
- Confirm sends exactly one request and displays a result;
- Cancel sends no request and restores focus;
- Escape closes the nested layer but leaves settings open;
- rotation, deletion, logout-everywhere, credential reset, and configuration
  save use the same confirmation contract; and
- the behavior works at desktop and narrow mobile widths.
