// ⚠️ IMPORTANTE: dotenv DEVE ser carregado ANTES de qualquer import
// que use variáveis de ambiente (como database.ts)
import dotenv from 'dotenv';
dotenv.config();

// O servidor NÃO pode rodar sem essas variáveis
const REQUIRED_ENV = ['JWT_SECRET'];

for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
        console.error(`❌ ERRO FATAL: Variável "${key}" não encontrada no .env!`);
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
    max: 100, // Limita a 100 requisições por IP a cada 15 minutos
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
    standardHeaders: true, // Retorna os headers `RateLimit-*`
    legacyHeaders: false, // Desabilita o cabeçalho `X-RateLimit-*`
});

// Aplica o Rate Limit em todas as rotas (pode ser ajustado apenas para /api/auth se desejar)
app.use('/api/', limiter);


// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Servidor Reybraztech rodando!' });
});

// ─── Iniciar servidor ────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log(`🚀  Servidor Reybraztech Online!`);
    console.log(`🚀  Porta: http://localhost:${PORT}`);
    console.log('🚀 ================================');
    console.log('');
});
