import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Zap, Clock, Shield, PlayCircle, LogOut, CreditCard, CheckCircle2, Loader2, Copy, AlertTriangle, X, Eye, EyeOff, Download, BookOpen, Rocket, Lock, MessageCircle, ShieldCheck, BadgeCheck } from 'lucide-react';
import { API_URL } from '../config/api';
import { InstallationGuideModal } from '../components/InstallationGuideModal';
import { UnitvPromoModal } from '../components/UnitvPromoModal';
import { DashboardSkeleton } from '../components/ui/skeleton';

const WHATSAPP_BOT_NUMBER = '559191715764';
const WHATSAPP_ACTIVATION_MESSAGE = 'Olá! Quero validar meu número 🔐';

function WhatsAppValidationBanner({ whatsapp, verified }: { whatsapp: string; verified: boolean }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(`wa_validated_${whatsapp}`) === 'true'
  );
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  const persistDismiss = () => {
    localStorage.setItem(`wa_validated_${whatsapp}`, 'true');
    setDismissed(true);
  };

  // Reagir quando a verificação automática (via link) for concluída
  useEffect(() => {
    if (verified || localStorage.getItem(`wa_validated_${whatsapp}`) === 'true') {
      setDone(true);
      const t = setTimeout(() => persistDismiss(), 3000);
      return () => clearTimeout(t);
    }
  }, [verified, whatsapp]);

  if (dismissed) return null;

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
        <p className="text-emerald-400 font-bold">WhatsApp verificado com sucesso!</p>
      </motion.div>
    );
  }

  const waLink = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(WHATSAPP_ACTIVATION_MESSAGE)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-3xl border border-cyan-500/20 overflow-hidden"
    >
      <div className="bg-gradient-to-br from-cyan-500/[0.08] via-blue-500/[0.05] to-purple-500/[0.06] p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              {!sent && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-[#020617]"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-black text-base mb-1">Valide seu WhatsApp</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Necessário para recuperar sua conta se esquecer a senha.
              </p>

              {!sent ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px]">1</span>
                    Clique abaixo para abrir o WhatsApp
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSent(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir WhatsApp
                  </a>
                  <div className="flex items-center gap-2 text-slate-400 text-xs opacity-60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-slate-500 font-bold text-[11px]">2</span>
                    Envie a mensagem e clique no link que receber
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-cyan-400 text-sm font-bold">Aguardando sua validação...</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Abra o WhatsApp e clique no link que enviamos. A validação é automática.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSent(false)} className="text-xs text-slate-500 hover:text-slate-300 underline">
                      Voltar
                    </button>
                    <button onClick={persistDismiss} className="text-xs text-slate-500 hover:text-slate-300">
                      Fazer depois
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          <button onClick={persistDismiss} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface UserData {
  name: string;
  plan: string;
  status: string;
  whatsapp: string;
  whatsapp_verified: boolean;
  days_remaining: number;
  app_account: string | null;
  app_password: string | null;
  starhome: {
    account: string;
    password: string;
    package: string;
    days_remaining: number;
    in_use: string;
    expiration_date: string;
    last_sync: string;
  } | null;
  createdAt: string;
  paymentHistory: Array<{
    date: string;
    plan: string;
    value: string;
    status: string;
  }>;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExperienceQuestion, setShowExperienceQuestion] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showUnitvPromo, setShowUnitvPromo] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [showWaVerified, setShowWaVerified] = useState(false);

  // Dados de boas-vindas (temporários via sessionStorage)
  const [welcomeData, setWelcomeData] = useState<{
    whatsapp: string;
    password: string;
    email: string;
  } | null>(null);

  const location = useLocation();

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowPaymentBanner(true);
      setSearchParams({});
    }
  }, []);

  useEffect(() => {
    // Verificar se é primeiro acesso após cadastro
    if (searchParams.get('welcome') === 'true') {
      const state = location.state as { welcomePassword?: string; welcomeWhatsapp?: string; welcomeEmail?: string } | null;

      if (state?.welcomePassword && state?.welcomeWhatsapp) {
        setWelcomeData({
          whatsapp: state.welcomeWhatsapp,
          password: state.welcomePassword,
          email: state.welcomeEmail || '',
        });
        setShowWelcome(true);
      }
    }
  }, [searchParams, location.state]);

  // Auto-verificação de WhatsApp via link
  useEffect(() => {
    const verifyToken = searchParams.get('verify');
    const wa = searchParams.get('wa');

    if (verifyToken && wa && !localStorage.getItem(`wa_validated_${wa}`)) {
      const autoVerify = async () => {
        try {
          const res = await fetch(`${API_URL}/api/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whatsapp: wa, token: verifyToken, type: 'register' }),
          });
          if (res.ok) {
            localStorage.setItem(`wa_validated_${wa}`, 'true');
            setShowWaVerified(true);
            setUser(prev => prev ? { ...prev, whatsapp_verified: true } : null);
            setTimeout(() => setShowWaVerified(false), 5000);
          }
        } catch {
          // Silencioso - o banner ainda aparecerá para tentar novamente
        }
        setSearchParams({});
      };
      autoVerify();
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('reyb_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403 || response.status === 404) {
          localStorage.removeItem('reyb_token');
          localStorage.removeItem('reyb_user');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.detail || data.error || 'Erro ao carregar dados.');
          return;
        }

        setUser(data);
      } catch {
        setError('Não foi possível conectar ao servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('reyb_token');
    localStorage.removeItem('reyb_user');
    navigate('/');
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Remover ?welcome=true da URL
    setSearchParams({});
    // Limpar o state da navegação
    window.history.replaceState({}, '');
    // Mostrar pergunta sobre experiência
    setShowExperienceQuestion(true);
  };

  const handleExperienceAnswer = (isNewbie: boolean) => {
    setShowExperienceQuestion(false);
    if (isNewbie) {
      setShowGuide(true);
    }
    // Mostrar promo do UNITV após resposta da experiência (só para novos cadastros)
    if (welcomeData) {
      setTimeout(() => setShowUnitvPromo(true), 500);
    }
  };

  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  // Se o cliente já enviou feedback na TrialPage nesta sessão, não exibe o banner novamente
  const [trialFeedback, setTrialFeedback] = useState<'yes' | 'no' | null>(
    sessionStorage.getItem('trial_feedback_sent') ? 'yes' : null
  );
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleTrialFeedback = async (worked: boolean) => {
    setSendingFeedback(true);
    const token = localStorage.getItem('reyb_token');
    try {
      await fetch(`${API_URL}/api/clients/trial-feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ worked }),
      });
      setTrialFeedback(worked ? 'yes' : 'no');
    } catch {
      setTrialFeedback(worked ? 'yes' : 'no');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleRequestAccess = async () => {
    setRequestingAccess(true);
    const token = localStorage.getItem('reyb_token');
    try {
      await fetch(`${API_URL}/api/clients/request-access`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccessRequested(true);
    } catch {
      // silencioso — notificação pode falhar mas não bloqueia o usuário
      setAccessRequested(true);
    } finally {
      setRequestingAccess(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 md:pt-32 md:pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Erro de conexão
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-cyan-400 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const planLinks: Record<string, string> = {
    mensal: '/checkout?plan=mensal',
    trimestral: '/checkout?plan=trimestral',
    semestral: '/checkout?plan=semestral',
    anual: '/checkout?plan=anual',
  };

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 md:pt-32 md:pb-20">
      <InstallationGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      {/* ─── Modal de Boas-vindas ─── */}
      <AnimatePresence>
        {showWelcome && welcomeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass border-cyan-500/20 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border-2 max-w-lg w-full relative"
            >
              {/* Botão fechar */}
              <button
                onClick={handleCloseWelcome}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                  Cadastro <span className="text-gradient">Concluído!</span>
                </h2>
                <p className="text-slate-400 text-sm">
                  Bem-vindo à Reybraz Tech! Aqui estão seus dados de acesso.
                </p>
              </div>

              {/* Credenciais */}
              <div className="space-y-3 mb-6">
                {/* Telefone */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Telefone (Login)</p>
                    <p className="text-white font-bold font-mono">{welcomeData.whatsapp}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(welcomeData.whatsapp, 'whatsapp')}
                    className={`p-2 rounded-xl transition-all ${
                      copiedField === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {copiedField === 'whatsapp' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Senha */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Senha</p>
                    <p className="text-white font-bold font-mono">{welcomeData.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(welcomeData.password, 'password')}
                    className={`p-2 rounded-xl transition-all ${
                      copiedField === 'password'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {copiedField === 'password' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* E-mail (se fornecido) */}
                {welcomeData.email && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-widest mb-0.5">E-mail (Login alternativo)</p>
                      <p className="text-white font-bold font-mono text-sm truncate max-w-[14rem]">{welcomeData.email}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(welcomeData.email, 'email')}
                      className={`p-2 rounded-xl transition-all ${
                        copiedField === 'email'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Aviso importante */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-400 font-bold text-sm mb-1">Importante!</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Guarde esses dados em um lugar seguro. Você vai precisar do <strong className="text-white">telefone</strong> (ou e-mail) e da <strong className="text-white">senha</strong> para acessar sua conta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão fechar */}
              <button
                onClick={handleCloseWelcome}
                className="btn-shimmer w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400"
              >
                Entendi, ir para o painel
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal: Primeira vez ou Experiente? ─── */}
      <AnimatePresence>
        {showExperienceQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass border-cyan-500/20 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border-2 max-w-md w-full relative"
            >
              <button
                onClick={() => handleExperienceAnswer(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                  Primeira vez aqui?
                </h2>
                <p className="text-slate-400 text-sm">
                  Você é novo na Reybraz Tech e quer aprender como configurar seu dispositivo?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleExperienceAnswer(true)}
                  className="w-full p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/50 text-emerald-400 font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Sim, me ajude com a instalação
                </button>
                <button
                  onClick={() => handleExperienceAnswer(false)}
                  className="w-full p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-slate-300 font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                  <Rocket className="w-5 h-5" />
                  Já sou experiente, pular tutorial
                </button>
              </div>

              <p className="text-center text-slate-500 text-xs mt-6">
                Você pode acessar o tutorial a qualquer momento pelo menu do painel.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal: UNITV App Promo ─── */}
      <UnitvPromoModal
        isOpen={showUnitvPromo}
        onClose={() => setShowUnitvPromo(false)}
      />

      <div className="max-w-6xl mx-auto">
        {/* ─── Banner: Conta Inativa ─── */}
        {user.status === 'Inativo' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl overflow-hidden border-2 border-orange-500/50"
          >
            <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-white font-black text-lg">Sua conta está inativa</h3>
                <p className="text-orange-200/70 text-sm">Ative um plano para liberar seu acesso ao IPTV e ver suas credenciais.</p>
              </div>
              <Link
                to="/checkout"
                className="btn-shimmer shrink-0 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl border-none shadow-[0_0_20px_rgba(249,115,22,0.4)] whitespace-nowrap flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                ATIVAR AGORA
              </Link>
            </div>
          </motion.div>
        )}

        {/* ─── Banner: Pagamento aprovado ─── */}
        <AnimatePresence>
          {showPaymentBanner && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-8 rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-emerald-400 font-black text-lg mb-1">Pagamento confirmado! 🎉</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      Seu plano <span className="font-bold text-white capitalize">{user.plan}</span> está ativo
                      por <span className="font-bold text-white">{user.days_remaining} dias</span>.
                      Suas credenciais já estão disponíveis abaixo.
                    </p>
                    {user.app_account && (
                      <div className="flex flex-wrap gap-3 text-sm font-mono">
                        <span className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl text-slate-200">
                          👤 <span className="text-white font-bold">{user.app_account}</span>
                        </span>
                        <span className="bg-black/30 border border-white/10 px-3 py-1.5 rounded-xl text-slate-200">
                          🔐 <span className="text-white font-bold">{user.app_password}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowPaymentBanner(false)} className="text-slate-500 hover:text-slate-300 shrink-0 mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Banner: WhatsApp verificado via link ─── */}
        <AnimatePresence>
          {showWaVerified && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="mb-8 rounded-3xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-emerald-500/[0.08] to-cyan-500/[0.06] p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                    <div>
                      <motion.h3
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-emerald-400 font-black text-base mb-1"
                      >
                        WhatsApp Verificado!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-sm"
                      >
                        Agora você pode recuperar sua conta pelo WhatsApp se esquecer a senha.
                      </motion.p>
                    </div>
                  </div>
                  <button onClick={() => setShowWaVerified(false)} className="text-slate-500 hover:text-slate-300 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Banner: Validar WhatsApp ─── */}
        <WhatsAppValidationBanner whatsapp={user.whatsapp} verified={showWaVerified} />

        {/* ─── Banner: Trial — Feedback ─── */}
        {user.plan === 'trial' && user.status === 'Ativo' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-3xl overflow-hidden border-2 border-emerald-500/40"
          >
            <div className="bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-emerald-500/15 p-5 md:p-6">
              {!trialFeedback ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-white font-black text-lg">Conseguiu acessar o App?</h3>
                    <p className="text-emerald-200/70 text-sm">Seu teste está ativo por 3 dias. Conta o que achou!</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => handleTrialFeedback(true)}
                      disabled={sendingFeedback}
                      className="px-5 py-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 font-black hover:bg-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      ✅ Sim, funcionou!
                    </button>
                    <a
                      href={`https://wa.me/5591986450659?text=${encodeURIComponent(`Olá! Sou ${user.name} e estou no teste gratuito do app mas não consegui acessar. Pode me ajudar?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleTrialFeedback(false)}
                      className="px-5 py-3 rounded-2xl bg-red-500/20 border-2 border-red-500/50 text-red-400 font-black hover:bg-red-500/30 transition-all flex items-center gap-2"
                    >
                      ❌ Não consegui
                    </a>
                  </div>
                </div>
              ) : trialFeedback === 'yes' ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-white font-black text-lg">Que ótimo! 🎉</h3>
                    <p className="text-emerald-200/70 text-sm">Aproveite os 3 dias de teste. Quando quiser continuar, assine um plano!</p>
                  </div>
                  <Link
                    to="/checkout"
                    className="btn-shimmer shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black rounded-2xl border-none whitespace-nowrap"
                  >
                    Quero assinar um plano
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-black text-lg">Vamos te ajudar! 💬</h3>
                    <p className="text-slate-400 text-sm">Nossa equipe recebeu seu aviso e vai entrar em contato em breve.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Olá, <span className="text-gradient">{user.name.split(' ')[0]}</span></h1>
            <p className="text-slate-400">Bem-vindo ao seu painel de controle.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center text-slate-400 hover:text-primary transition-colors font-bold">
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border-cyan-500/20 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] lg:col-span-2 border-2"
          >
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Sua Assinatura</h2>
              <span className="status-badge status-badge-paid">
                {user.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 font-bold text-[0.65rem] md:text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2 text-cyan-400" />
                  Plano Atual
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white capitalize">{user.plan}</div>
              </div>
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 font-bold text-[0.65rem] md:text-xs uppercase tracking-widest">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-2 text-orange-400" />
                  WhatsApp
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{user.whatsapp}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Acesso Rápido</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 sm:grid-cols-2 gap-4">
                <a
                  href="http://mkdw.qrdldunitvss.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-orange-500/10 border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)] text-orange-400 font-bold flex items-center justify-center gap-2 hover:bg-orange-500/20 transition-all text-sm"
                >
                  <Download className="w-5 h-5" />
                  Baixar UNITV
                </a>
                <button
                  onClick={() => setShowGuide(true)}
                  className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all text-sm"
                >
                  <Download className="w-5 h-5" />
                  Tutorial
                </button>
                <a
                  href="https://www.uvweboficial.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-cyan-400 font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all text-sm"
                >
                  <PlayCircle className="w-5 h-5" />
                  Web Player
                </a>
                <button className="p-4 rounded-2xl bg-purple-500/10 border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-purple-400 font-bold flex items-center justify-center gap-2 hover:bg-purple-500/20 transition-all text-sm">
                  <Shield className="w-5 h-5" />
                  Suporte
                </button>
              </div>
            </div>

            {/* Dados de Acesso ao App — oculto para trial (app é gratuito, sem credenciais) */}
            {user.plan !== 'trial' && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Dados de Acesso ao App</h3>

              {/* Estado: Inativo — mostra cadeado */}
              {user.status === 'Inativo' ? (
                <div className="p-6 rounded-2xl bg-white/3 border border-orange-500/20 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Disponível após ativação</p>
                    <p className="text-slate-500 text-sm">Ative seu plano para ver suas credenciais de acesso ao IPTV.</p>
                  </div>
                  <Link to="/checkout" className="mt-1 px-5 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-sm hover:bg-orange-500/30 transition-all flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Ativar Plano
                  </Link>
                </div>

              /* Estado: Ativo mas sem login atribuído (pool vazio) */
              ) : user.status !== 'Inativo' && !user.app_account ? (
                <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Seu acesso está sendo preparado ⏳</p>
                    <p className="text-slate-500 text-sm">Estamos configurando suas credenciais. Normalmente leva alguns minutos.</p>
                  </div>
                  {!accessRequested ? (
                    <button
                      onClick={handleRequestAccess}
                      disabled={requestingAccess}
                      className="mt-1 px-5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold text-sm hover:bg-cyan-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {requestingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      {requestingAccess ? 'Enviando...' : 'Solicitar Acesso'}
                    </button>
                  ) : (
                    <div className="mt-1 px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Solicitação enviada! Em breve te avisamos.
                    </div>
                  )}
                </div>

              /* Estado normal: tem login atribuído */
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 md:p-5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-[0.65rem] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Dias Restantes
                    </p>
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-cyan-400">
                      {user.days_remaining} <span className="text-sm font-bold text-slate-500">Dias</span>
                    </p>
                    <div className="mt-3 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          user.days_remaining > 10 ? 'bg-emerald-500' :
                          user.days_remaining > 3 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((user.days_remaining / 30) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 md:p-5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-[0.65rem] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">Usuário / Conta</p>
                    <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                      {user.app_account}
                    </p>
                  </div>
                  <div
                    onClick={() => user.app_password && !showPassword && setShowPassword(true)}
                    className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 ${
                      showPassword
                        ? 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                        : 'bg-slate-100/50 dark:bg-white/5 border-cyan-500/30 cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[0.65rem] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Senha</p>
                      {user.app_password && showPassword && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(user.app_password!, 'app_password'); }}
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            {copiedField === 'app_password' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPassword(false); }}
                            className="text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {showPassword ? (
                      <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">{user.app_password}</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-lg md:text-xl font-bold text-slate-500 dark:text-slate-400">••••••</p>
                        <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[0.65rem] text-cyan-400 font-medium">Clique para ver</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            )}

            {/* ─── Referência ao Painel StarHome ─── */}
            {/* Só aparece se o cliente tem conta StarHome DIFERENTE da conta do app */}
            {user.starhome && user.starhome.account !== user.app_account && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 p-3 rounded-2xl bg-purple-500/[0.04] border border-purple-500/15"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[0.65rem] text-purple-400 font-bold uppercase tracking-widest">Painel StarHome</span>
                  <span className="text-[0.55rem] text-slate-600 ml-auto">para renovação</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className="text-[0.55rem] text-slate-600 uppercase font-bold tracking-wider">Conta</p>
                    <p className="text-xs font-bold text-slate-300 truncate">{user.starhome.account}</p>
                  </div>
                  <div>
                    <p className="text-[0.55rem] text-slate-600 uppercase font-bold tracking-wider">Senha</p>
                    <p className="text-xs font-bold text-slate-300 font-mono truncate">{user.starhome.password}</p>
                  </div>
                  <div>
                    <p className="text-[0.55rem] text-slate-600 uppercase font-bold tracking-wider">Pacote</p>
                    <p className="text-xs font-bold text-slate-400 truncate">{user.starhome.package || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[0.55rem] text-slate-600 uppercase font-bold tracking-wider">Expira</p>
                    <p className="text-xs font-bold text-slate-300">
                      {user.starhome.expiration_date
                        ? new Date(user.starhome.expiration_date).toLocaleDateString('pt-BR')
                        : `${user.starhome.days_remaining}d`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </motion.div>

          {/* Renewal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass border-orange-500/20 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 bg-orange-500/5"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Renovar Agora</h2>
            <p className="text-slate-400 mb-8 text-sm">Não perca o acesso! Renove seu plano antecipadamente e ganhe bônus de fidelidade.</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-3 text-orange-500" />
                Manter histórico e favoritos
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-3 text-orange-500" />
                Ativação instantânea
              </div>
            </div>

            <Link
              to={planLinks[user.plan] || '/checkout?plan=mensal'}
              className="btn-shimmer w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl border-none flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.5)] border-2 border-orange-400"
            >
              <CreditCard className="w-5 h-5" />
              Renovar Assinatura
            </Link>
          </motion.div>
        </div>

        {/* Histórico de Pagamentos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Histórico de Pagamentos</h2>

          {user.paymentHistory.length === 0 ? (
            <div className="glass p-10 rounded-3xl text-center text-slate-400">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-3xl glass">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {user.paymentHistory.map((item, i) => (
                      <tr key={i}>
                        <td className="p-6 text-slate-900 dark:text-white font-medium">{item.date}</td>
                        <td className="p-6 text-slate-900 dark:text-white capitalize">{item.plan}</td>
                        <td className="p-6 text-slate-900 dark:text-white">{item.value}</td>
                        <td className="p-6">
                          <span className={`font-bold flex items-center gap-2 ${item.status === 'Pago' ? 'text-green-500' : 'text-red-500'}`}>
                            {item.status === 'Pago' ? '✅' : '❌'} {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {user.paymentHistory.map((item, i) => (
                  <div key={i} className="glass p-6 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.date}</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white capitalize">{item.plan}</h4>
                      <p className="text-slate-500 font-bold">{item.value}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-1">{item.status === 'Pago' ? '✅' : '❌'}</div>
                      <p className={`text-xs font-black uppercase ${item.status === 'Pago' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
