import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, QrCode, ExternalLink, User, Phone, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react';

// 🔗 Links do Mercado Pago — cole seus links aqui!
const MP_LINKS: Record<string, string> = {
  mensal: '#', // Ex: 'https://mpago.la/xxxxxxx'
  trimestral: '#',
  semestral: '#',
  anual: '#',
};

// 💬 Número de Suporte WhatsApp (coloque o DDD + Número)
const WHATSAPP_SUPPORT = '5511999999999';

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'mensal';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já está logado
    const userStr = localStorage.getItem('reyb_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setName(user.name);
        if (user.whatsapp) setPhone(user.whatsapp);
        setIsLoggedIn(true);
      } catch {
        // Ignora erro de parse
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
  const mpLink = MP_LINKS[plan] || '#';

  const handleProceed = (e: FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      // Salvar localmente apenas se for cliente novo, para uso futuro
      const clientInfo = { name, phone, plan, timestamp: new Date().toISOString() };
      localStorage.setItem('reyb_checkout_info', JSON.stringify(clientInfo));
    }
    setSubmitted(true);
    // Redirecionar para o Mercado Pago
    window.open(mpLink, '_blank');
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group font-bold">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para o início
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ─── COLUNA 1: Resumo do Pedido e Instruções ─── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className={`glow-card ${selectedPlan.border} p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2`}>
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
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">O que está incluso:</h4>
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

            {/* Informações Relevantes sobre Pagamento */}
            <div className="glow-card neon-border-cyan p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-400" />
                Pagamento Seguro
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Todos os pagamentos são processados pelo <strong>Mercado Pago</strong>, garantindo 100% de segurança para você.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white">PIX Copia e Cola</h4>
                  </div>
                  <p className="text-sm text-slate-400">Aprovação imediata. O acesso é liberado no mesmo instante, sem demoras.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h4 className="font-bold text-white">Cartão de Crédito</h4>
                  </div>
                  <p className="text-sm text-slate-400">Parcele em até 12x. Aprovação super rápida com a garantia Mercado Pago.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── COLUNA 2: Dados do Cliente e Checkout ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glow-card neon-border-cyan p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 h-fit"
          >
            {!isLoggedIn ? (
              <>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Seus Dados</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Informe seus dados para identificarmos seu pagamento e liberarmos seu acesso.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Tudo pronto, <span className={selectedPlan.color}>{name.split(' ')[0]}</span>!
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Você já está conectado. Clique no botão abaixo para prosseguir para o ambiente seguro de pagamento.
                </p>
              </>
            )}

            {!submitted ? (
              <form onSubmit={handleProceed} className="space-y-4">
                {/* Mostra inputs apenas se NÃO estiver logado */}
                {!isLoggedIn && (
                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        required
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
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

                <div className="pt-6 border-t border-white/5 flex justify-between items-center mb-6">
                  <span className="text-white font-bold text-lg">Total</span>
                  <span className={`text-4xl font-black ${selectedPlan.color}`}>R${selectedPlan.price}</span>
                </div>

                <button
                  type="submit"
                  className="glow-button w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.5)] border-2 border-green-400 transition-all text-lg"
                >
                  <QrCode className="w-6 h-6" />
                  Ir para o Pagamento
                  <ExternalLink className="w-5 h-5" />
                </button>

                <p className="text-center text-slate-500 text-xs px-4 mt-4">
                  Você será redirecionado para o Checkout Seguro do Mercado Pago.
                </p>

                {/* ─── SUPORTE WHATSAPP ─── */}
                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                  <h4 className="font-bold text-white mb-2">Dificuldades com o pagamento?</h4>
                  <p className="text-sm text-slate-400 mb-4">Nossa equipe está pronta para ajudar você agora mesmo.</p>
                  <a
                    href={`https://wa.me/${WHATSAPP_SUPPORT}?text=Olá,%20estou%20na%20página%20de%20checkout%20do%20plano%20${plan}%20e%20preciso%20de%20ajuda.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-green-400 hover:bg-green-500/10 transition-colors font-bold border border-green-500/30 w-full md:w-auto"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chamar no WhatsApp
                  </a>
                </div>
              </form>
            ) : (
              /* Mensagem de confirmação após clicar */
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
                    O ambiente seguro do Mercado Pago foi aberto em uma nova aba. Conclua o pagamento por lá.
                  </p>
                </div>
                <div className="pt-6 space-y-4">
                  <a
                    href={mpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-xl bg-white/5 text-cyan-400 hover:bg-cyan-500/10 transition-colors font-bold border border-cyan-500/30"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Página não abriu? Cique aqui
                  </a>

                  <Link
                    to="/dashboard"
                    className="block w-full text-center text-slate-400 hover:text-white transition-colors text-sm font-bold"
                  >
                    Já paguei, ir para o Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
