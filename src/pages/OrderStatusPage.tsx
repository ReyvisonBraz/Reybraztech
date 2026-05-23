import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { API_URL } from '../config/api';

const WHATSAPP_SUPPORT = '5591986450659';

type PublicOrder = {
  id: string;
  plan: string;
  amount: number;
  status: 'pending' | 'paid' | 'registered' | string;
  created_at?: string;
  paid_at?: string | null;
  registered_at?: string | null;
  registered: boolean;
  needs_registration: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  trial: 'Teste gratuito',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function getToken() {
  return localStorage.getItem('reyb_token');
}

export const OrderStatusPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order') || '';
  const paymentFlag = searchParams.get('payment') || '';
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async (silent = false) => {
    if (!orderId) {
      setError('Pedido nao encontrado.');
      setLoading(false);
      return;
    }

    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/orders/public/${encodeURIComponent(orderId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Nao foi possivel localizar este pedido.');
        setOrder(null);
        return;
      }
      setOrder(data);
    } catch {
      setError('Nao foi possivel conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!orderId || order?.status !== 'pending') return;

    const interval = window.setInterval(() => {
      fetchOrder(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchOrder, order?.status, orderId]);

  const supportHref = useMemo(() => {
    const text = orderId
      ? `Ola, preciso de ajuda com meu pedido ${orderId}.`
      : 'Ola, preciso de ajuda com meu pedido.';
    return `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(text)}`;
  }, [orderId]);

  const isFailure = paymentFlag === 'failure';
  const isPending = !isFailure && order?.status === 'pending';
  const isPaidNeedsRegistration = !isFailure && !!order?.needs_registration;
  const isRegistered = !isFailure && !!order?.registered;
  const isPaidWaitingSetup = !isFailure && order?.status === 'paid' && !order.needs_registration;
  const hasToken = !!getToken();

  const statusConfig = useMemo(() => {
    if (isFailure) {
      return {
        icon: <XCircle className="w-10 h-10 text-red-400" />,
        badge: 'Pagamento nao confirmado',
        title: 'Nao conseguimos confirmar o pagamento',
        description: 'Se a cobranca nao foi concluida, voce pode tentar novamente. Se ja pagou, chame o suporte com o numero do pedido.',
        border: 'border-red-500/30',
        glow: 'bg-red-500/10',
      };
    }

    if (isRegistered) {
      return {
        icon: <CheckCircle2 className="w-10 h-10 text-emerald-400" />,
        badge: 'Acesso liberado',
        title: 'Seu pedido ja foi liberado',
        description: hasToken
          ? 'Tudo certo. Voce pode acessar seu painel e conferir sua assinatura.'
          : 'Tudo certo. Entre na sua conta para acessar o painel.',
        border: 'border-emerald-500/30',
        glow: 'bg-emerald-500/10',
      };
    }

    if (isPaidNeedsRegistration) {
      return {
        icon: <UserPlus className="w-10 h-10 text-cyan-400" />,
        badge: 'Pagamento aprovado',
        title: 'Agora falta criar sua senha',
        description: 'Seu pagamento foi confirmado. Complete o cadastro para acessar seu painel e receber as instrucoes.',
        border: 'border-cyan-500/30',
        glow: 'bg-cyan-500/10',
      };
    }

    if (isPaidWaitingSetup) {
      return {
        icon: <ShieldCheck className="w-10 h-10 text-cyan-400" />,
        badge: 'Pagamento aprovado',
        title: 'Estamos preparando seu acesso',
        description: 'Recebemos seu pagamento. Se o acesso ainda nao aparecer, fale com o suporte usando o numero do pedido.',
        border: 'border-cyan-500/30',
        glow: 'bg-cyan-500/10',
      };
    }

    return {
      icon: <Clock className="w-10 h-10 text-yellow-400" />,
      badge: 'Aguardando pagamento',
      title: 'Estamos aguardando a confirmacao',
      description: 'Se voce acabou de pagar por PIX ou cartao, isso pode levar alguns segundos. Esta pagina atualiza automaticamente.',
      border: 'border-yellow-500/30',
      glow: 'bg-yellow-500/10',
    };
  }, [hasToken, isFailure, isPaidNeedsRegistration, isPaidWaitingSetup, isRegistered]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center px-4">
        <div className="glass p-8 rounded-3xl border border-cyan-500/20 flex items-center gap-3 text-cyan-400 font-bold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Consultando pedido...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-32 pb-20 min-h-screen px-4">
        <div className="max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 font-bold">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="glass p-8 rounded-3xl border border-red-500/30 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-white mb-3">Pedido nao encontrado</h1>
            <p className="text-slate-400 mb-6">{error || 'Nao encontramos dados para este pedido.'}</p>
            <div className="grid gap-3">
              <Link to="/#planos" className="py-3 rounded-2xl bg-cyan-500 text-white font-black">
                Ver planos
              </Link>
              <a href={supportHref} target="_blank" rel="noopener noreferrer" className="py-3 rounded-2xl border border-green-500/30 text-green-400 font-black">
                Falar com suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 font-bold">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar ao inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-3xl border-2 ${statusConfig.border} overflow-hidden`}
        >
          <div className={`${statusConfig.glow} p-6 sm:p-8 border-b border-white/10`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                {statusConfig.icon}
              </div>
              <div className="flex-1">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-widest font-black text-slate-300 mb-3">
                  {statusConfig.badge}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
                  {statusConfig.title}
                </h1>
                <p className="text-slate-300 leading-relaxed">
                  {statusConfig.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Pedido</p>
                <p className="text-white font-mono text-sm truncate">{order.id}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Plano</p>
                <p className="text-white font-black">{PLAN_LABELS[order.plan] || order.plan}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Valor</p>
                <p className="text-white font-black">{formatCurrency(order.amount)}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {isPaidNeedsRegistration && (
                <Link
                  to={`/complete-registration?order=${encodeURIComponent(order.id)}`}
                  className="btn-shimmer w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Finalizar cadastro
                </Link>
              )}

              {isRegistered && (
                <Link
                  to={hasToken ? '/dashboard' : '/login'}
                  className="btn-shimmer w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {hasToken ? 'Ir para meu painel' : 'Entrar na minha conta'}
                </Link>
              )}

              {(isPending || isPaidWaitingSetup || isFailure) && (
                <button
                  type="button"
                  onClick={() => fetchOrder(true)}
                  disabled={refreshing}
                  className="w-full py-4 rounded-2xl bg-white/10 border border-white/15 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Atualizar status
                </button>
              )}

              {isFailure && (
                <Link
                  to={`/checkout?plan=${encodeURIComponent(order.plan || 'mensal')}`}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Tentar novamente
                </Link>
              )}

              <a
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 font-black flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com suporte
              </a>
            </div>

            {isPending && (
              <p className="text-center text-slate-500 text-xs mt-5">
                A confirmacao depende do Mercado Pago. Voce pode manter esta pagina aberta.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
