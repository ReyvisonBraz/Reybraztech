import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { InstallPrompt } from './components/InstallPrompt';
import { PromoProvider } from './components/PromoProvider';
import { ReyBrazPromoModal } from './components/AppPromoModal';

import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load das páginas — cada uma vira um chunk JS separado
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const TrialPage = lazy(() => import('./pages/TrialPage').then(m => ({ default: m.TrialPage })));
const CompleteRegistrationPage = lazy(() => import('./pages/CompleteRegistrationPage').then(m => ({ default: m.CompleteRegistrationPage })));
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

// Splash só mostra quando o app está instalado como PWA
const isInstalledPWA = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;

export default function App() {
  const [showSplash, setShowSplash] = useState(isInstalledPWA);

  // Wake Up Server Strategy (Render Free Tier)
  const [serverAwake, setServerAwake] = useState(false);

  useEffect(() => {
    if (!serverAwake) {
      fetch(`${API_URL}/api/health`, { method: 'GET' })
        .then(() => {
          console.log('🟢 Servidor Acordado ou Conectado');
          setServerAwake(true);
        })
        .catch((err) => console.log('🔴 Servidor indisponível no momento', err));
    }
  }, [serverAwake]);

  // Restore SendPulse chat if user had an active conversation
  useEffect(() => {
    restoreSendPulseChat();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <PromoProvider>
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-500">
          <ScrollToTop />
          <Navbar />
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/trial" element={<TrialPage />} />
                <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/admlogin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <InstallPrompt />
          <ReyBrazPromoModal />
        </div>
      </PromoProvider>
    </BrowserRouter>
  );
}
