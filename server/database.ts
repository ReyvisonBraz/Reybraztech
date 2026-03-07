// server/database.ts
import postgres from 'postgres';

// A CONNECTION STRING vem do .env (segredo!)
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL não definida no .env!');
}

// Cria a conexão principal com o banco
const sql = postgres(connectionString, {
  ssl: 'require', // Supabase exige SSL
  max: 10,        // máximo de 10 conexões simultâneas
  idle_timeout: 20,
});

console.log('✅ Conectado ao Supabase (PostgreSQL)!');

export default sql;