import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, Monitor, Mail, Lock, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { API_URL } from '../config/api';

const DEVICE_OPTIONS = [
  { value: 'tvbox', label: 'TV Box / Fire Stick' },
  { value: 'android', label: 'Celular / Tablet Android' },
  { value: 'ios', label: 'iPhone / iPad' },
  { value: 'smarttv', label: 'Smart TV Android' },
  { value: 'outro', label: 'Outro dispositivo' },
];

type OrderData = {
  name: string;
  whatsapp: string;
  plan: string;
  status: string;
  amount: number;
};

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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  // Aguardando pagamento
  if (order.status === 'pending') {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-md mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-3xl border border-yellow-500/30"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-black text-white mb-2">Aguardando Pagamento</h2>
            <p className="text-slate-400 text-sm mb-4">
              Estamos verificando seu pagamento. Isso pode levar alguns segundos...
            </p>
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
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
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                required
                type="password"
                placeholder="Crie uma senha (min. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Confirmar senha */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                required
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
              />
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
