import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

// ► Para trocar a logo: substitua o arquivo  public/logo/logo.png
// ► Formatos aceitos: PNG, JPG, SVG, WEBP
const LOGO_URL = "/logo/logo.avif";
const LOGO_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDT_PyoMkB59P3OzTV_FbTxjdvtzFgyoxemqDJwBcszLBk9vonzWpUiC2ZVcrQvOmbqY0zjk7FdF0CSKQP2t7wS1k61vO5FQUS-5qpoyzrsYbPRE0sJvWqqkjPTTG-RVStF2gd78ThnlxpXPO4He6FboapYSBvaZ3RPBRm3USRYgxtIK3ggMuLX8nwsgytGrMmzDCFhAipovqbRi-S3ahXOqlUnnDKyJLrsIyOMUU_iAsruVUNJkCByYeE9GmQcYhNLjMlQWQxue";

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'glass-nav py-2' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-shrink-0 flex items-center"
                    >
                        <Link to="/">
                            <img
                                alt="Reybraz Tech Logo"
                                className="h-10 md:h-12 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                src={LOGO_URL}
                                onError={(e) => { (e.target as HTMLImageElement).src = LOGO_FALLBACK; }}
                            />
                        </Link>
                    </motion.div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {['Início', 'Dispositivos', 'Planos', 'FAQ'].map((item) => (
                                <a
                                    key={item}
                                    href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`}
                                    className="text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-bold transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:tracking-widest"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <Link to={localStorage.getItem('reyb_token') ? "/dashboard" : "/login"} className="glow-button bg-primary text-white px-8 py-3 rounded-full text-sm font-black shadow-[0_0_30px_rgba(14,165,233,0.5)] inline-block border-2 border-cyan-400 hover:scale-110">
                            {localStorage.getItem('reyb_token') ? "Painel" : "Acesso"}
                        </Link>
                    </div>
                    <div className="-mr-2 flex md:hidden items-center gap-3">
                        <Link to={localStorage.getItem('reyb_token') ? "/dashboard" : "/login"} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-full text-base font-black shadow-[0_0_20px_rgba(14,165,233,0.6)] border-2 border-cyan-400">
                            {localStorage.getItem('reyb_token') ? "Painel" : "Acesso"}
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center gap-2 justify-center px-4 py-3 rounded-xl border-2 border-cyan-400 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        >
                            <span className="font-black tracking-wider uppercase text-sm">Menu</span>
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden glass-nav shadow-[0_10px_30px_rgba(34,211,238,0.2)] border-b-2 border-cyan-400/30"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {['Início', 'Dispositivos', 'Planos', 'FAQ'].map((item) => (
                                <a
                                    key={item}
                                    href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`}
                                    className="block text-slate-600 dark:text-slate-300 hover:text-cyan-400 dark:hover:text-cyan-400 px-3 py-4 rounded-md text-base font-black transition-all border-b border-slate-100 dark:border-white/5 last:border-0"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <Link
                                to={localStorage.getItem('reyb_token') ? "/dashboard" : "/login"}
                                className="w-full text-center glow-button bg-primary text-white px-3 py-4 rounded-xl text-base font-black block mt-4 shadow-[0_0_20px_rgba(14,165,233,0.4)] border-2 border-cyan-400"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {localStorage.getItem('reyb_token') ? "Painel" : "Acesso"}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
