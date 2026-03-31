import { Router } from 'express';
import { createPaymentPreference, getPaymentDetails } from '../services/mercadopago.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { sendPaymentConfirmation } from '../services/whatsapp.js';
import sql from '../database.js';
import logger from '../utils/logger.js';

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
  const { query } = req;
  const topic = query.topic || query.type;

  logger.info('📬 Webhook recebido:', { topic, body: req.body });

  try {
    // Mercado Pago envia notificações com topic 'payment' ou type 'payment'
    if (topic === 'payment') {
      const paymentId = (query.id || req.body.data?.id) as string;

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

        // Enviar WhatsApp com dados do pagamento (abre janela 24h)
        await sendPaymentConfirmation(
          order.whatsapp,
          order.name,
          order.plan,
          Number(order.amount),
          orderId
        );
      } else {
        logger.info(`ℹ️ Pagamento ${paymentId} com status: ${payment.status}`);
      }
    }

    // Sempre retornar 200 para o Mercado Pago
    // IMPORTANTE: todo async já foi feito ANTES deste ponto (Vercel serverless)
    res.sendStatus(200);
  } catch (error) {
    logger.error('❌ Erro no webhook:', error);
    // Mesmo com erro, retornar 200 para o MP não reenviar infinitamente
    res.sendStatus(200);
  }
});

export default router;
