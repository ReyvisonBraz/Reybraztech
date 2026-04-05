import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const app = express();
app.use(express.json());

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_KEY = process.env.API_KEY;

// ─── Telegram helper ──────────────────────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  if (!TOKEN || !CHAT_ID) return;
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID, text, parse_mode: 'HTML',
    });
  } catch { /* silent */ }
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // Modo de teste sem API_KEY configurada
  if (!API_KEY) { next(); return; }
  const provided = req.headers['x-api-key'] as string;
  if (!provided || provided !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }
  next();
}

// ─── Run full scraper ─────────────────────────────────────────────────────────
async function runScraper(): Promise<{ success: boolean; clients: number; stats?: any; error?: string }> {
  return new Promise(resolve => {
    const child = spawn('npx', ['ts-node', 'src/index.ts', '--sync'], {
      cwd: __dirname,
      env: { ...process.env },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d: Buffer) => { const t = d.toString(); stdout += t; process.stdout.write('[Scraper] ' + t); });
    child.stderr.on('data', (d: Buffer) => { const t = d.toString(); stderr += t; process.stderr.write('[Scraper Error] ' + t); });

    child.on('close', async (code: number) => {
      if (code !== 0) { resolve({ success: false, clients: 0, error: stderr.slice(-500) }); return; }
      try {
        const jsonPath = path.join(__dirname, 'output', 'clients.json');
        if (fs.existsSync(jsonPath)) {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const list = data.clients || [];
          resolve({
            success: true, clients: list.length,
            stats: {
              active:   list.filter((c: any) => c.in_use === 'Used').length,
              inactive: list.filter((c: any) => c.in_use === 'Unused').length,
              expiring: list.filter((c: any) => c.days_remaining <= 7 && c.days_remaining > 0).length,
              expired:  list.filter((c: any) => c.days_remaining <= 0 || c.expired === 'Expired').length,
            },
          });
        } else {
          resolve({ success: true, clients: 0 });
        }
      } catch (e: any) {
        resolve({ success: false, clients: 0, error: e.message });
      }
    });

    child.on('error', (e: Error) => resolve({ success: false, clients: 0, error: e.message }));
  });
}

// ─── Search single client ─────────────────────────────────────────────────────
async function runSearch(query: string, searchBy: string): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise(resolve => {
    const args = ['--search=' + query];
    if (searchBy !== 'account') args.push('--by=' + (searchBy === 'buyer_name' ? 'name' : searchBy));

    const child = spawn('npx', ['ts-node', 'src/index.ts', ...args], {
      cwd: __dirname, env: { ...process.env }, shell: true, stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stdout.on('data', (d: Buffer) => process.stdout.write('[Search] ' + d.toString()));
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code: number) => {
      if (code !== 0) { resolve({ success: false, error: stderr.slice(-500) }); return; }
      try {
        const jsonPath = path.join(__dirname, 'output', 'client_search.json');
        if (fs.existsSync(jsonPath)) {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          resolve(data?.length > 0 ? { success: true, data } : { success: false, error: 'Cliente não encontrado' });
        } else {
          resolve({ success: false, error: 'Arquivo não encontrado' });
        }
      } catch (e: any) { resolve({ success: false, error: e.message }); }
    });

    child.on('error', (e: Error) => resolve({ success: false, error: e.message }));
  });
}

// ─── Job system (async) ───────────────────────────────────────────────────────
interface Job {
  id: string;
  status: 'running' | 'done' | 'error';
  startedAt: string;
  finishedAt?: string;
  logs: string[];
  result?: { success: boolean; clients?: number; stats?: any; error?: string; data?: any };
}

const jobs = new Map<string, Job>();

function createJob(): Job {
  const id = Math.random().toString(36).slice(2, 10);
  const job: Job = { id, status: 'running', startedAt: new Date().toISOString(), logs: [] };
  jobs.set(id, job);
  if (jobs.size > 5) jobs.delete(Array.from(jobs.keys())[0]);
  return job;
}

// ─── POST /run — dispara em background e retorna imediatamente ────────────────
app.post('/run', authenticate, async (req, res) => {
  const { action, query, searchBy } = req.body;
  console.log(`📩 action=${action}`);

  if (action === 'sync') {
    const job = createJob();
    res.json({ jobId: job.id, message: 'Sincronização iniciada em background!' });

    ;(async () => {
      const log = (m: string) => { console.log(m); job.logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${m}`); };
      try {
        log('🔄 Iniciando scraper...');
        await sendTelegram('🔄 <b>Scraper iniciado!</b>\n\nExecutando sincronização completa...');
        const result = await runScraper();
        job.result = result;

        if (result.success && result.stats) {
          log(`✅ Concluído! ${result.clients} clientes | Ativos: ${result.stats.active} | Inativos: ${result.stats.inactive}`);
          await sendTelegram(
            `✅ <b>Sincronização Concluída!</b>\n\n` +
            `📊 Total: ${result.clients}\n✅ Ativos: ${result.stats.active}\n` +
            `❌ Inativos: ${result.stats.inactive}\n⚠️ Expirando: ${result.stats.expiring}\n🔴 Expirados: ${result.stats.expired}`
          );
          job.status = 'done';
        } else {
          log(`❌ Falha: ${result.error}`);
          await sendTelegram(`🚨 <b>Erro na Sincronização!</b>\n\n${result.error}`);
          job.status = 'error';
        }
      } catch (err: any) {
        log(`❌ Erro crítico: ${err.message}`);
        job.status = 'error';
        job.result = { success: false, error: err.message };
      }
      job.finishedAt = new Date().toISOString();
    })();
    return;
  }

  if (action === 'search') {
    const job = createJob();
    res.json({ jobId: job.id, message: 'Busca iniciada em background!' });

    ;(async () => {
      const log = (m: string) => { job.logs.push(m); };
      const by = searchBy || 'account';
      try {
        log(`🔍 Buscando "${query}"...`);
        const result = await runSearch(query, by);
        job.result = result;
        if (result.success && result.data) {
          const c = result.data[0];
          log(`✅ Encontrado: ${c.buyer_name} | ${c.account} | ${c.days_remaining}d`);
          await sendTelegram(`✅ <b>Cliente Encontrado</b>\n\nAccount: ${c.account}\nNome: ${c.buyer_name}\nDias: ${c.days_remaining}\nStatus: ${c.in_use}`);
          job.status = 'done';
        } else {
          log(`❌ Não encontrado: ${query}`);
          await sendTelegram(`❌ Não encontrado: "${query}"`);
          job.status = 'error';
        }
      } catch (err: any) {
        job.status = 'error';
        job.result = { success: false, error: err.message };
      }
      job.finishedAt = new Date().toISOString();
    })();
    return;
  }

  res.status(400).json({ error: 'Ação inválida. Use action: sync | search' });
});

// ─── GET /job/:id — polling do status ─────────────────────────────────────────
app.get('/job/:id', authenticate, (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) { res.status(404).json({ error: 'Job não encontrado' }); return; }
  res.json({
    jobId:      job.id,
    status:     job.status,
    startedAt:  job.startedAt,
    finishedAt: job.finishedAt,
    logs:       job.logs.slice(-30),
    result:     job.result,
  });
});

// ─── GET /jobs — listar todos os jobs recentes ────────────────────────────────
app.get('/jobs', authenticate, (_req, res) => {
  res.json(Array.from(jobs.values()).map(j => ({
    jobId: j.id, status: j.status, startedAt: j.startedAt, finishedAt: j.finishedAt,
  })));
});

// ─── 2FA via API ──────────────────────────────────────────────────────────────
let pending2FAResolve: ((code: string) => void) | null = null;

export function waitFor2FACode(timeoutMs = 300000): Promise<string | null> {
  return new Promise(resolve => {
    pending2FAResolve = resolve;
    setTimeout(() => {
      if (pending2FAResolve) { pending2FAResolve = null; resolve(null); }
    }, timeoutMs);
  });
}

app.post('/2fa', authenticate, (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: 'Código 2FA é obrigatório' }); return; }
  if (pending2FAResolve) {
    pending2FAResolve(code.trim());
    pending2FAResolve = null;
    res.json({ ok: true, message: 'Código 2FA recebido. Scraper retomando...' });
  } else {
    res.status(409).json({ error: 'Nenhuma sessão 2FA aguardando.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Scraper Server rodando na porta ${PORT}`));

export default app;