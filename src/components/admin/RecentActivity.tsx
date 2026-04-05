import { useEffect, useState, ComponentType } from 'react';
import { ClipboardList, RefreshCw, User, Key, UserPlus, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config/api';

interface LogEvent {
  id: number;
  action: string;
  whatsapp: string | null;
  details: string | null;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: ComponentType<{ className?: string }>; color: string }> = {
  login:        { label: 'Login',          icon: Key,        color: 'text-cyan-400 bg-cyan-500/10'     },
  register:     { label: 'Cadastro',       icon: UserPlus,   color: 'text-emerald-400 bg-emerald-500/10' },
  failed_login: { label: 'Falha de Login', icon: AlertCircle, color: 'text-red-400 bg-red-500/10'       },
  sync:         { label: 'Sincronização',  icon: RefreshCw,  color: 'text-purple-400 bg-purple-500/10'  },
};

const getFallback = (action: string) => ({
  label: action,
  icon: User,
  color: 'text-slate-400 bg-slate-500/10'
});

export const RecentActivity = () => {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem('reyb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/activity-log?limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEvents(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atividade Recente</h3>
        </div>
        <button onClick={load} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />
          ))
        ) : events.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-8">Nenhuma atividade registrada ainda.</p>
        ) : events.map(ev => {
          const meta = ACTION_META[ev.action] ?? getFallback(ev.action);
          const Icon = meta.icon;
          const date = new Date(ev.created_at).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          });

          return (
            <div key={ev.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{meta.label}</p>
                <p className="text-xs text-slate-500 truncate">
                  {ev.whatsapp || 'Sistema'}{ev.details ? ` — ${ev.details}` : ''}
                </p>
              </div>
              <span className="text-xs text-slate-600 shrink-0 font-mono">{date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
