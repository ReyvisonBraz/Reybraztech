// ⚠️ IMPORTANTE: dotenv DEVE ser carregado ANTES de qualquer import
// que use variáveis de ambiente (como database.ts)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import otpRoutes from './routes/otp.js';

const app = express();
const PORT = process.env.PORT || 3001;

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

// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/otp', otpRoutes);

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
