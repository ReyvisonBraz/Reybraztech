import { useEffect, lazy, Suspense } from 'react';
import { PlayCircle, MonitorPlay, Smartphone, Tv, CheckCircle2, MonitorSmartphone, Film, Zap, Shield, Globe, ChevronDown, MoveHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ContentCarousel } from '../components/ContentCarousel';

// Lazy load Three.js (maior dependência) — só carrega quando LandingPage renderiza
const WebGLShader = lazy(() => import('../components/web-gl-shader').then(m => ({ default: m.WebGLShader })));

const Hero = () => {
  return (
    <section id="início" className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-transparent">
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/15 rounded-full" style={{ filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full" style={{ filter: 'blur(80px)' }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium"
        >
          🚀 A revolução do streaming chegou
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 sm:mb-8"
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
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4 sm:px-0"
        >
          <a href="#planos" className="glow-button gradient-logo text-white px-6 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-black shadow-[0_0_40px_rgba(34,211,238,0.6)] flex items-center justify-center gap-3 border-2 border-cyan-400">
            <PlayCircle className="w-7 h-7" />
            Assine Agora
          </a>
          <a href="#dispositivos" className="bg-slate-900/80 text-white border border-white/10 px-6 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-slate-800/90 transition-all text-center">
            Saiba Mais
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const Compatibility = () => {
  const devices = [
    {
      icon: <MonitorPlay className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: 'TV Box & Fire Stick',
      desc: 'Transforme sua TV convencional em uma Smart TV completa com total compatibilidade.',
      gradient: 'from-cyan-500 to-blue-600',
      glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
      border: 'border-cyan-500/30',
      tag: 'Android 5.0+',
    },
    {
      icon: <Smartphone className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: 'Celular Android',
      desc: 'Leve seu conteúdo favorito para onde você for. Assista na tela do seu bolso.',
      gradient: 'from-purple-500 to-pink-600',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
      border: 'border-purple-500/30',
      tag: 'Android & iOS',
    },
    {
      icon: <Tv className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: 'Smart TV Android',
      desc: 'A melhor experiência na tela grande. Imagem UHD 4K direto na sua sala.',
      gradient: 'from-orange-500 to-red-600',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]',
      border: 'border-orange-500/30',
      tag: 'Smart TV',
    },
  ];

  return (
    <section id="dispositivos" className="py-20 sm:py-28 lg:py-32 bg-transparent relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/8 rounded-full" style={{ filter: 'blur(80px)' }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs sm:text-sm font-bold tracking-widest uppercase"
          >
            <MonitorSmartphone className="w-4 h-4" />
            Compatibilidade
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight"
          >
            Assista onde{' '}<span className="text-gradient">você preferir</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="max-w-xl mx-auto text-base sm:text-lg text-slate-400"
          >
            Compatível com os dispositivos mais populares do mercado. Plug and play.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {devices.map((device, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative rounded-3xl p-6 sm:p-8 flex sm:flex-col items-center sm:items-start gap-5 sm:gap-0
                bg-slate-900/90 border ${device.border} ${device.glow}
                hover:-translate-y-2 transition-all duration-300 overflow-hidden group`}
            >
              {/* Gradient accent top */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${device.gradient} rounded-t-3xl`} />
              {/* Icon */}
              <div className={`flex-shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 sm:mb-6 rounded-2xl bg-gradient-to-br ${device.gradient} text-white ${device.glow} group-hover:scale-110 transition-transform duration-500`}>
                {device.icon}
              </div>
              {/* Text */}
              <div className="flex-1 sm:flex-none">
                <div className="flex flex-wrap items-center gap-2 sm:mb-3 mb-1">
                  <h3 className="text-lg sm:text-xl font-black text-white">{device.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${device.gradient} text-white`}>{device.tag}</span>
                </div>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{device.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom badge row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 sm:mt-16 flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          {['TV Box', 'Fire TV Stick', 'Android', 'Smart TV', 'iOS em breve'].map((b, i) => (
            <span key={i} className="text-xs sm:text-sm text-slate-400 bg-slate-900/80 border border-white/10 rounded-full px-4 py-2">
              ✓ {b}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      id: 'mensal',
      name: 'Mensal',
      duration: '31 dias',
      price: '35,00',
      priceInt: '35',
      priceDec: '00',
      color: 'cyan',
      popular: false,
      bestValue: false,
      highlight: false,
      savingText: '',
      badgeText: '',
      features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte via WhatsApp'],
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-blue-500',
      btnColor: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
      glowColor: 'shadow-[0_0_30px_rgba(34,211,238,0.25)]',
      borderColor: 'border-cyan-500/25',
      textColor: 'text-cyan-400',
    },
    {
      id: 'trimestral',
      name: 'Trimestral',
      duration: '93 dias',
      price: '90,00',
      priceInt: '90',
      priceDec: '00',
      color: 'purple',
      popular: true,
      bestValue: false,
      highlight: true,
      savingText: 'O Mais Escolhido',
      badgeText: '⭐ Popular',
      features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte Prioritário'],
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-pink-600',
      btnColor: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500',
      glowColor: 'shadow-[0_0_50px_rgba(168,85,247,0.45)]',
      borderColor: 'border-purple-400/50',
      textColor: 'text-purple-400',
    },
    {
      id: 'semestral',
      name: 'Semestral',
      duration: '186 dias',
      price: '169,00',
      priceInt: '169',
      priceDec: '00',
      color: 'blue',
      popular: false,
      bestValue: false,
      highlight: false,
      savingText: 'Economize 19%',
      badgeText: '',
      features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte Prioritário'],
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600',
      btnColor: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500',
      glowColor: 'shadow-[0_0_30px_rgba(59,130,246,0.25)]',
      borderColor: 'border-blue-500/25',
      textColor: 'text-blue-400',
    },
    {
      id: 'anual',
      name: 'Anual',
      duration: '365 dias',
      price: '299,00',
      priceInt: '299',
      priceDec: '00',
      color: 'orange',
      popular: false,
      bestValue: true,
      highlight: true,
      savingText: 'Economize +28%',
      badgeText: '🔥 Melhor Valor',
      features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Conteúdo Hot +18', 'Suporte 24/7 VIP'],
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-red-600',
      btnColor: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500',
      glowColor: 'shadow-[0_0_60px_rgba(249,115,22,0.5)]',
      borderColor: 'border-orange-400/60',
      textColor: 'text-orange-400',
    },
  ];

  return (
    <section id="planos" className="py-20 sm:py-28 lg:py-32 bg-transparent relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full pointer-events-none" style={{ filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/8 rounded-full pointer-events-none" style={{ filter: 'blur(80px)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs sm:text-sm font-bold tracking-widest uppercase"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            Planos & Preços
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight"
          >
            Escolha seu <span className="text-gradient">Plano</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Transparência total. Sem taxas escondidas. Cancele quando quiser.
          </motion.p>
        </div>

        {/* Plans grid - horizontal scroll on mobile */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative flex-shrink-0 w-72 sm:w-auto flex flex-col rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem]
                border transition-all duration-300 hover:-translate-y-2 snap-start
                ${plan.highlight
                  ? `bg-slate-800/70 ${plan.borderColor} ${plan.glowColor} z-10`
                  : `bg-slate-900/50 border-white/8`
                }`}
            >
              {/* Gradient top bar */}
              <div className={`h-1 w-full rounded-t-3xl sm:rounded-t-[2rem] lg:rounded-t-[2.5rem] bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`} />

              <div className="p-6 sm:p-7 lg:p-8 flex flex-col flex-1">
                {/* Badge */}
                {plan.badgeText && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1 text-white text-[11px] font-black px-3 py-1 rounded-full bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} uppercase tracking-widest`}>
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                {/* Plan name & duration */}
                <h3 className={`text-2xl sm:text-2xl lg:text-3xl font-black mb-1 ${plan.textColor}`}>{plan.name}</h3>
                <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm font-medium mb-5">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  {plan.duration}
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-start">
                    <span className="text-base sm:text-lg font-bold text-slate-300 mt-2 mr-1">R$</span>
                    <span className={`text-5xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white`}>{plan.priceInt}</span>
                    <span className="text-base sm:text-lg font-bold text-slate-300 mt-2">,{plan.priceDec}</span>
                  </div>
                </div>

                {/* Saving tag */}
                {plan.savingText && (
                  <div className="mb-5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-white bg-opacity-20`}>
                      {plan.savingText}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-5" />

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3 text-slate-300">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo} flex items-center justify-center`}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </span>
                      <span className="text-sm sm:text-sm font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to={`/checkout?plan=${plan.id}`}
                  className={`w-full py-3.5 sm:py-4 px-6 text-white font-black text-sm sm:text-base text-center rounded-2xl
                    transition-all duration-300 transform hover:scale-[1.03] active:scale-95
                    flex items-center justify-center gap-2 ${plan.btnColor}
                    shadow-lg`}
                >
                  Assinar Agora
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile swipe indicator */}
        <div className="flex sm:hidden items-center justify-center gap-2 mt-4 text-slate-500 text-xs animate-pulse">
          <MoveHorizontal className="w-4 h-4" />
          <span>Arraste para ver mais planos</span>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-8 text-slate-500 text-xs sm:text-sm"
        >
          {['✅ Pagamento seguro via Mercado Pago', '⚡ Ativação imediata', '🔒 Sem fidelidade', '💬 Suporte via WhatsApp'].map((t, i) => (
            <span key={i} className="flex items-center gap-1">{t}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    { icon: <MonitorSmartphone className="w-7 h-7" />, title: 'Telas Simultâneas', desc: 'Acesse em até 2 telas ao mesmo tempo — TV e celular ao mesmo tempo.', color: 'from-green-500 to-emerald-600', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
    { icon: <Film className="w-7 h-7" />, title: 'Qualidade UHD e 4K', desc: 'Conteúdo de TV, filmes e séries em ultra alta definição.', color: 'from-purple-500 to-violet-600', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
    { icon: <Shield className="w-7 h-7" />, title: 'VOD Atualizado', desc: '+280.000 horas de conteúdo on demand para você maratonar.', color: 'from-blue-500 to-indigo-600', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    { icon: <Globe className="w-7 h-7" />, title: 'Multi-Idioma & Legendas', desc: 'Troque o idioma e adicione legendas em tempo real, em qualquer conteúdo.', color: 'from-orange-500 to-amber-600', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]' },
    { icon: <PlayCircle className="w-7 h-7" />, title: 'Reprodução Inteligente', desc: 'Continuar Assistindo sincronizado em todos os aparelhos.', color: 'from-cyan-500 to-teal-600', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]' },
  ];

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: feature list */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-8 sm:mb-10 leading-tight"
            >
              Funções e Conteúdos{' '}<br className="hidden sm:block" /><span className="text-gradient">Exclusivos</span>
            </motion.h2>
            <div className="space-y-4 sm:space-y-5">
              {features.map((f, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/40 transition-all duration-300 group"
                >
                  <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${f.color} text-white ${f.glow} group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">{f.title}</h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Right: image */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -5 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="relative rounded-[3rem] bg-gradient-to-br from-slate-800 to-black p-3 shadow-[0_0_60px_rgba(34,211,238,0.2)] border border-white/10"
            >
              <img
                alt="Streaming interface on TV"
                className="rounded-[2.5rem] w-full h-auto opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfS2OAvF1Pi1Pak3tGAn8-1qnidOCBV7Jdh1w_-hiRGeFtNRiHSKj7328wIq7eZPSAaBf5O0uX4Jp_Ktu7fmVnbfpZHpFh8ScnUEsD6yyKn9CEtJ3_vNC_AomesEuwuFvi0lzEWzEV2sB_Bc5_gd9ETAU7_fL1hgUZyTmo_r2zqc1n-i6ctgoRqih6tF2KRMc59gq4otqumROcgcoPQqLMxKJeAMTvtFpLGPDYfEvbnrdyzCKaH0_fLYKCXaElSWlSe2kwKru2Z6Jj"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-cyan-500/30 p-6 rounded-full border border-cyan-500/30 cursor-pointer shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                >
                  <PlayCircle className="w-16 h-16 text-white" />
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
    { q: 'Quais as formas de pagamento?', a: 'Aceitamos PIX, cartão de crédito (em até 12x) e pix copia e cola — tudo processado com segurança pelo Mercado Pago. A ativação após o pagamento é imediata.' },
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
      <Suspense fallback={<div className="fixed inset-0 bg-[#020617]" style={{ zIndex: -1 }} />}>
        <WebGLShader />
      </Suspense>
      <Hero />
      <ContentCarousel />
      <Compatibility />
      <Pricing />
      <Features />
      <FAQ />
    </>
  );
};
