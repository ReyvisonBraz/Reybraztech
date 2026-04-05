import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger from '../utils/logger.js';
import sql from '../database.js';

const router = Router();
router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// POST /api/admin/sync-starhome — Async job + polling no Render
// A Vercel é serverless e NÃO pode spawnar processos.
// Solução: /run retorna imediatamente com jobId, fazemos polling em /job/:id
// ============================================================
router.post('/sync-starhome', async (req: AuthRequest, res: Response) => {
    const rawUrl     = process.env.SCRAPER_URL     || 'https://reybraztech-scraper.onrender.com';
    const apiKey     = process.env.SCRAPER_API_KEY || '';
    const scraperUrl = rawUrl.replace(/\/+$/, '');

    try {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        const write = (msg: string) => res.write(`message: ${msg}\n\n`);

        write('🔄 Iniciando sincronização com StarHome...');
        write(`📡 Servidor Render: ${scraperUrl}`);

        // 1 ── Health check / acorda o Render
        write('⏳ Verificando se o Render está ativo (até 35s)...');
        try {
            await fetch(`${scraperUrl}/health`, { signal: AbortSignal.timeout(35000) });
            write('✅ Servidor Render está ativo!');
        } catch (err: any) {
            write(`🚨 Render não respondeu: ${err.message}`);
            res.end(); return;
        }

        // 2 ── Dispara o job em background (responde imediatamente com jobId)
        write('🤖 Enviando comando de sincronização...');
        let jobId: string | null = null;
        try {
            const startRes = await fetch(`${scraperUrl}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                body: JSON.stringify({ action: 'sync' }),
                signal: AbortSignal.timeout(90000), // 90s: suporta código novo (~1s) e antigo (sync)
            });
            const startData = await startRes.json() as { jobId?: string; success?: boolean; clients?: number; stats?: any; error?: string };

            if (!startRes.ok) {
                write(`🚨 Falha ao iniciar: ${startData.error || startRes.status}`);
                res.end(); return;
            }
            // Novo código async: retornou jobId
            if (startData.jobId) {
                jobId = startData.jobId;
                write(`🆔 Job iniciado: ${jobId}. Fazendo polling de status...`);
            }
            // Código antigo sync: retornou resultado direto
            else if (typeof startData.success === 'boolean') {
                if (startData.success) {
                    write(`✅ Concluído! ${startData.clients ?? 0} clientes.`);
                    if (startData.stats) write(`📊 Ativos: ${startData.stats.active} | Inativos: ${startData.stats.inactive}`);
                } else {
                    write(`🚨 Erro: ${startData.error || 'Erro desconhecido'}`);
                }
                res.end(); return;
            } else {
                write('⚠️  Resposta inesperada. Verifique os logs do Render.');
                res.end(); return;
            }
        } catch (err: any) {
            write(`🚨 Timeout/Erro ao chamar scraper: ${err.message}`);
            write('💡 O Render pode estar processando — aguarde e verifique https://dashboard.render.com');
            res.end(); return;
        }

        // 3 ── Polling a cada 8s por até 15 minutos
        const maxWait = 15 * 60 * 1000;
        const startTime = Date.now();
        let lastLogCount = 0;

        while (Date.now() - startTime < maxWait) {
            await new Promise(r => setTimeout(r, 8000));
            try {
                const pollRes = await fetch(`${scraperUrl}/job/${jobId}`, {
                    headers: { 'x-api-key': apiKey },
                    signal: AbortSignal.timeout(10000),
                });
                const job = await pollRes.json() as {
                    status: string;
                    logs?: string[];
                    result?: { success: boolean; clients?: number; stats?: any; error?: string };
                };

                // Novos logs do scraper
                if (job.logs && job.logs.length > lastLogCount) {
                    job.logs.slice(lastLogCount).forEach(l => write(`📋 ${l}`));
                    lastLogCount = job.logs.length;
                }

                if (job.status === 'done') {
                    const r = job.result;
                    write(`✅ Concluído! ${r?.clients ?? 0} clientes processados.`);
                    if (r?.stats) write(`📊 Ativos: ${r.stats.active} | Inativos: ${r.stats.inactive} | Expirando: ${r.stats.expiring}`);
                    // Totais do banco
                    try {
                        const [tot] = await sql`SELECT COUNT(*)::int as c FROM clients`;
                        const [act] = await sql`SELECT COUNT(*)::int as c FROM clients WHERE status = 'Ativo'`;
                        write(`🗄️  Banco: ${act?.c ?? '?'} ativos / ${tot?.c ?? '?'} total`);
                    } catch { /* silent */ }
                    write('🎉 Finalizado!');
                    res.end(); return;
                }

                if (job.status === 'error') {
                    write(`🚨 Erro: ${job.result?.error || 'Erro desconhecido'}`);
                    res.end(); return;
                }

                const elapsed = Math.round((Date.now() - startTime) / 1000);
                write(`⏳ Rodando... ${elapsed}s`);
            } catch (err: any) {
                write(`⚠️ Erro ao consultar status: ${err.message}`);
            }
        }
        write('⏰ Timeout de 15 min. Scraper pode ainda estar rodando no Render.');
        res.end();

    } catch (error: any) {
        logger.error('Erro crítico ao sincronizar:', error);
        try { res.write(`message: 🚨 Erro: ${error.message}\n\n`); res.end(); } catch { /* ignore */ }
    }
});

// ============================================================
// GET /api/admin/sync-status — Status geral do banco
// ============================================================
router.get('/sync-status', async (_req: AuthRequest, res: Response) => {
    try {
        const [result]  = await sql`SELECT MAX(created_at) as last_sync, COUNT(*)::int as total_clients FROM clients`;
        const [ativos]  = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Ativo'`;
        const [inativos]= await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Inativo'`;
        res.json({
            last_sync:        result?.last_sync,
            total_clients:    result?.total_clients ?? 0,
            clients_ativos:   ativos?.count ?? 0,
            clients_inativos: inativos?.count ?? 0,
        });
    } catch (error) {
        logger.error('Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
});

// ============================================================
// GET /api/admin/scraper-health — Proxy health check (evita CORS)
// ============================================================
router.get('/scraper-health', async (_req: AuthRequest, res: Response) => {
    const rawUrl     = process.env.SCRAPER_URL || 'https://reybraztech-scraper.onrender.com';
    const scraperUrl = rawUrl.replace(/\/+$/, '');
    const start = Date.now();
    try {
        const response = await fetch(`${scraperUrl}/health`, { signal: AbortSignal.timeout(10000) });
        const latency  = Date.now() - start;
        const data     = await response.json() as { status?: string };
        res.json({ online: response.ok, latencyMs: latency, status: data?.status || 'ok' });
    } catch (err: any) {
        const latency  = Date.now() - start;
        res.json({ online: false, sleeping: latency > 5000, latencyMs: latency, error: err.message });
    }
});

export default router;
