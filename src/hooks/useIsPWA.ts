import { useState, useEffect } from 'react';

interface PWAState {
  isPWA: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
}

export function useIsPWA(): PWAState {
  const [state, setState] = useState<PWAState>({
    isPWA: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    isMobile: false,
  });

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
      const isPWA = isStandalone || (isIOS && (navigator as any).standalone === true);

      setState({ isPWA, isStandalone, isIOS, isAndroid, isMobile });
    };

    checkPWA();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkPWA();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return state;
}
