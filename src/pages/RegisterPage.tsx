import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, MessageSquare, CheckCircle2, Mail, Lock, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    device: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step < 2) {
      setStep(step + 1);
      return;
    }

    // Validar senha no passo 2
    if (formData.password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          whatsapp: formData.whatsapp,
          device: formData.device,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Erro ao cadastrar.');
        return;
      }

      // Sucesso → ir para login com mensagem
      navigate('/login?registered=true');

    } catch {
      setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
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
          {/* Barra de progresso */}
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
            {/* ─── PASSO 1: Nome, Dispositivo e WhatsApp ─── */}
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
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select
                    required
                    className="w-full p-4 pl-12 bg-slate-900 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
              </motion.div>
            ) : (
              /* ─── PASSO 2: E-mail e Senha ─── */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="password"
                    placeholder="Crie uma senha (mín. 6 caracteres)"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="password"
                    placeholder="Confirme a senha"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  Use seu e-mail e senha para acessar o painel do cliente.
                </p>
              </motion.div>
            )}

            {/* Mensagem de erro */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400 disabled:opacity-60"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {step === 1 ? 'Próximo Passo' : 'Finalizar Cadastro'}
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
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
