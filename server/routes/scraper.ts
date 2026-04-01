import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger, { sendTelegramNotification } from '../utils/logger.js';
import sql from '../database.js';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// POST /api/admin/sync-starhome — Iniciar sincronização
// ============================================================
router.post('/sync-starhome', async (req: AuthRequest, res: Response) => {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write('message: ⚠️ O scraper precisa ser executado manualmente.\n\n');
        res.write('message: No seu terminal, execute:\n\n');
        res.write('message: npm run scraper\n\n');
        res.write('message: Os dados serão salvos no banco automaticamente.\n\n');
        
        await sendTelegramNotification(
            '📋 *Sincronização Starhome*\n\n' +
            'Execute o scraper manualmente no terminal:\n' +
            '```\nnpm run scraper\n```\n\n' +
            'Os dados serão salvos no banco automaticamente.',
            'info'
        );

        res.end();
    } catch (error) {
        logger.error('Erro ao iniciar sincronização:', error);
        res.write(`message: Erro interno: ${error}\n\n`);
        res.end();
    }
});

// ============================================================
// GET /api/admin/sync-status — Verificar status da última sincronização
// ============================================================
router.get('/sync-status', async (req: AuthRequest, res: Response) => {
    try {
        const [result] = await sql`
            SELECT MAX(created_at) as last_sync, COUNT(*) as total_clients
            FROM clients
        `;

        const clientsAtivos = await sql`
            SELECT COUNT(*) as count FROM clients WHERE status = 'Ativo'
        `;

        const clientsInativos = await sql`
            SELECT COUNT(*) as count FROM clients WHERE status = 'Inativo'
        `;

        res.json({
            last_sync: result.last_sync,
            total_clients: parseInt(result.total_clients || 0),
            clients_ativos: parseInt(clientsAtivos[0]?.count || 0),
            clients_inativos: parseInt(clientsInativos[0]?.count || 0),
        });
    } catch (error) {
        logger.error('Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
});

export default router;
