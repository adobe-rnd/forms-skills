/* style-screen feedback widget
 * Injected via chrome-devtools MCP evaluate_script.
 * Lets the user click elements on the rendered AEM form and attach comments.
 * Annotations buffer to window.__styleFeedback for the skill to read back via
 * evaluate_script.
 */
(function () {
  if (window.__styleScreenWidget) {
    document.getElementById('ssw-toolbar')?.removeAttribute('hidden');
    return;
  }
  window.__styleScreenWidget = true;
  window.__styleFeedback = window.__styleFeedback || [];

  const STABLE_CLASS_PREFIXES = ['field-'];
  const STABLE_CLASS_NAMES = new Set([
    'panel-wrapper', 'field-wrapper', 'wizard', 'current-wizard-step',
    'wizard-menu-items', 'wizard-button-wrapper', 'cards', 'horizontal',
    'text-wrapper', 'number-wrapper', 'email-wrapper', 'date-wrapper',
    'drop-down-wrapper', 'radio-group-wrapper', 'checkbox-group-wrapper',
    'file-wrapper', 'radio-wrapper', 'checkbox-wrapper', 'submit-wrapper',
    'field-label', 'field-description', 'field-invalid',
  ]);

  let mode = 'idle';
  let hoveredEl = null;
  let pickedEl = null;
  let pickedRect = null;

  function isStable(cls) {
    return STABLE_CLASS_NAMES.has(cls) || STABLE_CLASS_PREFIXES.some(p => cls.startsWith(p));
  }

  function selectorFor(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let cur = el;
    let hitAnchor = false;
    while (cur && cur.nodeType === 1 && cur !== document.body && !hitAnchor) {
      let part = cur.tagName.toLowerCase();
      const stable = [...cur.classList].filter(isStable);
      if (stable.length) {
        part += '.' + stable.map(CSS.escape).join('.');
        if (stable.some(c => c.startsWith('field-'))) hitAnchor = true;
      } else if (cur.parentElement) {
        const sibs = [...cur.parentElement.children].filter(c => c.tagName === cur.tagName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function xpathFor(el) {
    if (!el) return '';
    if (el.id) return `//*[@id="${el.id}"]`;
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body) {
      const sibs = [...cur.parentElement.children].filter(c => c.tagName === cur.tagName);
      const idx = sibs.length > 1 ? `[${sibs.indexOf(cur) + 1}]` : '';
      parts.unshift(`${cur.tagName.toLowerCase()}${idx}`);
      cur = cur.parentElement;
    }
    return '//' + parts.join('/');
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
      viewportX: Math.round(r.left),
      viewportY: Math.round(r.top),
    };
  }

  function isWidgetEl(el) {
    // Comment box is appended outside #ssw-root (directly to dialog or body)
    // so we must check all widget containers explicitly.
    return el && el.closest &&
      el.closest('#ssw-root, #ssw-comment, #ssw-highlight, #ssw-tooltip');
  }

  // --- UI ---
  const root = document.createElement('div');
  root.id = 'ssw-root';
  root.innerHTML = `
    <style>
      #ssw-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      /* Override UA popover defaults for standalone overlay elements.
         UA sets inset:0 (stretches to fill) and margin:auto (centers).
         We position each element explicitly via left/top. */
      #ssw-highlight[popover], #ssw-tooltip[popover], #ssw-comment[popover] {
        position: fixed; inset: auto; margin: 0;
        padding: 0; border: 0; background: transparent;
        max-width: none; max-height: none; overflow: visible;
      }
    </style>
    <style>
      /* Make any modal-dialog backdrop click-transparent while the widget
         is loaded. Without this, AEM's <dialog>.showModal() renders a
         full-viewport ::backdrop with pointer-events: auto that swallows
         every click — including ones aimed at our toolbar painted on top.
         Trade-off: click-outside-to-dismiss on dialogs is disabled while
         the widget is active. The dialog's own close button still works. */
      dialog::backdrop { pointer-events: none !important; }
      #ssw-toolbar {
        position: fixed; top: 12px; right: 12px; z-index: 2147483647;
        background: #1a1a1a; color: #fff; border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 30%); padding: 8px;
        display: flex; gap: 6px; align-items: center; font-size: 13px;
      }
      #ssw-toolbar button {
        background: #2a2a2a; color: #fff; border: 1px solid #444;
        border-radius: 4px; padding: 6px 10px; cursor: pointer; font-size: 13px;
      }
      #ssw-toolbar button:hover { background: #3a3a3a; }
      #ssw-toolbar button.active { background: #5F8DDA; border-color: #5F8DDA; }
      #ssw-toolbar .ssw-count {
        background: #5F8DDA; color: #fff; border-radius: 10px;
        padding: 2px 8px; font-size: 12px; font-weight: 600;
      }
      #ssw-highlight {
        position: fixed; pointer-events: none; z-index: 2147483646;
        outline: 2px solid #5F8DDA; outline-offset: 1px;
        background: rgb(95 141 218 / 8%); transition: all 60ms;
      }
      #ssw-tooltip {
        position: fixed; z-index: 2147483647; pointer-events: none;
        background: #1a1a1a; color: #5F8DDA; padding: 4px 8px;
        border-radius: 4px; font-size: 11px; font-family: ui-monospace, monospace;
        max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #ssw-comment {
        position: fixed; z-index: 2147483647; background: #fff;
        border: 1px solid #ddd; border-radius: 8px; padding: 12px;
        box-shadow: 0 6px 24px rgb(0 0 0 / 18%); width: 320px;
      }
      #ssw-comment .ssw-sel {
        font-family: ui-monospace, monospace; font-size: 11px; color: #5F8DDA;
        margin-bottom: 8px; word-break: break-all;
      }
      #ssw-comment textarea {
        width: 100%; min-height: 80px; border: 1px solid #ccc;
        border-radius: 4px; padding: 8px; font-size: 13px; resize: vertical;
        font-family: inherit;
      }
      #ssw-comment .ssw-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
      #ssw-comment button { background: #5F8DDA; color: #fff; border: 0; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
      #ssw-comment button.cancel { background: #eee; color: #333; }
      #ssw-list {
        position: fixed; top: 60px; right: 12px; z-index: 2147483647;
        background: #fff; border: 1px solid #ddd; border-radius: 8px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 18%); width: 320px;
        max-height: 60vh; overflow-y: auto; padding: 8px;
      }
      #ssw-list[hidden] { display: none; }
      #ssw-list .ssw-item { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
      #ssw-list .ssw-item:last-child { border-bottom: 0; }
      #ssw-list .ssw-item code { font-size: 11px; color: #5F8DDA; word-break: break-all; }
      #ssw-list .ssw-item .ssw-cmt { margin-top: 4px; color: #333; }
      #ssw-list .ssw-item button { float: right; background: none; border: 0; cursor: pointer; color: #999; font-size: 14px; }
      #ssw-list .ssw-item.done { opacity: 0.55; }
      #ssw-list .ssw-item.done code, #ssw-list .ssw-item.done .ssw-cmt { text-decoration: line-through; }
      #ssw-list .ssw-item .ssw-status { color: #2E8B57; font-weight: 600; margin-right: 4px; }
      #ssw-comment .ssw-edit-note { font-size: 11px; color: #666; margin-bottom: 6px; font-style: italic; }
      #ssw-launcher {
        position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
        width: 44px; height: 44px; border-radius: 50%; border: 0;
        background: #1a1a1a; color: #fff; cursor: pointer; font-size: 20px;
        box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
      }
      #ssw-launcher:hover { background: #2a2a2a; }
      #ssw-launcher[hidden], #ssw-toolbar[hidden] { display: none; }
    </style>
    <div id="ssw-toolbar">
      <button type="button" id="ssw-pick" title="Pick elements to annotate — Shift+P to toggle without losing form state, Esc to exit">🎯 Pick</button>
      <button type="button" id="ssw-show-list">📋 <span class="ssw-count">0</span></button>
      <button type="button" id="ssw-send">📤 Send</button>
      <button type="button" id="ssw-close" title="Minimize (Shift+S to reopen)">−</button>
    </div>
    <button type="button" id="ssw-launcher" title="Open style-screen widget (Shift+S)" hidden>🎯</button>
    <div id="ssw-list" hidden></div>
  `;
  // Toolbar/launcher/list: regular DOM at z-index MAX. Physical clicks reach
  // them because dialog::backdrop has pointer-events:none (see <style> above).
  document.body.appendChild(root);

  const toolbar = root.querySelector('#ssw-toolbar');
  const btnPick = root.querySelector('#ssw-pick');
  const btnShowList = root.querySelector('#ssw-show-list');
  const btnSend = root.querySelector('#ssw-send');
  const btnClose = root.querySelector('#ssw-close');
  const btnLauncher = root.querySelector('#ssw-launcher');
  const list = root.querySelector('#ssw-list');
  const countBadge = root.querySelector('.ssw-count');

  // Highlight and tooltip are standalone popovers so they render in the top
  // layer above any native <dialog>. They have pointer-events:none so they
  // don't affect hit-testing. syncRootLocation() re-shows them after a dialog opens
  // so they stay above the dialog in the top-layer stack.
  function makeOverlayPopover(id) {
    const el = document.createElement('div');
    el.id = id;
    el.style.display = 'none';
    if ('showPopover' in HTMLElement.prototype) {
      el.setAttribute('popover', 'manual');
      document.body.appendChild(el);
      try { el.showPopover(); } catch (_) {}
    } else {
      document.body.appendChild(el);
    }
    return el;
  }
  let highlight = makeOverlayPopover('ssw-highlight');
  let tooltip   = makeOverlayPopover('ssw-tooltip');

  // Chrome's showModal() blocks pointer events to ALL elements outside the
  // dialog's DOM subtree — regardless of z-index or top-layer position.
  // Fix: when a dialog opens, move the widget root INTO the dialog so it
  // becomes a DOM descendant and is exempt from modal blocking.
  // position:fixed on the toolbar keeps it visually at top-right regardless
  // of where root sits in the DOM.
  function syncRootLocation() {
    const dialog = document.querySelector('dialog[open]');
    if (dialog && !dialog.contains(root)) {
      dialog.appendChild(root);
    } else if (!dialog && root.parentElement !== document.body) {
      document.body.appendChild(root);
    }
    // AEM form runtime may disable buttons inside the form — always reset.
    root.querySelectorAll('button').forEach(b => { b.disabled = false; });
    // Also bump visual overlay popovers so they render above the dialog.
    [highlight, tooltip].forEach(el => {
      if (!el.hidePopover) return;
      try { el.hidePopover(); el.showPopover(); } catch (_) {}
    });
    const cb = document.getElementById('ssw-comment');
    if (cb?.hidePopover) { try { cb.hidePopover(); cb.showPopover(); } catch (_) {} }
  }
  let bumpQueued = false;
  function queueBump() {
    if (bumpQueued) return;
    bumpQueued = true;
    requestAnimationFrame(() => { bumpQueued = false; syncRootLocation(); });
  }
  // Watch for dialogs opening/closing.
  const topLayerObserver = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' && r.attributeName === 'open') { queueBump(); return; }
      if (r.type === 'childList') {
        for (const node of r.addedNodes) {
          if (node.nodeType === 1 && (node.tagName === 'DIALOG' || node.querySelector?.('dialog'))) {
            queueBump(); return;
          }
        }
      }
    }
  });
  topLayerObserver.observe(document.body, {
    subtree: true, attributes: true, attributeFilter: ['open'], childList: true,
  });
  // Also move root back to body when a dialog closes.
  document.addEventListener('close', (e) => {
    if (e.target.tagName === 'DIALOG') queueBump();
  }, true);

  function setMode(next) {
    mode = next;
    btnPick.classList.toggle('active', mode === 'pick');
    if (mode !== 'pick') {
      highlight.style.display = 'none';
      tooltip.style.display = 'none';
    }
  }

  function refreshList() {
    const pendingCount = window.__styleFeedback.filter(a => a.status !== 'done').length;
    countBadge.textContent = pendingCount;
    list.innerHTML = window.__styleFeedback.map((a) => {
      const done = a.status === 'done';
      return `
      <div class="ssw-item${done ? ' done' : ''}" data-id="${a.id}">
        <button data-id="${a.id}" class="ssw-rm" title="Remove">✕</button>
        ${done ? '<span class="ssw-status" title="Marked done">✓</span>' : ''}
        <code>${a.selector}</code>
        <div class="ssw-cmt">${a.comment ? a.comment.replace(/[<>]/g, '') : '<i>no comment</i>'}</div>
      </div>`;
    }).join('');
    list.querySelectorAll('.ssw-rm').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const i = window.__styleFeedback.findIndex(a => a.id === id);
        if (i >= 0) window.__styleFeedback.splice(i, 1);
        refreshList();
      });
    });
  }

  // Hover highlight in pick mode
  document.addEventListener('mousemove', (e) => {
    if (mode !== 'pick') return;
    if (isWidgetEl(e.target)) {
      highlight.style.display = 'none';
      tooltip.style.display = 'none';
      return;
    }
    hoveredEl = e.target;
    const r = hoveredEl.getBoundingClientRect();
    highlight.style.cssText += `display:block;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    tooltip.textContent = selectorFor(hoveredEl);
    tooltip.style.cssText += `display:block;left:${Math.min(r.left, window.innerWidth - 380)}px;top:${Math.max(r.top - 24, 4)}px;`;
  }, true);

  // Click in pick mode → open comment box
  document.addEventListener('click', (e) => {
    if (mode !== 'pick' || isWidgetEl(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    pickedEl = e.target;
    pickedRect = rectOf(pickedEl);
    openCommentBox();
  }, true);

  function openCommentBox() {
    document.getElementById('ssw-comment')?.remove();
    const sel = selectorFor(pickedEl);
    // How many existing pending annotations on the same selector? (informational only)
    const existingPending = window.__styleFeedback.filter(a => a.selector === sel && a.status !== 'done').length;
    const box = document.createElement('div');
    box.id = 'ssw-comment';
    const r = pickedEl.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - 340);
    const top = Math.min(r.bottom + 8, window.innerHeight - 220);
    box.style.cssText = `left:${left}px;top:${top}px;`;
    const note = existingPending > 0
      ? `<div class="ssw-edit-note">${existingPending} pending annotation(s) already on this element. This will add another.</div>`
      : '';
    box.innerHTML = `
      <div class="ssw-sel">${sel}</div>
      ${note}
      <textarea placeholder="What's wrong here? (e.g. padding too tight, wrong font weight, off color)"></textarea>
      <div class="ssw-actions">
        <button type="button" class="cancel">Cancel</button>
        <button type="button" class="save">Save</button>
      </div>
    `;
    // Append inside the active dialog if present (avoids focus-trap blocking),
    // otherwise append to body. position:fixed keeps visual position correct.
    const activeDialog = document.querySelector('dialog[open]');
    (activeDialog || document.body).appendChild(box);
    // Reset disabled in case AEM form runtime disables buttons inside the form.
    box.querySelectorAll('button').forEach(b => { b.disabled = false; });
    const ta = box.querySelector('textarea');
    ta.focus();
    box.querySelector('.cancel').addEventListener('click', () => { box.remove(); setMode('idle'); });
    box.querySelector('.save').addEventListener('click', () => {
      const ts = Date.now();
      const annotation = {
        id: `a-${ts}-${Math.random().toString(36).slice(2, 7)}`,
        selector: sel,
        xpath: xpathFor(pickedEl),
        bbox: pickedRect,
        comment: ta.value.trim(),
        status: 'pending',
        ts,
      };
      window.__styleFeedback.push(annotation);
      box.remove();
      setMode('idle');
      refreshList();
    });
  }

  // Toolbar wiring
  btnPick.addEventListener('click', () => setMode(mode === 'pick' ? 'idle' : 'pick'));
  btnShowList.addEventListener('click', () => { list.hidden = !list.hidden; });
  btnSend.addEventListener('click', () => {
    // Signal readiness — DO NOT clear or mutate. Skill reads pending(), processes, then markDone().
    window.__styleFeedbackReady = true;
    const pending = window.__styleFeedback.filter(a => a.status !== 'done').length;
    btnSend.textContent = pending ? `✓ Sent (${pending})` : '✓ Sent';
    setTimeout(() => { btnSend.textContent = '📤 Send'; }, 1800);
  });
  function showWidget() {
    toolbar.removeAttribute('hidden');
    btnLauncher.setAttribute('hidden', '');
  }
  function hideWidget() {
    toolbar.setAttribute('hidden', '');
    btnLauncher.removeAttribute('hidden');
    setMode('idle');
    document.getElementById('ssw-comment')?.remove();
  }
  // Minimize-on-close (preserves annotations + state)
  btnClose.addEventListener('click', hideWidget);
  btnLauncher.addEventListener('click', showWidget);
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Esc — exit Pick mode without affecting form state
    if (e.key === 'Escape' && mode === 'pick') {
      setMode('idle');
      document.getElementById('ssw-comment')?.remove();
      return;
    }
    if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Shift+P — toggle Pick mode via keyboard so form focus/state is preserved
      if (e.key === 'P') {
        e.preventDefault();
        setMode(mode === 'pick' ? 'idle' : 'pick');
        return;
      }
      // Shift+S — toggle widget visibility
      if (e.key === 'S') {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        if (toolbar.hasAttribute('hidden')) showWidget(); else hideWidget();
      }
    }
  });
  // Recovery + lifecycle API on window for skill + emergency console use
  window.__styleScreen = {
    show: showWidget,
    hide: hideWidget,
    destroy: () => {
      topLayerObserver.disconnect();
      [highlight, tooltip].forEach(el => { try { el.hidePopover?.(); } catch (_) {} el.remove(); });
      document.getElementById('ssw-comment')?.remove();
      root.remove();
      delete window.__styleScreenWidget; delete window.__styleScreen;
    },
    bumpToTop: syncRootLocation,
    // Read pending annotations only (status !== 'done')
    pending: () => window.__styleFeedback.filter(a => a.status !== 'done'),
    all: () => window.__styleFeedback.slice(),
    // Mark one annotation done by id — no-op if not found
    markDone: (id) => {
      const a = window.__styleFeedback.find(a => a.id === id);
      if (a && a.status !== 'done') {
        a.status = 'done';
        a.doneTs = Date.now();
        refreshList();
        return true;
      }
      return false;
    },
    // Mark a list of ids done in one call
    markManyDone: (ids) => {
      const set = new Set(ids);
      const now = Date.now();
      let n = 0;
      window.__styleFeedback.forEach(a => {
        if (set.has(a.id) && a.status !== 'done') { a.status = 'done'; a.doneTs = now; n++; }
      });
      refreshList();
      return n;
    },
    // Mark all currently-pending as done (skill calls this after applying CSS)
    markAllDone: () => {
      let n = 0;
      const now = Date.now();
      window.__styleFeedback.forEach(a => { if (a.status !== 'done') { a.status = 'done'; a.doneTs = now; n++; } });
      refreshList();
      return n;
    },
    // Remove all done annotations (housekeeping)
    purgeDone: () => {
      const before = window.__styleFeedback.length;
      window.__styleFeedback = window.__styleFeedback.filter(a => a.status !== 'done');
      refreshList();
      return before - window.__styleFeedback.length;
    },
    // Nuclear: remove every annotation
    clear: () => {
      window.__styleFeedback.length = 0;
      window.__styleFeedbackReady = false;
      refreshList();
    },
  };

  refreshList();
  console.log('[style-screen] feedback widget injected. Shift+S to toggle. API: window.__styleScreen.{show,hide,destroy,pending,all,markDone,markAllDone,purgeDone,clear}. Annotations at window.__styleFeedback.');
})();
