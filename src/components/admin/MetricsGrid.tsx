import { ComponentType } from 'react';
import { Users, UserCheck, AlertTriangle, TrendingUp, Clock, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../../config/api';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  expiringSoon: number;
  trials: number;
  newLast24h: number;
}

const StatCard = ({
  label, value, icon: Icon, color, sublabel
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  sublabel?: string;
}) => (
  <div className={`glass rounded-2xl p-5 border flex flex-col gap-2 ${color}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</span>
      <Icon className="w-4 h-4 opacity-50" />
    </div>
    <p className="text-3xl font-black">{value}</p>
    {sublabel && <p className="text-xs opacity-50">{sublabel}</p>}
  </div>
);

export const MetricsGrid = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    const token = localStorage.getItem('reyb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/system-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 20000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard
        label="Total de Clientes"
        value={stats?.total ?? 0}
        icon={Users}
        color="border-white/5 text-slate-200"
      />
      <StatCard
        label="Ativos"
        value={stats?.active ?? 0}
        icon={UserCheck}
        color="border-emerald-500/20 text-emerald-400"
        sublabel="Status = Ativo"
      />
      <StatCard
        label="Inativos"
        value={stats?.inactive ?? 0}
        icon={AlertTriangle}
        color="border-red-500/20 text-red-400"
        sublabel="Fora do plano"
      />
      <StatCard
        label="Expirando em 7d"
        value={stats?.expiringSoon ?? 0}
        icon={Clock}
        color="border-yellow-500/20 text-yellow-400"
        sublabel="Precisa de atenção"
      />
      <StatCard
        label="Em Trial"
        value={stats?.trials ?? 0}
        icon={Gift}
        color="border-purple-500/20 text-purple-400"
        sublabel="Plano gratuito"
      />
      <StatCard
        label="Novos (24h)"
        value={stats?.newLast24h ?? 0}
        icon={TrendingUp}
        color="border-cyan-500/20 text-cyan-400"
        sublabel="Cadastrados hoje"
      />
    </div>
  );
};
