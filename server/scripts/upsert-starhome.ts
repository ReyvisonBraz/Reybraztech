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
  if (!name || name.trim() === '') {
    return { firstName: '', lastName: '' };
  }
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

async function encryptPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function syncStarhomeData() {
  console.log('\n🔄 Iniciando sincronização de dados do StarHome...\n');
  console.log('⚠️ ATENÇÃO: Este script ONLY atualiza registros existentes!');
  console.log('⚠️ Não serão criados novos registros.\n');

  const jsonPath = findLatestClientsJson();
  if (!jsonPath) {
    console.error('❌ Nenhum arquivo JSON encontrado para sincronizar');
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const clients: StarhomeClient[] = JSON.parse(fileContent);
    
    console.log(`📊 Total de clientes no JSON: ${clients.length}\n`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const client of clients) {
      try {
        const { firstName, lastName } = normalizeName(client.buyer_name);
        
        const starhomeStatus = client.in_use === 'Used' && client.expired !== 'Expired' ? 'Ativo' : 'Inativo';
        const passwordHash = await encryptPassword(client.password);

        // 1º: Buscar pelo starhome_account (se já vinculado anteriormente)
        let existingId: number | null = null;
        let matchType = '';

        if (client.account) {
          const [byStarhome] = await sql`
            SELECT id FROM clients WHERE starhome_account = ${client.account}
          `;
          if (byStarhome) {
            existingId = byStarhome.id;
            matchType = 'starhome_account';
          }
        }

        // 2º: Se não encontrou, tentar vincular por nome completo
        if (!existingId && firstName && lastName) {
          const [byName] = await sql`
            SELECT id FROM clients 
            WHERE name ILIKE ${`%${firstName}%`} AND name ILIKE ${`%${lastName}%`}
            LIMIT 1
          `;
          if (byName) {
            existingId = byName.id;
            matchType = 'nome';
          }
        }

        // 3º: Se ainda não encontrou, tentar por primeiro nome + telefone
        if (!existingId && firstName) {
          // Buscar clientes que têm primeiro nome similar E têm telefone cadastrado
          const [byFirstName] = await sql`
            SELECT id FROM clients 
            WHERE name ILIKE ${`%${firstName}%`}
            LIMIT 5
          `;
          
          // Se encontrou algum, tenta verificar se faz sentido (primeiro resultado)
          if (byFirstName && byFirstName.id) {
            existingId = byFirstName.id;
            matchType = 'primeiro nome';
          }
        }

        if (existingId) {
          // Atualiza o registro existente com dados do StarHome
          await sql`
            UPDATE clients SET
              starhome_account = ${client.account},
              starhome_password_hash = ${passwordHash},
              starhome_days_remaining = ${client.days_remaining},
              starhome_package = ${client.package_name},
              starhome_in_use = ${starhomeStatus},
              starhome_expiration_date = ${client.expiration_date || null},
              starhome_last_sync = NOW()
            WHERE id = ${existingId}
          `;
          
          console.log(`   ✅ ${client.buyer_name || client.account} → vinculado por ${matchType}`);
          updated++;
        } else {
          console.log(`   ⏭️  Não encontrado para vincular: ${client.account} (${client.buyer_name || 'sem nome'})`);
          notFound++;
        }

        // Log a cada 100 registros
        if ((updated + notFound) % 100 === 0) {
          console.log(`   📥 Processado: ${updated + notFound} clientes...`);
        }

      } catch (err: any) {
        errors++;
        console.error(`   ❌ Erro ao processar ${client.account}: ${err.message.split('\n')[0]}`);
      }
    }

    console.log('\n✅ Sincronização concluída!');
    console.log(`   🔄 ${updated} clientes atualizados/vinculados`);
    console.log(`   ⏭️  ${notFound} clientes não encontrados no sistema`);
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
    console.error('❌ Erro na sincronização:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

syncStarhomeData();