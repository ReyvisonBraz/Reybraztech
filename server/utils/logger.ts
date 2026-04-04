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

  // ⚠️ Notificações automáticas DESATIVADAS para não lotar o Telegram
  // Se quiser ativar novamente, descomente as linhas abaixo:
  /*
  // Enviar erros automaticamente
  if (log.level === 'error') {
    sendTelegramNotification(log.message, 'error', log);
  } 
  // Enviar mensagens de sucesso que começam com ✅
  else if (log.level === 'info' && log.message.includes('✅')) {
    sendTelegramNotification(log.message, 'info');
  }
  */
});

// ==========================================
// 🤖 TELEGRAM BOT WEBHOOK (Serverless-friendly)
// ==========================================
// Antes usava Long Polling (perguntava ao Telegram a cada 5s).
// Agora usa Webhook: o Telegram ENVIA a mensagem para nós quando alguém manda um comando.
// Funciona perfeitamente em Serverless (Vercel).

import type { Request, Response } from 'express';

// Helper para enviar mensagem no Telegram
const sendTelegram = async (text: string, replyMarkup?: any) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined
  });
};

// Função de busca que funciona no servidor (sem Puppeteer)
const runSearchInServer = async (query: string, searchBy: string): Promise<void> => {
  // O Vercel não suporta Puppeteer, então busca no banco de dados local
  const getDb = async () => (await import('../database.js')).default;
  const sql = await getDb();
  
  let results;
  
  if (searchBy === 'buyer_name') {
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE buyer_name ILIKE ${'%' + query + '%'}
      ORDER BY days_remaining DESC
      LIMIT 5
    `;
  } else if (searchBy === 'phone') {
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE buyer_name LIKE ${'%' + query + '%'}
      ORDER BY days_remaining DESC
      LIMIT 5
    `;
  } else {
    // account
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE account = ${query}
      LIMIT 1
    `;
  }
  
  if (results.length === 0) {
    await sendTelegram(`❌ Cliente não encontrado: "${query}"\n\nTente buscar por outro termo ou use /sync para sincronizar.`);
    return;
  }
  
  for (const c of results) {
    await sendTelegram(
      `✅ <b>Cliente Encontrado!</b>\n\n` +
      `📋 <b>Account:</b> ${c.account}\n` +
      `👤 <b>Nome:</b> ${c.buyer_name}\n` +
      `🔑 <b>Senha:</b> ${c.password}\n` +
      `📦 <b>Pacote:</b> ${c.package_name}\n` +
      `⏰ <b>Dias restantes:</b> ${c.days_remaining}\n` +
      `📊 <b>Status:</b> ${c.in_use}\n` +
      `📅 <b>Expira:</b> ${c.expiration_date || 'N/A'}`
    );
  }
};

/**
 * Handler do Webhook — chamado pelo Telegram quando alguém envia uma mensagem ao bot.
 * Registrado como rota POST /api/telegram-webhook no index.ts
 */
export const handleTelegramWebhook = async (req: Request, res: Response) => {
  const adminChatId = process.env.TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!adminChatId) { 
    res.status(200).json({ ok: true });
    return; 
  }

  try {
    const update = req.body;
    console.log('[Telegram Webhook] Update recebido:', JSON.stringify(update).substring(0, 200));
    
    // ─── Callback Query (botões inline) ───
    const callbackQuery = update?.callback_query;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const callbackChatId = callbackQuery.message?.chat.id;
      console.log('[Telegram] Callback:', callbackData, 'Chat:', callbackChatId);
      
      if (callbackChatId?.toString() !== adminChatId) {
        res.status(200).json({ ok: true });
        return;
      }
      
      // Responde ao callback para remover o "loading"
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id
      });
      
      // Processa o callback - comandos do menu
      if (callbackData.startsWith('cmd|')) {
        const cmd = callbackData.replace('cmd|', '');
        
        console.log('[Telegram] Comando do menu:', cmd);
        
        // Executar o comando correspondente
        if (cmd === 'sync') {
          const scraperUrl = process.env.SCRAPER_URL;
          const scraperKey = process.env.SCRAPER_API_KEY;
          
          console.log('[Scraper] URL:', scraperUrl, 'Key:', scraperKey ? 'ok' : 'missing');
          
          if (!scraperUrl || !scraperKey) {
            await sendTelegram(`⚠️ <b>Scraper não configurado!</b>\n\nVariáveis SCRAPER_URL e SCRAPER_API_KEY não estão definidas no Vercel.`);
          } else {
            const startTime = Date.now();
            await sendTelegram(`⏳ Sincronização iniciada!\nO Render está sendo acordado...\n\nAguarde, você será notificado quando concluír.`);
            
            try {
              const response = await axios.post(
                `${scraperUrl}/run`,
                { action: 'sync' },
                { headers: { 'x-api-key': scraperKey }, timeout: 300000 }
              );
              
              const elapsed = Math.round((Date.now() - startTime) / 1000);
              
              if (elapsed > 8) {
                console.log(`[Scraper] Render estava hibernando (${elapsed}s para acordar)`);
              }
              
              console.log('[Scraper] Completed in', elapsed, 's');
            } catch (err: any) {
              console.error('[Scraper] Erro:', err.message);
              await sendTelegram(`🚨 <b>Erro ao executar scraper:</b>\n\n${err.message}`);
            }
          }
        } else if (cmd === 'status') {
          // Redireciona para o comando /status
          const getDb = async () => (await import('../database.js')).default;
          const sql = await getDb();

          let dbStatus = '❌ Offline';
          let dbTime = '';
          try {
            const [row] = await sql`SELECT NOW() as t`;
            dbStatus = '✅ Online';
            dbTime = new Date(row.t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          } catch {}

          let totalClientes = 0;
          let ativos = 0;
          let inativos = 0;
          let expiring = 0;
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients`;
            totalClientes = row.total;
          } catch {}
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Used'`;
            ativos = row.total;
          } catch {}
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Unused'`;
            inativos = row.total;
          } catch {}
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE days_remaining <= 7 AND days_remaining > 0`;
            expiring = row.total;
          } catch {}

          let lastSync = 'Nunca';
          try {
            const [row] = await sql`SELECT MAX(created_at) as last_sync FROM starhome_clients`;
            if (row.last_sync) {
              lastSync = new Date(row.last_sync).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            }
          } catch {}

          await sendTelegram(
            `📊 <b>Status Reybraztech</b>\n\n` +
            `🔄 <b>Última Sync:</b> ${lastSync}\n` +
            `📦 <b>Total Clientes:</b> ${totalClientes}\n` +
            `✅ <b>Ativos:</b> ${ativos}\n` +
            `❌ <b>Inativos:</b> ${inativos}\n` +
            `⚠️ <b>Expirando (7 dias):</b> ${expiring}\n\n` +
            `🗄️ <b>Banco:</b> ${dbStatus}\n` +
            `🕐 <b>Hora:</b> ${dbTime || 'N/A'}`
          );
        } else if (cmd === 'buscar') {
          await sendTelegram(`🔍 <b>Buscar Cliente</b>\n\nUse: /buscar [conta]\nExemplo: /buscar conta123`);
        } else if (cmd === 'expirando') {
          const getDb = async () => (await import('../database.js')).default;
          const sql = await getDb();

          const clients = await sql`
            SELECT account, buyer_name, package_name, days_remaining, expiration_date
            FROM starhome_clients
            WHERE days_remaining <= 7 AND days_remaining > 0
            ORDER BY days_remaining ASC
            LIMIT 15
          `;

          if (clients.length === 0) {
            await sendTelegram(`✅ <b>Nenhum cliente expirando em 7 dias!</b>`);
          } else {
            let list = '';
            for (const c of clients) {
              list += `\n• <b>${c.account}</b> - ${c.buyer_name}\n  📦 ${c.package_name} | ⏰ ${c.days_remaining} dias | 📅 ${c.expiration_date || 'N/A'}`;
            }
            await sendTelegram(
              `⚠️ <b>Clientes Expirando em 7 dias (${clients.length})</b>${list}\n\n` +
              `<i>Use /expirando [dias] para ver mais.</i>`
            );
          }
        } else if (cmd === 'inativos') {
          const getDb = async () => (await import('../database.js')).default;
          const sql = await getDb();

          const clients = await sql`
            SELECT account, buyer_name, package_name, days_remaining, expiration_date
            FROM starhome_clients
            WHERE in_use = 'Unused'
            ORDER BY created_at DESC
            LIMIT 15
          `;

          if (clients.length === 0) {
            await sendTelegram(`✅ <b>Nenhum cliente inativo!</b>`);
          } else {
            let list = '';
            for (const c of clients) {
              list += `\n• <b>${c.account}</b> - ${c.buyer_name}\n  📦 ${c.package_name} | 📅 ${c.expiration_date || 'N/A'}`;
            }
            await sendTelegram(
              `❌ <b>Clientes Inativos (${clients.length})</b>${list}\n\n` +
              `<i>Mostrando até 15. Use /buscar [conta] para detalhes.</i>`
            );
          }
        } else if (cmd === 'ajuda') {
          await sendTelegram(
            `🤖 <b>Ajuda Reybraztech</b>\n\n` +
            `🔄 /sync — Sincronizar clientes\n` +
            `📊 /status — Ver status geral\n` +
            `🔍 /buscar [conta] — Buscar cliente\n` +
            `⚠️ /expirando [dias] — Clientes próximos de expirar\n` +
            `❌ /inativos — Clientes inativos\n` +
            `❓ /menu — Mostrar menu`
          );
        }
        
        res.status(200).json({ ok: true });
        return;
      }
      
      // Processa callbacks de busca (search)
      const [action, type, query] = callbackData.split('|');
      
      if (action === 'search') {
        const searchBy = type;
        const searchQuery = decodeURIComponent(query);
        
        await sendTelegram(`🔍 <b>Buscando "${searchQuery}"</b> por ${searchBy}...`);
        
        try {
          await runSearchInServer(searchQuery, searchBy);
        } catch (err: any) {
          await sendTelegram(`❌ Erro na busca: ${err.message}`);
        }
      }
      
      res.status(200).json({ ok: true });
      return;
    }

    // ─── Mensagem de texto ───
    const message = update?.message;
    if (!message?.text) { res.status(200).json({ ok: true }); return; }

    // Segurança: só responde ao dono do sistema
    if (message.chat.id.toString() !== adminChatId) {
      res.status(200).json({ ok: true });
      return;
    }

    const text = message.text.trim();

    // Ignora mensagens que não são comandos
    if (!text.startsWith('/')) {
      res.status(200).json({ ok: true });
      return;
    }

    const textLower = text.toLowerCase();

    // Importa o banco só quando precisa (lazy import para serverless)
    const getDb = async () => (await import('../database.js')).default;

    // ─── /ajuda ─────────────────────────────────────
    if (textLower === '/ajuda' || textLower === '/help' || textLower === '/start') {
      await sendTelegram(
        `🤖 <b>Comandos Reybraztech</b>\n\n` +
        `📊 <b>Monitoramento:</b>\n` +
        `• /status — Saúde geral do sistema\n` +
        `• /expirando [dias] — Clientes expirando\n` +
        `• /inativos — Clientes inativos\n\n` +
        `🔄 <b>Scraper:</b>\n` +
        `• /sync — Sincronizar clientes (via Render)\n` +
        `• /buscar [conta] — Buscar cliente\n\n` +
        `🔧 <b>Outros:</b>\n` +
        `• /menu — Menu interativo\n` +
        `• /logs — Últimos logs\n` +
        `• /ajuda — Esta mensagem\n\n` +
        `💡 Use os botões do menu para ações rápidas!`
      );
    }

    // ─── /status ────────────────────────────────────
    else if (textLower === '/status') {
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
    else if (textLower === '/clientes') {
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
    else if (textLower === '/pagamentos') {
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
    else if (textLower === '/otp') {
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

    // ─── /trials ─────────────────────────────────────
    else if (textLower === '/trials') {
      const sql = await getDb();

      const trials = await sql`
        SELECT id, name, whatsapp, device, created_at
        FROM pending_orders
        WHERE plan = 'trial' AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      if (trials.length === 0) {
        await sendTelegram(`🎁 <b>Trials Pendentes</b>\n\nNenhum trial aguardando aprovação.`);
      } else {
        let list = '';
        for (const t of trials) {
          const data = new Date(t.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          list += `\n• <b>${t.name}</b>\n  📱 ${t.whatsapp} | 🖥️ ${t.device || 'N/A'}\n  🆔 <code>${t.id}</code> | ${data}\n`;
        }
        await sendTelegram(
          `🎁 <b>Trials Pendentes (${trials.length})</b>\n${list}\n` +
          `Para aprovar, envie:\n<code>/aprovar ID</code>`
        );
      }
    }

    // ─── /aprovar [id] ──────────────────────────────
    else if (textLower.startsWith('/aprovar')) {
      const sql = await getDb();
      const parts = message.text.trim().split(/\s+/);
      const trialId = parts[1];

      if (!trialId) {
        await sendTelegram(`⚠️ Use: <code>/aprovar ID</code>\n\nVeja os IDs com /trials`);
      } else {
        const [order] = await sql`
          SELECT id, name, whatsapp, status
          FROM pending_orders
          WHERE id = ${trialId} AND plan = 'trial'
        `;

        if (!order) {
          await sendTelegram(`❌ Trial <code>${trialId}</code> não encontrado.`);
        } else if (order.status !== 'pending') {
          await sendTelegram(`ℹ️ Trial de <b>${order.name}</b> já está com status: <b>${order.status}</b>`);
        } else {
          await sql`
            UPDATE pending_orders
            SET status = 'paid', paid_at = NOW()
            WHERE id = ${trialId}
          `;
          await sendTelegram(
            `✅ <b>Trial Aprovado!</b>\n\n` +
            `👤 <b>Nome:</b> ${order.name}\n` +
            `📱 <b>WhatsApp:</b> ${order.whatsapp}\n` +
            `🆔 <b>ID:</b> <code>${trialId}</code>\n\n` +
            `O cliente já pode completar o cadastro.`
          );
        }
      }
    }

    // ─── /logs ──────────────────────────────────────
    else if (textLower === '/logs') {
      const logsText = logCache.length > 0 ? logCache.join('\n') : 'Nenhum log recente na memória.';
      await sendTelegram(`📋 <b>Últimos 20 Logs (memória):</b>\n\n<pre>${logsText}</pre>`);
    }

    // ─── /menu ──────────────────────────────────────
    else if (textLower === '/menu' || textLower === '/start') {
      await sendTelegram(
        `🤖 <b>Menu Reybraztech</b>\n\nEscolha uma opção:`,
        {
          inline_keyboard: [
            [{ text: '🔄 Sincronizar', callback_data: 'cmd|sync' }],
            [{ text: '📊 Status', callback_data: 'cmd|status' }],
            [{ text: '🔍 Buscar Cliente', callback_data: 'cmd|buscar' }],
            [{ text: '⚠️ Expirando', callback_data: 'cmd|expirando' }],
            [{ text: '❌ Inativos', callback_data: 'cmd|inativos' }],
            [{ text: '❓ Ajuda', callback_data: 'cmd|ajuda' }]
          ]
        }
      );
    }

    // ─── /status ────────────────────────────────────
    else if (textLower === '/status') {
      const sql = await getDb();

      // Testa conexão com banco
      let dbStatus = '❌ Offline';
      let dbTime = '';
      try {
        const [row] = await sql`SELECT NOW() as t`;
        dbStatus = '✅ Online';
        dbTime = new Date(row.t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      } catch { /* mantém offline */ }

      // Conta clientes
      let totalClientes = 0;
      let ativos = 0;
      let inativos = 0;
      let expiring = 0;
      try {
        const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients`;
        totalClientes = row.total;
      } catch { /* ignora */ }
      try {
        const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Used'`;
        ativos = row.total;
      } catch { /* ignora */ }
      try {
        const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Unused'`;
        inativos = row.total;
      } catch { /* ignora */ }
      try {
        const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE days_remaining <= 7 AND days_remaining > 0`;
        expiring = row.total;
      } catch { /* ignora */ }

      // Última sincronização
      let lastSync = 'Nunca';
      try {
        const [row] = await sql`SELECT MAX(created_at) as last_sync FROM starhome_clients`;
        if (row.last_sync) {
          lastSync = new Date(row.last_sync).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        }
      } catch { /* ignora */ }

      await sendTelegram(
        `📊 <b>Status Reybraztech</b>\n\n` +
        `🔄 <b>Última Sync:</b> ${lastSync}\n` +
        `📦 <b>Total Clientes:</b> ${totalClientes}\n` +
        `✅ <b>Ativos:</b> ${ativos}\n` +
        `❌ <b>Inativos:</b> ${inativos}\n` +
        `⚠️ <b>Expirando (7 dias):</b> ${expiring}\n\n` +
        `🗄️ <b>Banco:</b> ${dbStatus}\n` +
        `🕐 <b>Hora:</b> ${dbTime || 'N/A'}`
      );
    }

    // ─── /expirando [dias] ───────────────────────────
    else if (text.startsWith('/expirando')) {
      const sql = await getDb();
      const parts = message.text.trim().split(/\s+/);
      const days = parseInt(parts[1]) || 7;

      const clients = await sql`
        SELECT account, buyer_name, package_name, days_remaining, expiration_date
        FROM starhome_clients
        WHERE days_remaining <= ${days} AND days_remaining > 0
        ORDER BY days_remaining ASC
        LIMIT 15
      `;

      if (clients.length === 0) {
        await sendTelegram(`✅ <b>Nenhum cliente expirando em ${days} dias!</b>`);
      } else {
        let list = '';
        for (const c of clients) {
          list += `\n• <b>${c.account}</b> - ${c.buyer_name}\n  📦 ${c.package_name} | ⏰ ${c.days_remaining} dias | 📅 ${c.expiration_date || 'N/A'}`;
        }
        await sendTelegram(
          `⚠️ <b>Clientes Expirando em ${days} dias (${clients.length})</b>${list}\n\n` +
          `<i>Use /expirando [dias] para ver mais.</i>`
        );
      }
    }

    // ─── /inativos ──────────────────────────────────
    else if (textLower === '/inativos') {
      const sql = await getDb();

      const clients = await sql`
        SELECT account, buyer_name, package_name, days_remaining, expiration_date
        FROM starhome_clients
        WHERE in_use = 'Unused'
        ORDER BY created_at DESC
        LIMIT 15
      `;

      if (clients.length === 0) {
        await sendTelegram(`✅ <b>Nenhum cliente inativo!</b>`);
      } else {
        let list = '';
        for (const c of clients) {
          list += `\n• <b>${c.account}</b> - ${c.buyer_name}\n  📦 ${c.package_name} | 📅 ${c.expiration_date || 'N/A'}`;
        }
        await sendTelegram(
          `❌ <b>Clientes Inativos (${clients.length})</b>${list}\n\n` +
          `<i>Mostrando até 15. Use /buscar [conta] para detalhes.</i>`
        );
      }
    }

    // ─── /sync ──────────────────────────────────────
    else if (textLower === '/sync') {
      const scraperUrl = process.env.SCRAPER_URL;
      const scraperKey = process.env.SCRAPER_API_KEY;

      console.log('[Sync] URL:', scraperUrl, 'Key:', scraperKey ? 'ok' : 'missing');

      if (!scraperUrl || !scraperKey) {
        await sendTelegram(
          `⚠️ <b>Scraper não configurado!</b>\n\n` +
          `Variáveis SCRAPER_URL e SCRAPER_API_KEY não estão definidas no Vercel.`
        );
        return;
      }

      // Envia confirmação imediata
      await sendTelegram(
        `🔄 <b>Sincronização iniciada!</b>\n\n` +
        `O Render está sendo acordado...\n` +
        `Aguarde, você será notificado quando concluír.`
      );

      const startTime = Date.now();

      try {
        const response = await axios.post(
          `${scraperUrl}/run`,
          { action: 'sync' },
          {
            headers: { 'x-api-key': scraperKey },
            timeout: 300000
          }
        );
        
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        if (elapsed > 8) {
          await sendTelegram(`💤 <b>Render estava hibernando</b>\n\nTempo para acordar: ${elapsed}s\n\nO scraper está executando...`);
        }
        
        console.log('[Sync] Completed in', elapsed, 's');
      } catch (err: any) {
        console.error('[Sync] Erro:', err.message);
        await sendTelegram(
          `🚨 <b>Erro ao executar scraper:</b>\n\n${err.message}`
        );
      }
    }

    // ─── /buscar ─────────────────────────────────────
    else if (textLower.startsWith('/buscar') || textLower.startsWith('/search') || textLower.startsWith('/busca')) {
      const originalText = req.body?.message?.text?.trim() || text;
      const queryMatch = originalText.match(/\/buscar\s+(.+)|\/search\s+(.+)|\/busca\s+(.+)/i);
      
      let query = '';
      let explicitType = '';
      
      if (queryMatch) {
        query = (queryMatch[1] || queryMatch[2] || queryMatch[3] || '').trim();
      }
      
      if (originalText.match(/--account|--conta/i)) {
        explicitType = 'account';
      } else if (originalText.match(/--nome|--name/i)) {
        explicitType = 'buyer_name';
      } else if (originalText.match(/--telefone|--phone/i)) {
        explicitType = 'phone';
      }
      
      if (!query) {
        await sendTelegram(
          '🔍 <b>Como deseja buscar?</b>\n\n' +
          'Use: /buscar [conta]\n' +
          'Exemplos:\n' +
          '• /buscar conta123\n' +
          '• /buscar "João Silva"\n' +
          '• /buscar 11999999999\n\n' +
          'Também pode especificar:\n' +
          '• /buscar conta123 --account\n' +
          '• /buscar "João Silva" --nome\n' +
          '• /buscar 11999999999 --telefone'
        );
        return;
      }
      
      // Se especificado explicitamente, usar o scraper do Render
      if (explicitType) {
        const scraperUrl = process.env.SCRAPER_URL;
        const scraperKey = process.env.SCRAPER_API_KEY;
        
        const startTime = Date.now();
        await sendTelegram(`🔍 <b>Buscando "${query}"</b> por ${explicitType}...\n\nO Render está sendo acordado...`);
        
        if (scraperUrl && scraperKey) {
          try {
            await axios.post(
              `${scraperUrl}/run`,
              { action: 'search', query, searchBy: explicitType },
              { headers: { 'x-api-key': scraperKey }, timeout: 60000 }
            );
            
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            if (elapsed > 5) {
              console.log('[Search] Render estava hibernando (', elapsed, 's)');
            }
          } catch (err: any) {
            await sendTelegram(`❌ Erro na busca: ${err.message}`);
          }
        } else {
          // Fallback para busca no banco
          try {
            await runSearchInServer(query, explicitType);
          } catch (err: any) {
            await sendTelegram(`❌ Erro: ${err.message}`);
          }
        }
        return;
      }
      
      // Mostrar botões inline para escolher tipo de busca
      await sendTelegram(
        `🔍 <b>Buscando "${query}"</b>\n\nSelecione o tipo de busca:`,
        {
          inline_keyboard: [
            [{ text: '👤 Nome (Buyer Name)', callback_data: `search|buyer_name|${encodeURIComponent(query)}` }],
            [{ text: '🔑 Conta (Account)', callback_data: `search|account|${encodeURIComponent(query)}` }],
            [{ text: '📱 Telefone', callback_data: `search|phone|${encodeURIComponent(query)}` }]
          ]
        }
      );
      return;
    }

    // ─── Comando desconhecido ───────────────────────
    else if (textLower.startsWith('/')) {
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
