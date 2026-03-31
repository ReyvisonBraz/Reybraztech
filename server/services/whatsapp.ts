import logger from '../utils/logger.js';

// ---- Cache do token OAuth2 ----
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtém um access_token da SendPulse via OAuth2.
 * Faz cache do token e só renova quando expirar.
 */
async function getAccessToken(): Promise<string> {
  // Se o token ainda é válido (com 60s de margem), reutiliza
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SENDPULSE_CLIENT_ID!,
      client_secret: process.env.SENDPULSE_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('❌ Erro ao obter token SendPulse:', errorText);
    throw new Error('Falha na autenticação com SendPulse');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  logger.info('🔑 Token SendPulse obtido com sucesso!');
  return cachedToken!;
}

/**
 * Gera as variantes de formato do número brasileiro.
 * A SendPulse pode armazenar números com 12 ou 13 dígitos:
 *   - 13 dígitos: 5591993170497 (com nono dígito)
 *   - 12 dígitos: 559193170497  (sem nono dígito, formato antigo)
 * Retorna ambos os formatos para tentar.
 */
function getPhoneVariants(number: string): string[] {
  const digits = number.replace(/\D/g, '');

  // Garantir que começa com 55
  const full = digits.startsWith('55') ? digits : `55${digits}`;

  const variants: string[] = [full];

  if (full.length === 13) {
    // 5591993170497 → remover o 9 extra → 559193170497
    const ddd = full.slice(2, 4);
    const withoutNinth = `55${ddd}${full.slice(5)}`;
    variants.push(withoutNinth);
  } else if (full.length === 12) {
    // 559193170497 → adicionar o 9 → 5591993170497
    const ddd = full.slice(2, 4);
    const withNinth = `55${ddd}9${full.slice(4)}`;
    variants.push(withNinth);
  }

  return variants;
}

/**
 * Tenta enviar a mensagem para um número específico.
 */
async function trySendToPhone(token: string, phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(
    `https://api.sendpulse.com/whatsapp/contacts/sendByPhone`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        bot_id: process.env.SENDPULSE_BOT_ID!,
        phone,
        message: {
          type: 'text',
          text: { body: message },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: errorText };
  }

  return { ok: true };
}

/**
 * Envia uma mensagem de texto via WhatsApp usando a API da SendPulse.
 * Tenta ambos os formatos de telefone (com e sem nono dígito).
 */
export async function sendWhatsApp(number: string, message: string): Promise<boolean> {
  const variants = getPhoneVariants(number);

  try {
    const token = await getAccessToken();

    for (const phone of variants) {
      const result = await trySendToPhone(token, phone, message);

      if (result.ok) {
        logger.info(`✅ WhatsApp enviado para ${phone} via SendPulse`);
        return true;
      }

      // Se o erro não for "Contact does not exist", não tente o próximo formato
      if (result.error && !result.error.includes('Contact does not exist')) {
        logger.error(`❌ Erro ao enviar WhatsApp para ${phone}: ${result.error}`);
        return false;
      }

      logger.info(`⚠️ Contato ${phone} não encontrado, tentando formato alternativo...`);
    }

    logger.error(`❌ Nenhum formato de telefone funcionou para: ${number}`);
    return false;
  } catch (error) {
    logger.error('❌ Falha na conexão com SendPulse:', error);
    return false;
  }
}

/**
 * Envia um OTP de verificação via WhatsApp
 */
export async function sendOTPMessage(
  number: string,
  otp: string,
  type: 'register' | 'login' | 'reset_password'
): Promise<boolean> {
  const messages = {
    register: `🔐 *Reybraztech — Verificação de Cadastro*\n\nSeu código de verificação é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nNão compartilhe este código com ninguém.`,
    login: `🔑 *Reybraztech — Código de Login*\n\nSeu código de acesso é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nNão compartilhe este código com ninguém.`,
    reset_password: `🔓 *Reybraztech — Redefinir Senha*\n\nSeu código para redefinir a senha é:\n\n*${otp}*\n\n⏰ Válido por 5 minutos.\nSe você não solicitou isso, ignore esta mensagem.`,
  };

  return sendWhatsApp(number, messages[type]);
}

// ============================================================
// Mensagens do fluxo de checkout/trial
// ============================================================

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal (31 dias)',
  trimestral: 'Trimestral (93 dias)',
  semestral: 'Semestral (186 dias)',
  anual: 'Anual (365 dias)',
  trial: 'Teste Gratuito (3 dias)',
};

/**
 * Envia confirmação de pagamento com dados da transação.
 * Abre a janela de 24h do SendPulse.
 */
export async function sendPaymentConfirmation(
  whatsapp: string,
  name: string,
  plan: string,
  amount: number,
  orderId: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const date = new Date().toLocaleDateString('pt-BR');
  const planLabel = PLAN_LABELS[plan] || plan;

  const message = [
    `✅ *Reybraztech — Pagamento Confirmado!*`,
    ``,
    `Olá ${name}! Seu pagamento foi aprovado.`,
    ``,
    `📋 *Plano:* ${planLabel}`,
    `💰 *Valor:* R$ ${amount.toFixed(2)}`,
    `📅 *Data:* ${date}`,
    ``,
    `Complete seu cadastro para acessar o app:`,
    `${frontendUrl}/complete-registration?order=${orderId}`,
  ].join('\n');

  return sendWhatsApp(whatsapp, message);
}

/**
 * Envia confirmação de ativação do trial + link de cadastro.
 * Enviado APÓS o cadastro completo (trial exige conta criada).
 */
export async function sendTrialActivation(
  whatsapp: string,
  name: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const message = [
    `🎁 *Reybraztech — Teste Gratuito Ativado!*`,
    ``,
    `Olá ${name}! Seu teste gratuito de 3 dias (72 horas) foi ativado com sucesso.`,
    ``,
    `Acesse seu painel para ver suas credenciais:`,
    `${frontendUrl}/dashboard`,
    ``,
    `Aproveite! 🚀`,
  ].join('\n');

  return sendWhatsApp(whatsapp, message);
}

/**
 * Envia mensagem de cadastro completo + link do dashboard.
 */
export async function sendRegistrationComplete(
  whatsapp: string,
  name: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const message = [
    `🎉 *Reybraztech — Cadastro Completo!*`,
    ``,
    `Olá ${name}! Sua conta foi criada com sucesso.`,
    ``,
    `Acesse seu painel:`,
    `${frontendUrl}/dashboard`,
    ``,
    `Qualquer dúvida, estamos à disposição! 💬`,
  ].join('\n');

  return sendWhatsApp(whatsapp, message);
}