import { MercadoPagoConfig, Preference } from 'mercadopago';
import logger from '../utils/logger.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});

export const createPaymentPreference = async (items: { id: string, title: string, unit_price: number, quantity: number, currency_id?: string }[], externalReference: string) => {
  const preference = new Preference(client);
  
  const body = {
    items: items,
    external_reference: externalReference,
    // Note: notify_url must be a public URL to receive webhooks.
    // For local development, use Ngrok and set this URL in .env.
    notification_url: process.env.PAYMENT_WEBHOOK_URL || '', 
    back_urls: {
      success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=failure`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=pending`,
    },
    auto_return: 'approved' as const,
  };

  try {
    const response = await preference.create({ body });
    return response;
  } catch (error) {
    logger.error('Error creating Mercado Pago preference:', error);
    throw error;
  }
};
