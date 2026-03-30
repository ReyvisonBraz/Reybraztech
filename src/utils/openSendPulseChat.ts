const STORAGE_KEY = 'sp-chat-active-session';
const INTERACTION_THRESHOLD = 5000; // 5 seconds = assume user interacted

/**
 * Restores widget visibility on page load if the user had an active conversation.
 * Call this once on app mount.
 */
export function restoreSendPulseChat() {
  if (localStorage.getItem(STORAGE_KEY)) {
    document.body.classList.add('sp-chat-active');
  }
}

/**
 * Opens the SendPulse live chat widget.
 *
 * Behavior:
 * - Shows the `<sp-live-chat>` element (hidden by default via CSS).
 * - Clicks the fab button inside shadow DOM to open the chat window.
 * - If the user stays 5+ seconds → saves to localStorage (conversation assumed).
 * - If the user closes quickly (< 5s) → hides widget and clears flag.
 * - On next page load, `restoreSendPulseChat()` re-shows the widget if flagged.
 */
export function openSendPulseChat() {
  const widget = document.querySelector('sp-live-chat') as HTMLElement | null;

  if (!widget) {
    window.open('https://wa.me/5591986450659', '_blank');
    return;
  }

  // Show widget
  document.body.classList.add('sp-chat-active');

  const openedAt = Date.now();
  let interacted = !!localStorage.getItem(STORAGE_KEY);

  // Mark as interacted after threshold
  const interactionTimer = setTimeout(() => {
    interacted = true;
    localStorage.setItem(STORAGE_KEY, '1');
  }, INTERACTION_THRESHOLD);

  // Try to auto-click the fab to open the chat panel
  setTimeout(() => {
    try {
      const shadow = widget.shadowRoot;
      if (shadow) {
        const fab = shadow.querySelector('[class*="fab"]') as HTMLElement
          || shadow.querySelector('button') as HTMLElement;
        if (fab) fab.click();
      }
    } catch (_) { /* shadow DOM may not be accessible */ }
  }, 300);

  // Watch for close/minimize
  const observer = new MutationObserver(() => {
    // Detect if widget was collapsed: check if its rendered height shrunk
    const rect = widget.getBoundingClientRect();
    const isMinimized = rect.height < 100;

    if (isMinimized && Date.now() - openedAt > 1000) {
      if (!interacted) {
        // Closed quickly without interaction — hide completely
        clearTimeout(interactionTimer);
        document.body.classList.remove('sp-chat-active');
        localStorage.removeItem(STORAGE_KEY);
      }
      // If interacted, widget stays visible (minimized) — user can reopen
      observer.disconnect();
    }
  });

  observer.observe(widget, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Safety cleanup
  setTimeout(() => observer.disconnect(), 1800000);
}

/**
 * Clears the active session flag. Call this if you want to fully reset.
 */
export function clearSendPulseSession() {
  localStorage.removeItem(STORAGE_KEY);
  document.body.classList.remove('sp-chat-active');
}
