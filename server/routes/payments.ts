import { Router } from 'express';
import { createPaymentPreference } from '../services/mercadopago.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// Create a payment preference
router.post('/create-preference', verifyToken, async (req: AuthRequest, res) => {
  const { planId, amount, title } = req.body;
  const userId = req.clientId; // From verifyToken middleware

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

    // External reference can be used to identify the user/transaction in the webhook
    const externalReference = JSON.stringify({ userId, planId });

    const preference = await createPaymentPreference(items, externalReference);

    res.json({
      id: preference.id,
      init_point: preference.init_point, // URL for Desktop
      sandbox_init_point: preference.sandbox_init_point // URL for testing
    });
  } catch (error: any) {
    logger.error('Payment Error:', error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// Webhook for payment notifications
router.post('/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  logger.info('Received Webhook:', { topic, body: req.body });

  // Mercado Pago sends notifications for different topics
  // For 'payment', we should fetch the payment details using the ID
  if (topic === 'payment') {
    const paymentId = query.id || req.body.data?.id;
    logger.info(`Processing payment ID: ${paymentId}`);
    
    // TODO: Fetch payment details using the SDK and update database status
    // const payment = new Payment(client);
    // const details = await payment.get({ id: paymentId });
    // if (details.status === 'approved') { ... }
  }

  // Always return 200 OK to Mercado Pago
  res.sendStatus(200);
});

export default router;
