import { useEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight, Loader2, X } from 'lucide-react';
import { API_URL } from '../../config/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  message: string;
}

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  info:    'text-slate-400',
  warn:    'text-yellow-400',
  error:   'text-red-400',
  success: 'text-emerald-400',
  cmd:     'text-cyan-400 font-bold',
};

const LEVEL_PREFIX: Record<LogEntry['level'], string> = {
  info:    '[INFO]',
  warn:    '[WARN]',
  error:   '[ERR!]',
  success: '[  OK]',
  cmd:     '[ CMD]',
};

// Comandos disponíveis no console
const COMMAND_HINTS = [
  { cmd: 'sync full', desc: 'Sincronização completa com StarHome' },
  { cmd: 'sync buscar [conta]', desc: 'Buscar e atualizar um único cliente' },
  { cmd: 'ping', desc: 'Verifica a saúde geral do sistema' },
  { cmd: 'wake scraper', desc: 'Acorda o servidor Render (Extrator)' },
  { cmd: 'stats', desc: 'Exibe as métricas atuais no console' },
  { cmd: 'help', desc: 'Lista todos os comandos disponíveis' },
  { cmd: 'clear', desc: 'Limpa o histórico do terminal' },
];

export const LiveConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '0', timestamp: new Date().toLocaleTimeString('pt-BR'), level: 'success', message: 'Console Reybraztech inicializado. Digite "help" para listar os comandos.' }
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev.slice(-200), {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message
    }]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = async (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    addLog('cmd', `> ${raw}`);
    setInput('');
    setRunning(true);

    const token = localStorage.getItem('reyb_token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      if (cmd === 'clear') {
        setLogs([]);
        setRunning(false);
        return;
      }

      if (cmd === 'help') {
        COMMAND_HINTS.forEach(({ cmd: c, desc }) => addLog('info', `  ${c.padEnd(28)} — ${desc}`));
        setRunning(false);
        return;
      }

      if (cmd === 'ping') {
        addLog('info', 'Verificando saúde dos serviços...');
        const t1 = Date.now();
        try {
          const res = await fetch(`${API_URL}/api/health`);
          const data = await res.json();
          addLog('success', `API Principal: ${data.message} [${Date.now() - t1}ms]`);
        } catch {
          addLog('error', 'API Principal: Offline ou inacessível');
        }
        try {
          const t2 = Date.now();
          const res = await fetch(`${API_URL}/api/admin/scraper-health`, { headers });
          const d = await res.json() as { online: boolean; sleeping?: boolean; latencyMs: number };
          if (d.online) addLog('success', `Extrator (Render): Online [${d.latencyMs}ms]`);
          else if (d.sleeping) addLog('warn', `Extrator (Render): Hibernando [${d.latencyMs}ms]`);
          else addLog('error', `Extrator (Render): Offline`);
          void t2;
        } catch {
          addLog('warn', 'Extrator (Render): Não respondeu');
        }
        setRunning(false);
        return;
      }

      if (cmd === 'wake scraper') {
        addLog('info', 'Acordando o servidor Render via proxy (pode demorar 30s)...');
        try {
          const res = await fetch(`${API_URL}/api/admin/scraper-health`, { headers, signal: AbortSignal.timeout(40000) });
          const d = await res.json() as { online: boolean; latencyMs: number };
          if (d.online) addLog('success', `Servidor Render acordou! [${d.latencyMs}ms]`);
          else addLog('warn', 'Servidor não respondeu em tempo hábil.');
        } catch {
          addLog('error', 'Servidor não respondeu dentro de 40 segundos.');
        }
        setRunning(false);
        return;
      }

      if (cmd === 'stats') {
        const res = await fetch(`${API_URL}/api/admin/system-stats`, { headers });
        const data = await res.json();
        addLog('info', `Total: ${data.total} | Ativos: ${data.active} | Inativos: ${data.inactive}`);
        addLog('info', `Expirando em 7d: ${data.expiringSoon} | Trials: ${data.trials} | Novos 24h: ${data.newLast24h}`);
        setRunning(false);
        return;
      }

      if (cmd === 'sync full') {
        addLog('info', 'Disparando sincronização completa com StarHome...');
        const res = await fetch(`${API_URL}/api/admin/sync-starhome`, { method: 'POST', headers });
        if (res.ok) {
          addLog('success', 'Sincronização iniciada! Acompanhe o log acima.');
        } else {
          const err = await res.json();
          addLog('error', `Falha: ${err.error}`);
        }
        setRunning(false);
        return;
      }

      if (cmd.startsWith('sync buscar ')) {
        const query = raw.replace(/sync buscar /i, '').trim();
        addLog('info', `Buscando cliente "${query}"...`);
        const res = await fetch(`${API_URL}/api/admin/clients?search=${encodeURIComponent(query)}`, { headers });
        const data = await res.json();
        if (data.clients?.length > 0) {
          const c = data.clients[0];
          addLog('success', `Encontrado: ${c.name} | ${c.whatsapp} | Status: ${c.status} | Dias: ${c.days_remaining}`);
        } else {
          addLog('warn', `Nenhum cliente encontrado para "${query}"`);
        }
        setRunning(false);
        return;
      }

      addLog('warn', `Comando não reconhecido: "${raw}". Digite "help" para ver os disponíveis.`);
    } catch (err: any) {
      addLog('error', `Erro ao executar: ${err.message}`);
    }

    setRunning(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[420px] max-h-[600px] rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <Terminal className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500 font-mono">reybraztech — console</span>
        <div className="ml-auto flex items-center gap-2">
          {running && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          <button
            onClick={() => setLogs([])}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            title="Limpar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log stream */}
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed space-y-0.5">
        {logs.map(log => (
          <div key={log.id} className="flex gap-2 items-start">
            <span className="text-slate-700 shrink-0 select-none">{log.timestamp}</span>
            <span className={`shrink-0 ${LEVEL_STYLE[log.level]} select-none`}>{LEVEL_PREFIX[log.level]}</span>
            <span className={`${LEVEL_STYLE[log.level]} break-all`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Hints dropdown */}
      {showHints && input.length === 0 && (
        <div className="border-t border-white/5 bg-black/40 px-4 py-2 space-y-1 max-h-40 overflow-y-auto">
          {COMMAND_HINTS.map(({ cmd, desc }) => (
            <button
              key={cmd}
              className="w-full text-left text-xs flex gap-3 hover:bg-white/5 px-2 py-1 rounded transition-colors"
              onClick={() => { setInput(cmd); setShowHints(false); inputRef.current?.focus(); }}
            >
              <span className="text-cyan-400 font-mono shrink-0">{cmd}</span>
              <span className="text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2 bg-white/2">
        <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !running) executeCommand(input);
            if (e.key === 'Tab') { e.preventDefault(); setShowHints(p => !p); }
          }}
          onFocus={() => setShowHints(true)}
          onBlur={() => setTimeout(() => setShowHints(false), 200)}
          placeholder="Digite um comando… (Tab para sugestões)"
          disabled={running}
          className="flex-1 bg-transparent text-emerald-400 text-xs font-mono focus:outline-none placeholder:text-slate-700 caret-cyan-400"
          spellCheck={false}
          autoComplete="off"
        />
        {running && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />}
      </div>
    </div>
  );
};
