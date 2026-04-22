import { ServiceHealthCards } from './ServiceHealthCards';
import { LiveConsole } from './LiveConsole';
import { RecentActivity } from './RecentActivity';
import { Activity } from 'lucide-react';

export const SystemMonitor = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <Activity className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-200">Monitor do Sistema</h2>
      </div>

      {/* Console (largo) + coluna direita */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Console Interativo</h3>
          <LiveConsole />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <ServiceHealthCards />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
