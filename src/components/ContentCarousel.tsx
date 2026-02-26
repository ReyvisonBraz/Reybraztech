import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause } from 'lucide-react';

// =========================================================================
// CONFIGURAÇÃO DOS CONTEÚDOS DO CARROSSEL
// Adicione, edite ou remova os itens abaixo para atualizar o carrossel.
// =========================================================================
const carouselItems = [
    {
        id: 1,
        title: 'Ação Explosiva',
        category: 'Filmes',
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 2,
        title: 'Aventuras Épicas',
        category: 'Animes',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 3,
        title: 'Ficção Científica',
        category: 'Séries',
        image: 'https://images.unsplash.com/photo-1614728263694-2c0861de8ef9?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 4,
        title: 'Magia e Mistério',
        category: 'Animes',
        image: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 5,
        title: 'Suspense',
        category: 'Filmes',
        image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 6,
        title: 'Heróis',
        category: 'Filmes',
        image: 'https://images.unsplash.com/photo-1608889825103-60980ef618e1?q=80&w=800&auto=format&fit=crop',
    }
];

export const ContentCarousel = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const SLIDE_DURATION = 8000; // 8 segundos
    const UPDATE_INTERVAL = 50;  // Atualiza a cada 50ms para animação suave

    // Lógica do Timer de 8 Segundos
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const nextProgress = prev + (UPDATE_INTERVAL / SLIDE_DURATION) * 100;
                if (nextProgress >= 100) {
                    // Quando a barra encher (8s), vai para o próximo slide
                    setActiveIndex((current) => (current + 1) % carouselItems.length);
                    return 0; // Reseta o progresso para o próximo
                }
                return nextProgress;
            });
        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);
    }, [isPaused, activeIndex]); // Depende do activeIndex para garantir sincronia

    // Efeito para rolar suavemente a lista sempre que o activeIndex mudar
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && container.children[activeIndex]) {
            const item = container.children[activeIndex] as HTMLElement;
            // Calcula a rolagem para centralizar o item
            const scrollTarget = item.offsetLeft - (container.offsetWidth / 2) + (item.offsetWidth / 2);

            container.scrollTo({
                left: scrollTarget,
                behavior: 'smooth'
            });
        }
    }, [activeIndex]);

    const handleItemClick = (index: number) => {
        if (activeIndex === index) {
            // Se clicar no item ativo, alterna entre pausa/play
            setIsPaused(!isPaused);
        } else {
            // Se clicar em um item novo, foca nele, reseta o tempo e começa a tocar
            setActiveIndex(index);
            setProgress(0);
            setIsPaused(false);
        }
    };

    return (
        <section className="py-12 bg-transparent overflow-hidden relative select-none">
            <div className="max-w-[100vw] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-2 h-8 bg-cyan-500 rounded-full inline-block"></span>
                        Em Destaque
                    </h2>
                    <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <span className="hidden sm:inline">
                            {isPaused ? 'Pausado' : 'Reproduzindo automaticamete'}
                        </span>
                        <div className="flex gap-1">
                            {!isPaused ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse"></span>
                                    <span className="w-2 h-2 rounded-full bg-cyan-500/70 animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-150"></span>
                                </>
                            ) : (
                                <Pause className="w-4 h-4 text-cyan-500" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Container do Carrossel com Scroll Horizontal Escondido */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 max-w-7xl mx-auto px-4 sm:px-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {carouselItems.map((item, index) => {
                        const isActive = index === activeIndex;

                        return (
                            <motion.div
                                key={item.id}
                                onClick={() => handleItemClick(index)}
                                className={`snap-center min-w-[160px] md:min-w-[200px] h-[240px] md:h-[300px] rounded-2xl relative overflow-hidden shadow-lg flex-shrink-0 cursor-pointer transition-all duration-500 ${isActive ? 'ring-4 ring-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.5)] scale-105 z-10' : 'opacity-60 hover:opacity-100 bg-slate-800'}`}
                            >
                                {/* Imagem de Fundo */}
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover pointer-events-none"
                                />

                                {/* Gradiente de Sobreposição Principal */}
                                <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent transition-opacity duration-300 ${isActive ? 'opacity-90' : 'opacity-60'}`}></div>

                                {/* Barra de Progresso no Topo (Apenas para o Ativo) */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800/80 z-20">
                                        <div
                                            className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-75 ease-linear"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Ícone Central (Play / Pause) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center z-10"
                                        >
                                            <div className="bg-cyan-500/80 backdrop-blur-md p-4 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)] border border-cyan-400/50 hover:bg-cyan-400 transition-colors">
                                                {isPaused ? (
                                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                                ) : (
                                                    <Pause className="w-8 h-8 text-white fill-white" />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Textos */}
                                <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block transition-all duration-300 ${isActive ? 'bg-cyan-500 text-white' : 'bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300'}`}>
                                        {item.category}
                                    </span>
                                    <h3 className={`font-bold leading-tight drop-shadow-md transition-all duration-300 ${isActive ? 'text-white text-xl' : 'text-slate-300 text-lg'}`}>
                                        {item.title}
                                    </h3>
                                </div>
                            </motion.div>
                        );
                    })}
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
