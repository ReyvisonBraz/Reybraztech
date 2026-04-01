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
// Usa credenciais do .env para validar
// ============================================================
router.post('/verify-starhome', async (req: AuthRequest, res: Response) => {
    try {
        const { starhome_password } = req.body;

        if (!starhome_password) {
            res.status(400).json({ error: 'Senha do Starhome é obrigatória.' });
            return;
        }

        const envPassword = process.env.PANEL_PASSWORD;

        if (starhome_password !== envPassword) {
            res.status(401).json({ error: 'Senha do Starhome incorreta.' });
            return;
        }

        res.json({ verified: true });
    } catch (error) {
        logger.error('Erro ao verificar senha Starhome:', error);
        res.status(500).json({ error: 'Erro ao verificar senha.' });
    }
});

// ============================================================
// GET /api/admin/clients — Listar clientes com paginação
// ============================================================
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const clients = await sql`
            SELECT id, name, whatsapp, email, plan, status, is_admin, device, created_at, days_remaining
            FROM clients
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countResult = await sql`SELECT COUNT(*) as total FROM clients`;
        const total = parseInt(countResult[0]?.total || 0);

        res.json({ 
            clients, 
            total, 
            page, 
            limit,
            totalPages: Math.ceil(total / limit)
        });
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
        const { status, days_remaining } = req.body;

        if (!status || !['Ativo', 'Inativo'].includes(status)) {
            res.status(400).json({ error: 'Status deve ser "Ativo" ou "Inativo".' });
            return;
        }

        if (status === 'Ativo' && (!days_remaining || typeof days_remaining !== 'number')) {
            res.status(400).json({ error: 'Informe os dias restantes ao ativar um cliente.' });
            return;
        }

        await sql`
            UPDATE clients 
            SET status = ${status}, days_remaining = ${status === 'Ativo' ? days_remaining : 0}
            WHERE id = ${id}
        `;

        res.json({ message: `Cliente ${status === 'Ativo' ? 'ativado' : 'desativado'} com sucesso.` });
    } catch (error) {
        logger.error('Erro ao atualizar status do cliente:', error);
        res.status(500).json({ error: 'Erro ao atualizar status do cliente.' });
    }
});

export default router;
