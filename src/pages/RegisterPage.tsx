import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, MessageSquare, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    device: '',
    whatsapp: ''
  });

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) setStep(step + 1);
    else {
      // Mock registration
      navigate('/login?registered=true');
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Já tem uma conta? Entrar
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow-card neon-border-cyan p-6 md:p-10 rounded-3xl md:rounded-[3rem] relative overflow-hidden border-2"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-cyan-500"
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Criar <span className="text-gradient">Conta</span></h2>
            <p className="text-slate-400">Junte-se à Reybraz Tech hoje.</p>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            {step === 1 ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    required
                    type="text" 
                    placeholder="Nome" 
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    required
                    type="text" 
                    placeholder="Sobrenome" 
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select 
                    required
                    className="w-full p-4 pl-12 bg-slate-900 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none"
                    value={formData.device}
                    onChange={(e) => setFormData({...formData, device: e.target.value})}
                  >
                    <option value="" disabled>Selecione seu dispositivo</option>
                    <option value="tvbox">TV Box / Fire Stick</option>
                    <option value="android">Celular Android</option>
                    <option value="smarttv">Smart TV Android</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    required
                    type="tel" 
                    placeholder="WhatsApp (com DDD)" 
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  Enviaremos uma mensagem de confirmação para o seu WhatsApp após o cadastro.
                </p>
              </motion.div>
            )}

            <button 
              type="submit"
              className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400"
            >
              {step === 1 ? 'Próximo Passo' : 'Finalizar Cadastro'}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 flex justify-center gap-2">
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-cyan-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
