import { Router } from 'express';
import { createHmac } from 'crypto';
import { createPaymentPreference, getPaymentDetails } from '../services/mercadopago.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { sendPaymentConfirmation } from '../services/whatsapp.js';
import { sendTelegramMessage } from '../services/telegram.js';
import sql from '../database.js';
import logger from '../utils/logger.js';

const PLAN_DAYS: Record<string, number> = {
  mensal: 31,
  trimestral: 93,
  semestral: 186,
  anual: 365,
  trial: 3,
};

/**
 * Valida a assinatura do webhook enviada pelo Mercado Pago.
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateMercadoPagoSignature(req: import('express').Request, secret: string): boolean {
  const xSignature = req.headers['x-signature'] as string | undefined;
  const xRequestId = req.headers['x-request-id'] as string | undefined;

  if (!xSignature || !xRequestId) return false;

  // Extrair ts e v1 do header x-signature (formato: "ts=...,v1=...")
  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) return false;

  // Extrair dataId da query ou body
  const dataId = (req.query.id || req.body?.data?.id || '') as string;

  // Montar o manifest conforme documentação do MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex');

  return hmac === v1;
}

const router = Router();

// Create a payment preference (legacy — mantido para compatibilidade)
router.post('/create-preference', verifyToken, async (req: AuthRequest, res) => {
  const { planId, amount, title } = req.body;
  const userId = req.clientId;

  try {
    const items = [
      {
        id: planId.toString(),
        title: title || `Plano ${planId}`,
        unit_price: Number(amount),
        quantity: 1,
        currency_id: 'BRL'
      }
    ];

    const externalReference = JSON.stringify({ userId, planId });
    const preference = await createPaymentPreference(items, externalReference);

    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    });
  } catch (error: any) {
    logger.error('Payment Error:', error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// ============================================================
// Webhook do Mercado Pago — Processa notificações de pagamento
// ============================================================
router.post('/webhook', async (req, res) => {
  const { query, body } = req;
  // MP envia topic/type na query OU no body dependendo da versão da notificação
  const topic = query.topic || query.type || body.type || body.action?.split('.')[0];

  logger.info('📬 Webhook recebido:', { topic, query, body });

  // Validar assinatura do Mercado Pago — rejeita se secret configurado e assinatura inválida
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (webhookSecret) {
    const isValid = validateMercadoPagoSignature(req as any, webhookSecret);
    if (!isValid) {
      logger.warn('🚫 Webhook com assinatura inválida — rejeitado');
      res.sendStatus(401);
      return;
    }
  }

  try {
    // MP envia topic 'payment', type 'payment', ou action 'payment.created'/'payment.updated'
    const isPaymentEvent = topic === 'payment' || body.action?.startsWith('payment.');
    if (isPaymentEvent) {
      const paymentId = (query.id || body.data?.id) as string;

      if (!paymentId) {
        logger.warn('⚠️ Webhook sem payment ID');
        res.sendStatus(200);
        return;
      }

      logger.info(`💳 Processando pagamento ID: ${paymentId}`);

      // Buscar detalhes do pagamento no Mercado Pago
      const payment = await getPaymentDetails(paymentId);

      if (payment.status === 'approved') {
        const externalReference = payment.external_reference;

        if (!externalReference) {
          logger.warn('⚠️ Pagamento aprovado sem external_reference');
          res.sendStatus(200);
          return;
        }

        // external_reference é o UUID do pending_order
        const orderId = externalReference;

        // Buscar o pedido
        const [order] = await sql`
          SELECT id, name, whatsapp, plan, amount, status
          FROM pending_orders
          WHERE id = ${orderId}
        `;

        if (!order) {
          logger.warn(`⚠️ Pedido ${orderId} não encontrado no banco`);
          res.sendStatus(200);
          return;
        }

        if (order.status === 'paid' || order.status === 'registered') {
          logger.info(`ℹ️ Pedido ${orderId} já processado (status: ${order.status})`);
          res.sendStatus(200);
          return;
        }

        // Marcar como pago
        await sql`
          UPDATE pending_orders
          SET status = 'paid',
              mp_payment_id = ${paymentId},
              paid_at = NOW()
          WHERE id = ${orderId}
        `;

        logger.info(`✅ Pedido ${orderId} marcado como pago! ${order.name} | ${order.plan} | R$${order.amount}`);

        // Calcular dias conforme o plano
        const daysToAdd = PLAN_DAYS[order.plan] ?? 31;

        // Buscar cliente pelo whatsapp da order
        const [client] = await sql`
          SELECT id, days_remaining FROM clients WHERE whatsapp = ${order.whatsapp}
        `;

        if (client) {
          // Atribuir login do pool atomicamente via UPDATE ... RETURNING
          const [poolEntry] = await sql`
            UPDATE login_pool
            SET status = 'em_uso', client_id = ${client.id}, assigned_at = NOW()
            WHERE id = (
              SELECT id FROM login_pool
              WHERE status = 'disponivel'
              ORDER BY created_at ASC
              LIMIT 1
            )
            RETURNING id, app_account, app_password
          `;

          if (poolEntry) {
            await sql`
              UPDATE clients
              SET status = 'Ativo',
                  days_remaining = ${daysToAdd},
                  app_account = ${poolEntry.app_account},
                  app_password = ${poolEntry.app_password},
                  plan = ${order.plan}
              WHERE id = ${client.id}
            `;

            // Marcar order como registered — cliente já existe, não precisa de complete-registration
            await sql`
              UPDATE pending_orders
              SET status = 'registered', client_id = ${client.id}, registered_at = NOW()
              WHERE id = ${orderId}
            `;

            logger.info(`🔑 Login ${poolEntry.app_account} atribuído ao cliente ${client.id}`);

            await sendTelegramMessage(
              `✅ <b>Pagamento Confirmado</b>\n` +
              `👤 ${order.name}\n` +
              `📱 ${order.whatsapp}\n` +
              `📦 Plano: ${order.plan} (${daysToAdd} dias)\n` +
              `💰 R$${order.amount}\n` +
              `🔑 Login: <code>${poolEntry.app_account}</code>\n` +
              `🔐 Senha: <code>${poolEntry.app_password}</code>\n` +
              `🆔 Pedido: ${orderId}`
            );
          } else {
            // Pool vazio — ativa a conta sem login, alerta no Telegram
            await sql`
              UPDATE clients
              SET status = 'Ativo',
                  days_remaining = ${daysToAdd},
                  plan = ${order.plan}
              WHERE id = ${client.id}
            `;

            await sql`
              UPDATE pending_orders
              SET status = 'registered', client_id = ${client.id}, registered_at = NOW()
              WHERE id = ${orderId}
            `;

            logger.warn(`⚠️ Pool vazio! Cliente ${client.id} ativado sem login atribuído.`);

            await sendTelegramMessage(
              `✅ <b>Pagamento Confirmado</b> — ⚠️ <b>POOL VAZIO!</b>\n` +
              `👤 ${order.name}\n` +
              `📱 ${order.whatsapp}\n` +
              `📦 Plano: ${order.plan} (${daysToAdd} dias)\n` +
              `💰 R$${order.amount}\n` +
              `🔑 Nenhum login disponível no pool!\n` +
              `👉 Adicione logins no painel admin imediatamente.\n` +
              `🆔 Pedido: ${orderId}`
            );
          }
        } else {
          // Cliente não encontrado — alerta apenas (não bloqueia o webhook)
          logger.warn(`⚠️ Pagamento ${orderId} aprovado mas cliente não encontrado (whatsapp: ${order.whatsapp})`);
          await sendTelegramMessage(
            `⚠️ <b>Pagamento sem cadastro</b>\n` +
            `👤 ${order.name} | 📱 ${order.whatsapp}\n` +
            `📦 ${order.plan} | 💰 R$${order.amount}\n` +
            `🆔 Pedido: ${orderId}\n` +
            `👉 Cliente pagou mas não tem conta. Verifique!`
          );
        }
      } else {
        logger.info(`ℹ️ Pagamento ${paymentId} com status: ${payment.status}`);
      }
    } else {
      logger.info(`ℹ️ Webhook ignorado — topic: ${topic}`);
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('❌ Erro no webhook:', error);
    // Mesmo com erro, retornar 200 para o MP não reenviar infinitamente
    res.sendStatus(200);
  }
});

// ============================================================
// POST /api/payments/infinitypay — Criar link de pagamento
// ============================================================
router.post('/infinitypay', async (req: any, res: any) => {
  const { plan, name, whatsapp, amount, orderId } = req.body;

  if (!plan || !whatsapp) {
    res.status(400).json({ error: 'Plano e WhatsApp são obrigatórios.' });
    return;
  }

  const handle = process.env.INFINITYPAY_HANDLE;
  if (!handle) {
    res.status(500).json({ error: 'InfinityPay não configurado.' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const apiUrl = process.env.API_URL || frontendUrl;
  const generatedOrderId = orderId || `INF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { createInfinityPayLink } = await import('../services/infinitypay.js');

    const linkData = await createInfinityPayLink({
      handle,
      items: [{
        quantity: 1,
        price: Math.round(amount * 100),
        description: `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} - Reybraztech`,
      }],
      order_nsu: generatedOrderId,
      redirect_url: `${frontendUrl}/dashboard?payment=success`,
      webhook_url: `${apiUrl}/api/payments/infinitypay-webhook`,
      customer: {
        name,
        phone_number: `+55${whatsapp.replace(/\D/g, '')}`,
      },
    });

    if (!linkData.success || !linkData.link) {
      res.status(500).json({ error: linkData.error || 'Erro ao criar link.' });
      return;
    }

    logger.info(`[InfinityPay] Link gerado para ${whatsapp}: ${linkData.link}`);

    res.json({
      success: true,
      checkoutUrl: linkData.link,
      orderId: generatedOrderId,
      slug: linkData.slug,
    });
  } catch (error) {
    logger.error('[InfinityPay] Erro ao gerar link:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
});

// ============================================================
// POST /api/payments/infinitypay-webhook — Webhook
// ============================================================
router.post('/infinitypay-webhook', async (req: any, res: any) => {
  const { order_nsu, invoice_slug, paid, amount, paid_amount, capture_method, transaction_nsu, receipt_url } = req.body;

  logger.info('[InfinityPay] Webhook recebido:', req.body);

  // Responder com JSON conforme documentação
  res.status(200).json({ success: true });

  if (!paid) {
    logger.info(`[InfinityPay] Pagamento não aprovado para ${order_nsu}`);
    return;
  }

  try {
    const [order] = await sql`
      SELECT id, name, whatsapp, plan, status FROM pending_orders WHERE id = ${order_nsu}
    `;

    if (!order) {
      logger.warn(`[InfinityPay] Pedido ${order_nsu} não encontrado`);
      return;
    }

    if (order.status === 'paid' || order.status === 'registered') {
      logger.info(`[InfinityPay] Pedido ${order_nsu} já processado`);
      return;
    }

    await sql`
      UPDATE pending_orders SET status = 'paid', paid_at = NOW() WHERE id = ${order_nsu}
    `;

    const daysToAdd = PLAN_DAYS[order.plan] ?? 31;

    const [client] = await sql`
      SELECT id FROM clients WHERE whatsapp = ${order.whatsapp}
    `;

    if (client) {
      const [poolEntry] = await sql`
        UPDATE login_pool
        SET status = 'em_uso', client_id = ${client.id}, assigned_at = NOW()
        WHERE id = (SELECT id FROM login_pool WHERE status = 'disponivel' ORDER BY created_at ASC LIMIT 1)
        RETURNING id, app_account, app_password
      `;

      if (poolEntry) {
        await sql`
          UPDATE clients SET status = 'Ativo', days_remaining = ${daysToAdd},
          app_account = ${poolEntry.app_account}, app_password = ${poolEntry.app_password}, plan = ${order.plan}
          WHERE id = ${client.id}
        `;

        await sql`
          UPDATE pending_orders SET status = 'registered', client_id = ${client.id}, registered_at = NOW()
          WHERE id = ${order_nsu}
        `;

        logger.info(`[InfinityPay] Acesso liberado para ${client.id}`);
      }
    }

    logger.info(`[InfinityPay] Pagamento confirmado: ${order_nsu}`);
  } catch (error) {
    logger.error('[InfinityPay] Erro ao processar webhook:', error);
  }
});

export default router;
