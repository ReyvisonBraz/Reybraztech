import { Router, Response } from 'express';
import sql from '../database.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ============================================================
// GET /api/dashboard — Dados do cliente logado (rota protegida)
// ============================================================
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const [client] = await sql`
          SELECT id, name, whatsapp, device, email, plan, status, days_remaining, app_account, app_password, created_at
          FROM clients
          WHERE id = ${req.clientId!}
        `;

        if (!client) {
            res.status(404).json({ error: 'Cliente não encontrado.' });
            return;
        }

        // Buscar histórico de pagamentos
        const payments = await sql`
          SELECT plan, value, status, paid_at as date
          FROM payments
          WHERE client_id = ${req.clientId!}
          ORDER BY paid_at DESC
          LIMIT 10
        `;

        res.json({
            name: client.name,
            email: client.email,
            whatsapp: client.whatsapp,
            device: client.device,
            plan: client.plan,
            status: client.status,
            createdAt: client.created_at,
            paymentHistory: payments,
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro ao carregar dados.' });
    }
});

export default router;
