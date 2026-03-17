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

// Função para enviar alertas ao Telegram
export const sendTelegramAlert = async (message: string, error?: any) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) return;

  try {
    const stack = error?.stack ? `\n\n<b>Stack Trace:</b>\n<code>${error.stack.substring(0, 500)}</code>` : '';
    const text = `🚨 <b>Alerta de Erro - Reybraztech</b>\n\n${message}${stack}`;

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
  } catch (err) {
    logger.error('Falha ao enviar alerta para o Telegram', err);
  }
};

// Middleware para interceptar erros do Winston e enviar para o Telegram se for crítico
logger.on('data', (log) => {
  if (log.level === 'error') {
    sendTelegramAlert(`Erro detectado: ${log.message}`, log);
  }
});

export default logger;
