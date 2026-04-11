import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ExternalLink, Smartphone, Rocket, Star } from 'lucide-react';
import { useIsPWA } from '../hooks/useIsPWA';
import { usePromoRules } from '../hooks/usePromoRules';

interface AppPromo {
  name: string;
  description: string;
  icon: string;
  url: string;
  installUrl?: string;
  badge?: string;
}

interface AppPromoModalProps {
  apps: AppPromo[];
  title?: string;
  subtitle?: string;
  maxShows?: number;
  cooldownDays?: number;
  delayMs?: number;
  enabled?: boolean;
}

export function AppPromoModal({
  apps,
  title = 'Baixe nosso aplicativo',
  subtitle = 'Instale o app para melhor experiência e acesso offline',
  maxShows = 3,
  cooldownDays = 7,
  delayMs = 10000,
  enabled = true,
}: AppPromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartedDelay, setHasStartedDelay] = useState(false);
  const { isPWA, isMobile } = useIsPWA();
  const { canShow, recordShow, recordDismiss, showCount, maxShows: max } = usePromoRules({
    maxShows,
    cooldownDays,
    delayMs,
  });

  useEffect(() => {
    if (!enabled || isPWA || hasStartedDelay) return;

    const timer = setTimeout(() => {
      setHasStartedDelay(true);
      if (canShow()) {
        setIsOpen(true);
        recordShow();
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [enabled, isPWA, delayMs, canShow, recordShow, hasStartedDelay]);

  const handleClose = () => {
    setIsOpen(false);
    recordDismiss();
  };

  const handleAppClick = (app: AppPromo) => {
    window.open(app.url, '_blank');
  };

  // Don't show if PWA, not mobile, or already shown max times
  if (!enabled || isPWA || !isMobile || showCount >= max) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass border-cyan-500/30 rounded-3xl border-2 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">{title}</h3>
                    <p className="text-slate-400 text-sm">{subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Apps List */}
            <div className="px-6 pb-4 space-y-2">
              {apps.map((app, index) => (
                <motion.button
                  key={app.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAppClick(app)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-4 text-left group"
                >
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white truncate">{app.name}</h4>
                      {app.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm truncate">{app.description}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2">
              <p className="text-center text-slate-500 text-xs">
                Já mostrado {showCount}/{max} vezes
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Specialized component for ReyBraz tech recommendations
export function ReyBrazPromoModal() {
  const reyBrazApps: AppPromo[] = [
    {
      name: 'ReyBraz IPTV',
      description: 'Nosso app oficial para assistir IPTV',
      icon: '/icons/icon-192.png',
      url: 'https://play.google.com/store/apps/details?id=com.reybraztech.iptv',
      badge: 'Recomendado',
    },
    {
      name: 'ReyBraz Manager',
      description: 'Gerencie sua conta e assinaturas',
      icon: '/icons/icon-192.png',
      url: 'https://play.google.com/store/apps/details?id=com.reybraztech.manager',
    },
  ];

  return (
    <AppPromoModal
      apps={reyBrazApps}
      title="Melhore sua experiência"
      subtitle="Baixe nosso app para assistir onde quiser"
      maxShows={3}
      cooldownDays={7}
      delayMs={15000}
    />
  );
}
