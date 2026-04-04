import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from "@sentry/node";
import logger, { handleTelegramWebhook, setupTelegramWebhook } from './utils/logger.js';

// Inicializar Sentry (v10+)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
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
import otpRoutes from './routes/otp.js';
import adminRoutes from './routes/admin.js';
import scraperRoutes from './routes/scraper.js';
import paymentRoutes from './routes/payments.js';
import orderRoutes from './routes/orders.js';
import axios from 'axios';

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
        'https://reybraztech.pages.dev'
    ],
    credentials: true,
}));
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth', limiter);
app.use('/api/dashboard', limiter);
app.use('/api/otp', limiter);
app.use('/api/admin', limiter);
app.use('/api/orders', limiter);

// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/otp', otpRoutes);
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
                                    await axios.post(`${SCRAPER_URL}/run`, { action: 'sync' }, { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 300000 });
                                } catch (err: any) {
                                    await sendTelegram(`🚨 Erro: ${err.message}`);
                                }
                            }
                        } else if (data === 'cmd|status') {
                            const sql = await getDb();
                            let total = 0, ativos = 0;
                            let starhomeTotal = 0, starhomeAtivos = 0;
                            
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients`; total = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE status = 'Ativo'`; ativos = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_account IS NOT NULL`; starhomeTotal = r.total; } catch {}
                            try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_in_use = 'Ativo'`; starhomeAtivos = r.total; } catch {}
                            
                            await sendTelegram(
                                `📊 <b>Status Reybraztech</b>\n\n` +
                                `👥 <b>Usuários do App:</b>\n` +
                                `   📦 Total: ${total}\n` +
                                `   ✅ Ativos: ${ativos}\n` +
                                `   ❌ Inativos: ${total - ativos}\n\n` +
                                `🔐 <b>Clientes StarHome:</b>\n` +
                                `   📦 Total: ${starhomeTotal}\n` +
                                `   ✅ Ativos: ${starhomeAtivos}`
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
                    let total = 0, ativos = 0, inativos = 0;
                    let starhomeTotal = 0, starhomeAtivos = 0;
                    
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients`; total = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE status = 'Ativo'`; ativos = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_account IS NOT NULL`; starhomeTotal = r.total; } catch {}
                    try { const [r] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_in_use = 'Ativo'`; starhomeAtivos = r.total; } catch {}
                    
                    inativos = total - ativos;
                    
                    await sendTelegram(
                        `📊 <b>Status Reybraztech</b>\n\n` +
                        `👥 <b>Usuários do App:</b>\n` +
                        `   📦 Total: ${total}\n` +
                        `   ✅ Ativos: ${ativos}\n` +
                        `   ❌ Inativos: ${inativos}\n\n` +
                        `🔐 <b>Clientes StarHome:</b>\n` +
                        `   📦 Total: ${starhomeTotal}\n` +
                        `   ✅ Ativos: ${starhomeAtivos}\n` +
                        `   ❌ Inativos: ${starhomeTotal - starhomeAtivos}\n\n` +
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
                        await sendTelegram('⏳ Sincronização iniciada!\nO scraper está sendo executado...\n\nVocê receberá uma notificação quando concluir.');
                        try {
                            await axios.post(`${SCRAPER_URL}/run`, { action: 'sync' }, { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 300000 });
                        } catch (err: any) {
                            await sendTelegram(`🚨 Erro: ${err.message}`);
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

// ─── Iniciar servidor ────────────────────────────────────────
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        logger.info('🚀 ================================');
        logger.info(`🚀  Servidor Reybraztech Online!`);
        logger.info(`🚀  Porta: http://localhost:${PORT}`);
        logger.info('🚀 ================================');
        
        // Iniciar bot de polling (só no Render/local)
        startTelegramBot().catch(console.error);
    });
}

export default app;
