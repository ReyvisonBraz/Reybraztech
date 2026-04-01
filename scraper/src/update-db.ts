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

export async function updateDatabase(clients: ClientData[]) {
  console.log(`\n💾 Atualizando ${clients.length} clientes no banco de dados...`);

  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const client of clients) {
    try {
      // Normaliza o telefone (remove espaços, traços, parênteses)
      const cleanPhone = client.account.replace(/[\s\-\(\)]/g, '');
      
      // Verifica se o cliente já existe pelo WhatsApp
      const [existing] = await sql`
        SELECT id FROM clients WHERE whatsapp = ${cleanPhone}
      `;

      if (existing) {
        // Atualiza dias restantes e status
        const newStatus = client.in_use === 'Used' && client.expired !== 'Expired' ? 'Ativo' : 'Inativo';
        
        await sql`
          UPDATE clients 
          SET days_remaining = ${client.days_remaining},
              status = ${newStatus},
              app_password = ${client.password}
          WHERE whatsapp = ${cleanPhone}
        `;
        updated++;
      } else {
        // Cliente não existe - não cria automaticamente para evitar duplicatas
        console.log(`   ⚪ Cliente não encontrado: ${client.account} (${client.buyer_name})`);
        created++;
      }

    } catch (err: any) {
      console.error(`   ❌ Erro ao atualizar ${client.account}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅ Atualização concluída:`);
  console.log(`   📝 ${updated} clientes atualizados`);
  console.log(`   ⚪ ${created} clientes não encontrados no banco`);
  console.log(`   ❌ ${errors} erros`);

  return { updated, created, errors };
}
