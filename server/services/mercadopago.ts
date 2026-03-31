import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import logger from '../utils/logger.js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
});

export const createPaymentPreference = async (
  items: { id: string; title: string; unit_price: number; quantity: number; currency_id?: string }[],
  externalReference: string,
  backUrls?: { success: string; failure: string; pending: string }
) => {
  const preference = new Preference(client);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const body = {
    items: items,
    external_reference: externalReference,
    notification_url: process.env.PAYMENT_WEBHOOK_URL || '',
    back_urls: backUrls || {
      success: `${frontendUrl}/dashboard?payment=success`,
      failure: `${frontendUrl}/dashboard?payment=failure`,
      pending: `${frontendUrl}/dashboard?payment=pending`,
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

/**
 * Busca detalhes de um pagamento pelo ID.
 * Usado no webhook para confirmar status.
 */
export const getPaymentDetails = async (paymentId: string) => {
  const payment = new Payment(client);
  try {
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    logger.error('Error fetching Mercado Pago payment:', error);
    throw error;
  }
};
