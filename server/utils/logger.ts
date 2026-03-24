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

    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      });
    } catch (err: any) {
      // Se o erro for 400 (Bad Request), provavelmente é HTML malformado (ex: unclosed tags)
      if (err.response && err.response.status === 400) {
        try {
          // Tentar enviar novamente SEM parse_mode (como texto puro)
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: text, // Envia o texto original, tags aparecerão como texto
          });
          return; // Sucesso no fallback!
        } catch (retryErr) {
          console.error('Falha crítica no fallback do Telegram:', retryErr);
        }
      }
      console.error('Falha crítica ao enviar notificação para o Telegram:', err);
    }
  } catch (outerErr) {
    console.error('Erro inesperado em sendTelegramNotification:', outerErr);
  }
};

// ==========================================
// 🤖 TELEGRAM MEMORY CACHE
// ==========================================
const logCache: string[] = [];

// Middleware para interceptar logs do Winston
logger.on('data', (log) => {
  // Salvar no cache em memória
  logCache.push(`[${log.level.toUpperCase()}] ${log.message}`);
  if (logCache.length > 20) {
    logCache.shift(); // Remove o mais antigo (FIFO)
  }

  // Enviar erros automaticamente
  if (log.level === 'error') {
    sendTelegramNotification(log.message, 'error', log);
  } 
  // Enviar mensagens de sucesso que começam com ✅
  else if (log.level === 'info' && log.message.includes('✅')) {
    sendTelegramNotification(log.message, 'info');
  }
});

// ==========================================
// 🤖 TELEGRAM BOT POLLING (On Demand Logs)
// ==========================================
import os from 'os';

let lastUpdateId = 0;

export const startTelegramBot = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !adminChatId) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definidos. Bot desativado.');
    return;
  }

  try {
    // 🔴 Crítico: Se havia um webhook configurado, o Polling (getUpdates) quebra com erro 409.
    // Primeiro, forçamos o Telegram a deletar qualquer Webhook associado a este bot.
    await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook`);
    console.log('✅ Webhook do Telegram limpo (preparado para Polling).');
  } catch (e: any) {
    console.error('⚠️ Falha ao limpar webhook do Telegram:', e.message);
  }

  console.log('🤖 Telegram Bot Listener iniciado (Long Polling)...');

  setInterval(async () => {
    try {
      // Faz o request pedindo apenas mensagens mais novas que o último offset
      const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
      
      const updates = response.data.result;
      
      if (updates && updates.length > 0) {
        for (const update of updates) {
          lastUpdateId = update.update_id;

          const message = update.message;
          if (!message || !message.text) continue;

          // Confere se a mensagem veio do DONO do sistema (segurança)
          if (message.chat.id.toString() !== adminChatId) {
            continue; // Ignora intrusos
          }

          const text = message.text.trim().toLowerCase();

          // COMANDO: /logs
          if (text === '/logs') {
            const logsText = logCache.length > 0 ? logCache.join('\n') : 'Nenhum log recente na memória.';
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: adminChatId,
              text: `📋 <b>Últimos 20 Registros (Logs da Memória):</b>\n\n<pre>${logsText}</pre>`,
              parse_mode: 'HTML'
            });
          }

          // COMANDO: /status
          else if (text === '/status') {
            const uptimeSecs = Math.floor(os.uptime());
            const hours = Math.floor(uptimeSecs / 3600);
            const minutes = Math.floor((uptimeSecs % 3600) / 60);
            const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
            const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);

            const statusText = `📊 <b>Status do Servidor (Reybraztech)</b>\n\n` +
                               `🟢 <b>Uptime (Tempo Vido):</b> ${hours}h ${minutes}m\n` +
                               `💾 <b>Memória Livre:</b> ${freeMem}MB / ${totalMem}MB\n` +
                               `⚙️ <b>CPU:</b> ${os.cpus()[0].model}\n` +
                               `📈 <b>Status:</b> Operante e Saudável`;

            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: adminChatId,
              text: statusText,
              parse_mode: 'HTML'
            });
          }
        }
      }
    } catch (err: any) {
      console.error('⚠️ [Telegram Bot] Falha no polling:', err.message);
    }
  }, 5000); // Roda a cada 5 segundos
};

export default logger;
