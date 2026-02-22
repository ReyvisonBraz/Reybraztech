import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, FormEvent } from 'react';
import { Navbar, Footer, LandingPage } from './pages/LandingPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, MessageSquare } from 'lucide-react';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent pt-20 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glow-card neon-border-cyan p-6 md:p-12 rounded-3xl md:rounded-[3rem] max-w-md w-full text-center border-2"
      >
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Área do <span className="text-gradient">Cliente</span></h2>
        <p className="text-slate-400 mb-10">Acesse sua conta para gerenciar sua assinatura.</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              required
              type="email" 
              placeholder="Seu e-mail" 
              className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all" 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              required
              type="password" 
              placeholder="Sua senha" 
              className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all" 
            />
          </div>
          
          <button 
            disabled={loading}
            className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar na Conta
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5">
          <p className="text-slate-500 mb-4">Ainda não tem uma conta?</p>
          <Link 
            to="/register" 
            className="inline-flex items-center text-cyan-400 font-bold hover:text-cyan-300 transition-colors group"
          >
            <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Cadastre-se Agora
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-500">
        <ScrollToTop />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <Footer />
        
        {/* Floating WhatsApp Button */}
        <a 
          href="https://wa.me/5591986450659" 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="absolute right-full mr-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-100 dark:border-white/10">
            Fale Conosco
          </span>
        </a>
      </div>
    </BrowserRouter>
  );
}
