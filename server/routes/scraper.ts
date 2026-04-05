import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger, { sendTelegramNotification } from '../utils/logger.js';
import sql from '../database.js';

const router = Router();

router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// POST /api/admin/sync-starhome — Disparar sincronização via Render
// A Vercel é serverless e NÃO pode spawnar processos.
// A chamada é feita via HTTP para o servidor do Render (reybraztech-scraper).
// ============================================================
router.post('/sync-starhome', async (req: AuthRequest, res: Response) => {
    const rawUrl   = process.env.SCRAPER_URL     || 'https://reybraztech-scraper.onrender.com';
    const apiKey   = process.env.SCRAPER_API_KEY || '';
    const scraperUrl = rawUrl.replace(/\/+$/, '');

    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        const write = (msg: string) => res.write(`message: ${msg}\n\n`);

        write('🔄 Iniciando sincronização com StarHome...');
        write(`📡 Chamando servidor Render: ${scraperUrl}`);

        await sendTelegramNotification('🔄 *Sincronização Starhome iniciada!*').catch(() => {});

        // 1 ── Acorda o servidor se estiver hibernando
        write('⏳ Verificando se o Render está ativo (pode demorar ~30s)...');
        try {
            const health = await fetch(`${scraperUrl}/health`, { signal: AbortSignal.timeout(35000) });
            if (!health.ok) {
                write('⚠️  Render respondeu com status inesperado. Tentando continuar...');
            } else {
                write('✅ Servidor Render está ativo!');
            }
        } catch (err: any) {
            write(`🚨 Servidor Render não respondeu ao health check: ${err.message}`);
            write('Abortando sincronização — verifique os logs do Render.');
            res.end();
            return;
        }

        // 2 ── Dispara a sincronização no Render
        write('🤖 Disparando extração no StarHome (aguarde — pode levar vários minutos)...');

        let syncResult: { success: boolean; clients?: number; stats?: any; error?: string };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 600000); // 10 minutos

            const runRes = await fetch(`${scraperUrl}/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({ action: 'sync' }),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!runRes.ok) {
                const errText = await runRes.text();
                write(`🚨 Render retornou erro ${runRes.status}: ${errText.slice(0, 200)}`);
                res.end();
                return;
            }

            syncResult = await runRes.json() as typeof syncResult;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                write('⏰ Timeout de 10 minutos atingido. A sincronização ainda pode estar rodando no Render.');
            } else {
                write(`🚨 Falha ao chamar o Render: ${err.message}`);
            }
            res.end();
            return;
        }

        if (!syncResult.success) {
            write(`🚨 Scraper retornou erro: ${syncResult.error || 'Erro desconhecido'}`);
            await sendTelegramNotification(`🚨 *Erro na sincronização!*\n\n${syncResult.error}`).catch(() => {});
            res.end();
            return;
        }

        write(`✅ Extração concluída! ${syncResult.clients ?? 0} registros coletados.`);

        // 3 ── (Opcional) Sincroniza com o banco local se o Render retornou stats apenas
        //     O script do Render já faz UPDATE no banco via DATABASE_URL, então só precisamos confirmar.
        if (syncResult.stats) {
            const { active, inactive, expiring, expired } = syncResult.stats;
            write(`📊 Ativos: ${active} | Inativos: ${inactive} | Expirando: ${expiring} | Expirados: ${expired}`);
        }

        // 4 ── Conta totais atualizados no banco
        try {
            const [totRow] = await sql`SELECT COUNT(*)::int as count FROM clients`;
            const [actRow] = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Ativo'`;
            write(`🗄️  Banco atualizado: ${actRow?.count ?? '?'} ativos de ${totRow?.count ?? '?'} no total.`);
        } catch { /* ignora */ }

        write('🎉 Sincronização finalizada com sucesso!');

        await sendTelegramNotification(
            `✅ *Sincronização concluída!*\n\n📊 ${syncResult.clients ?? 0} clientes processados`
        ).catch(() => {});

        res.end();

    } catch (error: any) {
        logger.error('Erro crítico ao sincronizar Starhome:', error);
        try { res.write(`message: 🚨 Erro interno: ${error.message}\n\n`); res.end(); } catch { /* ignorar */ }
    }
});

// ============================================================
// GET /api/admin/sync-status — Status geral do banco
// ============================================================
router.get('/sync-status', async (_req: AuthRequest, res: Response) => {
    try {
        const [result] = await sql`
            SELECT MAX(created_at) as last_sync, COUNT(*)::int as total_clients FROM clients
        `;
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
// GET /api/admin/scraper-health — Proxy para verificar saúde do Extrator (evita CORS)
// ============================================================
router.get('/scraper-health', async (_req: AuthRequest, res: Response) => {
    const rawUrl = process.env.SCRAPER_URL || 'https://reybraztech-scraper.onrender.com';
    const scraperUrl = rawUrl.replace(/\/+$/, '');
    const start = Date.now();
    try {
        const response = await fetch(`${scraperUrl}/health`, {
            signal: AbortSignal.timeout(10000),
        });
        const latency = Date.now() - start;
        const data = await response.json() as { status?: string };
        res.json({ online: response.ok, latencyMs: latency, status: data?.status || 'ok' });
    } catch (err: any) {
        const latency = Date.now() - start;
        const isSleep = latency > 5000;
        res.json({ online: false, sleeping: isSleep, latencyMs: latency, error: err.message });
    }
});

export default router;
