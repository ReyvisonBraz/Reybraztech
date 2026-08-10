import * as Sentry from "@sentry/node";
import logger, { handleTelegramWebhook, setupTelegramWebhook } from './utils/logger.js';

// Só carregar dotenv se necessário (para desenvolvimento local)
if (!process.env.DATABASE_URL) {
  const dotenv = await import('dotenv');
  dotenv.config();
}

// Inicializar Sentry (v10+)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
}

// O servidor NÃO pode rodar sem essas variáveis
const REQUIRED_ENV = ['JWT_SECRET'];

for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
        logger.error(`❌ ERRO FATAL: Variável "${key}" não encontrada no .env!`);
        process.exit(1); // fecha o servidor imediatamente
    }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import scraperRoutes from './routes/scraper.js';
import paymentRoutes from './routes/payments.js';
import orderRoutes from './routes/orders.js';
import axios from 'axios';
import { ensureTables, default as sql } from './database.js';
import { sendWhatsApp } from './services/whatsapp.js';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Configuração de Proxy (Render/AWS) ─────────────────────
app.set('trust proxy', 1);

// ─── Middlewares ────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://reybraztech.pages.dev',
        'https://reybraztech.vercel.app',
    ],
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // era 50 — adequado para polling do frontend
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit dedicado para login — máx. 10 tentativas por 15min por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // só conta tentativas que falharam
});

// Rate limit para webhook — isolado dos demais
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Muitas requisições.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit dedicado para registro — 20 req/15min
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Muitas tentativas de cadastro. Aguarde 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', limiter);
app.use('/api/dashboard', limiter);
app.use('/api/admin', limiter);
app.use('/api/orders', limiter);
app.use('/api/payments/webhook', webhookLimiter);
app.use('/api/auth/register', registerLimiter);

// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', scraperRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);

// Telegram Bot (Webhook — funciona no Vercel)
app.post('/api/telegram-webhook', handleTelegramWebhook);
app.get('/api/telegram-setup', setupTelegramWebhook);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Servidor Reybraztech rodando!' });
});

// Rota de teste de erro
app.get('/api/test-error', (req, res) => {
    logger.error('Isto é um erro de teste disparado manualmente!');
    throw new Error('Erro de teste para o Sentry e Telegram!');
});

if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`Erro na rota ${req.method} ${req.path}:`, err);
    
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: true,
        message: process.env.NODE_ENV === 'production' 
            ? 'Ocorreu um erro interno no servidor.' 
            : err.message
    });
});

// ==========================================
// 🤖 TELEGRAM BOT POLLING (só no Render)
// ==========================================
async function startTelegramBot() {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TOKEN || !CHAT_ID) {
        console.log('⚠️ Telegram bot não configurado (faltam env vars)');
        return;
    }

    const LAST_UPDATE_FILE = '.last_update_id';
    let lastUpdateId = 0;
    
    try {
        const fs = await import('fs');
        if (fs.existsSync(LAST_UPDATE_FILE)) {
            lastUpdateId = parseInt(fs.readFileSync(LAST_UPDATE_FILE, 'utf-8'));
        }
    } catch {}

    async function saveUpdateId(id: number) {
        try {
            const fs = await import('fs');
            fs.writeFileSync(LAST_UPDATE_FILE, id.toString());
        } catch {}
    }

    async function sendTelegram(text: string, replyMarkup?: any) {
        try {
            await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup || undefined
            });
        } catch (err: any) {
            console.error('❌ Erro Telegram:', err.message);
        }
    }

    async function getDb() {
        const db = await import('./database.js');
        return db.default;
    }

    console.log('🤖 Bot Telegram iniciado (polling)...');

    while (true) {
        try {
            const response = await axios.get(`https://api.telegram.org/bot${TOKEN}/getUpdates`, {
                params: { offset: lastUpdateId + 1, timeout: 30 }
            });
            
            const updates = response.data.result;
            
            for (const update of updates) {
                const updateId = update.update_id;
                
                // Callback query (botões inline)
                if (update.callback_query) {
                    const data = update.callback_query.data;
                    const cbChatId = update.callback_query.message?.chat.id;
                    
                    if (cbChatId?.toString() === CHAT_ID) {
                        await axios.post(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
                            callback_query_id: update.callback_query.id
                        });
                        
                        if (data === 'cmd|sync') {
                            const SCRAPER_URL = process.env.SCRAPER_URL;
                            const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
                            
                            if (SCRAPER_URL && SCRAPER_KEY) {
                                await sendTelegram('⏳ Sincronização iniciada!\nO scraper está sendo executado...\n\nVocê receberá uma notificação quando concluir.');
                                try {
                                    await axios.post(`${SCRAPER_URL}/run`, { action: 'sync' }, { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 600000 });
                                } catch (err: any) {
                                    await sendTelegram(`🚨 Erro: ${err.message}`);
                                }
                            }
                        } else if (data === 'cmd|status') {
                            const sql = await getDb();
                            let total = 0, ativos = 0;
                            let starhomeAtivos = 0;
                            let expiring = 0;
                            
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients`; total = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE status = 'Ativo'`; ativos = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_in_use = 'Ativo'`; starhomeAtivos = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_days_remaining <= 7 AND starhome_days_remaining > 0`; expiring = r.total; } catch {}
                            
                            await sendTelegram(
                                `📊 <b>Status Reybraztech</b>\n\n` +
                                `👥 Total de Clientes: ${total}\n` +
                                `✅ Ativos: ${ativos}\n` +
                                `❌ Inativos: ${total - ativos}\n\n` +
                                `🔐 StarHome:\n` +
                                `   ⏰ Ativos: ${starhomeAtivos}\n` +
                                `   ⚠️ Expirando em 7 dias: ${expiring}`
                            );
                        }
                    }
                    await saveUpdateId(updateId);
                    continue;
                }

                // Mensagem de texto
                const msg = update.message;
                if (!msg?.text) { await saveUpdateId(updateId); continue; }
                
                const chatId = msg.chat.id;
                if (chatId.toString() !== CHAT_ID) { await saveUpdateId(updateId); continue; }
                
                const text = msg.text.trim();
                const textLower = text.toLowerCase();
                
                console.log('📩 Comando:', text);
                
                // /ajuda
                if (textLower === '/ajuda' || textLower === '/help' || textLower === '/start') {
                    await sendTelegram(`🤖 <b>Comandos</b>\n\n• /status — Status\n• /sync — Sincronizar\n• /buscar [conta] — Buscar\n• /menu — Menu\n• /ajuda — Ajuda`);
                }
                // /status
                else if (textLower === '/status') {
                    const sql = await getDb();
                    let total = 0, ativos = 0;
                    let starhomeAtivos = 0;
                    let expiring = 0;
                    
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients`; total = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE status = 'Ativo'`; ativos = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_in_use = 'Ativo'`; starhomeAtivos = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_days_remaining <= 7 AND starhome_days_remaining > 0`; expiring = r.total; } catch {}
                    
                    await sendTelegram(
                        `📊 <b>Status Reybraztech</b>\n\n` +
                        `👥 <b>Total de Clientes:</b> ${total}\n` +
                        `✅ <b>Ativos:</b> ${ativos}\n` +
                        `❌ <b>Inativos:</b> ${total - ativos}\n\n` +
                        `🔐 <b>StarHome:</b>\n` +
                        `   ⏰ Ativos no StarHome: ${starhomeAtivos}\n` +
                        `   ⚠️ Expirando em 7 dias: ${expiring}\n\n` +
                        `🤖 Bot: OK`
                    );
                }
                // /sync
                else if (textLower === '/sync' || textLower === '/sincronizar') {
                    const SCRAPER_URL = process.env.SCRAPER_URL;
                    const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
                    
                    if (!SCRAPER_URL || !SCRAPER_KEY) {
                        await sendTelegram('⚠️ Scraper não configurado!');
                    } else {
                        await sendTelegram('🔄 <b>Sincronização iniciada!</b>\n\nEtapa 1/4: Requisição recebida ✅');
                        
                        // Try to wake up Render first with a health check
                        try {
                            await sendTelegram('⏰ Etapa 2/4: Acordando servidor...\n(Isso pode levar até 30 segundos)');
                            await axios.get(`${SCRAPER_URL}/health`, { timeout: 35000 });
                            await sendTelegram('✅ Servidor acordou! Iniciando scraper...');
                        } catch (err: any) {
                            const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
                            if (isTimeout) {
                                await sendTelegram('⏳ Servidor hibernando, continuando mesmo assim...');
                            } else {
                                await sendTelegram(`⚠️ Servidor não respondeu: ${err.message}\nTentando executar mesmo assim...`);
                            }
                        }
                        
                        try {
                            await sendTelegram('🔄 Etapa 3/4: Executando scraper...\n(Aguarde, isso pode levar alguns minutos)');
                            const startTime = Date.now();
                            await axios.post(`${SCRAPER_URL}/run`, { action: 'sync' }, { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 600000 });
                            const duration = Math.round((Date.now() - startTime) / 1000);
                            await sendTelegram(`✅ <b>Etapa 4/4: Concluído!</b>\n\n⏱️ Tempo total: ${duration}s\n\nUse /status para ver os dados atualizados.`);
                        } catch (err: any) {
                            await sendTelegram(`🚨 <b>Erro na sincronização:</b>\n\n${err.message}`);
                        }
                    }
                }
                // /buscar
                else if (textLower.startsWith('/buscar') || textLower.startsWith('/search')) {
                    const query = text.replace(/\/buscar\s+|\/search\s+/i, '').trim();
                    if (!query) {
                        await sendTelegram('Use: /buscar [nome, whatsapp ou account StarHome]\nEx: /buscar 11999999999');
                    } else {
                        const sql = await getDb();
                        const results = await sql`
                            SELECT name, whatsapp, plan, status, 
                                   starhome_account, starhome_package, starhome_days_remaining, starhome_in_use
                            FROM clients 
                            WHERE whatsapp LIKE ${'%' + query + '%'} 
                               OR name ILIKE ${'%' + query + '%'}
                               OR starhome_account LIKE ${'%' + query + '%'}
                            LIMIT 1
                        `;
                        
                        if (results.length > 0) {
                            const c = results[0];
                            let response = `✅ <b>Cliente</b>\n\n`;
                            response += `👤 Nome: ${c.name || 'N/A'}\n`;
                            response += `📱 WhatsApp: ${c.whatsapp || 'N/A'}\n`;
                            response += `📦 Plano App: ${c.plan || 'N/A'}\n`;
                            response += `📊 Status App: ${c.status || 'N/A'}\n`;
                            
                            if (c.starhome_account) {
                                response += `\n🔐 <b>Dados StarHome:</b>\n`;
                                response += `   📋 Account: ${c.starhome_account}\n`;
                                response += `   📦 Plano: ${c.starhome_package || 'N/A'}\n`;
                                response += `   ⏰ Dias: ${c.starhome_days_remaining || 0}\n`;
                                response += `   📊 Status: ${c.starhome_in_use || 'N/A'}`;
                            }
                            
                            await sendTelegram(response);
                        } else {
                            await sendTelegram(`❌ Cliente não encontrado: ${query}`);
                        }
                    }
                }
                // /menu
                else if (textLower === '/menu') {
                    await sendTelegram('📋 Menu', {
                        inline_keyboard: [
                            [{ text: '🔄 Sync', callback_data: 'cmd|sync' }],
                            [{ text: '📊 Status', callback_data: 'cmd|status' }]
                        ]
                    });
                }
                // /logs
                else if (textLower === '/logs') {
                    const sql = await getDb();
                    try {
                        const recentLogs = await sql`
                            SELECT id, action, whatsapp, details, created_at
                            FROM login_logs
                            ORDER BY created_at DESC
                            LIMIT 10
                        `;
                        
                        if (recentLogs.length === 0) {
                            await sendTelegram('📋 <b>Logs de Login</b>\n\nNenhum registro encontrado.');
                        } else {
                            let text = '📋 <b>Últimos 10 Eventos de Login/Cadastro:</b>\n\n';
                            for (const log of recentLogs) {
                                const date = new Date(log.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                                const icon = log.action === 'login' ? '🔑' : log.action === 'register' ? '🆕' : log.action === 'failed_login' ? '❌' : 'ℹ️';
                                text += `${icon} <b>${log.action}</b>\n`;
                                text += `   📱 ${log.whatsapp || 'N/A'}\n`;
                                text += `   📝 ${log.details || 'N/A'}\n`;
                                text += `   🕐 ${date}\n\n`;
                            }
                            await sendTelegram(text);
                        }
                    } catch (err: any) {
                        // Tabela pode não existir ainda
                        if (err.message?.includes('relation') && err.message?.includes('does not exist')) {
                            await sendTelegram('📋 <b>Logs de Login</b>\n\nTabela ainda não criada. Logs serão salvos a partir do próximo login.');
                        } else {
                            await sendTelegram(`⚠️ Erro ao buscar logs: ${err.message}`);
                        }
                    }
                }
                
                await saveUpdateId(updateId);
            }
            
            if (updates.length > 0) {
                lastUpdateId = updates[updates.length - 1].update_id;
            }
            
        } catch (err: any) {
            console.error('❌ Erro polling:', err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// ==========================================
// ⏰ CRON DE LEMBRETES AUTOMÁTICOS (só no Render)
// Horários BRT: 9h, 12h, 15h, 18h
// ==========================================
function startReminderCron() {
    const isProduction = process.env.NODE_ENV === 'production' && !process.env.VERCEL;
    if (!isProduction) {
        logger.info('⏰ Cron de lembretes desativado (não é produção Render)');
        return;
    }

    const CLIENT_ID = process.env.SENDPULSE_CLIENT_ID;
    const CLIENT_SECRET = process.env.SENDPULSE_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        logger.warn('⚠️ Cron de lembretes: SendPulse não configurado (SENDPULSE_CLIENT_ID/CLIENT_SECRET)');
        return;
    }

    // Horários BRT (UTC-3): 9h = 12h UTC, 12h = 15h UTC, 15h = 18h UTC, 18h = 21h UTC
    cron.schedule('0 12,15,18,21 * * *', async () => {
        logger.info('⏰ Executando cron de lembretes...');
        try {
            const expiringClients = await sql`
                SELECT id, name, whatsapp, plan,
                    CASE
                      WHEN starhome_expiration_date IS NOT NULL
                      THEN GREATEST(0, (starhome_expiration_date::date - CURRENT_DATE)::int)
                      ELSE days_remaining
                    END AS days_remaining
                FROM clients
                WHERE status = 'Ativo'
                AND (
                    CASE
                      WHEN starhome_expiration_date IS NOT NULL
                      THEN GREATEST(0, (starhome_expiration_date::date - CURRENT_DATE)::int)
                      ELSE days_remaining
                    END IN (7, 3, 1, 0)
                )
            `;

            if (expiringClients.length === 0) {
                logger.info('⏰ Nenhum cliente para lembrar neste ciclo.');
                return;
            }

            logger.info(`⏰ Enviando ${expiringClients.length} lembretes...`);
            let sent = 0;
            let failed = 0;

            for (const client of expiringClients) {
                const days = client.days_remaining;
                const msg = days <= 0
                    ? `Olá ${client.name}! 👋\n\nSeu plano *${client.plan}* expirou. Renove agora para continuar usando nossos serviços!\n\nFale comigo para renovar. 🚀`
                    : `Olá ${client.name}! 👋\n\nSeu plano *${client.plan}* vence em *${days} dia${days === 1 ? '' : 's'}*. Renove com antecedência e não perca o acesso!\n\nFale comigo para renovar. 🚀`;

                try {
                    const ok = await sendWhatsApp(client.whatsapp, msg);
                    if (ok) sent++;
                    else failed++;
                } catch {
                    failed++;
                }
                // Pequena pausa entre envios para não sobrecarregar a API
                await new Promise(r => setTimeout(r, 1500));
            }

            logger.info(`⏰ Cron concluído: ${sent} enviados, ${failed} falhas`);
        } catch (err: any) {
            logger.error('⏰ Erro no cron de lembretes:', err.message);
        }
    }, { timezone: 'Etc/UTC' });

    logger.info('⏰ Cron de lembretes agendado: 9h, 12h, 15h, 18h (BRT)');
}

// ─── Iniciar servidor ────────────────────────────────────────
if (!process.env.VERCEL) {
    app.listen(PORT, async () => {
        logger.info('🚀 ================================');
        logger.info(`🚀  Servidor Reybraztech Online!`);
        logger.info(`🚀  Porta: http://localhost:${PORT}`);
        logger.info('🚀 ================================');
        
        // Garantir que tabelas existam (apenas no Render/local, não na Vercel)
        await ensureTables();
        
        // Iniciar bot de polling (só no Render/local)
        startTelegramBot().catch(console.error);
        
        // Iniciar cron de lembretes (só no Render)
        startReminderCron();
    });
}

export default app;
