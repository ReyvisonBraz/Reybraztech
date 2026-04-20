import { z } from 'zod';
import { Router, Request, Response } from 'express';
import sql from '../database.js';
import logger from '../utils/logger.js';
import { createPaymentPreference } from '../services/mercadopago.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Preços definidos no servidor — NUNCA confia no client
const PLAN_PRICES: Record<string, { amount: number; title: string; days: number }> = {
  mensal:     { amount: 35,  title: 'Plano Mensal',     days: 31 },
  trimestral: { amount: 90,  title: 'Plano Trimestral', days: 93 },
  semestral:  { amount: 169, title: 'Plano Semestral',  days: 186 },
  anual:      { amount: 299, title: 'Plano Anual',      days: 365 },
};

// Schema de validação
const createOrderSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  plan: z.enum(['mensal', 'trimestral', 'semestral', 'anual']),
});

const trialSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  device: z.string().min(1, 'Informe o dispositivo').optional().or(z.literal('')),
});

// ============================================================
// POST /api/orders/create — Criar pedido + preferência MP
// ============================================================
router.post('/create', async (req: Request, res: Response) => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, whatsapp, plan } = result.data;
  const planInfo = PLAN_PRICES[plan];

  try {
    // Verificar se já existe um pedido pendente recente (< 30min) para evitar duplicatas
    const [recentOrder] = await sql`
      SELECT id, mp_preference_id FROM pending_orders
      WHERE whatsapp = ${whatsapp}
        AND plan = ${plan}
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Criar preferência no Mercado Pago
    const items = [{
      id: plan,
      title: planInfo.title,
      unit_price: planInfo.amount,
      quantity: 1,
      currency_id: 'BRL',
    }];

    if (recentOrder) {
      // Reutilizar pedido existente — apenas gera nova preferência (a anterior pode ter expirado)
      logger.info(`♻️ Pedido recente encontrado para ${whatsapp}, reutilizando ${recentOrder.id}`);

      const backUrls = {
        success: `${frontendUrl}/dashboard?payment=success`,
        failure: `${frontendUrl}/checkout?plan=${plan}&error=payment_failed`,
        pending: `${frontendUrl}/dashboard?payment=pending`,
      };

      const preference = await createPaymentPreference(items, recentOrder.id, backUrls);

      await sql`
        UPDATE pending_orders
        SET mp_preference_id = ${preference.id}
        WHERE id = ${recentOrder.id}
      `;

      res.status(200).json({
        orderId: recentOrder.id,
        init_point: preference.init_point,
      });
      return;
    }

    // Gerar ID numérico grande (timestamp + random) - converter para string
    const orderId = String(BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)));

    // Inserir pedido
    const [order] = await sql`
      INSERT INTO pending_orders (id, name, whatsapp, plan, amount, status)
      VALUES (${orderId}, ${name}, ${whatsapp}, ${plan}, ${planInfo.amount}, 'pending')
      RETURNING id
    `;

    const backUrls = {
      success: `${frontendUrl}/dashboard?payment=success`,
      failure: `${frontendUrl}/checkout?plan=${plan}&error=payment_failed`,
      pending: `${frontendUrl}/dashboard?payment=pending`,
    };

    const preference = await createPaymentPreference(items, order.id, backUrls);

    // Atualizar pedido com o ID da preferência MP
    await sql`
      UPDATE pending_orders
      SET mp_preference_id = ${preference.id}
      WHERE id = ${order.id}
    `;

    logger.info(`🛒 Pedido criado: ${order.id} | ${name} | ${plan} | R$${planInfo.amount}`);

    res.status(201).json({
      orderId: order.id,
      init_point: preference.init_point,
    });
  } catch (error) {
    logger.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao processar pedido. Tente novamente.' });
  }
});

// ============================================================
// POST /api/orders/trial — Criar pedido de teste grátis
// ============================================================
router.post('/trial', async (req: Request, res: Response) => {
  const result = trialSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, whatsapp, device } = result.data;

  try {
    // Verificar se já tem trial
    const [existingTrial] = await sql`
      SELECT id FROM pending_orders
      WHERE whatsapp = ${whatsapp} AND plan = 'trial'
    `;
    if (existingTrial) {
      res.status(409).json({ error: 'Você já solicitou um teste gratuito.' });
      return;
    }

    // Verificar se já tem conta
    const [existingClient] = await sql`
      SELECT id FROM clients WHERE whatsapp = ${whatsapp}
    `;
    if (existingClient) {
      res.status(409).json({ error: 'Você já possui uma conta. Faça login para acessar.' });
      return;
    }

    // Gerar ID numérico grande (timestamp + random)
    const orderId = String(BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)));

    // Criar pedido de trial (status = 'pending' - aguardando confirmação via WhatsApp)
    const [order] = await sql`
      INSERT INTO pending_orders (id, name, whatsapp, plan, amount, status, device)
      VALUES (${orderId}, ${name}, ${whatsapp}, 'trial', 0, 'pending', ${device || null})
      RETURNING id
    `;

    // Gerar mensagem para WhatsApp
    const message = `Olá! Gostaria de ativar o teste gratuito.\n\n*Nome:* ${name}\n*Dispositivo:* ${device || 'Não informado'}`;
    const whatsappUrl = `https://wa.me/5591986450659?text=${encodeURIComponent(message)}`;

    logger.info(`🎁 Trial solicitado: ${order.id} | ${name} | ${whatsapp}`);

    res.status(201).json({
      orderId: order.id,
      whatsappUrl,
    });
  } catch (error) {
    logger.error('Erro ao criar trial:', error);
    res.status(500).json({ error: 'Erro ao processar teste gratuito. Tente novamente.' });
  }
});

// ============================================================
// GET /api/orders/:id — Consultar status do pedido
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [order] = await sql`
      SELECT name, whatsapp, plan, status, amount, device, created_at
      FROM pending_orders
      WHERE id = ${id}
    `;

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    // Auto-aprovar TRIAL após 3 segundos (para simular a confirmação automática)
    if (order.plan === 'trial' && order.status === 'pending') {
      const createdTime = new Date(order.created_at).getTime();
      if (Date.now() - createdTime > 3000) {
        await sql`UPDATE pending_orders SET status = 'paid', paid_at = NOW() WHERE id = ${id}`;
        order.status = 'paid';
      }
    }

    res.json(order);
  } catch (error) {
    logger.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido.' });
  }
});

// ============================================================
// POST /api/orders/renew — Renovação para usuário já logado
// ============================================================
const renewSchema = z.object({
  plan: z.enum(['mensal', 'trimestral', 'semestral', 'anual']),
});

router.post('/renew', verifyToken, async (req: AuthRequest, res: Response) => {
  const result = renewSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { plan } = result.data;
  const planInfo = PLAN_PRICES[plan];
  const clientId = req.clientId;

  try {
    const [client] = await sql`
      SELECT name, whatsapp FROM clients WHERE id = ${clientId}
    `;

    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const { name, whatsapp } = client;

    const orderId = String(BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)));

    const [order] = await sql`
      INSERT INTO pending_orders (id, name, whatsapp, plan, amount, status)
      VALUES (${orderId}, ${name}, ${whatsapp}, ${plan}, ${planInfo.amount}, 'pending')
      RETURNING id
    `;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const items = [{
      id: plan,
      title: planInfo.title,
      unit_price: planInfo.amount,
      quantity: 1,
      currency_id: 'BRL',
    }];

    const backUrls = {
      success: `${frontendUrl}/dashboard?payment=success`,
      failure: `${frontendUrl}/checkout?plan=${plan}&error=payment_failed`,
      pending: `${frontendUrl}/dashboard?payment=pending`,
    };

    const preference = await createPaymentPreference(items, order.id, backUrls);

    await sql`
      UPDATE pending_orders SET mp_preference_id = ${preference.id} WHERE id = ${order.id}
    `;

    logger.info(`🔄 Renovação criada: ${order.id} | ${name} | ${plan} | R$${planInfo.amount}`);

    res.status(201).json({
      orderId: order.id,
      init_point: preference.init_point,
    });
  } catch (error: any) {
    logger.error('Erro ao criar renovação:', error);
    res.status(500).json({ error: 'Erro ao processar renovação. Tente novamente.' });
  }
});

export default router;
