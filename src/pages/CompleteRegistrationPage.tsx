import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, Monitor, Mail, Lock, Loader2, CheckCircle2, Clock, MessageCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { API_URL } from '../config/api';

const DEVICE_OPTIONS = [
  { value: 'tvbox', label: 'TV Box Android' },
  { value: 'firestick', label: 'Fire Stick' },
  { value: 'smarttv', label: 'Smart TV Android' },
  { value: 'celular', label: 'Celular Android' },
  { value: 'outro', label: 'Outro' },
];

type OrderData = {
  name: string;
  whatsapp: string;
  plan: string;
  status: string;
  amount: number;
  device?: string;
};

const STRONG_PASSWORDS = [
  'Rey@2024#Braz!',
  'Tech#Rey9@Secure',
  'Braz!Tech$2024Rey',
  'ReyBraz@2024#Tech',
  'Secure$Rey9@Braz',
];

function getPasswordStrength(password: string): { score: number; label: string; color: string; bgColor: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Fraca', color: 'text-red-400', bgColor: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Média', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
  if (score <= 6) return { score, label: 'Forte', color: 'text-emerald-400', bgColor: 'bg-emerald-500' };
  return { score, label: 'Excelente', color: 'text-cyan-400', bgColor: 'bg-cyan-500' };
}

function PasswordRequirements({ password }: { password: string }) {
  const reqs = [
    { label: 'Mínimo 6 caracteres', met: password.length >= 6 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Caractere especial (!@#$%)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest mb-2">Requisitos da senha:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {reqs.map((req, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
              {req.met ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            {req.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [device, setDevice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPasswordTips, setShowPasswordTips] = useState(false);

  // Pre-fill device from order (trial sends device)
  useEffect(() => {
    if (order?.device) {
      setDevice(order.device);
    }
  }, [order?.device]);

  // Buscar dados do pedido
  useEffect(() => {
    if (!orderId) {
      setError('Pedido nao encontrado.');
      setLoading(false);
      return;
    }

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    const maxPolls = 24; // 2 minutos (5s * 24)

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`);
        if (!res.ok) {
          setError('Pedido nao encontrado.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrder(data);
        setLoading(false);

        // Se status == paid, para de fazer polling
        if (data.status === 'paid') {
          if (pollInterval) clearInterval(pollInterval);
        }

        // Se ja registrado, redireciona
        if (data.status === 'registered') {
          if (pollInterval) clearInterval(pollInterval);
          navigate('/login');
        }

        // Se ainda pendente, continua polling
        if (data.status === 'pending') {
          pollCount++;
          if (pollCount >= maxPolls) {
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch {
        setError('Erro ao buscar pedido.');
        setLoading(false);
      }
    };

    fetchOrder();

    // Polling para pedidos pendentes (aguardando webhook do MP)
    pollInterval = setInterval(() => {
      if (pollCount < maxPolls) {
        fetchOrder();
      } else {
        if (pollInterval) clearInterval(pollInterval);
      }
    }, 5000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!device) {
      setFormError('Selecione seu dispositivo.');
      return;
    }

    if (password.length < 6) {
      setFormError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As senhas nao coincidem.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          device,
          email: email || '',
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao criar conta.');
        setSubmitting(false);
        return;
      }

      // Salvar token e dados do usuario
      localStorage.setItem('reyb_token', data.token);
      localStorage.setItem('reyb_user', JSON.stringify(data.user));

      // Redirecionar para dashboard
      navigate('/dashboard?welcome=true', {
        state: {
          justRegistered: true,
          whatsapp: order?.whatsapp,
          password: password,
          email: email || null,
        },
      });
    } catch {
      setFormError('Erro de conexao. Tente novamente.');
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Erro
  if (error || !order) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="glass p-8 rounded-3xl border border-red-500/30">
            <p className="text-red-400 font-bold mb-4">{error || 'Pedido nao encontrado.'}</p>
            <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-bold">
              Voltar para o inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Aguardando confirmacao (pagamento ou trial via WhatsApp)
  if (order.status === 'pending') {
    const isTrial = order.plan === 'trial';
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-md mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass p-8 rounded-3xl border ${isTrial ? 'border-emerald-500/30' : 'border-yellow-500/30'}`}
          >
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-full ${isTrial ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-yellow-500/20 border-yellow-500/50'} border-2 flex items-center justify-center`}>
                {isTrial
                  ? <MessageCircle className="w-8 h-8 text-emerald-400 animate-pulse" />
                  : <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                }
              </div>
            </div>
            <h2 className="text-xl font-black text-white mb-2">
              {isTrial ? 'Aguardando Confirmacao' : 'Aguardando Pagamento'}
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              {isTrial
                ? 'Envie a mensagem no WhatsApp para confirmar seu teste gratuito. Assim que confirmarmos, esta pagina sera atualizada automaticamente.'
                : 'Estamos verificando seu pagamento. Isso pode levar alguns segundos...'
              }
            </p>
            <div className={`flex items-center justify-center gap-2 ${isTrial ? 'text-emerald-400' : 'text-yellow-400'} text-sm`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando automaticamente
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
    trial: 'Teste Gratuito',
  };

  // Formulario de registro
  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group font-bold">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl border-2"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {order.plan === 'trial' ? 'Ativar Teste Gratuito' : 'Pagamento Confirmado!'}
            </h2>
            <p className="text-slate-400 text-sm">
              Complete seu cadastro para acessar o app.
            </p>
            {order.plan !== 'trial' && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-bold">
                Plano {planLabels[order.plan] || order.plan} — R$ {Number(order.amount).toFixed(2)}
              </div>
            )}
          </div>

          {/* Dados pre-preenchidos (read-only) */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={order.name}
                readOnly
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={order.whatsapp}
                readOnly
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dispositivo */}
            {order.device ? (
              <div className="relative">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={DEVICE_OPTIONS.find(o => o.value === order.device)?.label || order.device}
                  readOnly
                  className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-slate-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <div className="relative">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  required
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900">Selecione seu dispositivo</option>
                  {DEVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Email (opcional) */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Senha */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crie uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordTips(true)}
                  className="w-full p-4 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.7rem] text-slate-500 font-bold uppercase tracking-widest">Força da senha</span>
                    <span className={`text-xs font-bold ${getPasswordStrength(password).color}`}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(getPasswordStrength(password).score / 7) * 100}%` }}
                      className={`h-full ${getPasswordStrength(password).bgColor} rounded-full transition-all`}
                    />
                  </div>
                </div>
              )}

              {/* Requirements & Examples */}
              {showPasswordTips && <PasswordRequirements password={password} />}

              {/* Strong password examples */}
              {password.length === 0 && (
                <div className="mt-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Senhas fortes exemplos</span>
                  </div>
                  <div className="space-y-1">
                    {STRONG_PASSWORDS.slice(0, 3).map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setPassword(ex); setConfirmPassword(ex); }}
                        className="block w-full text-left font-mono text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <p className="text-[0.65rem] text-slate-500 mt-2">Clique para usar ou crie a sua</p>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                required
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-4 pl-12 pr-12 bg-white/5 rounded-2xl text-white outline-none transition-all ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-cyan-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {confirmPassword && password === confirmPassword && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              {confirmPassword && password !== confirmPassword && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <span className="text-xs text-red-400 font-bold">Diferente</span>
                </div>
              )}
            </div>

            {/* Erro */}
            {formError && (
              <p className="text-red-400 text-sm text-center font-bold">{formError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25 transition-all text-lg border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  {order.plan === 'trial' ? 'Ativar Teste Gratuito' : 'Finalizar Cadastro'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
