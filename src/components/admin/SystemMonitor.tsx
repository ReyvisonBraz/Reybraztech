import { ServiceHealthCards } from './ServiceHealthCards';
import { MetricsGrid } from './MetricsGrid';
import { LiveConsole } from './LiveConsole';
import { RecentActivity } from './RecentActivity';
import { Activity } from 'lucide-react';

export const SystemMonitor = () => {
  return (
    <div className="space-y-8">
      {/* Título da seção */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <Activity className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-200">Monitor do Sistema</h2>
        <span className="ml-auto text-xs text-slate-600 font-mono">Auto-refresh: 30s</span>
      </div>

      {/* Row 1: Métricas + Saúde */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Métricas Gerais</h3>
          <MetricsGrid />
        </div>
        <div className="xl:col-span-1">
          <ServiceHealthCards />
        </div>
      </div>

      {/* Row 2: Console + Atividade */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Console Interativo</h3>
          <LiveConsole />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
