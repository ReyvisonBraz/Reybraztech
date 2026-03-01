import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Clock, Shield, PlayCircle, LogOut, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:3001';

interface UserData {
  name: string;
  plan: string;
  status: string;
  whatsapp: string;
  days_remaining: number;
  app_account: string | null;
  app_password: string | null;
  createdAt: string;
  paymentHistory: Array<{
    date: string;
    plan: string;
    value: string;
    status: string;
  }>;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('reyb_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          // Token expirado ou inválido
          localStorage.removeItem('reyb_token');
          localStorage.removeItem('reyb_user');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Erro ao carregar dados.');
          return;
        }

        setUser(data);
      } catch {
        setError('Não foi possível conectar ao servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('reyb_token');
    localStorage.removeItem('reyb_user');
    navigate('/');
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-slate-400">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  // Erro de conexão
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-cyan-400 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const planLinks: Record<string, string> = {
    mensal: '/checkout?plan=mensal',
    trimestral: '/checkout?plan=trimestral',
    semestral: '/checkout?plan=semestral',
    anual: '/checkout?plan=anual',
  };

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 md:pt-32 md:pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Olá, <span className="text-gradient">{user.name.split(' ')[0]}</span></h1>
            <p className="text-slate-400">Bem-vindo ao seu painel de controle.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center text-slate-400 hover:text-primary transition-colors font-bold">
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glow-card neon-border-cyan p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] lg:col-span-2 border-2"
          >
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Sua Assinatura</h2>
              <span className="status-badge status-badge-paid">
                {user.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2 text-cyan-400" />
                  Plano Atual
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white capitalize">{user.plan}</div>
              </div>
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-2 text-orange-400" />
                  WhatsApp
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{user.whatsapp}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Acesso Rápido</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="p-4 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-cyan-400 font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all">
                  <PlayCircle className="w-5 h-5" />
                  Abrir Web Player
                </button>
                <button className="p-4 rounded-2xl bg-purple-500/10 border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-purple-400 font-bold flex items-center justify-center gap-2 hover:bg-purple-500/20 transition-all">
                  <Shield className="w-5 h-5" />
                  Suporte Técnico
                </button>
              </div>
            </div>

            {/* Dados de Acesso ao App */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Dados de Acesso ao App</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 md:p-5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Dias Restantes
                  </p>
                  <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-cyan-400">
                    {user.days_remaining} <span className="text-sm font-bold text-slate-500">Dias</span>
                  </p>
                </div>
                <div className="p-4 md:p-5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">Usuário / Conta</p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {user.app_account || 'Pendente'}
                  </p>
                </div>
                <div className="p-4 md:p-5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">Senha</p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {user.app_password || 'Pendente'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Renewal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glow-card neon-border-orange p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border-2 bg-orange-500/5"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Renovar Agora</h2>
            <p className="text-slate-400 mb-8 text-sm">Não perca o acesso! Renove seu plano antecipadamente e ganhe bônus de fidelidade.</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-3 text-orange-500" />
                Manter histórico e favoritos
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 mr-3 text-orange-500" />
                Ativação instantânea
              </div>
            </div>

            <Link
              to={planLinks[user.plan] || '/checkout?plan=mensal'}
              className="glow-button w-full py-4 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.5)] border-2 border-orange-400"
            >
              <CreditCard className="w-5 h-5" />
              Renovar Assinatura
            </Link>
          </motion.div>
        </div>

        {/* Histórico de Pagamentos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Histórico de Pagamentos</h2>

          {user.paymentHistory.length === 0 ? (
            <div className="glow-card p-10 rounded-3xl text-center text-slate-400">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-3xl border border-white/5 bg-white/5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Plano</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {user.paymentHistory.map((item, i) => (
                      <tr key={i}>
                        <td className="p-6 text-slate-900 dark:text-white font-medium">{item.date}</td>
                        <td className="p-6 text-slate-900 dark:text-white capitalize">{item.plan}</td>
                        <td className="p-6 text-slate-900 dark:text-white">{item.value}</td>
                        <td className="p-6">
                          <span className={`font-bold flex items-center gap-2 ${item.status === 'Pago' ? 'text-green-500' : 'text-red-500'}`}>
                            {item.status === 'Pago' ? '✅' : '❌'} {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {user.paymentHistory.map((item, i) => (
                  <div key={i} className="glow-card p-6 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.date}</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white capitalize">{item.plan}</h4>
                      <p className="text-slate-500 font-bold">{item.value}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-1">{item.status === 'Pago' ? '✅' : '❌'}</div>
                      <p className={`text-xs font-black uppercase ${item.status === 'Pago' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
