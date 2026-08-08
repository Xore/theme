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

  // Closes an open .action-menu (native <details>) and returns focus to its
  // trigger, mirroring closeDialog()'s opener-focus-return. Used by the
  // outside-click and item-click paths below, and by Escape.
  function closeActionMenu(menu) {
    if (!menu || !menu.hasAttribute('open')) return;
    var summary = menu.querySelector('summary');
    menu.removeAttribute('open');
    if (summary) summary.focus();
  }

  function openNav(trigger) {
    var shell = trigger.closest('.app-shell');
    if (!shell) return;
    shell.classList.add('hp-nav-open');
    trigger.setAttribute('aria-expanded', 'true');
    shell._navOpener = trigger;
    var main = shell.querySelector('.app-main');
    if (main) {
      main.setAttribute('inert', '');
      main.setAttribute('aria-hidden', 'true');
    }
    var firstLink = shell.querySelector('.app-sidebar a, .app-sidebar button');
    if (firstLink) firstLink.focus();
  }

  function closeNav(shell) {
    if (!shell || !shell.classList.contains('hp-nav-open')) return;
    shell.classList.remove('hp-nav-open');
    var main = shell.querySelector('.app-main');
    if (main) {
      main.removeAttribute('inert');
      main.removeAttribute('aria-hidden');
    }
    var trigger = shell.querySelector('[data-nav-toggle]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    var opener = shell._navOpener;
    shell._navOpener = null;
    if (opener && opener.isConnected) opener.focus();
  }

  applyTheme(savedTheme());

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.action-menu')) {
      document.querySelectorAll('.action-menu[open]').forEach(closeActionMenu);
    }
    var menuItem = event.target.closest('.action-menu__item');
    if (menuItem) closeActionMenu(menuItem.closest('.action-menu'));

    var navToggle = event.target.closest('[data-nav-toggle]');
    if (navToggle) {
      var toggleShell = navToggle.closest('.app-shell');
      if (toggleShell) {
        if (toggleShell.classList.contains('hp-nav-open')) closeNav(toggleShell);
        else openNav(navToggle);
      }
      return;
    }

    var navScrim = event.target.closest('[data-nav-scrim]');
    if (navScrim) {
      closeNav(navScrim.closest('.app-shell'));
      return;
    }

    // Any link/button inside an open off-canvas drawer closes it first, so
    // the drawer doesn't stay marked open underneath whatever navigation
    // (or same-page action) the click triggers.
    var navLink = event.target.closest('.app-sidebar a, .app-sidebar button:not([data-nav-toggle])');
    if (navLink) {
      var linkShell = navLink.closest('.app-shell.hp-nav-open');
      if (linkShell) closeNav(linkShell);
    }

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
    // No focus-restore here (unlike the two closeActionMenu() call sites
    // above): the menu just opened via a real click on its own summary,
    // which the browser already focused natively -- calling .focus() on a
    // sibling menu's summary here would steal focus straight back off it.
    document.querySelectorAll('.action-menu[open]').forEach(function (menu) {
      if (menu !== event.target) menu.removeAttribute('open');
    });
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var openMenu = document.querySelector('.action-menu[open]');
      if (openMenu) {
        event.preventDefault();
        closeActionMenu(openMenu);
        return;
      }
      var openShell = document.querySelector('.app-shell.hp-nav-open');
      if (openShell) {
        event.preventDefault();
        closeNav(openShell);
        return;
      }
      var dialogs = document.querySelectorAll('dialog.open:not([data-permanent-dialog])');
      var deepestDialog = dialogs[dialogs.length - 1];
      if (deepestDialog) {
        event.preventDefault();
        closeDialog(deepestDialog.id);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      var openMenuEl = event.target.closest('.action-menu[open]');
      if (!openMenuEl) return;
      var onSummary = event.target.tagName === 'SUMMARY';
      var onItem = event.target.classList && event.target.classList.contains('action-menu__item');
      if (!onSummary && !onItem) return;
      var items = Array.prototype.slice.call(openMenuEl.querySelectorAll('.action-menu__item'));
      if (!items.length) return;
      event.preventDefault();
      if (onSummary) {
        (event.key === 'ArrowDown' ? items[0] : items[items.length - 1]).focus();
        return;
      }
      var at = items.indexOf(event.target);
      var nextItem = event.key === 'ArrowDown'
        ? items[(at + 1) % items.length]
        : items[(at - 1 + items.length) % items.length];
      nextItem.focus();
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      var tabTarget = event.target.closest('[role="tab"][data-tab-target]');
      if (!tabTarget) return;
      var tabGroup = tabTarget.closest('[data-tabs]');
      if (!tabGroup) return;
      var tabs = Array.prototype.slice.call(tabGroup.querySelectorAll('[role="tab"]'));
      var tabAt = tabs.indexOf(tabTarget);
      var nextTab;
      if (event.key === 'Home') nextTab = tabs[0];
      else if (event.key === 'End') nextTab = tabs[tabs.length - 1];
      else nextTab = tabs[(tabAt + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      event.preventDefault();
      nextTab.focus();
      nextTab.click();
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
