import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, QrCode, ExternalLink, User, Phone, CreditCard, ShieldCheck, MessageCircle, Loader2, XCircle } from 'lucide-react';
import { API_URL } from '../config/api';

// Links do Mercado Pago (Fallbacks caso a API falhe)
const MP_FALLBACK_LINKS: Record<string, string> = {
  mensal: 'https://mpago.la/2S5S5S5',
  trimestral: '#',
  semestral: '#',
  anual: '#',
};

// Numero de Suporte WhatsApp
const WHATSAPP_SUPPORT = '5591986450659';

function getLoggedInToken(): string | null {
  const token = localStorage.getItem('reyb_token');
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 > Date.now() ? token : null;
  } catch {
    return null;
  }
}

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(searchParams.get('plan') || 'mensal');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [countryCode] = useState('55');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<'mercadopago' | 'infinitypay'>('mercadopago');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'waiting' | 'success' | 'error'>('idle');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');

  // Detectar login e pré-preencher dados do usuário
  useEffect(() => {
    const token = getLoggedInToken();
    if (!token) return;

    const stored = localStorage.getItem('reyb_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setIsLoggedIn(true);
        if (user.name) setName(user.name);
        if (user.whatsapp) setPhone(user.whatsapp.replace(/^55/, ''));
      } catch {
        // ignora JSON inválido
      }
    }
  }, []);

  const planDetails: Record<string, { price: string; duration: string; color: string; border: string }> = {
    mensal: { price: '35,00', duration: '31 dias', color: 'text-cyan-400', border: 'border-cyan-500/30' },
    trimestral: { price: '90,00', duration: '93 dias', color: 'text-purple-400', border: 'border-purple-500/30' },
    semestral: { price: '169,00', duration: '186 dias', color: 'text-blue-400', border: 'border-blue-500/30' },
    anual: { price: '299,00', duration: '365 dias', color: 'text-orange-400', border: 'border-orange-500/30' },
  };

  const selectedPlan = planDetails[plan] || planDetails.mensal;

  const handleProceed = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (selectedGateway === 'infinitypay') {
      setPaymentStatus('processing');

      const whatsapp = isLoggedIn
        ? (JSON.parse(localStorage.getItem('reyb_user') || '{}').whatsapp || '').replace(/^55/, '')
        : phone.replace(/\D/g, '');
      const cleanWhatsapp = `${countryCode}${whatsapp}`;
      const amount = parseFloat(selectedPlan.price.replace(',', '.'));

      try {
        const response = await fetch(`${API_URL}/api/payments/infinitypay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, name, whatsapp: cleanWhatsapp, amount }),
        });

        const data = await response.json();

        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error || 'Erro ao gerar link');
        }

        setCurrentOrderId(data.orderId);
        setCheckoutUrl(data.checkoutUrl);
        setPaymentStatus('waiting');

        window.open(data.checkoutUrl, '_blank');

        const maxPolls = 90;
        let polls = 0;
        const pollInterval = setInterval(async () => {
          polls++;
          if (polls >= maxPolls) {
            clearInterval(pollInterval);
            setPaymentStatus('error');
            return;
          }
          try {
            const token = localStorage.getItem('reyb_token');
            const res = await fetch(`${API_URL}/api/orders/${data.orderId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const orderData = await res.json();
              if (orderData.status === 'paid' || orderData.status === 'registered') {
                clearInterval(pollInterval);
                setPaymentStatus('success');
                return;
              }
            }
          } catch { /* continue polling */ }
        }, 2000);
      } catch (err) {
        console.error('Erro:', err);
        setPaymentStatus('error');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      let response: Response;

      if (isLoggedIn) {
        // Usuário logado: usa rota de renovação com JWT (sem pedir dados)
        const token = getLoggedInToken();
        response = await fetch(`${API_URL}/api/orders/renew`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        });
      } else {
        // Usuário não logado: valida whatsapp e cria pedido normal
        const whatsapp = `${countryCode}${phone.replace(/\D/g, '')}`;
        if (whatsapp.length < 12) {
          setError('Numero de WhatsApp invalido. Inclua o DDD.');
          setSubmitting(false);
          return;
        }
        response = await fetch(`${API_URL}/api/orders/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, whatsapp, plan }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao processar pedido.');
        setSubmitting(false);
        return;
      }

      localStorage.setItem('reyb_pending_order', data.orderId);

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento nao encontrada');
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      const fallbackLink = MP_FALLBACK_LINKS[plan];
      if (fallbackLink && fallbackLink !== '#') {
        window.open(fallbackLink, '_blank');
        setSubmitted(true);
      } else {
        setError('Erro ao gerar link de pagamento. Tente novamente ou use o suporte via WhatsApp.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group font-bold">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          {isLoggedIn ? 'Voltar para o painel' : 'Voltar para o início'}
        </Link>

        {/* Seletor de Gateway */}
        <div className="mb-8">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3">Escolha a forma de pagamento:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setSelectedGateway('mercadopago'); setPaymentStatus('idle'); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                selectedGateway === 'mercadopago'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedGateway === 'mercadopago' ? 'bg-green-500/20' : 'bg-white/5'}`}>
                  <CreditCard className={`w-5 h-5 ${selectedGateway === 'mercadopago' ? 'text-green-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`font-bold ${selectedGateway === 'mercadopago' ? 'text-green-400' : 'text-white'}`}>Mercado Pago</p>
                  <p className="text-slate-500 text-xs">Redirect para checkout</p>
                </div>
              </div>
              {selectedGateway === 'mercadopago' && <CheckCircle2 className="w-4 h-4 text-green-400 absolute top-3 right-3" />}
            </button>

            <button
              type="button"
              onClick={() => { setSelectedGateway('infinitypay'); setPaymentStatus('idle'); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                selectedGateway === 'infinitypay'
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedGateway === 'infinitypay' ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                  <QrCode className={`w-5 h-5 ${selectedGateway === 'infinitypay' ? 'text-yellow-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`font-bold ${selectedGateway === 'infinitypay' ? 'text-yellow-400' : 'text-white'}`}>InfinityPay</p>
                  <p className="text-slate-500 text-xs">Pagamento rápido</p>
                </div>
              </div>
              {selectedGateway === 'infinitypay' && <CheckCircle2 className="w-4 h-4 text-yellow-400 absolute top-3 right-3" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* COLUNA 1: Resumo do Pedido */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className={`glass ${selectedPlan.border} p-6 md:p-8 rounded-3xl border`}>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Resumo do Pedido</h2>

              <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 mb-6">
                <div>
                  <p className={`font-bold uppercase tracking-widest text-xs mb-1 ${selectedPlan.color}`}>Plano Selecionado</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">{plan}</h3>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white font-black text-2xl">R${selectedPlan.price}</p>
                  <p className="text-slate-500 text-xs">{selectedPlan.duration}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">O que esta incluso:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Acesso Imediato', 'Suporte 24/7', 'Qualidade 4K HDR', '+500 Canais UHD'].map((item, i) => (
                    <div key={i} className="flex items-center text-slate-300 text-sm bg-white/5 p-3 rounded-xl">
                      <CheckCircle2 className={`w-4 h-4 mr-2 ${selectedPlan.color}`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagamento Seguro */}
            <div className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-400" />
                Pagamento Seguro
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Todos os pagamentos sao processados pelo <strong>Mercado Pago</strong>, garantindo 100% de seguranca para voce.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white">PIX Copia e Cola</h4>
                  </div>
                  <p className="text-sm text-slate-400">Aprovacao imediata. O acesso e liberado no mesmo instante.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h4 className="font-bold text-white">Cartao de Credito</h4>
                  </div>
                  <p className="text-sm text-slate-400">Parcele em ate 12x. Aprovacao super rapida com a garantia Mercado Pago.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* COLUNA 2: Dados e Checkout */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border-cyan-500/20 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 h-fit"
          >
            {!submitted ? (
              <>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Seus Dados</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Informe seus dados para identificarmos seu pagamento e liberarmos seu acesso.
                </p>

                {isLoggedIn && (
                  <div className="mb-6">
                    <div className="mb-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-bold text-center">
                      Renovando com sua conta atual
                    </div>
                    <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-3">Escolha seu plano:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(planDetails).map(([key, details]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPlan(key)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all ${
                            plan === key
                              ? `border-current bg-white/10 ${details.color}`
                              : 'border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <p className={`font-black capitalize text-sm ${plan === key ? details.color : ''}`}>{key}</p>
                          <p className="text-white font-bold text-lg">R${details.price}</p>
                          <p className="text-slate-500 text-xs">{details.duration}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleProceed} className="space-y-4">
                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        required={!isLoggedIn}
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => !isLoggedIn && setName(e.target.value)}
                        readOnly={isLoggedIn}
                        className={`w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white outline-none transition-all ${isLoggedIn ? 'text-slate-400 cursor-not-allowed' : 'focus:border-cyan-500'}`}
                      />
                    </div>
                    {!isLoggedIn && (
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-sm font-mono min-w-[72px] justify-center">
                          +{countryCode}
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            required
                            type="tel"
                            placeholder="WhatsApp (com DDD)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center mb-6">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className={`text-4xl font-black ${selectedPlan.color}`}>R${selectedPlan.price}</span>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center font-bold">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-shimmer w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 transition-all text-lg border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-6 h-6" />
                        Ir para o Pagamento
                        <ExternalLink className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-slate-500 text-xs px-4 mt-4">
                    Voce sera redirecionado para o Checkout Seguro do Mercado Pago.
                  </p>

                  {/* Suporte WhatsApp */}
                  <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <h4 className="font-bold text-white mb-2">Dificuldades com o pagamento?</h4>
                    <p className="text-sm text-slate-400 mb-4">Nossa equipe esta pronta para ajudar voce agora mesmo.</p>
                    <a
                      href={`https://wa.me/${WHATSAPP_SUPPORT}?text=Ol%C3%A1%2C%20estou%20na%20p%C3%A1gina%20de%20checkout%20do%20plano%20${plan}%20e%20preciso%20de%20ajuda.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-green-400 hover:bg-green-500/10 transition-colors font-bold border border-green-500/30 w-full md:w-auto"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chamar no WhatsApp
                    </a>
                  </div>

                  {paymentStatus === 'processing' && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                      <p className="text-blue-400 text-sm">Gerando link de pagamento...</p>
                    </div>
                  )}

                  {paymentStatus === 'waiting' && (
                    <div className="mt-6 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-yellow-400 font-bold">Aguardando pagamento...</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">
                        O pagamento está sendo processado. Você pode acompanhar na outra aba.
                      </p>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(checkoutUrl, '_blank')}
                        className="mt-4 text-sm text-yellow-400 hover:underline"
                      >
                        Abrir checkout novamente
                      </button>
                    </div>
                  )}

                  {paymentStatus === 'success' && (
                    <div className="mt-6 p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-white mb-2">Pagamento Aprovado!</h3>
                      <p className="text-slate-400 text-sm mb-4">Seu acesso foi liberado. Bom proveito!</p>
                      <Link to="/dashboard" className="inline-block px-6 py-3 bg-green-500 text-white font-bold rounded-xl">
                        Ir para o Dashboard
                      </Link>
                    </div>
                  )}

                  {paymentStatus === 'error' && (
                    <div className="mt-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-white mb-2">Tempo esgotado</h3>
                      <p className="text-slate-400 text-sm mb-4">O pagamento não foi detectado. Tente novamente.</p>
                      <button type="button" onClick={() => setPaymentStatus('idle')} className="text-sm text-red-400 hover:underline">
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* Mensagem de confirmacao (fallback) */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Redirecionando!</h3>
                  <p className="text-slate-400 text-sm px-4">
                    O ambiente seguro do Mercado Pago foi aberto em uma nova aba. Conclua o pagamento por la.
                  </p>
                </div>
                <div className="pt-6 space-y-4">
                  <a
                    href={MP_FALLBACK_LINKS[plan] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-xl bg-white/5 text-cyan-400 hover:bg-cyan-500/10 transition-colors font-bold border border-cyan-500/30"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Pagina nao abriu? Clique aqui
                  </a>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
