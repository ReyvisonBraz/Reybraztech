import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowLeft, CreditCard, Smartphone, QrCode } from 'lucide-react';

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'mensal';

  const planDetails: Record<string, { price: string, duration: string }> = {
    mensal: { price: '35,00', duration: '31 dias' },
    trimestral: { price: '90,00', duration: '93 dias' },
    semestral: { price: '169,00', duration: '186 dias' },
    anual: { price: '299,00', duration: '365 dias' },
  };

  const selectedPlan = planDetails[plan] || planDetails.mensal;

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para o início
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glow-card neon-border-cyan p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Resumo do Pedido</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-white/5 dark:bg-white/5 light:bg-white rounded-2xl border border-white/5 dark:border-white/5 light:border-slate-200">
                <div>
                  <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-1">Plano Selecionado</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">{plan}</h3>
                </div>
                <div className="text-right">
                  <p className="text-slate-900 dark:text-white font-black text-xl">R${selectedPlan.price}</p>
                  <p className="text-slate-500 text-xs">{selectedPlan.duration}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">O que está incluso:</h4>
                <ul className="space-y-3">
                  {['Acesso Imediato', 'Suporte 24/7', 'Qualidade 4K HDR', 'Sem Fidelidade'].map((item, i) => (
                    <li key={i} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-3 text-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-white font-bold">Total a pagar</span>
                <span className="text-3xl font-black text-gradient">R${selectedPlan.price}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glow-card neon-border-purple p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Método de Pagamento</h2>
            
            <div className="space-y-4">
              <button className="w-full p-6 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-white border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center group hover:bg-cyan-500/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-900 dark:text-white font-bold">PIX (Aprovação Imediata)</p>
                  <p className="text-slate-500 text-sm">Pague e assista agora mesmo</p>
                </div>
              </button>

              <button className="w-full p-6 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-white border border-white/5 dark:border-white/5 light:border-slate-200 flex items-center group hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-900 dark:text-white font-bold">Cartão de Crédito</p>
                  <p className="text-slate-500 text-sm">Até 12x sem juros</p>
                </div>
              </button>

              <button className="w-full p-6 rounded-3xl bg-white/5 dark:bg-white/5 light:bg-white border border-white/5 dark:border-white/5 light:border-slate-200 flex items-center group hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-900 dark:text-white font-bold">Boleto Bancário</p>
                  <p className="text-slate-500 text-sm">Compensação em até 48h</p>
                </div>
              </button>
            </div>

            <p className="text-center text-slate-500 text-xs px-8">
              Ao clicar em um método de pagamento, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
