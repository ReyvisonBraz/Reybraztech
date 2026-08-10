// server/database.ts
// NÃO usar dotenv aqui - as variáveis já vêm do sistema (Render/Vercel)

import postgres from 'postgres';
import logger from './utils/logger.js';

// Log para debug
console.log('[DB] DATABASE_URL está definida?', !!process.env.DATABASE_URL);

// A CONNECTION STRING vem das variáveis de ambiente do sistema
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[DB] DATABASE_URL não encontrada!');
  throw new Error('❌ DATABASE_URL não definida!');
}

const useSsl = process.env.DATABASE_SSL !== 'false';

// Cria a conexão principal com o banco
// prepare: false é OBRIGATÓRIO para Transaction Pooler do Supabase (usado na Vercel)
const sql = postgres(connectionString, {
  ssl: useSsl ? 'require' : false,
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
    
    // Tabela renewal_jobs — fila de renovação StarHome (modelo híbrido pool + fila assíncrona)
    await sql`
      CREATE TABLE IF NOT EXISTS renewal_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        order_id TEXT REFERENCES pending_orders(id) ON DELETE SET NULL,
        starhome_account TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'queued',
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_renewal_jobs_pending ON renewal_jobs (status, next_attempt_at)`.catch(() => {});
    
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE`.catch(() => {});

    logger.info('✅ Tabelas verificadas/criadas automaticamente');
  } catch (err: any) {
    logger.error('⚠️ Erro ao criar tabelas:', err.message);
  }
}

export default sql;
