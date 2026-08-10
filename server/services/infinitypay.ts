import logger from '../utils/logger.js';

const INFINITYPAY_API = 'https://api.infinitepay.io';

interface InfinityPayItem {
  quantity: number;
  price: number;
  description: string;
}

interface InfinityPayLinkResponse {
  success: boolean;
  link?: string;
  slug?: string;
  error?: string;
}

interface InfinityPayPaymentStatus {
  success: boolean;
  paid: boolean;
  amount?: number;
  paidAmount?: number;
  captureMethod?: string;
  error?: string;
}

export const createInfinityPayLink = async (params: {
  handle: string;
  items: InfinityPayItem[];
  order_nsu: string;
  redirect_url?: string;
  webhook_url?: string;
  customer?: { name: string; email?: string; phone_number?: string };
}): Promise<InfinityPayLinkResponse> => {
  try {
    const response = await fetch(`${INFINITYPAY_API}/invoices/public/checkout/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[InfinityPay] Erro ao criar link:', data);
      return { success: false, error: data.message || 'Erro ao criar link' };
    }

    logger.info(`[InfinityPay] Link criado: ${data.url}`);
    return { success: true, link: data.url, slug: data.slug };
  } catch (error) {
    logger.error('[InfinityPay] Erro na API:', error);
    return { success: false, error: 'Erro de conexão com InfinityPay' };
  }
};

export const checkInfinityPayStatus = async (params: {
  handle: string;
  order_nsu: string;
  transaction_nsu?: string;
  slug?: string;
}): Promise<InfinityPayPaymentStatus> => {
  try {
    const response = await fetch(`${INFINITYPAY_API}/invoices/public/checkout/payment_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      logger.warn('[InfinityPay] Falha ao confirmar pagamento:', data);
      return {
        success: false,
        paid: false,
        error: data.message || 'Falha ao confirmar pagamento',
      };
    }

    return {
      success: true,
      paid: data.paid === true,
      amount: typeof data.amount === 'number' ? data.amount : undefined,
      paidAmount: typeof data.paid_amount === 'number' ? data.paid_amount : undefined,
      captureMethod: data.capture_method,
    };
  } catch (error) {
    logger.error('[InfinityPay] Erro ao verificar status:', error);
    return {
      success: false,
      paid: false,
      error: 'Erro de conexão com InfinityPay',
    };
  }
};
