import { useEffect, useState, lazy, Suspense } from 'react';
import { PlayCircle, MonitorPlay, Smartphone, Tv, CheckCircle2, MonitorSmartphone, Film, Zap, Shield, Globe, ChevronDown, Sparkles, Terminal, Crown, Star, Flame, ArrowRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { openSendPulseChat } from '../utils/openSendPulseChat';

/* ═══ Smooth scroll-reveal variants (no flash/blink) ═══ */
const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};
const fadeSlideLeft = {
  hidden: { opacity: 0, x: -30, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
};
const fadeScale = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
};
const smoothTransition = { duration: 0.7, ease: [0.25, 0.4, 0, 1] };
const staggerContainer = {
  visible: { transition: { staggerChildren: 0.1 } },
};

import { SpecialText } from '../components/SpecialText';

const WebGLShader = lazy(() => import('../components/web-gl-shader').then(m => ({ default: m.WebGLShader })));

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */
const Hero = () => {
  return (
    <section id="início" className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-52 lg:pb-36 overflow-hidden bg-transparent">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-cyan-500/10 rounded-full" style={{ filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full" style={{ filter: 'blur(120px)' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-pink-500/5 rounded-full" style={{ filter: 'blur(100px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        {/* Badge com typing effect */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full glass text-cyan-400 text-sm"
        >
          <Terminal className="w-4 h-4" />
          <SpecialText speed={25} delay={0.5} className="tracking-wider text-cyan-400">streaming.premium( )</SpecialText>
        </motion.div>

        {/* Headline com mais impacto */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.05em] mb-6 leading-[0.85]"
        >
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gradient inline-block pr-2"
          >
            Entretenimento
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-white relative inline-block"
          >
            Sem Limites
            {/* Underline animada */}
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full origin-left"
            />
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed font-light"
        >
          Mais de <span className="text-white font-semibold">500 canais em UHD</span>, filmes, séries e conteúdo exclusivo.
          <br className="hidden sm:block" />
          Tudo na palma da sua mão ou na sua TV.
        </motion.p>

        {/* CTA Buttons com shimmer */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 sm:mt-14 flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0"
        >
          <a
            href="#planos"
            className="btn-shimmer group flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-base sm:text-lg font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
          >
            <PlayCircle className="w-6 h-6 group-hover:rotate-[360deg] transition-transform duration-700" />
            Assine Agora
            <ArrowRight className="w-5 h-5 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
          </a>
          <a
            href="#dispositivos"
            className="group flex items-center justify-center gap-2 glass text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-base sm:text-lg font-semibold hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
          >
            Saiba Mais
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
          </a>
        </motion.div>

        {/* Contact Buttons - WhatsApp & Chat ao Vivo */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-6 flex flex-row justify-center gap-3 px-4 sm:px-0"
        >
          <a
            href="https://wa.me/5591986450659"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 pl-3 pr-3.5 py-2 rounded-full text-xs font-semibold hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <button
            type="button"
            onClick={openSendPulseChat}
            className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 pl-3 pr-3.5 py-2 rounded-full text-xs font-semibold hover:bg-purple-600/30 hover:border-purple-500/50 transition-all duration-200 hover:scale-105"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            Chat ao Vivo
          </button>
        </motion.div>

        {/* Stats row animada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-16 sm:mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { value: '500+', label: 'Canais' },
            { value: '280K', label: 'Horas VOD' },
            { value: '4K', label: 'Ultra HD' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl font-black font-mono text-gradient tracking-tight">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   COMPATIBILIDADE / DISPOSITIVOS
   ═══════════════════════════════════════════ */
const Compatibility = () => {
  const devices = [
    {
      icon: <MonitorPlay className="w-8 h-8" />,
      title: 'TV Box & Fire Stick',
      desc: 'Transforme sua TV convencional em uma Smart TV completa.',
      tag: 'Android 5.0+',
      accent: 'cyan',
      emoji: '📺',
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Celular & Tablet',
      desc: 'Leve seu conteúdo favorito para onde você for.',
      tag: 'Android & iOS',
      accent: 'purple',
      emoji: '📱',
    },
    {
      icon: <Tv className="w-8 h-8" />,
      title: 'Smart TV Android',
      desc: 'A melhor experiência na tela grande. Imagem UHD 4K.',
      tag: 'Smart TV',
      accent: 'orange',
      emoji: '🖥️',
    },
  ];

  const accentColors: Record<string, { border: string; bg: string; text: string; glow: string; gradient: string }> = {
    cyan: { border: 'border-cyan-500/25', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]', gradient: 'from-cyan-500 to-blue-600' },
    purple: { border: 'border-purple-500/25', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]', gradient: 'from-purple-500 to-pink-600' },
    orange: { border: 'border-orange-500/25', bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'hover:shadow-[0_0_40px_rgba(249,115,22,0.15)]', gradient: 'from-orange-500 to-red-600' },
  };

  return (
    <section id="dispositivos" className="py-24 sm:py-32 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            transition={{ ...smoothTransition, duration: 0.5 }}
            viewport={{ once: true, margin: '-80px' }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full glass text-cyan-400 text-xs sm:text-sm font-bold tracking-widest uppercase"
          >
            <MonitorSmartphone className="w-4 h-4" />
            Compatibilidade
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            transition={smoothTransition}
            viewport={{ once: true, margin: '-80px' }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-[-0.03em] leading-tight"
          >
            Assista onde <span className="text-gradient">você preferir</span>
          </motion.h2>
        </div>

        {/* Cards com hover glow */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {devices.map((device, idx) => {
            const colors = accentColors[device.accent];
            return (
              <motion.div
                key={idx}
                variants={fadeSlideUp}
                transition={{ ...smoothTransition, delay: idx * 0.1 }}
                className={`card-hover-glow glass rounded-3xl p-7 sm:p-8 flex flex-col gap-5 border ${colors.border} ${colors.glow} group cursor-default`}
              >
                {/* Top: emoji grande + gradient line */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${colors.bg} ${colors.text} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {device.icon}
                  </div>
                  <span className="text-3xl">{device.emoji}</span>
                </div>
                {/* Title + Tag */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{device.title}</h3>
                  <p className="text-slate-400 text-base leading-relaxed mb-4">{device.desc}</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${colors.bg} ${colors.text}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {device.tag}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   PLANOS & PREÇOS — Expand on click (mobile) + Grid (desktop)
   ═══════════════════════════════════════════ */
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 };

const plans = [
  {
    id: 'mensal',
    name: 'Mensal',
    duration: '31 dias',
    priceInt: '35',
    priceDec: '00',
    perDay: '1,12',
    popular: false,
    bestValue: false,
    savingText: '',
    badgeText: '',
    badgeIcon: null,
    features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte via WhatsApp'],
    accent: 'cyan',
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    duration: '93 dias',
    priceInt: '90',
    priceDec: '00',
    perDay: '0,96',
    popular: true,
    bestValue: false,
    savingText: 'O Mais Escolhido',
    badgeText: 'Popular',
    badgeIcon: <Star className="w-3.5 h-3.5" />,
    features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte Prioritário'],
    accent: 'purple',
  },
  {
    id: 'semestral',
    name: 'Semestral',
    duration: '186 dias',
    priceInt: '169',
    priceDec: '00',
    perDay: '0,90',
    popular: false,
    bestValue: false,
    savingText: 'Economize 19%',
    badgeText: '',
    badgeIcon: null,
    features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Suporte Prioritário'],
    accent: 'blue',
  },
  {
    id: 'anual',
    name: 'Anual',
    duration: '365 dias',
    priceInt: '299',
    priceDec: '00',
    perDay: '0,81',
    popular: false,
    bestValue: true,
    savingText: 'Economize +28%',
    badgeText: 'Melhor Valor',
    badgeIcon: <Flame className="w-3.5 h-3.5" />,
    features: ['2 Telas Simultâneas', '+500 Canais UHD', 'VOD +280.000h', 'Conteúdo Hot +18', 'Suporte 24/7 VIP'],
    accent: 'orange',
  },
];

const accentMap: Record<string, {
  gradient: string; border: string; text: string; btnBg: string;
  glow: string; badgeBg: string; ringColor: string; solidBorder: string;
}> = {
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
    glow: 'hover:shadow-[0_0_50px_rgba(34,211,238,0.12)]',
    badgeBg: 'bg-cyan-500/15 text-cyan-400',
    ringColor: 'ring-cyan-500/30',
    solidBorder: 'border-cyan-500',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-600',
    border: 'border-purple-400/40',
    text: 'text-purple-400',
    btnBg: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500',
    glow: 'shadow-[0_0_60px_rgba(168,85,247,0.12)]',
    badgeBg: 'bg-purple-500/15 text-purple-300',
    ringColor: 'ring-purple-500/40',
    solidBorder: 'border-purple-500',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    btnBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500',
    glow: 'hover:shadow-[0_0_50px_rgba(59,130,246,0.12)]',
    badgeBg: 'bg-blue-500/15 text-blue-400',
    ringColor: 'ring-blue-500/30',
    solidBorder: 'border-blue-500',
  },
  orange: {
    gradient: 'from-orange-500 to-red-600',
    border: 'border-orange-400/40',
    text: 'text-orange-400',
    btnBg: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500',
    glow: 'shadow-[0_0_60px_rgba(249,115,22,0.12)]',
    badgeBg: 'bg-orange-500/15 text-orange-300',
    ringColor: 'ring-orange-500/40',
    solidBorder: 'border-orange-500',
  },
};

/* ── Mobile: Expand-on-click pricing cards ── */
const MobilePricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('trimestral');

  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {plans.map((plan) => {
        const colors = accentMap[plan.accent];
        const isSelected = selectedPlan === plan.id;

        return (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className="cursor-pointer"
          >
            <div
              className={`relative rounded-2xl glass transition-all duration-300 ${
                isSelected
                  ? `border-2 ${colors.solidBorder} shadow-lg`
                  : 'border border-white/[0.08]'
              }`}
            >
              <div className="p-5">
                {/* Header row: radio + name + price */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3.5">
                    {/* Radio indicator */}
                    <div className="mt-1 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected ? colors.solidBorder : 'border-white/15'
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${colors.gradient}`}
                              transition={SPRING}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        {plan.badgeText && (
                          <span className={`badge-pulse text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badgeBg} uppercase tracking-wider ring-1 ${colors.ringColor} flex items-center gap-1`}>
                            {plan.badgeIcon}
                            {plan.badgeText}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{plan.duration}</p>
                    </div>
                  </div>

                  {/* Price right */}
                  <div className="text-right">
                    <div className="flex items-baseline justify-end">
                      <span className="text-xs font-bold text-slate-400 mr-0.5">R$</span>
                      <span className="text-2xl font-black text-white font-mono tracking-tighter">{plan.priceInt}</span>
                      <span className="text-xs font-bold text-slate-400">,{plan.priceDec}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">~R$ {plan.perDay}/dia</p>
                  </div>
                </div>

                {/* Expandable content */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden w-full"
                    >
                      <div className="pt-5 flex flex-col gap-4">
                        {/* Saving tag */}
                        {plan.savingText && (
                          <span className={`inline-flex items-center gap-1.5 self-start text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r ${colors.gradient} text-white`}>
                            <Zap className="w-3 h-3" />
                            {plan.savingText}
                          </span>
                        )}

                        {/* Divider */}
                        <div className={`h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent`} />

                        {/* Features staggered */}
                        <div className="flex flex-col gap-3">
                          {plan.features.map((feature, fIdx) => (
                            <motion.div
                              key={fIdx}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: fIdx * 0.05, duration: 0.3 }}
                              className="flex items-center gap-3"
                            >
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </span>
                              <span className="text-sm text-slate-300 font-medium">{feature}</span>
                            </motion.div>
                          ))}
                        </div>

                        {/* CTA */}
                        <Link
                          to={`/checkout?plan=${plan.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`btn-shimmer group w-full py-4 px-6 mt-1 text-white font-bold text-base text-center rounded-2xl
                            transition-all duration-300 active:scale-95
                            flex items-center justify-center gap-2 ${colors.btnBg} shadow-lg`}
                        >
                          Assinar Agora
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Desktop: Full grid cards ── */
const DesktopPricing = () => {
  return (
    <motion.div
      className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {plans.map((plan, idx) => {
        const colors = accentMap[plan.accent];
        const isHighlight = plan.popular || plan.bestValue;

        return (
          <motion.div
            key={idx}
            variants={fadeSlideUp}
            transition={{ ...smoothTransition, delay: idx * 0.08 }}
            className={`relative flex flex-col rounded-3xl transition-all duration-500
              ${plan.popular
                ? 'gradient-border sm:scale-[1.04] z-10'
                : `glass border ${isHighlight ? colors.border : 'border-white/[0.06]'} ${colors.glow} card-hover-glow`
              }
            `}
          >
            {!plan.popular && (
              <div className={`h-1 w-full rounded-t-3xl bg-gradient-to-r ${colors.gradient}`} />
            )}

            <div className={`p-6 sm:p-7 flex flex-col flex-1 ${plan.popular ? 'pt-7' : ''}`}>
              {plan.badgeText && (
                <div className="mb-4">
                  <span className={`badge-pulse inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-full ${colors.badgeBg} uppercase tracking-wider ring-1 ${colors.ringColor}`}>
                    {plan.badgeIcon}
                    {plan.badgeText}
                  </span>
                </div>
              )}

              <h3 className={`text-2xl font-black mb-1 ${colors.text}`}>{plan.name}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">{plan.duration}</p>

              <div className={`mb-1 ${isHighlight ? 'price-float' : ''}`}>
                <div className="flex items-baseline">
                  <span className="text-sm font-bold text-slate-400 mr-1">R$</span>
                  <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter">{plan.priceInt}</span>
                  <span className="text-sm font-bold text-slate-400 ml-0.5">,{plan.priceDec}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-2 font-mono">~ R$ {plan.perDay}/dia</p>

              {plan.savingText && (
                <div className="mb-5">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r ${colors.gradient} text-white`}>
                    <Zap className="w-3 h-3" />
                    {plan.savingText}
                  </span>
                </div>
              )}

              <div className="h-px w-full mb-6 bg-white/5" />

              <ul className="space-y-3.5 flex-1 mb-8">
                {plan.features.map((feature, fIdx) => (
                  <motion.li
                    key={fIdx}
                    variants={fadeSlideLeft}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ ...smoothTransition, duration: 0.5, delay: idx * 0.05 + fIdx * 0.05 }}
                    viewport={{ once: true, margin: '-40px' }}
                    className="flex items-center gap-3"
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    <span className="text-sm text-slate-300 font-medium">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Link
                to={`/checkout?plan=${plan.id}`}
                className={`btn-shimmer group w-full py-4 px-6 text-white font-bold text-sm text-center rounded-2xl
                  transition-all duration-300 hover:scale-[1.03] active:scale-95
                  flex items-center justify-center gap-2 ${colors.btnBg}
                  ${isHighlight ? 'shadow-lg' : ''}`}
              >
                Assinar Agora
                <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

const Pricing = () => {
  return (
    <section id="planos" className="py-24 sm:py-32 bg-transparent relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full pointer-events-none" style={{ filter: 'blur(100px)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-orange-600/5 rounded-full pointer-events-none" style={{ filter: 'blur(100px)' }} />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-20">
          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            transition={{ ...smoothTransition, duration: 0.5 }}
            viewport={{ once: true, margin: '-80px' }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full glass text-purple-400 text-xs sm:text-sm font-bold tracking-widest uppercase"
          >
            <Sparkles className="w-4 h-4" />
            Planos & Preços
          </motion.div>
          <motion.h2
            variants={fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            transition={smoothTransition}
            viewport={{ once: true, margin: '-80px' }}
            className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-[-0.03em] leading-tight mb-4"
          >
            Escolha seu <span className="text-gradient">Plano</span>
          </motion.h2>
          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            whileInView="visible"
            transition={{ ...smoothTransition, delay: 0.1 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto"
          >
            Transparência total. Sem taxas escondidas.
          </motion.p>
        </div>

        {/* Mobile: accordion cards | Desktop: grid cards */}
        <MobilePricing />
        <DesktopPricing />

        {/* Trust badges */}
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ ...smoothTransition, delay: 0.2 }}
          className="mt-14 sm:mt-20 flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          {[
            { icon: <Shield className="w-4 h-4 text-green-400" />, text: 'Pagamento seguro via Mercado Pago' },
            { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: 'Ativação imediata' },
            { icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />, text: 'Sem fidelidade' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm text-slate-500 glass-light rounded-full px-4 py-2">
              {item.icon}
              {item.text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════ */
const Features = () => {
  const features = [
    { icon: <MonitorSmartphone className="w-6 h-6" />, title: 'Telas Simultâneas', desc: 'Acesse em até 2 telas ao mesmo tempo — TV e celular juntos.', accent: 'emerald' },
    { icon: <Film className="w-6 h-6" />, title: 'Qualidade UHD e 4K', desc: 'Conteúdo de TV, filmes e séries em ultra alta definição.', accent: 'purple' },
    { icon: <Shield className="w-6 h-6" />, title: 'VOD Atualizado', desc: '+280.000 horas de conteúdo on demand para maratonar.', accent: 'blue' },
    { icon: <Globe className="w-6 h-6" />, title: 'Multi-Idioma & Legendas', desc: 'Troque o idioma e adicione legendas em tempo real.', accent: 'orange' },
    { icon: <PlayCircle className="w-6 h-6" />, title: 'Reprodução Inteligente', desc: 'Continuar Assistindo sincronizado em todos os aparelhos.', accent: 'cyan' },
  ];

  const accentColors: Record<string, { bg: string; text: string; gradient: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', gradient: 'from-emerald-500 to-green-600' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', gradient: 'from-purple-500 to-violet-600' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', gradient: 'from-orange-500 to-amber-600' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', gradient: 'from-cyan-500 to-teal-600' },
  };

  return (
    <section className="py-24 sm:py-32 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: feature list */}
          <div>
            <motion.h2
              variants={fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              transition={smoothTransition}
              viewport={{ once: true, margin: '-80px' }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-[-0.03em] mb-10 leading-tight"
            >
              Funções e Conteúdos{' '}<span className="text-gradient">Exclusivos</span>
            </motion.h2>
            <div className="space-y-3">
              {features.map((f, idx) => {
                const colors = accentColors[f.accent];
                return (
                  <motion.div
                    key={idx}
                    variants={fadeSlideLeft}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ ...smoothTransition, delay: idx * 0.1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    className="flex items-start gap-4 p-5 rounded-2xl glass-light hover:bg-white/[0.07] transition-all duration-300 group cursor-default"
                  >
                    <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                      <p className="text-slate-400 text-base leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: streaming visual */}
          <div className="relative hidden lg:block">
            <motion.div
              variants={fadeScale}
              initial="hidden"
              whileInView="visible"
              transition={{ ...smoothTransition, duration: 0.9 }}
              viewport={{ once: true, margin: '-80px' }}
              className="relative"
            >
              {/* Floating cards grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Film className="w-8 h-8" />, label: 'Filmes', sub: '+50.000 títulos', gradient: 'from-cyan-500 to-blue-600', delay: 0 },
                  { icon: <Tv className="w-8 h-8" />, label: 'Canais ao Vivo', sub: '+500 canais UHD', gradient: 'from-purple-500 to-pink-600', delay: 0.15 },
                  { icon: <MonitorPlay className="w-8 h-8" />, label: 'Séries', sub: '+280.000h VOD', gradient: 'from-orange-500 to-red-600', delay: 0.3 },
                  { icon: <Globe className="w-8 h-8" />, label: 'Conteúdo Global', sub: 'Sem fronteiras', gradient: 'from-emerald-500 to-teal-600', delay: 0.45 },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ ...smoothTransition, delay: card.delay }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, scale: 1.03 }}
                    className="glass rounded-2xl p-6 flex flex-col items-center text-center gap-3 cursor-default"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg`}>
                      {card.icon}
                    </div>
                    <h4 className="text-white font-bold text-sm">{card.label}</h4>
                    <p className="text-slate-400 text-xs font-mono">{card.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Ambient glow behind cards */}
              <div className="absolute inset-0 -z-10 blur-3xl opacity-20">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500 rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════ */
const FAQ = () => {
  const faqs = [
    { q: 'Como faço para instalar o aplicativo?', a: 'A instalação é simples! Após a assinatura, você receberá um email com o link direto para download do nosso APK para Android ou instruções para configurar no seu TV Box/Fire Stick.' },
    { q: 'Posso testar antes de comprar?', a: 'Sim! Oferecemos um período de teste gratuito de 4 horas para que você possa verificar a qualidade do nosso serviço e a estabilidade dos canais.' },
    { q: 'A lista de canais é atualizada?', a: 'Sim, nossa equipe trabalha diariamente para manter a lista de canais, filmes e séries sempre atualizada com os lançamentos mais recentes.' },
    { q: 'Quais as formas de pagamento?', a: 'Aceitamos PIX, cartão de crédito (em até 12x) e pix copia e cola — tudo processado com segurança pelo Mercado Pago. A ativação após o pagamento é imediata.' },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 bg-transparent">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.h2
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          transition={smoothTransition}
          viewport={{ once: true, margin: '-80px' }}
          className="text-4xl sm:text-5xl md:text-6xl font-black text-center text-white tracking-[-0.03em] mb-16"
        >
          Perguntas <span className="text-gradient">Frequentes</span>
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.details
              key={idx}
              variants={fadeSlideUp}
              initial="hidden"
              whileInView="visible"
              transition={{ ...smoothTransition, duration: 0.5, delay: idx * 0.08 }}
              viewport={{ once: true, margin: '-40px' }}
              className="group glass rounded-2xl overflow-hidden hover:border-cyan-500/20 transition-colors duration-300"
            >
              <summary className="flex items-center justify-between text-white text-lg sm:text-xl font-bold p-6 sm:p-7 cursor-pointer list-none select-none">
                <span className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-sm font-mono text-cyan-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {faq.q}
                </span>
                <span className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-open:bg-cyan-500/20 group-open:rotate-180">
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:text-cyan-400" />
                </span>
              </summary>
              <div className="px-6 sm:px-7 pb-6 sm:pb-7">
                <div className="h-px w-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent mb-5" />
                <p className="leading-relaxed text-slate-400 text-base sm:text-lg pl-11">
                  {faq.a}
                </p>
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════
   PAGE EXPORT
   ═══════════════════════════════════════════ */
export const LandingPage = () => {
  useEffect(() => {
    // SendPulse Chatbot Placeholder
  }, []);

  return (
    <>
      <Suspense fallback={<div className="fixed inset-0 bg-[#020617]" style={{ zIndex: -1 }} />}>
        <WebGLShader />
      </Suspense>
      <Hero />
      <Compatibility />
      <Pricing />
      <Features />
      <FAQ />
    </>
  );
};
