import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, MessageSquare, CheckCircle2, Lock, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { API_URL } from '../config/api';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'mensal';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (localStorage.getItem('reyb_token')) navigate('/dashboard');
  }, [navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    device: '',
    countryCode: '55',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (formData.password.length < 6) {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }

      setLoading(true);

      let isAwaking = false;
      const awakeTimer = setTimeout(() => {
        isAwaking = true;
        setErrorMsg('⚙️ O servidor está despertando. Isso pode levar até 50 segundos na primeira vez do dia.');
      }, 4000);

      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            whatsapp: formData.countryCode + formData.whatsapp,
            device: formData.device,
            password: formData.password,
          }),
        });

        clearTimeout(awakeTimer);
        if (isAwaking) setErrorMsg('');

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.error || 'Erro ao cadastrar.');
          return;
        }

        localStorage.setItem('reyb_token', data.token);
        localStorage.setItem('reyb_user', JSON.stringify(data.user));
        setStep(3);
      } catch {
        clearTimeout(awakeTimer);
        setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
      } finally {
        clearTimeout(awakeTimer);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {step === 1 && (
          <Link to="/login" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-sm font-bold">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Já tem uma conta? Entrar
          </Link>
        )}
        {step === 2 && (
          <button type="button" onClick={() => setStep(1)} className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors group px-4 py-2 rounded-full glass-light hover:bg-white/10 text-sm font-bold">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
        )}
        {step === 3 && <div className="mb-8" />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 md:p-10 rounded-3xl relative overflow-hidden"
        >
          <div className="text-center mb-8 mt-2">
            <h2 className="text-4xl font-black text-white mb-4">
              {step === 3 ? <span className="text-gradient">Conta Criada! 🎉</span> : <>Criar <span className="text-gradient">Conta</span></>}
            </h2>
            <p className="text-slate-400">
              {step === 1 && 'Preencha seus dados para começar.'}
              {step === 2 && 'Crie uma senha para acessar seu painel.'}
              {step === 3 && 'Agora é só ativar seu plano e começar a assistir!'}
            </p>
          </div>

          {/* Barra de progresso */}
          {step < 3 && (
            <div className="mb-10 px-2 pb-6">
              <div className="flex items-center justify-center gap-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800/80 rounded-full -z-10" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 -z-10"
                  style={{ width: step === 1 ? '0%' : '100%' }}
                />
                {[{ num: 1, label: 'Dados' }, { num: 2, label: 'Senha' }].map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-sm transition-all duration-500 ${
                      step === s.num
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-110 border-2 border-white/20'
                        : step > s.num
                          ? 'glass text-cyan-400 border-2 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-600 border-2 border-slate-700'
                    }`}>
                      {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`absolute -bottom-6 text-[0.65rem] font-black uppercase tracking-widest ${
                      step === s.num ? 'text-cyan-400' : step > s.num ? 'text-slate-400' : 'text-slate-600'
                    }`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-6">

            {/* ── PASSO 3: Sucesso ── */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="relative"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: Math.cos((i * Math.PI * 2) / 6) * 50, y: Math.sin((i * Math.PI * 2) / 6) * 50 }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                        style={{ background: i % 2 === 0 ? '#22d3ee' : '#a855f7' }}
                      />
                    ))}
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 className="text-2xl font-black text-white mb-2">Sua conta foi criada!</h3>
                  <p className="text-slate-400 text-sm leading-relaxed px-4">
                    Escolha seu plano para liberar o acesso. É rápido e você começa a assistir em minutos.
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-3">
                  {[
                    { plan: 'mensal', label: 'Mensal', price: 'R$35', days: '31 dias', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 text-cyan-400' },
                    { plan: 'trimestral', label: 'Trimestral', price: 'R$90', days: '93 dias', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/40 text-purple-400' },
                    { plan: 'semestral', label: 'Semestral', price: 'R$169', days: '186 dias', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-400' },
                    { plan: 'anual', label: 'Anual', price: 'R$299', days: '365 dias', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/40 text-orange-400' },
                  ].map((p) => (
                    <button key={p.plan} type="button" onClick={() => navigate(`/checkout?plan=${p.plan}`)}
                      className={`bg-gradient-to-br ${p.color} border rounded-2xl p-4 text-left transition-all hover:scale-105 active:scale-95`}>
                      <div className="font-black text-sm uppercase tracking-wide mb-1">{p.label}</div>
                      <div className="text-white font-black text-xl">{p.price}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{p.days}</div>
                    </button>
                  ))}
                </motion.div>

                <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  onClick={() => navigate(`/checkout?plan=${planFromUrl}`)}
                  className="btn-shimmer w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(14,165,233,0.4)] border-none text-lg">
                  <Zap className="w-6 h-6" />
                  Ativar Meu Plano Agora
                  <CreditCard className="w-5 h-5" />
                </motion.button>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
                  <button type="button" onClick={() => navigate('/dashboard')}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline">
                    Entrar no painel sem ativar por agora
                  </button>
                </motion.p>
              </motion.div>
            )}

            {/* ── PASSO 1: Dados ── */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="text" placeholder="Nome"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="text" placeholder="Sobrenome"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select required
                    className="w-full p-4 pl-12 bg-slate-900 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none"
                    value={formData.device} onChange={(e) => setFormData({ ...formData, device: e.target.value })}>
                    <option value="" disabled>Selecione seu dispositivo</option>
                    <option value="tvbox">TV Box / Fire Stick</option>
                    <option value="android">Celular Android</option>
                    <option value="smarttv">Smart TV Android</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-[6.5rem] shrink-0">
                    <select
                      className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none text-sm"
                      value={formData.countryCode} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}>
                      <option value="55">🇧🇷 +55</option>
                      <option value="351">🇵🇹 +351</option>
                      <option value="1">🇺🇸 +1</option>
                      <option value="44">🇬🇧 +44</option>
                      <option value="34">🇪🇸 +34</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="tel" placeholder="Ex: 91988887777"
                      className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                      value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>

                <button type="submit"
                  className="btn-shimmer w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400">
                  Próximo Passo
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* ── PASSO 2: Senha ── */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="password" placeholder="Crie uma senha (mín. 6 caracteres)"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="password" placeholder="Confirme a senha"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                </div>

                <p className="text-xs text-slate-500 text-center px-4">
                  Use seu WhatsApp e senha para entrar no painel a qualquer momento.
                </p>

                <AnimatePresence>
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                  className="btn-shimmer w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400 disabled:opacity-60">
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>Criar Minha Conta <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>
              </motion.div>
            )}

          </form>
        </motion.div>
      </div>
    </div>
  );
};
