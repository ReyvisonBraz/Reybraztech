import { useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Rocket, Star } from 'lucide-react';
import { useIsPWA } from '../hooks/useIsPWA';
import { usePromoRules } from '../hooks/usePromoRules';

interface AppPromo {
  name: string;
  description: string;
  icon: string;
  url: string;
  badge?: string;
}

interface PromoContextType {
  triggerPromo: (apps: AppPromo[], title?: string, subtitle?: string) => void;
  hidePromo: () => void;
}

const PromoContext = createContext<PromoContextType | null>(null);

export function usePromoContext() {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromoContext must be used within PromoProvider');
  return ctx;
}

interface PromoProviderProps {
  children: ReactNode;
}

export function PromoProvider({ children }: PromoProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<AppPromo[]>([]);
  const [title, setTitle] = useState('Baixe nosso app');
  const [subtitle, setSubtitle] = useState('Melhore sua experiência');
  const { isPWA } = useIsPWA();
  const { canShow, recordShow, recordDismiss } = usePromoRules({
    maxShows: 5,
    cooldownDays: 3,
    delayMs: 0,
    sessionCooldownMs: 60000, // 1 minute between triggers
  });

  const triggerPromo = (newApps: AppPromo[], newTitle?: string, newSubtitle?: string) => {
    if (isPWA || !canShow()) return;
    
    setApps(newApps);
    setTitle(newTitle || 'Baixe nosso app');
    setSubtitle(newSubtitle || 'Melhore sua experiência');
    setIsOpen(true);
    recordShow();
  };

  const hidePromo = () => {
    setIsOpen(false);
    recordDismiss();
  };

  return (
    <PromoContext.Provider value={{ triggerPromo, hidePromo }}>
      {children}
      
      <AnimatePresence>
        {isOpen && apps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={hidePromo}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass border-cyan-500/30 rounded-3xl border-2 w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-white">{title}</h3>
                      <p className="text-slate-400 text-sm">{subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={hidePromo}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-2">
                {apps.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => {
                      window.open(app.url, '_blank');
                      hidePromo();
                    }}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-3"
                  >
                    <img
                      src={app.icon}
                      alt={app.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{app.name}</span>
                        {app.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[0.6rem] font-bold">
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{app.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PromoContext.Provider>
  );
}

// Hook for triggering promo from anywhere
export function useTriggerPromo() {
  const { triggerPromo } = usePromoContext();
  return triggerPromo;
}

// Ready-to-use app list for ReyBraz
export const REYBRAZ_APPS = [
  {
    name: 'ReyBraz IPTV',
    description: 'App oficial para assistir IPTV',
    icon: '/icons/icon-192.png',
    url: 'https://play.google.com/store/apps/details?id=com.reybraztech.iptv',
    badge: 'Recomendado',
  },
  {
    name: 'ReyBraz Manager',
    description: 'Gerencie sua conta',
    icon: '/icons/icon-192.png',
    url: 'https://play.google.com/store/apps/details?id=com.reybraztech.manager',
  },
];
