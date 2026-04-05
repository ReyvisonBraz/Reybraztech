import { useEffect, useRef, useState } from 'react';
import { Terminal, ChevronRight, Loader2, X, KeyRound } from 'lucide-react';
import { API_URL } from '../../config/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd' | 'system';
  message: string;
}

interface TwoFAPrompt {
  visible: boolean;
  submitting: boolean;
  code: string;
}

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  info:    'text-slate-400',
  warn:    'text-yellow-400',
  error:   'text-red-400',
  success: 'text-emerald-400',
  cmd:     'text-cyan-400 font-semibold',
  system:  'text-purple-400 font-semibold',
};

const LEVEL_PREFIX: Record<LogEntry['level'], string> = {
  info:    '[INFO]',
  warn:    '[WARN]',
  error:   '[ERR!]',
  success: '[  OK]',
  cmd:     '[ CMD]',
  system:  '[ SYS]',
};

const COMMAND_HINTS = [
  { cmd: 'sync full',          desc: 'Sincronização completa com StarHome' },
  { cmd: 'sync buscar [conta]',desc: 'Buscar e atualizar um único cliente' },
  { cmd: 'ping',               desc: 'Verifica a saúde geral do sistema' },
  { cmd: 'wake scraper',       desc: 'Acorda o servidor Render' },
  { cmd: 'stats',              desc: 'Exibe as métricas atuais' },
  { cmd: 'help',               desc: 'Lista todos os comandos' },
  { cmd: 'clear',              desc: 'Limpa o terminal' },
];

function newLog(level: LogEntry['level'], message: string): LogEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    level,
    message,
  };
}

export const LiveConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    newLog('success', 'Console Reybraztech inicializado. Digite "help" para ver os comandos disponíveis.'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [twoFA, setTwoFA] = useState<TwoFAPrompt>({ visible: false, submitting: false, code: '' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const twoFARef = useRef<HTMLInputElement>(null);

  const addLog = (level: LogEntry['level'], message: string) =>
    setLogs(prev => [...prev.slice(-300), newLog(level, message)]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, twoFA.visible]);

  const token = localStorage.getItem('reyb_token') ?? '';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── 2FA submit ────────────────────────────────────────────────────────
  const submit2FA = async () => {
    const code = twoFA.code.trim();
    if (!code) return;
    setTwoFA(p => ({ ...p, submitting: true }));
    addLog('cmd', `> 2fa ${code}`);
    try {
      const scraperUrl = (import.meta.env.VITE_SCRAPER_URL || 'https://reybraztech-scraper.onrender.com').replace(/\/+$/, '');
      const scraperKey = import.meta.env.VITE_SCRAPER_API_KEY || '';
      const res = await fetch(`${scraperUrl}/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': scraperKey },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        addLog('success', `Código 2FA enviado com sucesso. Scraper retomando...`);
      } else {
        addLog('error', `Falha ao enviar código 2FA: ${res.status}`);
      }
    } catch (err: any) {
      addLog('error', `Erro ao enviar 2FA: ${err.message}`);
    }
    setTwoFA({ visible: false, submitting: false, code: '' });
  };

  // ── Command executor ───────────────────────────────────────────────────
  const executeCommand = async (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    addLog('cmd', `> ${raw}`);
    setInput('');
    setRunning(true);

    try {
      // clear
      if (cmd === 'clear') { setLogs([]); setRunning(false); return; }

      // help
      if (cmd === 'help') {
        COMMAND_HINTS.forEach(({ cmd: c, desc }) =>
          addLog('info', `  ${c.padEnd(30)} — ${desc}`)
        );
        addLog('system', '  2fa [código]                   — Enviar código SMS/2FA para o scraper');
        setRunning(false); return;
      }

      // 2fa inline: "2fa 123456"
      if (cmd.startsWith('2fa ')) {
        const code = raw.replace(/^2fa\s+/i, '').trim();
        setTwoFA({ visible: false, submitting: true, code });
        await submit2FA();
        setRunning(false); return;
      }

      // ping
      if (cmd === 'ping') {
        addLog('info', 'Verificando saúde dos serviços...');
        try {
          const t1 = Date.now();
          const r1 = await fetch(`${API_URL}/api/health`);
          const d1 = await r1.json();
          addLog('success', `API Principal: ${d1.message} [${Date.now() - t1}ms]`);
        } catch { addLog('error', 'API Principal: Inacessível'); }
        try {
          const r2 = await fetch(`${API_URL}/api/admin/scraper-health`, { headers });
          const d2 = await r2.json() as { online: boolean; sleeping?: boolean; latencyMs: number };
          if (d2.online)        addLog('success', `Extrator (Render): Online [${d2.latencyMs}ms]`);
          else if (d2.sleeping) addLog('warn',    `Extrator (Render): Hibernando [${d2.latencyMs}ms]`);
          else                  addLog('error',   `Extrator (Render): Offline`);
        } catch { addLog('warn', 'Extrator (Render): Não respondeu'); }
        setRunning(false); return;
      }

      // wake scraper
      if (cmd === 'wake scraper') {
        addLog('info', 'Acordando servidor Render (pode demorar 30s)...');
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-health`, { headers, signal: AbortSignal.timeout(40000) });
          const d = await r.json() as { online: boolean; latencyMs: number };
          addLog(d.online ? 'success' : 'warn', d.online
            ? `Servidor acordou! [${d.latencyMs}ms]`
            : 'Servidor não respondeu em tempo hábil.');
        } catch { addLog('error', 'Timeout — servidor não respondeu dentro de 40s.'); }
        setRunning(false); return;
      }

      // stats
      if (cmd === 'stats') {
        const r = await fetch(`${API_URL}/api/admin/system-stats`, { headers });
        const d = await r.json();
        addLog('info', `Total: ${d.total} | Ativos: ${d.active} | Inativos: ${d.inactive}`);
        addLog('info', `Expirando (7d): ${d.expiringSoon} | Trial: ${d.trials} | Novos 24h: ${d.newLast24h}`);
        setRunning(false); return;
      }

      // sync full — polling no frontend (evita timeout de 60s da Vercel)
      if (cmd === 'sync full') {
        addLog('system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addLog('info',   'Iniciando sincronização completa com StarHome...');
        addLog('info',   'Este processo pode levar 3–10 minutos.');
        addLog('warn',   'Se o scraper solicitar 2FA, use o campo amarelo que aparecerá abaixo.');
        addLog('system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const syncStart = Date.now();
        let dotCount = 0;

        // Inicia a sincronização em background
        const syncPromise = fetch(`${API_URL}/api/admin/sync-starhome`, { method: 'POST', headers })
          .then(async r => {
            const text = await r.text();
            return { ok: r.ok, text };
          })
          .catch(err => ({ ok: false, text: err.message }));

        // Polling de logs de progresso a cada 4s
        const pollInterval = setInterval(() => {
          dotCount++;
          const elapsed = Math.round((Date.now() - syncStart) / 1000);
          addLog('info', `Progresso [${'●'.repeat(dotCount % 5 + 1)}${'○'.repeat(4 - dotCount % 5)}] ${elapsed}s corridos... (se demorar muito pode ser 2FA pendente)`);
          if (elapsed > 30 && elapsed % 30 === 0) {
            addLog('warn', `⚠️ ${elapsed}s — Se o scraper pediu 2FA, aparecerá o campo abaixo!`);
            setTwoFA(p => ({ ...p, visible: true }));
          }
        }, 4000);

        const result = await syncPromise;
        clearInterval(pollInterval);

        const duration = Math.round((Date.now() - syncStart) / 1000);
        if (result.ok) {
          addLog('success', `━━ Sincronização concluída em ${duration}s! ━━`);
          // Mostra as métricas atualizadas
          try {
            const r = await fetch(`${API_URL}/api/admin/system-stats`, { headers });
            const d = await r.json();
            addLog('success', `Clientes: ${d.total} total | ${d.active} ativos | ${d.inactive} inativos`);
          } catch { /* silent */ }
        } else {
          addLog('error', `Falha na sincronização (${duration}s): ${result.text.slice(0, 200)}`);
        }
        setRunning(false); return;
      }

      // sync buscar
      if (cmd.startsWith('sync buscar ')) {
        const query = raw.replace(/sync buscar /i, '').trim();
        addLog('info', `Buscando cliente "${query}"...`);
        const r = await fetch(`${API_URL}/api/admin/clients?search=${encodeURIComponent(query)}`, { headers });
        const d = await r.json();
        if (d.clients?.length > 0) {
          const c = d.clients[0];
          addLog('success', `${c.name} | ${c.whatsapp} | Status: ${c.status} | Dias: ${c.days_remaining} | StarHome: ${c.starhome_account || 'N/A'}`);
        } else {
          addLog('warn', `Nenhum cliente encontrado para "${query}"`);
        }
        setRunning(false); return;
      }

      addLog('warn', `Comando não reconhecido: "${raw}". Digite "help" para ver os disponíveis.`);
    } catch (err: any) {
      addLog('error', `Erro: ${err.message}`);
    }

    setRunning(false);
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black/70 backdrop-blur-xl" style={{ minHeight: 480, maxHeight: 640 }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <Terminal className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500 font-mono select-none">reybraztech — console</span>
        <div className="ml-auto flex items-center gap-3">
          {running && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" /> executando...
            </span>
          )}
          <button onClick={() => setLogs([])} className="text-slate-600 hover:text-slate-400 transition-colors" title="Limpar">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Log stream ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-5 space-y-0.5">
        {logs.map(log => (
          <div key={log.id} className="flex gap-2 group">
            <span className="text-slate-700 shrink-0 select-none tabular-nums">{log.timestamp}</span>
            <span className={`shrink-0 select-none tabular-nums ${LEVEL_STYLE[log.level]}`}>{LEVEL_PREFIX[log.level]}</span>
            <span className={`break-all ${LEVEL_STYLE[log.level]}`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── 2FA Alert Box ── */}
      {twoFA.visible && (
        <div className="shrink-0 border-t-2 border-yellow-500/60 bg-yellow-500/5 px-4 py-3 flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-yellow-400 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-yellow-400 mb-1">🔐 Código 2FA Necessário</p>
            <p className="text-xs text-yellow-300/70">O scraper detectou um novo dispositivo. Digite o código SMS/e-mail recebido:</p>
          </div>
          <input
            ref={twoFARef}
            value={twoFA.code}
            onChange={e => setTwoFA(p => ({ ...p, code: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit2FA()}
            placeholder="Ex: 123456"
            className="w-32 bg-black/60 border border-yellow-500/50 rounded-xl px-3 py-2 text-yellow-300 text-sm font-mono text-center focus:outline-none focus:border-yellow-400"
            autoFocus
            disabled={twoFA.submitting}
          />
          <button
            onClick={submit2FA}
            disabled={twoFA.submitting || !twoFA.code}
            className="px-4 py-2 rounded-xl bg-yellow-500 text-black text-xs font-black disabled:opacity-50 hover:bg-yellow-400 transition-colors shrink-0"
          >
            {twoFA.submitting ? '...' : 'Enviar'}
          </button>
          <button onClick={() => setTwoFA(p => ({ ...p, visible: false }))} className="text-yellow-600 hover:text-yellow-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Hints dropdown ── */}
      {showHints && input.length === 0 && (
        <div className="shrink-0 border-t border-white/5 bg-black/50 px-4 py-2 grid grid-cols-2 gap-0.5 max-h-48 overflow-y-auto">
          {[...COMMAND_HINTS, { cmd: '2fa [código]', desc: 'Enviar código SMS/2FA' }].map(({ cmd, desc }) => (
            <button
              key={cmd}
              className="text-left text-xs flex gap-2 hover:bg-white/5 px-2 py-1.5 rounded transition-colors"
              onMouseDown={e => { e.preventDefault(); setInput(cmd); setShowHints(false); inputRef.current?.focus(); }}
            >
              <span className="text-cyan-400 font-mono shrink-0">{cmd}</span>
              <span className="text-slate-500 truncate">{desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="shrink-0 border-t border-white/5 px-4 py-3 flex items-center gap-2 bg-black/30">
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
          onBlur={() => setTimeout(() => setShowHints(false), 150)}
          placeholder='Comando... (Tab = sugestões, Enter = executar)'
          disabled={running}
          className="flex-1 bg-transparent text-emerald-300 text-xs font-mono focus:outline-none placeholder:text-slate-700 caret-cyan-400 disabled:opacity-50"
          spellCheck={false}
          autoComplete="off"
        />
        {running && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />}
      </div>
    </div>
  );
};
