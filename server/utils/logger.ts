import winston from 'winston';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para o console
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  // 1. Logs no Console (Coloridos)
  new winston.transports.Console({
    format: combine(colorize(), logFormat),
  })
];

// 🔴 A Vercel possui um sistema de arquivos "Read-Only". Só grava arquivos se NÃO for na Vercel.
if (!process.env.VERCEL) {
  transports.push(
    // 2. Salvar erros em arquivo
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 3. Salvar todos os logs em arquivo
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

// Logger Principal
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports,
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
// 🤖 TELEGRAM BOT WEBHOOK (Serverless-friendly)
// ==========================================
// Antes usava Long Polling (perguntava ao Telegram a cada 5s).
// Agora usa Webhook: o Telegram ENVIA a mensagem para nós quando alguém manda um comando.
// Funciona perfeitamente em Serverless (Vercel).

import os from 'os';
import type { Request, Response } from 'express';

/**
 * Handler do Webhook — chamado pelo Telegram quando alguém envia uma mensagem ao bot.
 * Registrado como rota POST /api/telegram-webhook no index.ts
 */
export const handleTelegramWebhook = async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_CHAT_ID;

  // Responde 200 imediatamente (Telegram exige resposta rápida)
  res.status(200).json({ ok: true });

  if (!token || !adminChatId) return;

  try {
    const update = req.body;
    const message = update?.message;
    if (!message?.text) return;

    // Segurança: só responde ao dono do sistema
    if (message.chat.id.toString() !== adminChatId) return;

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
      const uptimeSecs = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSecs / 3600);
      const minutes = Math.floor((uptimeSecs % 3600) / 60);
      const memUsage = process.memoryUsage();
      const usedMem = (memUsage.rss / 1024 / 1024).toFixed(0);

      const statusText = `📊 <b>Status do Servidor (Reybraztech)</b>\n\n` +
                         `🌐 <b>Ambiente:</b> ${process.env.VERCEL ? 'Vercel (Serverless)' : 'Local'}\n` +
                         `🟢 <b>Uptime do processo:</b> ${hours}h ${minutes}m\n` +
                         `💾 <b>Memória usada:</b> ${usedMem}MB\n` +
                         `📈 <b>Status:</b> Operante e Saudável`;

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: adminChatId,
        text: statusText,
        parse_mode: 'HTML'
      });
    }
  } catch (err: any) {
    console.error('⚠️ [Telegram Webhook] Erro ao processar:', err.message);
  }
};

/**
 * Registra o webhook no Telegram — chamar uma vez após deploy.
 * GET /api/telegram-setup vai configurar o Telegram para enviar mensagens para o seu servidor.
 */
export const setupTelegramWebhook = async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `https://reybraztech.vercel.app/api/telegram-webhook`;

  if (!token) {
    res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN não definido' });
    return;
  }

  try {
    // Registra o webhook no Telegram
    const response = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url: webhookUrl,
    });
    res.json({ ok: true, message: 'Webhook registrado!', telegram: response.data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default logger;
