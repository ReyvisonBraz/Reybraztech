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
  sessionId?: string | null;
}

interface TwoFAStatus {
  waiting: boolean;
  state?: string;
  sessionId?: string | null;
  remainingMs?: number;
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
  { cmd: 'sync',              desc: 'Sincronização completa com StarHome' },
  { cmd: 'renew [nome]',      desc: 'Renovar cliente pelo nome' },
  { cmd: 'search [query]',    desc: 'Buscar cliente no StarHome' },
  { cmd: 'jobs',              desc: 'Listar jobs recentes do scraper' },
  { cmd: 'job [id]',          desc: 'Detalhes de um job específico' },
  { cmd: 'ping',              desc: 'Verificar saúde dos serviços' },
  { cmd: 'wake',              desc: 'Acordar o servidor Render' },
  { cmd: 'stats',             desc: 'Exibir métricas do banco' },
  { cmd: '2fa status',        desc: 'Checar se scraper aguarda 2FA' },
  { cmd: '2fa [código]',      desc: 'Enviar código 2FA ao scraper' },
  { cmd: 'clear',             desc: 'Limpar o terminal' },
  { cmd: 'help',              desc: 'Listar todos os comandos' },
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
    newLog('success', 'Console Reybraztech inicializado. Digite "help" para ver os comandos.'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [twoFA, setTwoFA] = useState<TwoFAPrompt>({ visible: false, submitting: false, code: '' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Lembra o último estado 2FA observado pelo polling para só logar em transições.
  const lastPolledSessionId = useRef<string | null | undefined>(undefined);

  const addLog = (level: LogEntry['level'], message: string) =>
    setLogs(prev => [...prev.slice(-400), newLog(level, message)]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, twoFA.visible]);

  // Polling de 2FA independente de `running`: roda enquanto o Console estiver
  // montado, para jobs autônomos da fila também fazerem o prompt aparecer.
  useEffect(() => {
    let stopped = false;
    let failCount = 0;
    const poll = async () => {
      if (stopped) return;
      try {
        const r = await fetch(`${API_URL}/api/admin/scraper-2fa-status`, {
          headers: authHeaders(),
          signal: AbortSignal.timeout(4000),
        });
        // Falha HTTP (401/500/504): mantém o prompt/estado atual e aplica
        // backoff de erro, sem interpretar o payload como "não aguardando".
        if (!r.ok) {
          failCount++;
          const backoff = failCount > 2 ? 10000 : 5000;
          if (!stopped) setTimeout(poll, backoff);
          return;
        }
        const data = await r.json() as TwoFAStatus;
        failCount = 0;
        if (data.waiting) {
          // Sessão mudou: zera o código digitado para não enviar o antigo.
          setTwoFA(p => {
            const sessionChanged = p.sessionId != null && p.sessionId !== data.sessionId;
            return { ...p, visible: true, sessionId: data.sessionId ?? p.sessionId, code: sessionChanged ? '' : p.code };
          });
          // Loga apenas na transição para waiting (ou troca de tentativa).
          if (lastPolledSessionId.current !== data.sessionId) {
            lastPolledSessionId.current = data.sessionId ?? null;
            addLog('warn', '🔐 Scraper aguarda código 2FA — use o campo amarelo abaixo!');
          }
        } else if (twoFA.visible) {
          // Scraper deixou de aguardar (consumido/aceito/timeout) — fecha o prompt.
          lastPolledSessionId.current = null;
          setTwoFA({ visible: false, submitting: false, code: '', sessionId: null });
        }
      } catch {
        failCount++;
      }
      const backoff = failCount > 2 ? 10000 : 5000;
      if (!stopped) setTimeout(poll, backoff);
    };
    poll();
    return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twoFA.visible]);

  const token = () => localStorage.getItem('reyb_token') ?? '';
  const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  // ── 2FA submit ──────────────────────────────────────────────────────────
  const submit2FA = async (codeArg?: string, sessionIdArg?: string) => {
    const code = (codeArg ?? twoFA.code).trim();
    if (!code) return;
    setTwoFA(p => ({ ...p, submitting: true }));
    try {
      const res = await fetch(`${API_URL}/api/admin/scraper-2fa`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, sessionId: sessionIdArg ?? twoFA.sessionId ?? null }),
      });
      const data = await res.json() as { message?: string; error?: string; state?: string };
      if (res.ok) {
        addLog('success', data.message ?? 'Código 2FA enviado. Scraper retomando...');
        setTwoFA({ visible: false, submitting: false, code: '', sessionId: null });
      } else {
        // 400/409: mantém o prompt aberto para correção, mostrando o motivo.
        addLog('error', `Falha ao enviar 2FA (${res.status}): ${data.error ?? data.message ?? 'erro desconhecido'}`);
        setTwoFA(p => ({ ...p, submitting: false, code: '' }));
      }
    } catch (err: any) {
      addLog('error', `Erro ao enviar 2FA: ${err.message}`);
      setTwoFA(p => ({ ...p, submitting: false }));
    }
  };

  // ── Polling genérico de job com exibição de logs incrementais ──────────
  const pollJob = async (jobId: string, startedAt: number) => {
    let lastLogCount = 0;
    const maxPolls = 150;
    let polls = 0;

    while (polls < maxPolls) {
      await new Promise(r => setTimeout(r, 4000));
      polls++;
      try {
        const r = await fetch(`${API_URL}/api/admin/sync-poll/${jobId}`, {
          headers: authHeaders(),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) { addLog('warn', 'Job não encontrado (scraper pode ter reiniciado).'); return; }

        const d = await r.json() as {
          status: string;
          logs?: string[];
          result?: { success: boolean; clients?: number; account?: string; clientName?: string; error?: string };
          dbStats?: { total?: number; active?: number };
        };

        if (d.logs && d.logs.length > lastLogCount) {
          const newLines = d.logs.slice(lastLogCount);
          lastLogCount = d.logs.length;
          for (const line of newLines) {
            const level = line.includes('✅') || line.includes('OK') ? 'success'
              : line.includes('❌') || line.includes('Erro') || line.includes('Falha') ? 'error'
              : line.includes('⚠️') || line.includes('Aguardando') ? 'warn'
              : 'info';
            addLog(level, line);
          }
        }

        if (d.status === 'done') {
          const elapsed = Math.round((Date.now() - startedAt) / 1000);
          addLog('system', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          if (d.result?.success) {
            if (d.result.clients != null) {
              addLog('success', `Concluído em ${elapsed}s — ${d.result.clients} clientes sincronizados.`);
            } else if (d.result.clientName) {
              addLog('success', `Concluído em ${elapsed}s — ${d.result.clientName} | conta: ${d.result.account ?? '?'}`);
            } else {
              addLog('success', `Concluído em ${elapsed}s.`);
            }
            if (d.dbStats) addLog('info', `Banco: ${d.dbStats.total} total | ${d.dbStats.active} ativos`);
          } else {
            addLog('error', `Falhou em ${elapsed}s — ${d.result?.error ?? 'erro desconhecido'}`);
          }
          return;
        }

        if (d.status === 'error') {
          const elapsed = Math.round((Date.now() - startedAt) / 1000);
          addLog('error', `Job falhou em ${elapsed}s — ${d.result?.error ?? 'erro desconhecido'}`);
          return;
        }

        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        if (elapsed > 60 && elapsed % 60 < 4) {
          addLog('warn', `⚠️ ${elapsed}s em execução — se pediu 2FA, use o campo abaixo!`);
          setTwoFA(p => ({ ...p, visible: true }));
        }
      } catch (err: any) {
        addLog('warn', `Timeout de rede (tentativa ${polls}): ${err.message}`);
      }
    }
    addLog('warn', '⏱️ Timeout de 10min. Verifique pelo Telegram ou use "job [id]".');
  };

  // ── Command executor ────────────────────────────────────────────────────
  const executeCommand = async (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    addLog('cmd', `> ${raw}`);
    setInput('');
    setRunning(true);

    try {
      // clear
      if (cmd === 'clear') {
        setLogs([]);
        setRunning(false);
        return;
      }

      // help
      if (cmd === 'help') {
        addLog('system', '━━━━━━━ Comandos disponíveis ━━━━━━━');
        COMMAND_HINTS.forEach(({ cmd: c, desc }) =>
          addLog('info', `  ${c.padEnd(22)} — ${desc}`)
        );
        setRunning(false);
        return;
      }

      // 2fa status
      if (cmd === '2fa status') {
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-2fa-status`, {
            headers: authHeaders(),
            signal: AbortSignal.timeout(6000),
          });
          if (!r.ok) {
            addLog('error', `Falha ao consultar status 2FA (${r.status}).`);
            setRunning(false);
            return;
          }
          const d = await r.json() as TwoFAStatus;
          if (d.waiting) {
            addLog('warn', '🔐 Scraper está aguardando código 2FA.');
            setTwoFA(p => ({ ...p, visible: true, sessionId: d.sessionId ?? p.sessionId }));
          } else {
            addLog('info', d.state && d.state !== 'none'
              ? `Scraper 2FA: ${d.state}.` : 'Scraper não está aguardando 2FA.');
          }
        } catch { addLog('error', 'Não foi possível contatar o scraper.'); }
        setRunning(false);
        return;
      }

      // 2fa [código]
      if (cmd.startsWith('2fa ')) {
        const code = raw.replace(/^2fa\s+/i, '').trim();
        // Garante que temos o sessionId da tentativa atual mesmo sem prompt aberto.
        let sessionId = twoFA.sessionId;
        if (!sessionId) {
          try {
            const sr = await fetch(`${API_URL}/api/admin/scraper-2fa-status`, {
              headers: authHeaders(), signal: AbortSignal.timeout(6000),
            });
            if (!sr.ok) {
              addLog('error', `Falha ao consultar status 2FA (${sr.status}).`);
              setRunning(false);
              return;
            }
            const sd = await sr.json() as TwoFAStatus;
            if (!sd.waiting) {
              addLog('warn', 'Scraper não está aguardando 2FA. Nada a enviar.');
              setRunning(false);
              return;
            }
            sessionId = sd.sessionId ?? null;
          } catch {
            addLog('error', 'Não foi possível contatar o scraper para enviar o 2FA.');
            setRunning(false);
            return;
          }
        }
        await submit2FA(code, sessionId ?? undefined);
        setRunning(false);
        return;
      }

      // ping
      if (cmd === 'ping') {
        addLog('info', 'Verificando serviços...');
        try {
          const t = Date.now();
          const r = await fetch(`${API_URL}/api/health`);
          const d = await r.json();
          addLog('success', `API Principal: ${d.message} [${Date.now() - t}ms]`);
        } catch { addLog('error', 'API Principal: inacessível'); }
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-health`, { headers: authHeaders() });
          const d = await r.json() as { online: boolean; sleeping?: boolean; latencyMs: number };
          addLog(d.online ? 'success' : d.sleeping ? 'warn' : 'error',
            d.online ? `Scraper (Render): Online [${d.latencyMs}ms]`
              : d.sleeping ? `Scraper (Render): Hibernando [${d.latencyMs}ms]`
              : 'Scraper (Render): Offline');
        } catch { addLog('warn', 'Scraper (Render): sem resposta'); }
        setRunning(false);
        return;
      }

      // wake
      if (cmd === 'wake') {
        addLog('info', 'Acordando servidor Render (pode demorar ~30s)...');
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-health`, {
            headers: authHeaders(),
            signal: AbortSignal.timeout(40000),
          });
          const d = await r.json() as { online: boolean; latencyMs: number };
          addLog(d.online ? 'success' : 'warn',
            d.online ? `Servidor acordou! [${d.latencyMs}ms]` : 'Servidor não respondeu em tempo hábil.');
        } catch { addLog('error', 'Timeout — servidor não respondeu em 40s.'); }
        setRunning(false);
        return;
      }

      // stats
      if (cmd === 'stats') {
        const r = await fetch(`${API_URL}/api/admin/system-stats`, { headers: authHeaders() });
        const d = await r.json();
        addLog('info', `Total: ${d.total} | Ativos: ${d.active} | Inativos: ${d.inactive}`);
        addLog('info', `Expirando (7d): ${d.expiringSoon} | Trial: ${d.trials} | Novos 24h: ${d.newLast24h}`);
        setRunning(false);
        return;
      }

      // jobs
      if (cmd === 'jobs') {
        addLog('info', 'Consultando jobs recentes...');
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-jobs`, {
            headers: authHeaders(),
            signal: AbortSignal.timeout(8000),
          });
          if (!r.ok) { addLog('error', `Scraper retornou ${r.status}`); setRunning(false); return; }
          const jobs = await r.json() as { jobId: string; status: string; startedAt: string; finishedAt?: string }[];
          if (!jobs.length) { addLog('info', 'Nenhum job encontrado.'); setRunning(false); return; }
          addLog('system', `━━━ ${jobs.length} jobs recentes ━━━`);
          jobs.slice(0, 10).forEach(j => {
            const started = new Date(j.startedAt).toLocaleString('pt-BR');
            const dur = j.finishedAt
              ? `${Math.round((new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()) / 1000)}s`
              : 'em andamento';
            const level = j.status === 'done' ? 'success' : j.status === 'error' ? 'error' : 'warn';
            addLog(level, `[${j.status.toUpperCase().padEnd(7)}] ${j.jobId} | ${started} | ${dur}`);
          });
        } catch (err: any) { addLog('error', `Erro ao listar jobs: ${err.message}`); }
        setRunning(false);
        return;
      }

      // job [id]
      if (cmd.startsWith('job ')) {
        const jobId = raw.replace(/^job\s+/i, '').trim();
        addLog('info', `Buscando job ${jobId}...`);
        try {
          const r = await fetch(`${API_URL}/api/admin/scraper-job/${jobId}`, {
            headers: authHeaders(),
            signal: AbortSignal.timeout(8000),
          });
          if (!r.ok) { addLog('error', `Job não encontrado (${r.status})`); setRunning(false); return; }
          const d = await r.json() as {
            jobId: string; status: string; startedAt: string; finishedAt?: string;
            logs?: string[]; result?: { success: boolean; clients?: number; error?: string };
          };
          addLog('system', `━━━ Job ${d.jobId} ━━━`);
          addLog('info', `Status: ${d.status} | Início: ${new Date(d.startedAt).toLocaleString('pt-BR')}`);
          if (d.finishedAt) addLog('info', `Fim: ${new Date(d.finishedAt).toLocaleString('pt-BR')}`);
          if (d.result) {
            const level = d.result.success ? 'success' : 'error';
            addLog(level, d.result.success
              ? `Resultado: OK${d.result.clients != null ? ` (${d.result.clients} clientes)` : ''}`
              : `Resultado: FALHA — ${d.result.error ?? 'desconhecido'}`);
          }
          if (d.logs && d.logs.length > 0) {
            addLog('info', `Últimas ${Math.min(8, d.logs.length)} linhas de log:`);
            d.logs.slice(-8).forEach(l => addLog('info', `  ${l}`));
          }
        } catch (err: any) { addLog('error', `Erro ao buscar job: ${err.message}`); }
        setRunning(false);
        return;
      }

      // sync
      if (cmd === 'sync') {
        addLog('system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        addLog('info',   'Iniciando sincronização completa com StarHome...');
        addLog('info',   'Este processo pode levar 3–10 minutos.');
        addLog('warn',   'Se pedido 2FA, use o campo amarelo abaixo.');
        addLog('system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const t0 = Date.now();

        const startRes = await fetch(`${API_URL}/api/admin/sync-starhome`, { method: 'POST', headers: authHeaders() });
        if (!startRes.ok) {
          addLog('error', `Falha ao iniciar: ${startRes.status} — ${(await startRes.text()).slice(0, 200)}`);
          setRunning(false); return;
        }
        const startData = await startRes.json() as { jobId?: string; mode?: string; success?: boolean; error?: string; clients?: number };

        if (startData.mode === 'sync') {
          addLog(startData.success ? 'success' : 'error',
            startData.success
              ? `Concluído! ${startData.clients ?? 0} clientes.`
              : `Falha: ${startData.error ?? 'erro desconhecido'}`);
          setRunning(false); return;
        }

        if (!startData.jobId) { addLog('error', 'jobId não retornado pelo servidor.'); setRunning(false); return; }
        addLog('info', `Job criado: ${startData.jobId}`);
        await pollJob(startData.jobId, t0);
        setRunning(false); return;
      }

      // renew [nome]
      if (cmd.startsWith('renew ')) {
        const clientName = raw.replace(/^renew\s+/i, '').trim();
        if (!clientName) { addLog('warn', 'Uso: renew [nome do cliente]'); setRunning(false); return; }
        addLog('info', `Iniciando renovação para "${clientName}"...`);
        const t0 = Date.now();

        const res = await fetch(`${API_URL}/api/admin/renew-client`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ clientName }),
        });
        const data = await res.json() as { jobId?: string; waking?: boolean; error?: string };

        if (data.waking) { addLog('warn', '⏳ Scraper hibernando. Tente "wake" primeiro.'); setRunning(false); return; }
        if (!res.ok || !data.jobId) { addLog('error', data.error ?? 'Erro ao iniciar renovação.'); setRunning(false); return; }

        addLog('info', `Job criado: ${data.jobId}`);
        await pollJob(data.jobId, t0);
        setRunning(false); return;
      }

      // search [query]
      if (cmd.startsWith('search ')) {
        const query = raw.replace(/^search\s+/i, '').trim();
        if (!query) { addLog('warn', 'Uso: search [nome ou conta]'); setRunning(false); return; }
        addLog('info', `Buscando "${query}" no StarHome...`);
        const t0 = Date.now();

        const res = await fetch(`${API_URL}/api/admin/search-client`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ query }),
        });

        if (res.status === 404) {
          // Fallback: busca no banco local
          addLog('warn', 'Endpoint de busca no scraper não disponível. Buscando no banco local...');
          const r2 = await fetch(`${API_URL}/api/admin/clients?search=${encodeURIComponent(query)}`, { headers: authHeaders() });
          const d2 = await r2.json();
          if (d2.clients?.length > 0) {
            const c = d2.clients[0];
            addLog('success', `${c.name} | ${c.whatsapp} | Status: ${c.status} | Dias: ${c.days_remaining} | StarHome: ${c.starhome_account ?? 'N/A'}`);
          } else {
            addLog('warn', `Nenhum cliente encontrado para "${query}"`);
          }
          setRunning(false); return;
        }

        if (!res.ok) { addLog('error', `Erro ${res.status} ao buscar.`); setRunning(false); return; }
        const data = await res.json() as { jobId?: string; error?: string };
        if (!data.jobId) { addLog('error', data.error ?? 'jobId não retornado.'); setRunning(false); return; }

        addLog('info', `Job criado: ${data.jobId}`);
        await pollJob(data.jobId, t0);
        setRunning(false); return;
      }

      addLog('warn', `Comando não reconhecido: "${raw}". Digite "help" para ver os disponíveis.`);
    } catch (err: any) {
      addLog('error', `Erro: ${err.message}`);
    }

    setRunning(false);
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black/70 backdrop-blur-xl" style={{ minHeight: 520, maxHeight: 700 }}>
      {/* Header */}
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

      {/* Log stream */}
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-5 space-y-0.5">
        {logs.map(log => (
          <div key={log.id} className="flex gap-2">
            <span className="text-slate-700 shrink-0 select-none tabular-nums">{log.timestamp}</span>
            <span className={`shrink-0 select-none tabular-nums ${LEVEL_STYLE[log.level]}`}>{LEVEL_PREFIX[log.level]}</span>
            <span className={`break-all ${LEVEL_STYLE[log.level]}`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 2FA alert */}
      {twoFA.visible && (
        <div className="shrink-0 border-t-2 border-yellow-500/60 bg-yellow-500/5 px-4 py-3 flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-yellow-400 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-yellow-400 mb-0.5">🔐 Código 2FA Necessário</p>
            <p className="text-xs text-yellow-300/70">Scraper detectou novo dispositivo. Digite o código SMS/e-mail:</p>
          </div>
          <input
            value={twoFA.code}
            onChange={e => setTwoFA(p => ({ ...p, code: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && submit2FA()}
            placeholder="123456"
            className="w-28 bg-black/60 border border-yellow-500/50 rounded-xl px-3 py-2 text-yellow-300 text-sm font-mono text-center focus:outline-none focus:border-yellow-400"
            autoFocus
            disabled={twoFA.submitting}
          />
          <button
            onClick={() => submit2FA()}
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

      {/* Hints dropdown */}
      {showHints && input.length === 0 && (
        <div className="shrink-0 border-t border-white/5 bg-black/50 px-4 py-2 grid grid-cols-2 gap-0.5 max-h-52 overflow-y-auto">
          {COMMAND_HINTS.map(({ cmd, desc }) => (
            <button
              key={cmd}
              className="text-left text-xs flex gap-2 hover:bg-white/5 px-2 py-1.5 rounded transition-colors"
              onMouseDown={e => { e.preventDefault(); setInput(cmd.replace(/\[.*?\]/g, '').trim()); setShowHints(false); inputRef.current?.focus(); }}
            >
              <span className="text-cyan-400 font-mono shrink-0">{cmd}</span>
              <span className="text-slate-500 truncate">{desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
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
          placeholder="Comando... (Tab = sugestões, Enter = executar)"
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
