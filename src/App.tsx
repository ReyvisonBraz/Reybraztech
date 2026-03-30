import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load das páginas — cada uma vira um chunk JS separado
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

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

// Loading fallback minimalista
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

import { API_URL } from './config/api';
import { restoreSendPulseChat } from './utils/openSendPulseChat';

export default function App() {
  // Wake Up Server Strategy (Render Free Tier)
  useEffect(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' })
      .then(() => console.log('🟢 Servidor Acordado ou Conectado'))
      .catch((err) => console.log('🔴 Servidor indisponível no momento', err));
  }, []);

  // Restore SendPulse chat if user had an active conversation
  useEffect(() => {
    restoreSendPulseChat();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-500">
        <ScrollToTop />
        <Navbar />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/admlogin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
