// server/database.ts
import dotenv from 'dotenv';
dotenv.config(); // Carrega .env ANTES de ler DATABASE_URL

import postgres from 'postgres';
import logger from './utils/logger.js';

// A CONNECTION STRING vem do .env (segredo!)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL não definida no .env!');
  throw new Error('❌ DATABASE_URL não definida no .env!');
}

// Cria a conexão principal com o banco
// prepare: false é OBRIGATÓRIO para Transaction Pooler do Supabase (usado na Vercel)
const sql = postgres(connectionString, {
  ssl: 'require',    // Supabase exige SSL
  max: 10,           // máximo de 10 conexões simultâneas
  idle_timeout: 20,
  prepare: false,    // Transaction pooler não suporta prepared statements
});

logger.info('✅ Conectado ao Supabase (PostgreSQL)!');

// Criar tabelas automaticamente se não existirem
export async function ensureTables() {
  try {
    // Tabela login_logs
    await sql`
      CREATE TABLE IF NOT EXISTS login_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(50) NOT NULL,
        whatsapp VARCHAR(20),
        email VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    
    // Índices para login_logs
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_whatsapp ON login_logs(whatsapp)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_login_logs_action ON login_logs(action)`.catch(() => {});
    
    logger.info('✅ Tabelas verificadas/criadas automaticamente');
  } catch (err: any) {
    logger.error('⚠️ Erro ao criar tabelas:', err.message);
  }
}

export default sql;