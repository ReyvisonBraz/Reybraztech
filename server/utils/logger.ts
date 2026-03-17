import winston from 'winston';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para o console
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Logger Principal
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 1. Logs no Console (Coloridos)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // 2. Salvar erros em arquivo
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // 3. Salvar todos os logs em arquivo
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

/**
 * Envia uma notificação ao Telegram.
 * @param message Mensagem principal
 * @param type 'error' para alertas de erro, 'info' para notificações gerais
 * @param error Objeto de erro opcional para stack trace
 */
export const sendTelegramNotification = async (message: string, type: 'error' | 'info' = 'info', error?: any) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) return;

  try {
    const isError = type === 'error';
    const icon = isError ? '🚨' : '✨';
    const title = isError ? '<b>Alerta de Erro - Reybraztech</b>' : '<b>Nova Notificação - Reybraztech</b>';
    
    let text = `${icon} ${title}\n\n${message}`;

    if (isError && error?.stack) {
      const sanitizedStack = error.stack.replace(/<|>/g, '');
      text += `\n\n<b>Stack Trace:</b>\n<code>${sanitizedStack.substring(0, 800)}</code>`;
    }

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('Falha crítica ao enviar notificação para o Telegram:', err);
  }
};

// Mantemos o nome antigo por compatibilidade se necessário, mas apontando para a nova
export const sendTelegramAlert = (message: string, error?: any) => sendTelegramNotification(message, 'error', error);

// Middleware para interceptar logs do Winston
logger.on('data', (log) => {
  // Enviar erros automaticamente
  if (log.level === 'error') {
    sendTelegramNotification(log.message, 'error', log);
  } 
  // Enviar mensagens de sucesso que começam com ✅
  else if (log.level === 'info' && log.message.includes('✅')) {
    sendTelegramNotification(log.message, 'info');
  }
});

export default logger;
