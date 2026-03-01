import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express.json());

// ─── Rotas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
