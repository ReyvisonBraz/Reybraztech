import { useState, FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Phone, Lock, Gift, Loader2,
  Smartphone, Tv, ChevronRight, CheckCircle2, Download,
  MessageCircle, ArrowRight, AlertCircle, ThumbsUp, ThumbsDown,
  Copy, Check, Shield, PartyPopper,
} from 'lucide-react';
import { API_URL } from '../config/api';

type Step = 'form' | 'device' | 'tutorial-phone' | 'tutorial-tv';
type FeedbackState = null | 'sending' | 'yes' | 'no';

export const TrialPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [phoneStep, setPhoneStep] = useState(0);
  const [tvStep, setTvStep] = useState(0);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [clientName, setClientName] = useState('');
  const [device, setDevice] = useState<'phone' | 'tv' | null>(null);

  // Download state
  const [downloadClicked, setDownloadClicked] = useState(false);

  // Code copy
  const [codeCopied, setCodeCopied] = useState(false);

  // Feedback — ref garante que nunca dispara duas vezes mesmo com double-click
  const feedbackSent = useRef(false);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Show confirm block after 2s on last tutorial step
  useEffect(() => {
    setShowConfirm(false);
    if ((step === 'tutorial-phone' && phoneStep === 2) || (step === 'tutorial-tv' && tvStep === 2)) {
      const t = setTimeout(() => setShowConfirm(true), 2000);
      return () => clearTimeout(t);
    }
  }, [step, phoneStep, tvStep]);

  // Countdown after YES
  useEffect(() => {
    if (feedbackState !== 'yes') return;
    if (countdown <= 0) { navigate('/dashboard'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [feedbackState, countdown, navigate]);

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
        body: JSON.stringify({ name, whatsapp, password, device: 'trial' }),
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
    if (feedbackSent.current) return; // bloqueia duplo clique / dupla chamada
    feedbackSent.current = true;
    setFeedbackState('sending');
    try {
      if (worked) {
        await fetch(`${API_URL}/api/orders/trial/activate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
      await fetch(`${API_URL}/api/clients/trial-feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ worked }),
      });
      // Marcar que feedback já foi enviado nesta sessão — dashboard não exibe o banner
      sessionStorage.setItem('trial_feedback_sent', '1');
      setFeedbackState(worked ? 'yes' : 'no');
    } catch {
      sessionStorage.setItem('trial_feedback_sent', '1');
      setFeedbackState(worked ? 'yes' : 'no');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText('850811');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const retryInstall = () => {
    setFeedbackState(null);
    setShowConfirm(false);
    if (device === 'phone') { setPhoneStep(0); setDownloadClicked(false); }
    else { setTvStep(0); }
  };

  // ── Feedback overlay (YES / NO result) ───────────────────────
  if (feedbackState === 'yes') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-transparent flex items-start justify-center">
        <div className="max-w-lg w-full mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="glass border-emerald-500/30 p-8 md:p-10 rounded-3xl border-2 text-center relative overflow-hidden"
          >
            {/* confete CSS */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    left: `${(i * 6) % 100}%`,
                    top: '-8px',
                    backgroundColor: ['#22d3ee','#a78bfa','#34d399','#f59e0b','#f472b6'][i % 5],
                  }}
                  animate={{ y: ['0vh', '110vh'], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)], opacity: [1, 0] }}
                  transition={{ duration: 2 + (i % 4) * 0.3, delay: i * 0.07, ease: 'linear' }}
                />
              ))}
            </div>

            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="text-7xl mb-6 inline-block"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-3">Seus 3 dias começaram!</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Aproveite ao máximo. Quando quiser continuar sem limites, assine um plano pelo painel.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-shimmer w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2 text-lg mb-4"
            >
              Ir para meu painel <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-500 text-sm">
              Redirecionando em <span className="text-cyan-400 font-bold">{countdown}s</span>...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (feedbackState === 'no') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-transparent flex items-start justify-center">
        <div className="max-w-lg w-full mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border-red-500/20 p-8 md:p-10 rounded-3xl border-2 text-center"
          >
            <div className="text-6xl mb-6">😕</div>
            <h2 className="text-2xl font-black text-white mb-3">Vamos resolver isso!</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Nossa equipe foi avisada. Fale diretamente no WhatsApp — respondemos rápido!
            </p>
            <a
              href={`https://wa.me/5591986450659?text=${encodeURIComponent(`Olá! Tentei instalar o app no teste gratuito mas não consegui acessar. Pode me ajudar?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shimmer w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-3 text-lg mb-4"
            >
              <MessageCircle className="w-6 h-6" /> Falar no WhatsApp
            </a>
            <button
              onClick={retryInstall}
              className="text-slate-400 hover:text-cyan-400 transition-colors text-sm font-bold flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Tentar instalar de novo
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Confirm block (inline, aparece no último passo) ──────────
  const ConfirmBlock = ({ isTV = false }: { isTV?: boolean }) => (
    <AnimatePresence>
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="mt-6 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5"
          style={{ boxShadow: '0 0 24px rgba(52,211,153,0.12)' }}
        >
          <p className="text-white font-black text-center text-lg mb-1">
            {isTV ? 'O app abriu e funcionou na TV?' : 'O app abriu e funcionou?'}
          </p>
          <p className="text-emerald-400/80 text-xs text-center mb-5">
            Ao confirmar, seus 3 dias de teste começam!
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleFeedback(true)}
              disabled={feedbackState === 'sending'}
              className="btn-shimmer w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {feedbackState === 'sending'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <ThumbsUp className="w-5 h-5" />}
              Sim, funcionou!
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={feedbackState === 'sending'}
              className="w-full py-4 rounded-2xl bg-white/5 border-2 border-red-500/30 text-red-400 font-black hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <ThumbsDown className="w-5 h-5" /> Não consegui
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="glass border-emerald-500/20 p-6 md:p-8 rounded-3xl border-2">
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

          {/* ── ETAPA 2: Escolha dispositivo ── */}
          {step === 'device' && (
            <motion.div key="device" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl border-2">
              <div className="text-center mb-8">
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Quase lá!</p>
                <h2 className="text-2xl font-black text-white mb-2">Onde quer usar, {clientName.split(' ')[0]}?</h2>
                <p className="text-slate-400 text-sm">Escolha o dispositivo para o tutorial certo.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => { setDevice('phone'); setStep('tutorial-phone'); }}
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

                <button onClick={() => { setDevice('tv'); setStep('tutorial-tv'); }}
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

          {/* ── ETAPA 3a: Tutorial CELULAR ── */}
          {step === 'tutorial-phone' && (
            <motion.div key="tutorial-phone" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl border-2">

              {/* Header com progress */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => phoneStep === 0 ? setStep('device') : setPhoneStep(s => s - 1)}
                  className="text-slate-400 hover:text-white transition-colors shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
                    Celular Android — Passo {phoneStep + 1} de 3
                  </p>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= phoneStep ? 'bg-cyan-400' : 'bg-white/10'} ${i <= phoneStep ? 'flex-[2]' : 'flex-1'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">

                {/* Phone Step 0: Download */}
                {phoneStep === 0 && (
                  <motion.div key="p0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-5">
                      <Download className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Baixe o app</h3>
                    <p className="text-slate-400 leading-relaxed mb-6">
                      Toque no botão abaixo para baixar o app oficial. É um arquivo APK — o Android vai pedir permissão para instalar, autorize.
                    </p>

                    <a
                      href="http://mkdw.qrdldunitvss.com/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDownloadClicked(true)}
                      className="btn-shimmer w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-3 text-lg mb-3"
                    >
                      <Download className="w-5 h-5" /> Baixar App Agora
                    </a>

                    <AnimatePresence>
                      {downloadClicked && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 justify-center mb-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2 h-2 rounded-full bg-emerald-400"
                          />
                          <span className="text-emerald-400 text-sm font-bold">Download iniciado! Continue aqui quando instalar.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setPhoneStep(1)}
                      className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${downloadClicked ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15' : 'bg-white/5 border border-white/10 text-slate-500'}`}
                    >
                      Já baixei, próximo <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Phone Step 1: Instalar */}
                {phoneStep === 1 && (
                  <motion.div key="p1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-5">
                      <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Instalando o app</h3>
                    <p className="text-slate-400 leading-relaxed mb-5">
                      Abra o arquivo baixado. O Android vai pedir para <span className="text-white font-bold">"Permitir esta fonte"</span> — toque em Configurações, ative e volte para instalar.
                    </p>

                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-6">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-200/80 text-sm leading-relaxed">
                        Se não encontrar o arquivo, cheque a pasta <span className="font-bold text-amber-300">Downloads</span> ou a barra de notificações do celular.
                      </p>
                    </div>

                    <button onClick={() => setPhoneStep(2)}
                      className="btn-shimmer w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                      Já instalei, próximo <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {/* Phone Step 2: Abrir + Confirmar */}
                {phoneStep === 2 && (
                  <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5">
                      <PartyPopper className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Abra o app agora!</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Com o app aberto, navegue pelos canais por alguns segundos para garantir que está funcionando.
                    </p>

                    <ConfirmBlock />

                    {!showConfirm && (
                      <div className="mt-6 flex items-center gap-2 justify-center text-slate-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aguardando você testar...
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* ── ETAPA 3b: Tutorial TV ── */}
          {step === 'tutorial-tv' && (
            <motion.div key="tutorial-tv" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="glass border-purple-500/20 p-6 md:p-8 rounded-3xl border-2">

              {/* Header com progress */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => tvStep === 0 ? setStep('device') : setTvStep(s => s - 1)}
                  className="text-slate-400 hover:text-white transition-colors shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">
                    TV Box / Smart TV — Passo {tvStep + 1} de 3
                  </p>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= tvStep ? 'bg-purple-400' : 'bg-white/10'} ${i <= tvStep ? 'flex-[2]' : 'flex-1'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">

                {/* TV Step 0: Downloader */}
                {tvStep === 0 && (
                  <motion.div key="tv0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-5">
                      <Download className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Baixe o Downloader</h3>
                    <p className="text-slate-400 leading-relaxed mb-8">
                      Na Play Store da sua TV Box ou Smart TV, pesquise por <span className="text-white font-bold">"Downloader"</span> (ícone laranja) e instale.
                    </p>
                    <button onClick={() => setTvStep(1)}
                      className="btn-shimmer w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                      Já instalei <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {/* TV Step 1: Código */}
                {tvStep === 1 && (
                  <motion.div key="tv1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5">
                      <Tv className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Digite o código</h3>
                    <p className="text-slate-400 leading-relaxed mb-5">
                      Abra o Downloader na TV, toque na barra de URL e digite exatamente esse código. Depois clique em <span className="text-white font-bold">GO</span>.
                    </p>

                    <div className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 mb-6">
                      <span className="text-5xl font-black tracking-widest text-emerald-400 font-mono">850811</span>
                      <button onClick={copyCode}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-bold hover:bg-emerald-500/30 transition-all">
                        {codeCopied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
                      </button>
                    </div>

                    <button onClick={() => setTvStep(2)}
                      className="btn-shimmer w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2">
                      Já digitei <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {/* TV Step 2: Instalar + Confirmar */}
                {tvStep === 2 && (
                  <motion.div key="tv2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5">
                      <CheckCircle2 className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Instale e abra!</h3>
                    <p className="text-slate-400 leading-relaxed">
                      A TV vai baixar e perguntar se quer instalar — confirme. Depois abra o app e navegue por alguns canais para testar.
                    </p>

                    <ConfirmBlock isTV />

                    {!showConfirm && (
                      <div className="mt-6 flex items-center gap-2 justify-center text-slate-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aguardando você testar...
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
