import { Router, Response } from 'express';
import sql from '../database.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';

const router = Router();

// Aplica as DUAS camadas de proteção em todas as rotas de /api/admin
router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// GET /api/admin/clients — Listar todos os clientes
// ============================================================
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        // Busca todos os clientes exceto os dados muito sensíveis (como hash da senha)
        // Ordena pelos mais recentes primeiro
        const clients = await sql`
            SELECT id, name, whatsapp, email, plan, status, is_admin, device, created_at
            FROM clients
            ORDER BY created_at DESC
        `;

        res.json({ clients });
    } catch (error) {
        console.error('Erro ao buscar clientes no admin:', error);
        res.status(500).json({ error: 'Erro ao buscar a lista de clientes.' });
    }
});

export default router;
