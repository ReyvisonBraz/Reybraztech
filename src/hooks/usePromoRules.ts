import { useState, useEffect, useCallback } from 'react';

interface PromoRules {
  maxShows: number;        // Max times to show
  cooldownDays: number;     // Days before showing again after dismiss
  delayMs: number;          // Delay before first show
  sessionCooldownMs: number; // Cooldown within same session (ms)
}

const DEFAULT_RULES: PromoRules = {
  maxShows: 3,
  cooldownDays: 7,
  delayMs: 10000, // 10 seconds
  sessionCooldownMs: 300000, // 5 minutes
};

interface PromoState {
  showCount: number;
  lastShownAt: number | null;
  lastDismissedAt: number | null;
  sessionShownAt: number | null;
}

const STORAGE_KEY = 'app_promo_state';

function loadState(): PromoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return {
    showCount: 0,
    lastShownAt: null,
    lastDismissedAt: null,
    sessionShownAt: null,
  };
}

function saveState(state: PromoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function usePromoRules(rules: Partial<PromoRules> = {}) {
  const config = { ...DEFAULT_RULES, ...rules };
  const [state, setState] = useState<PromoState>(loadState);

  const canShow = useCallback(() => {
    const now = Date.now();
    const state = loadState();

    // Check max shows
    if (state.showCount >= config.maxShows) {
      return false;
    }

    // Check cooldown days after dismiss
    if (state.lastDismissedAt) {
      const daysSinceDismiss = (now - state.lastDismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < config.cooldownDays) {
        return false;
      }
    }

    // Check session cooldown
    if (state.sessionShownAt) {
      if (now - state.sessionShownAt < config.sessionCooldownMs) {
        return false;
      }
    }

    return true;
  }, [config]);

  const recordShow = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        showCount: prev.showCount + 1,
        lastShownAt: Date.now(),
        sessionShownAt: Date.now(),
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const recordDismiss = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        lastDismissedAt: Date.now(),
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = {
      showCount: 0,
      lastShownAt: null,
      lastDismissedAt: null,
      sessionShownAt: null,
    };
    saveState(newState);
    setState(newState);
  }, []);

  return {
    canShow,
    recordShow,
    recordDismiss,
    reset,
    showCount: state.showCount,
    maxShows: config.maxShows,
  };
}
