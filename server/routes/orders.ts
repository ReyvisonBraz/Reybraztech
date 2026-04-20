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
// POST /api/orders/trial/activate — Ativar 3 dias após confirmação do usuário (JWT)
// ============================================================
router.post('/trial/activate', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const [client] = await sql`
      SELECT id, name, whatsapp, device, status, plan FROM clients WHERE id = ${req.clientId!}
    `;
    if (!client) { res.status(404).json({ error: 'Cliente não encontrado.' }); return; }

    // Evitar dupla ativação
    if (client.status === 'Ativo' && client.plan === 'trial') {
      res.json({ success: true, already_active: true });
      return;
    }

    // Buscar login disponível no pool
    const [poolEntry] = await sql`
      UPDATE login_pool
      SET status = 'em_uso', client_id = ${client.id}, assigned_at = NOW()
      WHERE id = (
        SELECT id FROM login_pool WHERE status = 'disponivel' ORDER BY created_at ASC LIMIT 1
      )
      RETURNING id, app_account, app_password
    `;

    if (poolEntry) {
      // Ativar com login do pool
      await sql`
        UPDATE clients
        SET status = 'Ativo', plan = 'trial', days_remaining = 3,
            app_account = ${poolEntry.app_account}, app_password = ${poolEntry.app_password}
        WHERE id = ${client.id}
      `;
    } else {
      // Pool vazio — ativa sem login, notifica Telegram
      await sql`
        UPDATE clients SET status = 'Ativo', plan = 'trial', days_remaining = 3 WHERE id = ${client.id}
      `;
    }

    // Registrar pedido de trial
    const orderId = String(BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)));
    await sql`
      INSERT INTO pending_orders (id, name, whatsapp, plan, amount, status, device, paid_at)
      VALUES (${orderId}, ${client.name}, ${client.whatsapp}, 'trial', 0, 'paid', ${client.device || null}, NOW())
      ON CONFLICT DO NOTHING
    `;

    const { sendTelegramMessage } = await import('../services/telegram.js');
    if (poolEntry) {
      await sendTelegramMessage(
        `🎁 <b>Trial Ativado!</b>\n` +
        `👤 ${client.name}\n📱 ${client.whatsapp}\n🖥️ ${client.device || 'Não informado'}\n` +
        `🔑 Login: <code>${poolEntry.app_account}</code>\n🔐 Senha: <code>${poolEntry.app_password}</code>\n⏰ 3 dias`
      );
    } else {
      await sendTelegramMessage(
        `⚠️ <b>Trial ativado mas POOL VAZIO!</b>\n` +
        `👤 ${client.name} | 📱 ${client.whatsapp}\n` +
        `👉 Adicione logins no painel admin!`
      );
    }

    logger.info(`🎁 Trial ativado: ${client.id} | ${client.name} | pool: ${poolEntry?.app_account || 'vazio'}`);

    res.json({ success: true, has_login: !!poolEntry });
  } catch (error) {
    logger.error('Erro ao ativar trial:', error);
    res.status(500).json({ error: 'Erro ao ativar teste gratuito. Tente novamente.' });
  }
});

// ============================================================
// POST /api/orders/trial — Ativar teste gratuito automaticamente
// ============================================================
router.post('/trial', async (req: Request, res: Response) => {
  const result = trialSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, whatsapp, device } = result.data;

  try {
    // Verificar se já tem trial ou conta
    const [existingTrial] = await sql`
      SELECT id FROM pending_orders WHERE whatsapp = ${whatsapp} AND plan = 'trial'
    `;
    if (existingTrial) {
      res.status(409).json({ error: 'Você já solicitou um teste gratuito.' });
      return;
    }

    const [existingClient] = await sql`
      SELECT id FROM clients WHERE whatsapp = ${whatsapp}
    `;
    if (existingClient) {
      res.status(409).json({ error: 'Você já possui uma conta. Faça login para acessar.' });
      return;
    }

    // Buscar login disponível no pool
    const [poolEntry] = await sql`
      UPDATE login_pool
      SET status = 'em_uso', assigned_at = NOW()
      WHERE id = (
        SELECT id FROM login_pool
        WHERE status = 'disponivel'
        ORDER BY created_at ASC
        LIMIT 1
      )
      RETURNING id, app_account, app_password
    `;

    if (!poolEntry) {
      // Pool vazio — notifica Telegram e retorna erro amigável
      const { sendTelegramMessage } = await import('../services/telegram.js');
      await sendTelegramMessage(
        `⚠️ <b>Trial solicitado mas pool VAZIO!</b>\n` +
        `👤 ${name} | 📱 ${whatsapp}\n` +
        `🖥️ Dispositivo: ${device || 'Não informado'}\n` +
        `👉 Adicione logins no painel admin!`
      );
      res.status(503).json({ error: 'Nosso sistema está com alta demanda. Tente novamente em alguns minutos ou entre em contato via WhatsApp.' });
      return;
    }

    // Criar cliente com trial ativo
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.default.hash(tempPassword, 10);

    const [newClient] = await sql`
      INSERT INTO clients (name, whatsapp, device, password_hash, plan, status, days_remaining, app_account, app_password)
      VALUES (${name}, ${whatsapp}, ${device || null}, ${passwordHash}, 'trial', 'Ativo', 3, ${poolEntry.app_account}, ${poolEntry.app_password})
      RETURNING id
    `;

    // Vincular login do pool ao cliente
    await sql`
      UPDATE login_pool SET client_id = ${newClient.id} WHERE id = ${poolEntry.id}
    `;

    // Registrar pedido de trial como pago
    const orderId = String(BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000)));
    await sql`
      INSERT INTO pending_orders (id, name, whatsapp, plan, amount, status, device, paid_at)
      VALUES (${orderId}, ${name}, ${whatsapp}, 'trial', 0, 'paid', ${device || null}, NOW())
    `;

    // Gerar JWT para auto-login
    const JWT_SECRET = process.env.JWT_SECRET!;
    const token = jwt.default.sign(
      { id: newClient.id, email: whatsapp },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Notificar Telegram
    const { sendTelegramMessage } = await import('../services/telegram.js');
    await sendTelegramMessage(
      `🎁 <b>Novo Trial Ativado!</b>\n` +
      `👤 ${name}\n` +
      `📱 ${whatsapp}\n` +
      `🖥️ Dispositivo: ${device || 'Não informado'}\n` +
      `🔑 Login: <code>${poolEntry.app_account}</code>\n` +
      `🔐 Senha: <code>${poolEntry.app_password}</code>\n` +
      `⏰ 3 dias de acesso`
    );

    logger.info(`🎁 Trial ativado: ${newClient.id} | ${name} | ${whatsapp} | login: ${poolEntry.app_account}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        name,
        plan: 'trial',
        status: 'Ativo',
        whatsapp,
        days_remaining: 3,
        app_account: poolEntry.app_account,
        app_password: poolEntry.app_password,
      },
      tempPassword,
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
