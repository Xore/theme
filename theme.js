(function () {
  'use strict';

  var storageKey = 'xore-theme';
  var root = document.documentElement;

  function applyTheme(value) {
    if (value === 'dark' || value === 'light') {
      root.setAttribute('data-theme', value);
    } else {
      root.removeAttribute('data-theme');
    }
    document.querySelectorAll('[data-theme-value]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-value') === value));
    });
  }

  function setTheme(value) {
    try {
      if (value === 'system') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    } catch (_) {
      // Storage is optional; the visible theme still changes.
    }
    applyTheme(value);
  }

  function savedTheme() {
    try { return localStorage.getItem(storageKey) || 'system'; }
    catch (_) { return 'system'; }
  }

  function dialogBackdrop(id) {
    return document.querySelector('[data-dialog-backdrop="' + id + '"]');
  }

  function setBackdropState(backdrop, open) {
    if (!backdrop) return;
    backdrop.classList.toggle('open', open);
    backdrop.setAttribute('aria-hidden', String(!open));
    if (open) backdrop.removeAttribute('inert');
    else backdrop.setAttribute('inert', '');
  }

  function initialDialogFocus(dialog) {
    return dialog.querySelector('[data-dialog-initial-focus]') ||
      dialog.querySelector('[autofocus]') ||
      dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  }

  function openDialog(id, opener) {
    var dialog = document.getElementById(id);
    if (!dialog) return;
    dialog._themeOpener = opener || document.activeElement;
    setBackdropState(dialogBackdrop(id), true);
    if (dialog.showModal && !dialog.open) dialog.showModal();
    dialog.classList.add('open');
    var initialFocus = initialDialogFocus(dialog);
    if (initialFocus) initialFocus.focus();
  }

  function closeDialog(id) {
    var dialog = document.getElementById(id);
    if (!dialog || dialog.hasAttribute('data-permanent-dialog')) return;
    var opener = dialog._themeOpener;
    dialog.classList.remove('open');
    if (dialog.close && dialog.open) dialog.close();
    dialog._themeOpener = null;
    setBackdropState(dialogBackdrop(id), false);
    if (opener && opener.isConnected) opener.focus();
  }

  applyTheme(savedTheme());

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.action-menu')) {
      document.querySelectorAll('.action-menu[open]').forEach(function (menu) {
        menu.removeAttribute('open');
      });
    }
    var menuItem = event.target.closest('.action-menu__item');
    if (menuItem) menuItem.closest('.action-menu').removeAttribute('open');

    var themeButton = event.target.closest('[data-theme-value]');
    if (themeButton) {
      setTheme(themeButton.getAttribute('data-theme-value'));
      return;
    }

    var tab = event.target.closest('[role="tab"][data-tab-target]');
    if (tab) {
      var group = tab.closest('[data-tabs]');
      if (!group) return;
      group.querySelectorAll('[role="tab"]').forEach(function (candidate) {
        candidate.classList.toggle('active', candidate === tab);
        candidate.setAttribute('aria-selected', String(candidate === tab));
      });
      var scope = group.parentElement;
      scope.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-tab-panel') !== tab.getAttribute('data-tab-target');
      });
      return;
    }

    var opener = event.target.closest('[data-open-dialog]');
    if (opener) {
      openDialog(opener.getAttribute('data-open-dialog'), opener);
      return;
    }

    var closer = event.target.closest('[data-close-dialog]');
    if (closer) {
      closeDialog(closer.getAttribute('data-close-dialog'));
      return;
    }

    var backdrop = event.target.closest('[data-dialog-backdrop]');
    if (backdrop && backdrop === event.target) {
      closeDialog(backdrop.getAttribute('data-dialog-backdrop'));
    }
  });

  document.addEventListener('toggle', function (event) {
    if (!event.target.matches || !event.target.matches('.action-menu[open]')) return;
    document.querySelectorAll('.action-menu[open]').forEach(function (menu) {
      if (menu !== event.target) menu.removeAttribute('open');
    });
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var dialogs = document.querySelectorAll('dialog.open:not([data-permanent-dialog])');
    var deepestDialog = dialogs[dialogs.length - 1];
    if (deepestDialog) {
      event.preventDefault();
      closeDialog(deepestDialog.id);
    }
  });

  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (!dialog.hasAttribute('data-permanent-dialog')) closeDialog(dialog.id);
    });
  });

  document.querySelectorAll('dialog[data-permanent-dialog]').forEach(function (dialog) {
    if (dialog.showModal && !dialog.open) dialog.showModal();
    dialog.classList.add('open');
  });

  window.XoreTheme = {
    get: savedTheme,
    set: setTheme,
    openDialog: openDialog,
    closeDialog: closeDialog
  };
}());
