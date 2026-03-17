// server/database.ts
import dotenv from 'dotenv';
dotenv.config(); // Carrega .env ANTES de ler DATABASE_URL

import postgres from 'postgres';
import logger from './utils/logger.js';

// A CONNECTION STRING vem do .env (segredo!)
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  logger.error('❌ DATABASE_URL não definida no .env!');
  throw new Error('❌ DATABASE_URL não definida no .env!');
}

// Cria a conexão principal com o banco
const sql = postgres(connectionString, {
  ssl: 'require', // Supabase exige SSL
  max: 10,        // máximo de 10 conexões simultâneas
  idle_timeout: 20,
});

logger.info('✅ Conectado ao Supabase (PostgreSQL)!');

export default sql;