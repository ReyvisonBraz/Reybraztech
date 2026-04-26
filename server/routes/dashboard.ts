import { Router, Response } from 'express';
import sql from '../database.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================
// GET /api/dashboard — Dados do cliente logado (rota protegida)
// ============================================================
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const [client] = await sql`
          SELECT id, name, whatsapp, device, email, plan, status, app_account, app_password, created_at,
                 CASE
                   WHEN starhome_expiration_date IS NOT NULL
                   THEN GREATEST(0, (starhome_expiration_date::date - CURRENT_DATE)::int)
                   ELSE days_remaining
                 END AS days_remaining
          FROM clients
          WHERE id = ${req.clientId!}
        `;

        if (!client) {
            res.status(404).json({ error: 'Cliente não encontrado.' });
            return;
        }

        // Buscar histórico de pagamentos via pending_orders
        const payments = await sql`
          SELECT plan, amount, status, paid_at, created_at
          FROM pending_orders
          WHERE whatsapp = ${client.whatsapp}
            AND status IN ('paid', 'registered')
          ORDER BY paid_at DESC
          LIMIT 10
        `;

        const paymentHistory = payments.map((p: any) => ({
            date: new Date(p.paid_at || p.created_at).toLocaleDateString('pt-BR'),
            plan: p.plan,
            value: `R$ ${Number(p.amount).toFixed(2).replace('.', ',')}`,
            status: 'Pago',
        }));

        res.json({
            name: client.name,
            email: client.email,
            whatsapp: client.whatsapp,
            device: client.device,
            plan: client.plan,
            status: client.status,
            days_remaining: client.days_remaining,
            app_account: client.app_account,
            app_password: client.app_password,
            createdAt: client.created_at,
            paymentHistory,
        });
    } catch (error) {
        logger.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro ao carregar dados.' });
    }
});

// ============================================================
// POST /api/clients/request-access — Solicitar acesso (pool vazio)
// ============================================================
router.post('/request-access', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const [client] = await sql`
            SELECT name, whatsapp, plan FROM clients WHERE id = ${req.clientId!}
        `;
        if (!client) { res.status(404).json({ error: 'Cliente não encontrado.' }); return; }

        const { sendTelegramMessage } = await import('../services/telegram.js');
        await sendTelegramMessage(
            `🆘 <b>Solicitação de Acesso</b>\n` +
            `👤 ${client.name}\n` +
            `📱 ${client.whatsapp}\n` +
            `📦 Plano: ${client.plan}\n` +
            `👉 Cliente pagou mas não tem login atribuído. Atribua manualmente no painel admin!`
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('Erro ao solicitar acesso:', error);
        res.status(500).json({ error: 'Erro ao enviar solicitação.' });
    }
});

// ============================================================
// POST /api/clients/trial-feedback — Feedback do trial
// ============================================================
router.post('/trial-feedback', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { worked } = req.body as { worked: boolean };
        const [client] = await sql`
            SELECT name, whatsapp, device FROM clients WHERE id = ${req.clientId!}
        `;
        if (!client) { res.status(404).json({ error: 'Cliente não encontrado.' }); return; }

        const { sendTelegramMessage } = await import('../services/telegram.js');
        await sendTelegramMessage(
            worked
                ? `✅ <b>Trial funcionou!</b>\n👤 ${client.name} | 📱 ${client.whatsapp}\n🖥️ ${client.device || 'N/A'}\n💬 Cliente conseguiu acessar o app.`
                : `❌ <b>Trial com problema!</b>\n👤 ${client.name} | 📱 ${client.whatsapp}\n🖥️ ${client.device || 'N/A'}\n💬 Cliente não conseguiu acessar o app. Entre em contato!`
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('Erro ao salvar feedback trial:', error);
        res.status(500).json({ error: 'Erro ao enviar feedback.' });
    }
});

export default router;
