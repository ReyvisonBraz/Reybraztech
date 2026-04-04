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