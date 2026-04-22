import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const recentlyDismissed = dismissed
      && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Sempre previne o banner nativo do browser/Play Store
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-md mx-auto glass border-cyan-500/30 rounded-2xl p-4 border-2 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-white text-sm">Instalar ReyBraz</h3>
                <p className="text-slate-400 text-xs">Acesse rapidamente pelo seu celular</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstall}
                  className="p-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
