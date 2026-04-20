import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Phone, Lock, Gift, Loader2,
  Smartphone, Tv, ChevronRight, CheckCircle2, Download,
  MessageCircle, ArrowRight,
} from 'lucide-react';
import { API_URL } from '../config/api';

type Step = 'form' | 'device' | 'tutorial-tv' | 'tutorial-phone' | 'feedback';

const TV_STEPS = [
  {
    icon: Download,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    title: 'Baixe o Downloader',
    desc: 'Na Play Store da sua TV, pesquise "Downloader" (ícone laranja) e instale.',
  },
  {
    icon: () => <span className="text-2xl font-black text-emerald-400">850811</span>,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    title: 'Digite o código',
    desc: 'Abra o Downloader, digite o código 850811 na barra de URL e clique em "Go".',
  },
  {
    icon: CheckCircle2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    title: 'Instale e abra',
    desc: 'Permita a instalação quando a TV pedir e abra o app da Reybraztech.',
  },
];

const PHONE_STEPS = [
  {
    icon: Download,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    title: 'Baixe o app',
    desc: 'Acesse o link abaixo para baixar o app oficial direto no seu celular.',
    link: 'http://mkdw.qrdldunitvss.com/download',
    linkLabel: 'Baixar App',
  },
  {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    title: 'Instale e abra',
    desc: 'Após baixar, instale o arquivo APK. Se pedir permissão, autorize e abra o app.',
  },
];

export const TrialPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [tvTutorialStep, setTvTutorialStep] = useState(0);
  const [phoneTutorialStep, setPhoneTutorialStep] = useState(0);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [clientName, setClientName] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const whatsapp = `55${phone.replace(/\D/g, '')}`;
    if (whatsapp.length < 12) { setError('WhatsApp inválido. Inclua o DDD.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, password, device: 'trial', plan: 'trial' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); return; }

      localStorage.setItem('reyb_token', data.token);
      localStorage.setItem('reyb_user', JSON.stringify(data.user));
      setToken(data.token);
      setClientName(data.user.name);
      setStep('device');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async (worked: boolean) => {
    setSendingFeedback(true);
    try {
      if (worked) {
        // Ativar 3 dias
        await fetch(`${API_URL}/api/orders/trial/activate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
      // Enviar feedback ao Telegram
      await fetch(`${API_URL}/api/clients/trial-feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ worked }),
      });
      setFeedbackDone(true);
      if (worked) setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setFeedbackDone(true);
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {step === 'form' && (
          <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group font-bold">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </Link>
        )}

        <AnimatePresence mode="wait">

          {/* ── ETAPA 1: Formulário ── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass border-emerald-500/20 p-6 md:p-8 rounded-3xl border-2"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Teste Gratuito</h2>
                <p className="text-slate-400 text-sm">Crie sua conta e experimente por 3 dias, sem compromisso.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Gift, text: '100% Gratuito' },
                  { icon: CheckCircle2, text: 'Sem Cartão' },
                  { icon: Smartphone, text: 'Celular ou TV' },
                  { icon: CheckCircle2, text: '3 Dias de Teste' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl text-sm text-slate-300">
                    <item.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="text" placeholder="Seu nome completo" value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all" />
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center px-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-sm font-mono min-w-[72px] justify-center">+55</div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="tel" placeholder="WhatsApp (com DDD)" value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input required type="password" placeholder="Crie uma senha (mín. 6 caracteres)" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all" />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-sm text-center font-bold">{error}</motion.p>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={submitting}
                  className="btn-shimmer w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-lg border-none disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-6 h-6 animate-spin" />Criando conta...</> : <><Gift className="w-6 h-6" />Criar conta e testar</>}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── ETAPA 2: Escolha o dispositivo ── */}
          {step === 'device' && (
            <motion.div key="device" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl border-2">
              <div className="text-center mb-8">
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Etapa 1 de 2</p>
                <h2 className="text-2xl font-black text-white mb-2">Onde quer usar, {clientName.split(' ')[0]}?</h2>
                <p className="text-slate-400 text-sm">Escolha o dispositivo para ver o tutorial certo pra você.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setStep('tutorial-phone')}
                  className="p-6 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-4 text-left group">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg">Celular Android</p>
                    <p className="text-slate-400 text-sm">Baixar e instalar no celular</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button onClick={() => setStep('tutorial-tv')}
                  className="p-6 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-4 text-left group">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Tv className="w-7 h-7 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg">TV Box / Smart TV</p>
                    <p className="text-slate-400 text-sm">Instalar na televisão</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 3a: Tutorial TV ── */}
          {step === 'tutorial-tv' && (
            <motion.div key="tutorial-tv" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-purple-500/20 p-6 md:p-8 rounded-3xl border-2">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('device')} className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">TV Box / Smart TV — Passo {tvTutorialStep + 1} de {TV_STEPS.length}</p>
                  <div className="flex gap-1 mt-1">
                    {TV_STEPS.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i <= tvTutorialStep ? 'bg-purple-400 w-8' : 'bg-white/10 w-4'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={tvTutorialStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className={`w-16 h-16 rounded-2xl ${TV_STEPS[tvTutorialStep].bg} flex items-center justify-center mb-6`}>
                    {tvTutorialStep === 1
                      ? <span className="text-2xl font-black text-emerald-400">850811</span>
                      : (() => { const Icon = TV_STEPS[tvTutorialStep].icon as any; return <Icon className={`w-8 h-8 ${TV_STEPS[tvTutorialStep].color}`} />; })()
                    }
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{TV_STEPS[tvTutorialStep].title}</h3>
                  <p className="text-slate-400 leading-relaxed mb-8">{TV_STEPS[tvTutorialStep].desc}</p>
                </motion.div>
              </AnimatePresence>

              {tvTutorialStep < TV_STEPS.length - 1 ? (
                <button onClick={() => setTvTutorialStep(s => s + 1)}
                  className="btn-shimmer w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                  Próximo <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={() => setStep('feedback')}
                  className="btn-shimmer w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                  Já instalei! <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          )}

          {/* ── ETAPA 3b: Tutorial Celular ── */}
          {step === 'tutorial-phone' && (
            <motion.div key="tutorial-phone" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl border-2">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('device')} className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Celular Android — Passo {phoneTutorialStep + 1} de {PHONE_STEPS.length}</p>
                  <div className="flex gap-1 mt-1">
                    {PHONE_STEPS.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all ${i <= phoneTutorialStep ? 'bg-cyan-400 w-8' : 'bg-white/10 w-4'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={phoneTutorialStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className={`w-16 h-16 rounded-2xl ${PHONE_STEPS[phoneTutorialStep].bg} flex items-center justify-center mb-6`}>
                    {(() => { const Icon = PHONE_STEPS[phoneTutorialStep].icon as any; return <Icon className={`w-8 h-8 ${PHONE_STEPS[phoneTutorialStep].color}`} />; })()}
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{PHONE_STEPS[phoneTutorialStep].title}</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">{PHONE_STEPS[phoneTutorialStep].desc}</p>
                  {'link' in PHONE_STEPS[phoneTutorialStep] && (
                    <a href={(PHONE_STEPS[phoneTutorialStep] as any).link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold hover:bg-cyan-500/30 transition-all mb-6">
                      <Download className="w-4 h-4" />
                      {(PHONE_STEPS[phoneTutorialStep] as any).linkLabel}
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>

              {phoneTutorialStep < PHONE_STEPS.length - 1 ? (
                <button onClick={() => setPhoneTutorialStep(s => s + 1)}
                  className="btn-shimmer w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                  Próximo <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={() => setStep('feedback')}
                  className="btn-shimmer w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                  Já instalei! <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          )}

          {/* ── ETAPA 4: Feedback ── */}
          {step === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="glass border-emerald-500/20 p-6 md:p-8 rounded-3xl border-2 text-center">

              {!feedbackDone ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📱</span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Conseguiu acessar o App?</h2>
                  <p className="text-slate-400 text-sm mb-8">Ao confirmar que funcionou, seus 3 dias de teste começam agora!</p>

                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleFeedback(true)} disabled={sendingFeedback}
                      className="btn-shimmer w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-3 disabled:opacity-50">
                      {sendingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      ✅ Sim, funcionou! Iniciar meus 3 dias
                    </button>

                    <a href={`https://wa.me/5591986450659?text=${encodeURIComponent('Olá! Criei minha conta no teste gratuito mas não consegui acessar o app. Pode me ajudar?')}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => handleFeedback(false)}
                      className="w-full py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-slate-300 font-black hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      ❌ Não consegui — preciso de ajuda
                    </a>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Seus 3 dias começaram! 🎉</h2>
                  <p className="text-slate-400 text-sm mb-6">Aproveite. Quando quiser continuar, assine um plano no painel.</p>
                  <p className="text-slate-500 text-xs">Redirecionando para o painel...</p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
