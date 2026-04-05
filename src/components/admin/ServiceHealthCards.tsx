import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database, Server, Zap, AlertCircle, Activity } from 'lucide-react';
import { API_URL } from '../../config/api';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'sleeping' | 'offline' | 'checking';
  latencyMs: number | null;
  lastChecked: Date | null;
}

const SERVICES_CONFIG = [
  { name: 'API Principal (Vercel)', url: `${API_URL}/api/health`, type: 'api' },
  { name: 'Extrator (Render)', url: `${import.meta.env.VITE_SCRAPER_URL || 'https://reybraztech-scraper.onrender.com'}/health`, type: 'scraper' },
];

const getStatusColor = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'online': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'sleeping': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'offline': return 'text-red-400 bg-red-500/10 border-red-500/30';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
};

const getStatusIcon = (status: ServiceStatus['status']) => {
  switch (status) {
    case 'online': return <Wifi className="w-4 h-4" />;
    case 'sleeping': return <AlertCircle className="w-4 h-4 animate-pulse" />;
    case 'offline': return <WifiOff className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4 animate-spin" />;
  }
};

const getServiceIcon = (name: string) => {
  if (name.includes('Render') || name.includes('Extrator')) return <Server className="w-5 h-5 text-purple-400" />;
  if (name.includes('Database') || name.includes('DB')) return <Database className="w-5 h-5 text-cyan-400" />;
  return <Zap className="w-5 h-5 text-blue-400" />;
};

export const ServiceHealthCards = () => {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES_CONFIG.map(s => ({ name: s.name, url: s.url, status: 'checking', latencyMs: null, lastChecked: null }))
  );

  const checkService = async (url: string, index: number) => {
    const start = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const latency = Date.now() - start;
      setServices(prev => prev.map((s, i) => i === index ? {
        ...s, status: res.ok ? 'online' : 'offline', latencyMs: latency, lastChecked: new Date()
      } : s));
    } catch (err: any) {
      const latency = Date.now() - start;
      const isSleep = latency > 5000;
      setServices(prev => prev.map((s, i) => i === index ? {
        ...s, status: isSleep ? 'sleeping' : 'offline', latencyMs: null, lastChecked: new Date()
      } : s));
    }
  };

  const checkAll = () => {
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' })));
    SERVICES_CONFIG.forEach((svc, i) => checkService(svc.url, i));
  };

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saúde dos Serviços</h3>
        <button
          onClick={checkAll}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <Activity className="w-3 h-3" />
          Verificar
        </button>
      </div>
      {services.map((svc, i) => (
        <div key={i} className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {getServiceIcon(svc.name)}
            <div>
              <p className="text-sm font-semibold text-slate-200">{svc.name}</p>
              <p className="text-xs text-slate-500">
                {svc.lastChecked ? `Verificado ${svc.lastChecked.toLocaleTimeString('pt-BR')}` : 'Verificando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {svc.latencyMs !== null && (
              <span className="text-xs font-mono text-slate-500">{svc.latencyMs}ms</span>
            )}
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColor(svc.status)}`}>
              {getStatusIcon(svc.status)}
              {svc.status === 'checking' ? 'Verificando...' :
               svc.status === 'online' ? 'Online' :
               svc.status === 'sleeping' ? 'Hibernando' : 'Offline'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
