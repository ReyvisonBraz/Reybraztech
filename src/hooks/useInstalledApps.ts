import { useState, useCallback } from 'react';

export interface AppInfo {
  scheme: string;
  name: string;
  icon?: string;
  url?: string;
  installUrl?: string;
}

const BUILT_IN_APPS: AppInfo[] = [
  { scheme: 'whatsapp', name: 'WhatsApp', url: 'https://whatsapp.com' },
  { scheme: 'instagram', name: 'Instagram', url: 'https://instagram.com' },
  { scheme: 'tiktok', name: 'TikTok', url: 'https://tiktok.com' },
  { scheme: 'telegram', name: 'Telegram', url: 'https://telegram.org' },
  { scheme: 'spotify', name: 'Spotify', url: 'https://spotify.com' },
  { scheme: 'netflix', name: 'Netflix', url: 'https://netflix.com' },
  { scheme: 'youtube', name: 'YouTube', url: 'https://youtube.com' },
  { scheme: 'twitter', name: 'Twitter / X', url: 'https://x.com' },
];

export function useInstalledApps() {
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [checking, setChecking] = useState(false);

  const checkApp = useCallback(async (app: AppInfo): Promise<boolean> => {
    return new Promise((resolve) => {
      const start = Date.now();
      
      // Try to open the app URL scheme
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `${app.scheme}://`;
      
      const timeout = setTimeout(() => {
        // If it takes too long, app is likely not installed
        if (Date.now() - start > 500) {
          resolve(false);
        }
      }, 500);

      iframe.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      iframe.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      document.body.appendChild(iframe);
      
      // Clean up after a short time
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    });
  }, []);

  const checkAllApps = useCallback(async (apps: AppInfo[] = BUILT_IN_APPS) => {
    setChecking(true);
    const results: AppInfo[] = [];

    for (const app of apps) {
      const isInstalled = await checkApp(app);
      if (isInstalled) {
        results.push(app);
      }
    }

    setInstalledApps(results);
    setChecking(false);
    return results;
  }, [checkApp]);

  const checkSingleApp = useCallback(async (scheme: string, name: string, url?: string) => {
    const app: AppInfo = { scheme, name, url };
    const isInstalled = await checkApp(app);
    return isInstalled;
  }, [checkApp]);

  return {
    installedApps,
    checking,
    checkAllApps,
    checkSingleApp,
    BUILT_IN_APPS,
  };
}
