import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Download, ShieldCheck, Tv, LogIn, CheckCircle2 } from 'lucide-react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Bem-vindo ao Novo App!',
    description: 'Vamos te ensinar a baixar e instalar o nosso aplicativo oficial na sua TV Box ou Smart TV Android em apenas 4 passos.',
    icon: Tv,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20 text-cyan-400',
    image: null,
  },
  {
    title: 'Baixe o app Downloader',
    description: 'Acesse a loja de aplicativos da sua TV (Play Store) e pesquise pelo aplicativo "Downloader" (um app laranja). Instale e abra-o.',
    icon: Download,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    image: 'https://i.imgur.com/kH10tL3.png', // Fake reference or placeholder structure
  },
  {
    title: 'Digite o Código Mágico',
    description: 'Dentro do Downloader, na barra de URL (Home), digite o código de download oficial: 850811 e clique em "Go". O download do nosso app vai começar sozinho!',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    image: null,
    highlightCode: '850811'
  },
  {
    title: 'Permita Instalações',
    description: 'Se a TV pedir, clique em "Configurações" e permita que o app Downloader instale aplicativos desconhecidos. Depois, é só clicar em "Instalar".',
    icon: ShieldCheck,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    image: null,
  },
  {
    title: 'Faça o Login e Aproveite!',
    description: 'Abra o app da Reybraztech recém-instalado e faça login com o seu Telefone e Senha que você acabou de criar!',
    icon: LogIn,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    image: null,
  }
];

export const InstallationGuideModal = ({ isOpen, onClose }: InstallationGuideModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((c) => c + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center px-4 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -10 }}
          transition={{ duration: 0.3 }}
          className="glass border-cyan-500/30 p-1 md:p-2 rounded-3xl md:rounded-[2.5rem] border flex flex-col max-w-2xl w-full relative overflow-hidden"
        >
          {/* Progress Bar (Visual Header) */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 bg-white/5 opacity-80">
             {STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`flex-1 h-full transition-all duration-300 ${idx <= currentStep ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-transparent'}`} 
                />
             ))}
          </div>

          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6 md:p-10 flex flex-col items-center text-center">
            
            {/* Ícone ou Ilustração Maior */}
            <motion.div 
               initial={{ scale: 0.8, rotate: -10 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ type: "spring", stiffness: 200, damping: 15 }}
               className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${STEPS[currentStep].bg}`}
            >
              <StepIcon className={`w-10 h-10 md:w-12 md:h-12 ${STEPS[currentStep].color}`} />
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
               {STEPS[currentStep].title}
            </h2>
            
            <p className="text-slate-300 md:text-lg leading-relaxed mb-6">
               {STEPS[currentStep].description}
            </p>

            {/* Simulated Highlight if code exists */}
            {STEPS[currentStep].highlightCode && (
              <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/20 mb-6 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Código</span>
                <span className="text-3xl font-black text-emerald-400 tracking-widest">{STEPS[currentStep].highlightCode}</span>
              </div>
            )}

            {/* Step Indicators Bottom */}
            <div className="flex gap-2 mb-8">
               {STEPS.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`} 
                  />
               ))}
            </div>

            {/* Controls */}
            <div className="w-full flex justify-between gap-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`py-3 px-4 md:px-6 rounded-2xl font-bold flex items-center gap-2 transition-all ${currentStep === 0 ? 'opacity-0 invisible' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'}`}
              >
                <ChevronLeft className="w-5 h-5" /> Anterior
              </button>
              
              <button
                onClick={nextStep}
                className="btn-shimmer flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.4)] border-2 border-cyan-400"
              >
                {currentStep === STEPS.length - 1 ? (
                  <>Finalizar Guia <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>Próximo Passo <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
