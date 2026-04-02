import * as dotenv from 'dotenv';
import * as path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

interface ClientData {
  account: string;
  password: string;
  days_remaining: number;
  package_name: string;
  buyer_name: string;
  in_use: string;
  expired: string;
  expiration_date: string | null;
}

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

function normalizeName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

export async function updateDatabase(clients: ClientData[]) {
  console.log(`\n💾 Atualizando ${clients.length} clientes no banco de dados...`);

  let found = 0;
  let notFound = 0;
  let errors = 0;

  for (const client of clients) {
    try {
      const { firstName, lastName } = normalizeName(client.buyer_name);
      const newStatus = client.in_use === 'Used' && client.expired !== 'Expired' ? 'Ativo' : 'Inativo';

      let existingId: number | null = null;
      let matchType = '';

      // 1º: Buscar pelo starhome_account (código do StarHome)
      if (client.account) {
        const [byStarhome] = await sql`
          SELECT id FROM clients 
          WHERE starhome_account = ${client.account}
          LIMIT 1
        `;
        if (byStarhome) {
          existingId = byStarhome.id;
          matchType = 'starhome_account';
        }
      }

      // 2º: Buscar pelo nome (primeiro + último nome)
      if (!existingId && firstName && lastName) {
        const [byName] = await sql`
          SELECT id FROM clients 
          WHERE name ILIKE ${`%${firstName}%`}
            AND name ILIKE ${`%${lastName}%`}
          LIMIT 1
        `;
        if (byName) {
          existingId = byName.id;
          matchType = 'nome';
        }
      }

      if (existingId) {
        await sql`
          UPDATE clients 
          SET days_remaining = ${client.days_remaining},
              status = ${newStatus},
              app_password = ${client.password},
              starhome_account = ${client.account}
          WHERE id = ${existingId}
        `;
        console.log(`   ✅ ${client.buyer_name || client.account} → ${matchType}`);
        found++;
      } else {
        console.log(`   ⚪ Não encontrado: ${client.account} (${client.buyer_name || 'sem nome'})`);
        notFound++;
      }

    } catch (err: any) {
      console.error(`   ❌ Erro ao atualizar ${client.account}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅ Atualização concluída:`);
  console.log(`   📝 ${found} clientes atualizados`);
  console.log(`   ⚪ ${notFound} clientes não encontrados no banco`);
  console.log(`   ❌ ${errors} erros`);

  return { found, notFound, errors };
}