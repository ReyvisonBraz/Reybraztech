import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger from '../utils/logger.js';
import sql from '../database.js';

const router = Router();
router.use(verifyToken);
router.use(verifyAdmin);

function scraperUrl() {
    const raw = process.env.SCRAPER_URL || 'https://reybraztech-scraper.onrender.com';
    return raw.replace(/\/+$/, '');
}
function scraperKey() {
    return process.env.SCRAPER_API_KEY || '';
}

// ============================================================
// POST /api/admin/sync-start — Dispara sync no Render
// NÃO faz health check — isso causava timeout na Vercel
// O scraper acorda sozinho quando /run é chamado
// ============================================================
async function handleSyncStart(_req: AuthRequest, res: Response) {
    const url = scraperUrl();
    const key = scraperKey();

    try {
        // Timeout curto (8s) — se o scraper estiver acordado, responde rápido
        // Se estiver dormindo, o /run vai acordá-lo mas pode timeout aqui
        const r = await fetch(`${url}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ action: 'sync' }),
            signal: AbortSignal.timeout(8000),
        });
        const data = await r.json() as { jobId?: string; success?: boolean; clients?: number; stats?: any; error?: string };

        if (!r.ok) { res.status(r.status).json({ error: data.error || 'Falha no Render' }); return; }

        if (data.jobId) {
            res.json({ jobId: data.jobId, mode: 'async' });
            return;
        }
        if (typeof data.success === 'boolean') {
            res.json({ mode: 'sync', done: true, success: data.success, clients: data.clients, stats: data.stats, error: data.error });
            return;
        }
        res.status(502).json({ error: 'Resposta inesperada do Render' });
    } catch (err: any) {
        // Timeout significa que o scraper estava dormindo — está acordando agora
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
            res.status(202).json({
                mode: 'async',
                waking: true,
                message: 'Scraper está acordando. Aguarde ~30s e tente novamente para ver o jobId.'
            });
        } else {
            res.status(504).json({ error: `Erro ao chamar scraper: ${err.message}` });
        }
    }
}

router.post('/sync-start', handleSyncStart);

// ============================================================
// POST /api/admin/sync-starhome — Alias for /sync-start (used by frontend)
// ============================================================
router.post('/sync-starhome', handleSyncStart);

// ============================================================
// GET /api/admin/sync-poll/:jobId — Polling de status (chamada rápida, <2s cada)
// ============================================================
router.get('/sync-poll/:jobId', async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const url = scraperUrl();
    const key = scraperKey();

    try {
        const r = await fetch(`${url}/job/${jobId}`, {
            headers: { 'x-api-key': key },
            signal: AbortSignal.timeout(8000),
        });

        if (!r.ok) {
            res.status(r.status).json({ error: `Job não encontrado: ${r.status}` });
            return;
        }

        const data = await r.json() as {
            jobId: string; status: string; logs?: string[];
            result?: { success: boolean; clients?: number; stats?: any; error?: string };
        };

        // Se concluído, busca totais do banco
        let dbStats: { total?: number; active?: number } = {};
        if (data.status === 'done') {
            try {
                const [tot] = await sql`SELECT COUNT(*)::int as c FROM clients`;
                const [act] = await sql`SELECT COUNT(*)::int as c FROM clients WHERE status = 'Ativo'`;
                dbStats = { total: tot?.c, active: act?.c };
            } catch { /* silent */ }
        }

        res.json({ ...data, dbStats });
    } catch (err: any) {
        res.status(504).json({ error: `Timeout ao consultar job: ${err.message}` });
    }
});

// ============================================================
// GET /api/admin/sync-status — Status geral do banco
// ============================================================
router.get('/sync-status', async (_req: AuthRequest, res: Response) => {
    try {
        const [r]  = await sql`SELECT MAX(created_at) as last_sync, COUNT(*)::int as total_clients FROM clients`;
        const [a]  = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Ativo'`;
        const [in_] = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Inativo'`;
        res.json({ last_sync: r?.last_sync, total_clients: r?.total_clients ?? 0, clients_ativos: a?.count ?? 0, clients_inativos: in_?.count ?? 0 });
    } catch (err) {
        logger.error('Erro ao buscar status:', err);
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
});

// ============================================================
// POST /api/admin/renew-client — Renova cliente via scraper
// Body: { clientName: string }
// ============================================================
router.post('/renew-client', async (req: AuthRequest, res: Response) => {
    const { clientName } = req.body;
    if (!clientName) {
        res.status(400).json({ error: 'clientName é obrigatório.' });
        return;
    }

    const url = scraperUrl();
    const key = scraperKey();

    try {
        const r = await fetch(`${url}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ action: 'renew', query: clientName, searchBy: 'buyer_name' }),
            signal: AbortSignal.timeout(10000),
        });

        const data = await r.json() as { jobId?: string; message?: string; error?: string };

        if (!r.ok) {
            res.status(r.status).json({ error: data.error || 'Falha ao iniciar renovação.' });
            return;
        }

        res.json({ jobId: data.jobId, message: data.message });
    } catch (err: any) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
            res.status(202).json({ waking: true, message: 'Scraper acordando, tente novamente em 30s.' });
        } else {
            res.status(504).json({ error: `Erro ao chamar scraper: ${err.message}` });
        }
    }
});

// ============================================================
// GET /api/admin/scraper-health — Proxy health check (evita CORS)
// ============================================================
router.get('/scraper-health', async (_req: AuthRequest, res: Response) => {
    const url = scraperUrl();
    const start = Date.now();
    try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(10000) });
        const latency = Date.now() - start;
        const data = await r.json() as { status?: string };
        res.json({ online: r.ok, latencyMs: latency, status: data?.status || 'ok' });
    } catch (err: any) {
        const latency = Date.now() - start;
        res.json({ online: false, sleeping: latency > 5000, latencyMs: latency, error: err.message });
    }
});

export default router;
