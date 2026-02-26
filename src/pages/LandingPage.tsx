import { useEffect } from 'react';
import { PlayCircle, MonitorPlay, Smartphone, Tv, CheckCircle2, MonitorSmartphone, Film, Zap, Shield, Globe, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ContentCarousel } from '../components/ContentCarousel';

const Hero = () => {
  return (
    <section id="início" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-transparent">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
        ></motion.div>
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px]"
        ></motion.div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium backdrop-blur-sm"
        >
          🚀 A revolução do streaming chegou
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-8"
        >
          <span className="text-gradient">
            Entretenimento
          </span>
          <br />
          <span className="text-slate-900 dark:text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Sem Limites</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 leading-relaxed"
        >
          Acesse mais de 500 canais em UHD, filmes, séries e conteúdo exclusivo. Tudo isso na palma da sua mão ou na sua TV.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-6"
        >
          <a href="#planos" className="glow-button gradient-logo text-white px-6 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-black shadow-[0_0_40px_rgba(34,211,238,0.6)] flex items-center justify-center gap-3 border-2 border-cyan-400">
            <PlayCircle className="w-7 h-7" />
            Assine Agora
          </a>
          <a href="#dispositivos" className="bg-white/5 dark:bg-white/5 light:bg-slate-100 text-slate-900 dark:text-white border border-white/10 dark:border-white/10 light:border-slate-200 px-6 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-white/10 transition-all text-center backdrop-blur-md">
            Saiba Mais
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const Compatibility = () => {
  const devices = [
    { icon: <MonitorPlay className="w-14 h-14" />, title: 'TV Box e Fire TV Stick', desc: 'Transforme sua TV convencional em uma Smart TV completa.' },
    { icon: <Smartphone className="w-14 h-14" />, title: 'Celular Android', desc: 'Leve seu conteúdo favorito para onde você for.' },
    { icon: <Tv className="w-14 h-14" />, title: 'Smart TV Android', desc: 'A melhor experiência na tela grande da sua sala.' },
  ];

  return (
    <section id="dispositivos" className="py-32 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-base text-cyan-400 font-bold tracking-[0.2em] uppercase mb-4"
          >
            Compatibilidade
          </motion.h2>
          <p className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
            Assista onde você preferir
          </p>
          <p className="max-w-2xl text-xl text-slate-400 mx-auto">
            Nossa plataforma é compatível com os dispositivos mais populares do mercado.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {devices.map((device, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="glow-card neon-border-cyan p-10 rounded-3xl text-center group"
            >
              <div className="flex justify-center mb-8 text-cyan-400 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {device.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{device.title}</h3>
              <p className="text-slate-400 leading-relaxed">{device.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    { name: 'Mensal', duration: '31 dias', price: '35,00', color: 'border-cyan-500/30', btnColor: 'bg-cyan-500 hover:bg-cyan-600 shadow-[0_0_20px_rgba(34,211,238,0.4)]', textColor: 'text-cyan-400', features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.00h'] },
    { name: 'Trimestral', duration: '93 dias', price: '90,00', color: 'border-purple-500/30', btnColor: 'bg-purple-500 hover:bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]', textColor: 'text-purple-400', features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.00h'] },
    { name: 'Semestral', duration: '186 dias', price: '169,00', color: 'border-blue-500/30', btnColor: 'bg-blue-500 hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]', textColor: 'text-blue-400', features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.00h'] },
    { name: 'Anual', duration: '365 dias', price: '299,00', color: 'border-orange-500', btnColor: 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.5)]', textColor: 'text-orange-400', features: ['2 Telas Simultâneas', '+500 Canais UHD', 'Conteúdo Hot+18', 'Suporte Prioritário'], highlighted: true },
  ];

  return (
    <section id="planos" className="py-32 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6">Escolha seu Plano</h2>
          <p className="text-xl text-slate-400">Transparência total. Sem taxas escondidas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`glow-card relative ${plan.highlighted ? 'bg-slate-900 ring-2 ring-orange-500 lg:-translate-y-6 neon-border-orange' : 'neon-border-cyan'} rounded-[2.5rem] p-10 flex flex-col ${plan.color}`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
                  Melhor Valor
                </div>
              )}
              <h3 className={`text-3xl font-black mb-4 ${plan.textColor}`}>{plan.name}</h3>
              <div className="flex items-center text-slate-500 text-sm mb-8 font-medium">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Duração: {plan.duration}
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">
                R${plan.price}
              </div>
              {plan.highlighted && <p className="text-slate-400 text-sm mb-8 leading-relaxed">Economize mais de 25% comparado ao plano mensal.</p>}
              <ul className="space-y-5 mb-10 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center text-slate-300">
                    <CheckCircle2 className={`w-6 h-6 mr-3 ${plan.highlighted ? 'text-orange-500' : plan.textColor}`} />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to={`/checkout?plan=${plan.name.toLowerCase()}`} className={`glow-button w-full py-4 px-6 text-white font-black text-center rounded-2xl transition-all ${plan.btnColor}`}>
                Assinar {plan.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { icon: <MonitorSmartphone className="w-8 h-8" />, title: 'Dispositivos Simultâneos', desc: 'Acesse em até 2 telas ao mesmo tempo (TV ou App).', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { icon: <Film className="w-8 h-8" />, title: 'Qualidade UHD e 4K', desc: 'Conteúdo de TV, filmes e séries em ultra alta definição.', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { icon: <Shield className="w-8 h-8" />, title: 'VOD Atualizado', desc: '+280.000 horas de conteúdo on demand para você maratonar.', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { icon: <Globe className="w-8 h-8" />, title: 'Multi-Idioma e Legendas', desc: 'Personalize sua experiência trocando o idioma do áudio e adicionando legendas em tempo real.', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { icon: <PlayCircle className="w-8 h-8" />, title: 'Reprodução Inteligente', desc: 'Funcionalidades de Continuar Assistindo e Vistos Recentemente sincronizados em todos os seus aparelhos.', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  ];

  return (
    <section className="py-32 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-10 leading-tight">Funções e Conteúdos <br /><span className="text-gradient">Exclusivos</span></h2>
            <div className="space-y-8">
              {features.map((f, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex items-start p-6 rounded-2xl glow-card transition-all"
                >
                  <div className={`flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl border ${f.color}`}>
                    {f.icon}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1 }}
              className="relative rounded-[3rem] bg-gradient-to-br from-slate-800 to-black p-3 shadow-[0_0_50px_rgba(34,211,238,0.2)] border border-white/10"
            >
              <img
                alt="Streaming interface on TV"
                className="rounded-[2.5rem] w-full h-auto opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfS2OAvF1Pi1Pak3tGAn8-1qnidOCBV7Jdh1w_-hiRGeFtNRiHSKj7328wIq7eZPSAaBf5O0uX4Jp_Ktu7fmVnbfpZHpFh8ScnUEsD6yyKn9CEtJ3_vNC_AomesEuwuFvi0lzEWzEV2sB_Bc5_gd9ETAU7_fL1hgUZyTmo_r2zqc1n-i6ctgoRqih6tF2KRMc59gq4otqumROcgcoPQqLMxKJeAMTvtFpLGPDYfEvbnrdyzCKaH0_fLYKCXaElSWlSe2kwKru2Z6Jj"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-cyan-500/20 backdrop-blur-xl p-6 rounded-full border border-cyan-500/30 cursor-pointer shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                >
                  <PlayCircle className="w-20 h-20 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const faqs = [
    { q: 'Como faço para instalar o aplicativo?', a: 'A instalação é simples! Após a assinatura, você receberá um email com o link direto para download do nosso APK para Android ou instruções para configurar no seu TV Box/Fire Stick.' },
    { q: 'Posso testar antes de comprar?', a: 'Sim! Oferecemos um período de teste gratuito de 4 horas para que você possa verificar a qualidade do nosso serviço e a estabilidade dos canais.' },
    { q: 'A lista de canais é atualizada?', a: 'Sim, nossa equipe trabalha diariamente para manter a lista de canais, filmes e séries sempre atualizada com os lançamentos mais recentes.' },
    { q: 'Quais as formas de pagamento?', a: 'Aceitamos PIX, cartão de crédito e boleto bancário. A ativação via PIX e cartão é imediata.' },
  ];

  return (
    <section id="faq" className="py-32 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-6xl font-black text-center text-slate-900 dark:text-white mb-20">Perguntas <span className="text-gradient">Frequentes</span></h2>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <motion.details
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group glow-card rounded-2xl md:rounded-3xl p-5 md:p-8 cursor-pointer"
            >
              <summary className="flex items-center justify-between text-slate-900 dark:text-white text-xl font-bold list-none">
                {faq.q}
                <span className="ml-5 flex-shrink-0 transition-transform duration-500 group-open:-rotate-180 text-cyan-400">
                  <ChevronDown className="w-8 h-8" />
                </span>
              </summary>
              <p className="mt-6 leading-relaxed text-slate-400 text-lg">
                {faq.a}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
};



export const LandingPage = () => {
  useEffect(() => {
    // SendPulse Chatbot Placeholder
    // To enable, uncomment and replace with your actual SendPulse script
    /*
    const script = document.createElement('script');
    script.src = "//cdn.sendpulse.com/js/loader.js";
    script.setAttribute('data-sp-widget-id', 'YOUR_WIDGET_ID');
    script.async = true;
    document.body.appendChild(script);
    */
  }, []);

  return (
    <>
      <Hero />
      <ContentCarousel />
      <Compatibility />
      <Pricing />
      <Features />
      <FAQ />
    </>
  );
};
