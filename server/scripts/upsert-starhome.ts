import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

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

interface StarhomeClient {
  account: string;
  password: string;
  days_remaining: number;
  package_name: string;
  buyer_name: string;
  in_use: string;
  expired: string;
  expiration_date: string;
}

function findLatestClientsJson(): string | null {
  const docsDir = path.join(process.cwd(), 'docs');
  
  if (!fs.existsSync(docsDir)) {
    console.log('⚠️ Pasta docs não encontrada');
    return null;
  }
  
  const files = fs.readdirSync(docsDir)
    .filter(f => f.startsWith('clients_') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log('⚠️ Nenhum arquivo clients_*.json encontrado');
    return null;
  }
  
  const latestFile = path.join(docsDir, files[0]);
  console.log(`📁 Usando arquivo: ${files[0]}`);
  return latestFile;
}

function normalizeName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

async function encryptPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function upsertStarhomeData() {
  console.log('\n🔄 Iniciando importação de dados do StarHome...\n');

  const jsonPath = findLatestClientsJson();
  if (!jsonPath) {
    console.error('❌ Nenhum arquivo JSON encontrado para importar');
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const clients: StarhomeClient[] = JSON.parse(fileContent);
    
    console.log(`📊 Total de clientes no JSON: ${clients.length}\n`);
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const client of clients) {
      try {
        const { firstName, lastName } = normalizeName(client.buyer_name);
        
        const starhomeStatus = client.in_use === 'Used' && client.expired !== 'Expired' ? 'Ativo' : 'Inativo';
        const passwordHash = await encryptPassword(client.password);

        // Verificar se já existe um cliente com o mesmo starhome_account
        const [existing] = await sql`
          SELECT id FROM clients WHERE starhome_account = ${client.account}
        `;

        if (existing) {
          // Atualizar existente
          await sql`
            UPDATE clients SET
              starhome_password_hash = ${passwordHash},
              starhome_days_remaining = ${client.days_remaining},
              starhome_package = ${client.package_name},
              starhome_in_use = ${starhomeStatus},
              starhome_expiration_date = ${client.expiration_date || null},
              starhome_last_sync = NOW()
            WHERE starhome_account = ${client.account}
          `;
          updated++;
        } else {
          // Verificar se existe pelo nome (matching por nome)
          let byName = null;
          if (firstName && lastName) {
            const [existingByName] = await sql`
              SELECT id FROM clients 
              WHERE name ILIKE ${`%${firstName}%`} AND name ILIKE ${`%${lastName}%`}
              LIMIT 1
            `;
            byName = existingByName;
          }

          if (byName) {
            // Atualizar pelo nome
            await sql`
              UPDATE clients SET
                starhome_account = ${client.account},
                starhome_password_hash = ${passwordHash},
                starhome_days_remaining = ${client.days_remaining},
                starhome_package = ${client.package_name},
                starhome_in_use = ${starhomeStatus},
                starhome_expiration_date = ${client.expiration_date || null},
                starhome_last_sync = NOW()
              WHERE id = ${byName.id}
            `;
            updated++;
          } else {
            // Criar novo registro
            await sql`
              INSERT INTO clients (
                name,
                whatsapp,
                device,
                email,
                password_hash,
                plan,
                status,
                starhome_account,
                starhome_password_hash,
                starhome_days_remaining,
                starhome_package,
                starhome_in_use,
                starhome_expiration_date,
                starhome_last_sync
              ) VALUES (
                ${client.buyer_name || 'Sem nome'},
                ${null},
                ${null},
                ${null},
                ${passwordHash},
                ${client.package_name || 'Basic Plan'},
                ${starhomeStatus},
                ${client.account},
                ${passwordHash},
                ${client.days_remaining},
                ${client.package_name},
                ${starhomeStatus},
                ${client.expiration_date || null},
                NOW()
              )
            `;
            inserted++;
          }
        }

        // Log a cada 100 registros
        if ((inserted + updated) % 100 === 0) {
          console.log(`   📥 Processado: ${inserted + updated} clientes...`);
        }

      } catch (err: any) {
        errors++;
        console.error(`   ❌ Erro ao processar ${client.account}: ${err.message.split('\n')[0]}`);
      }
    }

    console.log('\n✅ Importação concluída!');
    console.log(`   📝 ${inserted} novos clientes inseridos`);
    console.log(`   🔄 ${updated} clientes atualizados`);
    console.log(`   ⏭️  ${skipped}跳过 (ignorados)`);
    console.log(`   ❌ ${errors} erros`);

    // Mostrar estatísticas
    console.log('\n📊 Estatísticas do banco:');
    const [total] = await sql`SELECT COUNT(*)::int as total FROM clients`;
    const [withStarhome] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_account IS NOT NULL`;
    const [activeStarhome] = await sql`SELECT COUNT(*)::int as total FROM clients WHERE starhome_in_use = 'Ativo'`;
    
    console.log(`   Total de clientes: ${total.total}`);
    console.log(`   Com dados StarHome: ${withStarhome.total}`);
    console.log(`   Ativos no StarHome: ${activeStarhome.total}`);

  } catch (err: any) {
    console.error('❌ Erro na importação:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

upsertStarhomeData();