import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ShieldAlert, Smartphone, CheckCircle2, ExternalLink } from 'lucide-react';

interface UnitvPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnitvPromoModal({ isOpen, onClose }: UnitvPromoModalProps) {
  const downloadUrl = 'http://mkdw.qrdldunitvss.com/download';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass border-orange-500/40 rounded-3xl border-2 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-orange-500/10 to-red-500/5">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-xl">APP UNITV</h3>
                  <p className="text-orange-400 text-sm font-bold">Aplicativo para assistir IPTV</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                Para assistir seus canais, você precisa instalar o <strong className="text-white">aplicativo UNITV</strong> no seu dispositivo.
              </p>
            </div>

            {/* Download Button */}
            <div className="px-6 pb-4">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30 border-2 border-orange-400 hover:from-orange-400 hover:to-red-500 transition-all"
              >
                <Download className="w-6 h-6" />
                Baixar APP UNITV
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>

            {/* Unknown Sources Warning */}
            <div className="mx-6 mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Permitir Fontes Desconhecidas
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed mb-2">
                    Antes de instalar, você precisa ativar a opção <strong className="text-white">"Fontes Desconhecidas"</strong> no seu dispositivo:
                  </p>
                  <ol className="text-slate-400 text-xs leading-relaxed space-y-1 list-decimal list-inside">
                    <li>Vá em <strong className="text-white">Configurações</strong></li>
                    <li>Procure <strong className="text-white">Segurança</strong> ou <strong className="text-white">Aplicativos</strong></li>
                    <li>Ative <strong className="text-white">"Fontes Desconhecidas"</strong> ou <strong className="text-white">"Fontes Desconhecidas para: [seu navegador]"</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Help text */}
            <div className="px-6 pb-6">
              <p className="text-center text-slate-500 text-xs">
                Não sabe como instalar? Assista o tutorial no menu do painel.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
