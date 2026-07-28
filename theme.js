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

  applyTheme(savedTheme());

  document.addEventListener('click', function (event) {
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
      var dialog = document.getElementById(opener.getAttribute('data-open-dialog'));
      var backdrop = document.querySelector('[data-dialog-backdrop="' + opener.getAttribute('data-open-dialog') + '"]');
      if (dialog) {
        if (dialog.showModal) dialog.showModal();
        dialog.classList.add('open');
      }
      if (backdrop) backdrop.classList.add('open');
      return;
    }

    var closer = event.target.closest('[data-close-dialog]');
    if (closer) {
      closeDialog(closer.getAttribute('data-close-dialog'));
    }
  });

  function closeDialog(id) {
    var dialog = document.getElementById(id);
    var backdrop = document.querySelector('[data-dialog-backdrop="' + id + '"]');
    if (dialog) {
      dialog.classList.remove('open');
      if (dialog.close) dialog.close();
    }
    if (backdrop) backdrop.classList.remove('open');
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var openDialog = document.querySelector('dialog.open');
    if (openDialog) {
      event.preventDefault();
      closeDialog(openDialog.id);
    }
  });

  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog(dialog.id);
    });
  });

  window.XoreTheme = {
    get: savedTheme,
    set: setTheme
  };
}());
