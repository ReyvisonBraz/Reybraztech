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
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Configuração de Proxy (Render/AWS) ─────────────────────
// Necessário para que o Rate Limit pegue o IP real do usuário, 
// não o IP do proxy do serviço de hospedagem.
app.set('trust proxy', 1);

// ─── Middlewares ────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://reybraztech.pages.dev' // Adicione o seu link do Cloudflare Pages aqui
    ],
    credentials: true,
}));
app.use(express.json());

// 🛡️ Segurança HTTP com Helmet
app.use(helmet());

// 🛡️ Prevenção contra força bruta ou tráfego excessivo (Rate Limit)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Limita a 100 requisições por IP a cada 15 minutos
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
    standardHeaders: true, // Retorna os headers `RateLimit-*`
    legacyHeaders: false, // Desabilita o cabeçalho `X-RateLimit-*`
});

// Aplica o Rate Limit em todas as rotas (pode ser ajustado apenas para /api/auth se desejar)
app.use('/api/', limiter);

// ─── Rastreamento de Erros (Sentry) ──────────────────────────
// Sentry v10+ captura automaticamente a maior parte das coisas com init


// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Telegram Bot (Webhook — funciona em Serverless)
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

// O handler de erros do Sentry v10+ deve vir antes dos outros middlewares de erro
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

// ─── Iniciar servidor ────────────────────────────────────────
// Só inicializa o servidor na porta localmente se não estiver na Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        logger.info('🚀 ================================');
        logger.info(`🚀  Servidor Reybraztech Online!`);
        logger.info(`🚀  Porta: http://localhost:${PORT}`);
        logger.info('🚀 ================================');
    });
}

// Exportar para que a Vercel Serverless Functions possa usar o Express
export default app;
