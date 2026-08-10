import 'dotenv/config';
import postgres from 'postgres';

console.log('🔍 DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SIM' : 'NÃO');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não definido no .env');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  prepare: false,
});

/**
 * One-off: recria renewal_jobs com o schema da fila de renovação StarHome.
 *
 * A tabela antiga (baseada em starhome_accesses/access_id) nunca foi usada
 * em código e é incompatível com o modelo de fila (client_id + order_id +
 * starhome_account + attempts/next_attempt_at). Como nenhum job existia,
 * DROP + CREATE é seguro.
 */
async function migrate() {
  console.log('🔄 Recriando tabela renewal_jobs...\n');

  try {
    await sql`DROP TABLE IF EXISTS renewal_jobs`;
    console.log('✅ Tabela antiga renewal_jobs removida (se existia)');

    await sql`
      CREATE TABLE renewal_jobs (
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
    `;
    console.log('✅ renewal_jobs recriada com schema da fila');

    await sql`
      CREATE INDEX idx_renewal_jobs_pending ON renewal_jobs (status, next_attempt_at)
    `;
    console.log('✅ Índice idx_renewal_jobs_pending criado');

    const [row] = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'renewal_jobs' ORDER BY ordinal_position`;
    console.log('\n📋 Primeira coluna confirmada:', row?.column_name);
  } catch (err: any) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
