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

async function migrate() {
  console.log('🔄 Iniciando migração para adicionar colunas do StarHome...\n');

  try {
    // Verificar se cada coluna já existe antes de adicionar
    const columnsToAdd = [
      { name: 'starhome_account', type: 'VARCHAR(50)' },
      { name: 'starhome_password_hash', type: 'VARCHAR(255)' },
      { name: 'starhome_days_remaining', type: 'INT' },
      { name: 'starhome_package', type: 'VARCHAR(100)' },
      { name: 'starhome_in_use', type: 'VARCHAR(20)' },
      { name: 'starhome_last_sync', type: 'TIMESTAMP' },
      { name: 'starhome_expiration_date', type: 'VARCHAR(50)' },
    ];

    for (const col of columnsToAdd) {
      try {
        // Tenta adicionar a coluna (não dá erro se já existir)
        await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS ${sql(col.name)} ${sql(col.type)}`;
        console.log(`   ✅ Coluna '${col.name}' verificada/criada`);
      } catch (err: any) {
        console.log(`   ⚠️ Coluna '${col.name}' já existe ou erro: ${err.message.split('\n')[0]}`);
      }
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\nColunas disponíveis na tabela clients:');
    const existingColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position
    `;
    
    for (const col of existingColumns) {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    }

  } catch (err: any) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();