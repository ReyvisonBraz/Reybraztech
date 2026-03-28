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

import type { Request, Response } from 'express';

// Helper para enviar mensagem no Telegram
const sendTelegram = async (text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  });
};

/**
 * Handler do Webhook — chamado pelo Telegram quando alguém envia uma mensagem ao bot.
 * Registrado como rota POST /api/telegram-webhook no index.ts
 */
export const handleTelegramWebhook = async (req: Request, res: Response) => {
  const adminChatId = process.env.TELEGRAM_CHAT_ID;

  // Responde 200 imediatamente (Telegram exige resposta rápida)
  res.status(200).json({ ok: true });

  if (!adminChatId) return;

  try {
    const update = req.body;
    const message = update?.message;
    if (!message?.text) return;

    // Segurança: só responde ao dono do sistema
    if (message.chat.id.toString() !== adminChatId) return;

    const text = message.text.trim().toLowerCase();

    // Importa o banco só quando precisa (lazy import para serverless)
    const getDb = async () => (await import('../database.js')).default;

    // ─── /ajuda ─────────────────────────────────────
    if (text === '/ajuda' || text === '/help' || text === '/start') {
      await sendTelegram(
        `🤖 <b>Comandos Reybraztech</b>\n\n` +
        `📊 /status — Saúde geral (servidor + banco)\n` +
        `👥 /clientes — Total e últimos cadastros\n` +
        `💰 /pagamentos — Resumo de pagamentos\n` +
        `🔑 /otp — Tokens OTP recentes\n` +
        `📋 /logs — Últimos registros do sistema\n` +
        `❓ /ajuda — Esta mensagem`
      );
    }

    // ─── /status ────────────────────────────────────
    else if (text === '/status') {
      const sql = await getDb();

      // Testa conexão com banco
      let dbStatus = '❌ Offline';
      let dbTime = '';
      try {
        const [row] = await sql`SELECT NOW() as t`;
        dbStatus = '✅ Online';
        dbTime = new Date(row.t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      } catch { /* mantém offline */ }

      // Conta clientes ativos
      let totalClientes = 0;
      try {
        const [row] = await sql`SELECT COUNT(*)::int as total FROM clients`;
        totalClientes = row.total;
      } catch { /* ignora */ }

      await sendTelegram(
        `📊 <b>Status Reybraztech</b>\n\n` +
        `🌐 <b>Ambiente:</b> ${process.env.VERCEL ? 'Vercel (Serverless)' : 'Local'}\n` +
        `🗄️ <b>Banco de dados:</b> ${dbStatus}\n` +
        `🕐 <b>Hora do banco:</b> ${dbTime || 'N/A'}\n` +
        `👥 <b>Total de clientes:</b> ${totalClientes}\n` +
        `📈 <b>Servidor:</b> Respondendo normalmente`
      );
    }

    // ─── /clientes ──────────────────────────────────
    else if (text === '/clientes') {
      const sql = await getDb();

      const [countRow] = await sql`SELECT COUNT(*)::int as total FROM clients`;
      const [activeRow] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE status = 'Ativo'`;
      const recentes = await sql`
        SELECT name, whatsapp, plan, status, created_at
        FROM clients ORDER BY created_at DESC LIMIT 5
      `;

      let recentesText = '';
      for (const c of recentes) {
        const data = new Date(c.created_at).toLocaleDateString('pt-BR');
        recentesText += `\n• <b>${c.name}</b> | ${c.whatsapp} | ${c.plan} | ${c.status} | ${data}`;
      }

      await sendTelegram(
        `👥 <b>Clientes Reybraztech</b>\n\n` +
        `📊 <b>Total:</b> ${countRow.total}\n` +
        `✅ <b>Ativos:</b> ${activeRow.total}\n` +
        `⏸️ <b>Inativos:</b> ${countRow.total - activeRow.total}\n\n` +
        `🆕 <b>Últimos 5 cadastros:</b>${recentesText || '\nNenhum cliente ainda.'}`
      );
    }

    // ─── /pagamentos ────────────────────────────────
    else if (text === '/pagamentos') {
      const sql = await getDb();

      const [totalRow] = await sql`SELECT COUNT(*)::int as total FROM payments`;
      const [approvedRow] = await sql`SELECT COUNT(*)::int as total FROM payments WHERE status = 'approved'`;
      const recentes = await sql`
        SELECT p.plan, p.value, p.status, p.paid_at, c.name
        FROM payments p
        LEFT JOIN clients c ON c.id = p.client_id
        ORDER BY p.paid_at DESC LIMIT 5
      `;

      let recentesText = '';
      for (const p of recentes) {
        const data = p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : 'N/A';
        recentesText += `\n• <b>${p.name || 'N/A'}</b> | ${p.plan} | R$${p.value || '?'} | ${p.status} | ${data}`;
      }

      await sendTelegram(
        `💰 <b>Pagamentos Reybraztech</b>\n\n` +
        `📊 <b>Total:</b> ${totalRow.total}\n` +
        `✅ <b>Aprovados:</b> ${approvedRow.total}\n\n` +
        `🆕 <b>Últimos 5 pagamentos:</b>${recentesText || '\nNenhum pagamento ainda.'}`
      );
    }

    // ─── /otp ───────────────────────────────────────
    else if (text === '/otp') {
      const sql = await getDb();

      const recentes = await sql`
        SELECT whatsapp, type, used, created_at, expires_at
        FROM otp_tokens ORDER BY created_at DESC LIMIT 5
      `;

      let recentesText = '';
      for (const o of recentes) {
        const data = new Date(o.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const status = o.used ? '✅ Usado' : '⏳ Pendente';
        recentesText += `\n• ${o.whatsapp} | ${o.type} | ${status} | ${data}`;
      }

      await sendTelegram(
        `🔑 <b>Tokens OTP Recentes</b>\n\n` +
        `<b>Últimos 5:</b>${recentesText || '\nNenhum token ainda.'}`
      );
    }

    // ─── /logs ──────────────────────────────────────
    else if (text === '/logs') {
      const logsText = logCache.length > 0 ? logCache.join('\n') : 'Nenhum log recente na memória.';
      await sendTelegram(`📋 <b>Últimos 20 Logs (memória):</b>\n\n<pre>${logsText}</pre>`);
    }

    // ─── Comando desconhecido ───────────────────────
    else if (text.startsWith('/')) {
      await sendTelegram(`❓ Comando não reconhecido. Use /ajuda para ver os comandos disponíveis.`);
    }

  } catch (err: any) {
    console.error('⚠️ [Telegram Webhook] Erro ao processar:', err.message);
    try {
      await sendTelegram(`🚨 <b>Erro ao processar comando:</b>\n<code>${err.message}</code>`);
    } catch { /* ignora erro ao reportar erro */ }
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
