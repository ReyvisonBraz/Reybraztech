import { Router, Response } from 'express';
import sql from '../database.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger from '../utils/logger.js';

const router = Router();

// Aplica as DUAS camadas de proteção em todas as rotas de /api/admin
router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// POST /api/admin/verify-starhome — Verificar senha do Starhome
// ============================================================
router.post('/verify-starhome', async (req: AuthRequest, res: Response) => {
    try {
        const { starhome_password } = req.body;
        if (!starhome_password) { res.status(400).json({ error: 'Senha do Starhome é obrigatória.' }); return; }
        const envPassword = process.env.PANEL_PASSWORD;
        if (starhome_password !== envPassword) { res.status(401).json({ error: 'Senha do Starhome incorreta.' }); return; }
        res.json({ verified: true });
    } catch (error) {
        logger.error('Erro ao verificar senha Starhome:', error);
        res.status(500).json({ error: 'Erro ao verificar senha.' });
    }
});

// ============================================================
// GET /api/admin/system-stats — Métricas agregadas do sistema
// ============================================================
router.get('/system-stats', async (_req: AuthRequest, res: Response) => {
    try {
        const [totalRow]    = await sql`SELECT COUNT(*)::int as count FROM clients`;
        const [activeRow]   = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status = 'Ativo'`;
        const [inactiveRow] = await sql`SELECT COUNT(*)::int as count FROM clients WHERE status != 'Ativo'`;
        const [expiringRow] = await sql`SELECT COUNT(*)::int as count FROM clients WHERE days_remaining <= 7 AND days_remaining > 0 AND status = 'Ativo'`;
        const [trialsRow]   = await sql`SELECT COUNT(*)::int as count FROM clients WHERE plan = 'trial'`;
        const [newRow]      = await sql`SELECT COUNT(*)::int as count FROM clients WHERE created_at >= NOW() - INTERVAL '24 hours'`;

        res.json({
            total:        totalRow?.count ?? 0,
            active:       activeRow?.count ?? 0,
            inactive:     inactiveRow?.count ?? 0,
            expiringSoon: expiringRow?.count ?? 0,
            trials:       trialsRow?.count ?? 0,
            newLast24h:   newRow?.count ?? 0,
        });
    } catch (error) {
        logger.error('Erro ao buscar system-stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
});

// ============================================================
// GET /api/admin/activity-log — Atividade recente do sistema
// ============================================================
router.get('/activity-log', async (req: AuthRequest, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 15, 50);
    try {
        const rows = await sql`
            SELECT id, action, whatsapp, details, created_at
            FROM login_logs
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;
        res.json(rows);
    } catch (err: any) {
        if (err.message?.includes('does not exist')) {
            res.json([]);
        } else {
            logger.error('Erro ao buscar activity-log:', err);
            res.status(500).json({ error: 'Erro ao buscar logs.' });
        }
    }
});

// ============================================================
// GET /api/admin/clients — Listar clientes com paginação + busca
// ============================================================
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        const page   = parseInt(req.query.page as string) || 1;
        const limit  = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string)?.trim() ?? '';

        const clients = search
            ? await sql`
                SELECT id, name, whatsapp, email, plan, status, is_admin, device, created_at, days_remaining, starhome_account
                FROM clients
                WHERE name ILIKE ${'%' + search + '%'}
                   OR whatsapp ILIKE ${'%' + search + '%'}
                   OR starhome_account ILIKE ${'%' + search + '%'}
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `
            : await sql`
                SELECT id, name, whatsapp, email, plan, status, is_admin, device, created_at, days_remaining, starhome_account
                FROM clients
                ORDER BY created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;

        const countResult = search
            ? await sql`SELECT COUNT(*)::int as total FROM clients WHERE name ILIKE ${'%' + search + '%'} OR whatsapp ILIKE ${'%' + search + '%'} OR starhome_account ILIKE ${'%' + search + '%'}`
            : await sql`SELECT COUNT(*)::int as total FROM clients`;

        const total = countResult[0]?.total ?? 0;
        res.json({ clients, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        logger.error('Erro ao buscar clientes no admin:', error);
        res.status(500).json({ error: 'Erro ao buscar a lista de clientes.' });
    }
});

// ============================================================
// PATCH /api/admin/clients/:id/status — Ativar/Desativar cliente
// ============================================================
router.patch('/clients/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, days_remaining, starhome_account } = req.body;

        if (status && !['Ativo', 'Inativo'].includes(status)) {
            res.status(400).json({ error: 'Status deve ser "Ativo" ou "Inativo".' }); return;
        }
        if (status === 'Ativo' && (!days_remaining || typeof days_remaining !== 'number')) {
            res.status(400).json({ error: 'Informe os dias restantes ao ativar um cliente.' }); return;
        }

        await sql`
            UPDATE clients 
            SET status = ${status || sql`status`}, 
                days_remaining = ${status === 'Ativo' ? days_remaining : 0},
                starhome_account = ${starhome_account ?? sql`starhome_account`}
            WHERE id = ${id}
        `;
        res.json({ message: `Cliente ${status === 'Ativo' ? 'ativado' : 'desativado'} com sucesso.` });
    } catch (error) {
        logger.error('Erro ao atualizar status do cliente:', error);
        res.status(500).json({ error: 'Erro ao atualizar status do cliente.' });
    }
});

// ============================================================
// PATCH /api/admin/clients/:id/starhome — Definir código StarHome
// ============================================================
router.patch('/clients/:id/starhome', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { starhome_account } = req.body;
        if (!starhome_account || typeof starhome_account !== 'string') {
            res.status(400).json({ error: 'Código StarHome é obrigatório.' }); return;
        }
        await sql`UPDATE clients SET starhome_account = ${starhome_account} WHERE id = ${id}`;
        res.json({ message: 'Código StarHome atualizado com sucesso.' });
    } catch (error) {
        logger.error('Erro ao atualizar starhome_account:', error);
        res.status(500).json({ error: 'Erro ao atualizar código StarHome.' });
    }
});

// ============================================================
// GET /api/admin/login-pool — Listar todos os logins do pool
// ============================================================
router.get('/login-pool', async (_req: AuthRequest, res: Response) => {
    try {
        const entries = await sql`
            SELECT lp.id, lp.app_account, lp.app_password, lp.status,
                   lp.client_id, lp.assigned_at, lp.created_at,
                   c.name as client_name
            FROM login_pool lp
            LEFT JOIN clients c ON c.id = lp.client_id
            ORDER BY lp.status ASC, lp.created_at DESC
        `;
        res.json({ entries });
    } catch (error) {
        logger.error('Erro ao buscar login pool:', error);
        res.status(500).json({ error: 'Erro ao buscar pool de logins.' });
    }
});

// ============================================================
// GET /api/admin/login-pool/stats — Estatísticas do pool
// ============================================================
router.get('/login-pool/stats', async (_req: AuthRequest, res: Response) => {
    try {
        const [row] = await sql`
            SELECT
                COUNT(*) FILTER (WHERE status = 'disponivel')::int as disponivel,
                COUNT(*) FILTER (WHERE status = 'em_uso')::int as em_uso,
                COUNT(*)::int as total
            FROM login_pool
        `;
        res.json(row ?? { disponivel: 0, em_uso: 0, total: 0 });
    } catch (error) {
        logger.error('Erro ao buscar stats do pool:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas do pool.' });
    }
});

// ============================================================
// POST /api/admin/login-pool — Adicionar logins em bulk
// ============================================================
router.post('/login-pool', async (req: AuthRequest, res: Response) => {
    try {
        const { logins } = req.body as { logins: { app_account: string; app_password: string }[] };

        if (!Array.isArray(logins) || logins.length === 0) {
            res.status(400).json({ error: 'Envie um array de logins.' });
            return;
        }

        let added = 0;
        const errors: string[] = [];

        for (const login of logins) {
            if (!login.app_account?.trim() || !login.app_password?.trim()) {
                errors.push(`Login inválido: ${JSON.stringify(login)}`);
                continue;
            }
            try {
                await sql`
                    INSERT INTO login_pool (app_account, app_password, status)
                    VALUES (${login.app_account.trim()}, ${login.app_password.trim()}, 'disponivel')
                    ON CONFLICT (app_account) DO NOTHING
                `;
                added++;
            } catch (err: any) {
                errors.push(`Erro ao inserir ${login.app_account}: ${err.message}`);
            }
        }

        logger.info(`🔑 Pool: ${added} login(s) adicionado(s) pelo admin`);
        res.status(201).json({ added, errors });
    } catch (error) {
        logger.error('Erro ao adicionar logins ao pool:', error);
        res.status(500).json({ error: 'Erro ao adicionar logins.' });
    }
});

// ============================================================
// DELETE /api/admin/login-pool/:id — Remover login disponível
// ============================================================
router.delete('/login-pool/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const [entry] = await sql`SELECT status FROM login_pool WHERE id = ${id}`;
        if (!entry) {
            res.status(404).json({ error: 'Login não encontrado.' });
            return;
        }
        if (entry.status === 'em_uso') {
            res.status(400).json({ error: 'Não é possível remover um login em uso por um cliente.' });
            return;
        }

        await sql`DELETE FROM login_pool WHERE id = ${id}`;
        logger.info(`🗑️ Login pool ID ${id} removido pelo admin`);
        res.json({ message: 'Login removido com sucesso.' });
    } catch (error) {
        logger.error('Erro ao remover login do pool:', error);
        res.status(500).json({ error: 'Erro ao remover login.' });
    }
});

export default router;
