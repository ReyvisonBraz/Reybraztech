import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Sparkles } from 'lucide-react';

// =========================================================================
// CONFIGURAÇÃO DOS CONTEÚDOS DO CARROSSEL
// ► Para trocar as imagens: coloque os arquivos em  public/carrossel/
// ► Para mudar títulos/categorias: edite  public/carrossel/config.json
// ► NÃO precisa mexer neste arquivo!
// =========================================================================

type CarouselItem = {
    id: number;
    title: string;
    category: string;
    image: string;
};

// Fallback usado enquanto as imagens locais não foram adicionadas
const FALLBACK_ITEMS: CarouselItem[] = [
    { id: 1, title: 'Ação Explosiva', category: 'Filmes', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop' },
    { id: 2, title: 'Aventuras Épicas', category: 'Animes', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop' },
    { id: 3, title: 'Ficção Científica', category: 'Séries', image: 'https://images.unsplash.com/photo-1614728263694-2c0861de8ef9?q=80&w=800&auto=format&fit=crop' },
    { id: 4, title: 'Magia e Mistério', category: 'Animes', image: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=800&auto=format&fit=crop' },
    { id: 5, title: 'Suspense', category: 'Filmes', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop' },
    { id: 6, title: 'Heróis', category: 'Filmes', image: 'https://images.unsplash.com/photo-1608889825103-60980ef618e1?q=80&w=800&auto=format&fit=crop' },
];

const categoryGradients: Record<string, string> = {
    'Filmes': 'from-cyan-500 to-blue-600',
    'Séries': 'from-purple-500 to-pink-600',
    'Animes': 'from-orange-500 to-red-600',
};

export const ContentCarousel = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [items, setItems] = useState<CarouselItem[]>(FALLBACK_ITEMS);

    const SLIDE_DURATION = 8000;
    const UPDATE_INTERVAL = 50;

    // Carrega o config.json da pasta public/carrossel/
    useEffect(() => {
        fetch('/carrossel/config.json')
            .then(res => res.json())
            .then((data: CarouselItem[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    setItems(data);
                }
            })
            .catch(() => {
                // Se o arquivo não existir ainda, mantém o fallback silenciosamente
            });
    }, []);

    // Lógica do Timer de 8 Segundos
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const nextProgress = prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100;
                if (nextProgress >= 100) {
                    setActiveIndex((current) => (current + 1) % items.length);
                    return 0;
                }
                return nextProgress;
            });
        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);
    }, [isPaused, activeIndex, items.length]);

    // Efeito para rolar suavemente a lista sempre que o activeIndex mudar
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && container.children[activeIndex]) {
            const item = container.children[activeIndex] as HTMLElement;
            const scrollTarget = item.offsetLeft - (container.offsetWidth / 2) + (item.offsetWidth / 2);
            container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }
    }, [activeIndex]);

    const handleItemClick = (index: number) => {
        if (activeIndex === index) {
            setIsPaused(!isPaused);
        } else {
            setActiveIndex(index);
            setProgress(0);
            setIsPaused(false);
        }
    };

    const activeItem = items[activeIndex];
    const gradient = categoryGradients[activeItem?.category] || 'from-cyan-500 to-blue-600';

    return (
        <section className="py-10 sm:py-16 bg-transparent overflow-hidden relative select-none">
            <div className="max-w-[100vw] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header premium */}
                <div className="flex items-center justify-between mb-6 sm:mb-10 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-all duration-500`}>
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                Destaques
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:block">
                                {isPaused ? 'Pausado' : 'Reproduzindo automaticamente'}
                            </p>
                        </div>
                    </div>
                    {/* Status indicators */}
                    <div className="flex items-center gap-3">
                        {/* Dot indicators */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setActiveIndex(i); setProgress(0); setIsPaused(false); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex
                                            ? `w-6 bg-gradient-to-r ${gradient}`
                                            : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                                        }`}
                                />
                            ))}
                        </div>
                        {/* Play/Pause toggle */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/10 ${!isPaused ? 'text-cyan-400' : 'text-slate-400'}`}
                        >
                            {isPaused
                                ? <Play className="w-4 h-4 fill-current ml-0.5" />
                                : <Pause className="w-4 h-4 fill-current" />
                            }
                        </button>
                    </div>
                </div>

                {/* Carousel scroll container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 max-w-7xl mx-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item, index) => {
                        const isActive = index === activeIndex;
                        const itemGradient = categoryGradients[item.category] || 'from-cyan-500 to-blue-600';

                        return (
                            <motion.div
                                key={item.id}
                                onClick={() => handleItemClick(index)}
                                layout
                                className={`snap-center flex-shrink-0 rounded-2xl sm:rounded-3xl relative overflow-hidden cursor-pointer transition-all duration-500
                                    ${isActive
                                        ? 'min-w-[200px] sm:min-w-[240px] md:min-w-[260px] h-[280px] sm:h-[320px] md:h-[360px] z-10 shadow-2xl'
                                        : 'min-w-[140px] sm:min-w-[170px] md:min-w-[200px] h-[240px] sm:h-[280px] md:h-[300px] opacity-50 hover:opacity-80'
                                    }`}
                            >
                                {/* Background Image */}
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover pointer-events-none"
                                />

                                {/* Gradient overlay */}
                                <div className={`absolute inset-0 transition-opacity duration-300 ${isActive
                                        ? 'bg-gradient-to-t from-black via-black/40 to-transparent opacity-90'
                                        : 'bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent opacity-70'
                                    }`} />

                                {/* Active ring glow */}
                                {isActive && (
                                    <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl ring-2 ring-inset bg-gradient-to-t ${itemGradient} opacity-20 pointer-events-none`} />
                                )}

                                {/* Progress bar at top */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
                                        <motion.div
                                            className={`h-full bg-gradient-to-r ${itemGradient} shadow-[0_0_8px_rgba(34,211,238,0.6)]`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Center play/pause icon */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center z-10"
                                        >
                                            <div className={`bg-gradient-to-r ${itemGradient} bg-opacity-80 backdrop-blur-md p-3 sm:p-4 rounded-full shadow-lg border border-white/20 hover:scale-110 transition-transform`}>
                                                {isPaused ? (
                                                    <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-0.5" />
                                                ) : (
                                                    <Pause className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bottom text */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10 pointer-events-none">
                                    <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 sm:py-1 rounded-md mb-1.5 sm:mb-2 inline-block uppercase tracking-widest transition-all duration-300
                                        ${isActive
                                            ? `bg-gradient-to-r ${itemGradient} text-white`
                                            : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/70'
                                        }`}
                                    >
                                        {item.category}
                                    </span>
                                    <h3 className={`font-black leading-tight drop-shadow-md transition-all duration-300 ${isActive ? 'text-white text-base sm:text-xl' : 'text-slate-300 text-sm sm:text-lg'
                                        }`}>
                                        {item.title}
                                    </h3>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Mobile dot indicators */}
                <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setActiveIndex(i); setProgress(0); setIsPaused(false); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex
                                    ? `w-5 bg-gradient-to-r ${gradient}`
                                    : 'w-1.5 bg-slate-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
};
