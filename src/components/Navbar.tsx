import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDT_PyoMkB59P3OzTV_FbTxjdvtzFgyoxemqDJwBcszLBk9vonzWpUiC2ZVcrQvOmbqY0zjk7FdF0CSKQP2t7wS1k61vO5FQUS-5qpoyzrsYbPRE0sJvWqqkjPTTG-RVStF2gd78ThnlxpXPO4He6FboapYSBvaZ3RPBRm3USRYgxtIK3ggMuLX8nwsgytGrMmzDCFhAipovqbRi-S3ahXOqlUnnDKyJLrsIyOMUU_iAsruVUNJkCByYeE9GmQcYhNLjMlQWQxue";

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Theme initialization
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
    };

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
                                className="h-12 w-auto filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                src={LOGO_URL}
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
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-white/5 dark:bg-white/5 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 text-slate-400 hover:text-cyan-400 transition-all"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link to="/login" className="glow-button bg-primary text-white px-8 py-3 rounded-full text-sm font-black shadow-[0_0_30px_rgba(14,165,233,0.5)] inline-block border-2 border-cyan-400 hover:scale-110">
                            Acesso
                        </Link>
                    </div>
                    <div className="-mr-2 flex md:hidden items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-slate-200 hover:text-cyan-400 focus:outline-none"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-200 hover:text-cyan-400 focus:outline-none"
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
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
                                to="/login"
                                className="w-full text-center glow-button bg-primary text-white px-3 py-4 rounded-xl text-base font-black block mt-4 shadow-[0_0_20px_rgba(14,165,233,0.4)] border-2 border-cyan-400"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Acesso
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
