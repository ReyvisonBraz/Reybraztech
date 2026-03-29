import { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

const LOGO_URL = "/logo/logo.avif";
const LOGO_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDT_PyoMkB59P3OzTV_FbTxjdvtzFgyoxemqDJwBcszLBk9vonzWpUiC2ZVcrQvOmbqY0zjk7FdF0CSKQP2t7wS1k61vO5FQUS-5qpoyzrsYbPRE0sJvWqqkjPTTG-RVStF2gd78ThnlxpXPO4He6FboapYSBvaZ3RPBRm3USRYgxtIK3ggMuLX8nwsgytGrMmzDCFhAipovqbRi-S3ahXOqlUnnDKyJLrsIyOMUU_iAsruVUNJkCByYeE9GmQcYhNLjMlQWQxue";

const NAV_ITEMS = ['Início', 'Dispositivos', 'Planos', 'FAQ'];

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const location = useLocation();

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('reyb_token'));
    }, [location]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    return (
        <nav ref={navRef} className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'glass-nav py-1' : 'bg-transparent py-3'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-shrink-0"
                    >
                        <Link to="/">
                            <img
                                alt="Reybraz Tech Logo"
                                className="h-9 md:h-11 w-auto object-contain"
                                src={LOGO_URL}
                                onError={(e) => { (e.target as HTMLImageElement).src = LOGO_FALLBACK; }}
                            />
                        </Link>
                    </motion.div>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <a
                                key={item}
                                href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`}
                                className="relative text-slate-400 hover:text-white px-4 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 group"
                            >
                                {item}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300 group-hover:w-3/4" />
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center">
                        <Link
                            to={isLoggedIn ? "/dashboard" : "/login"}
                            className="flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border border-white/10 hover:border-cyan-400/40"
                        >
                            {isLoggedIn ? "Área do Cliente" : "Entrar"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex md:hidden items-center gap-3">
                        <Link
                            to={isLoggedIn ? "/dashboard" : "/login"}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25"
                        >
                            {isLoggedIn ? "Área do Cliente" : "Entrar"}
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/10 bg-white/5 text-white"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile fullscreen overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 top-0 z-40 md:hidden bg-[#020617]/98 backdrop-blur-xl flex flex-col"
                    >
                        {/* Close button top right */}
                        <div className="flex justify-end p-6 pt-8">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Nav links centered */}
                        <div className="flex-1 flex flex-col justify-center items-center gap-2 px-8">
                            {NAV_ITEMS.map((item, idx) => (
                                <motion.a
                                    key={item}
                                    href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="text-3xl font-bold text-white/80 hover:text-white py-4 tracking-tight transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </motion.a>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: NAV_ITEMS.length * 0.08 }}
                                className="mt-8"
                            >
                                <Link
                                    to={isLoggedIn ? "/dashboard" : "/login"}
                                    className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-full text-lg font-bold shadow-lg shadow-cyan-500/30"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {isLoggedIn ? "Área do Cliente" : "Entrar"}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
