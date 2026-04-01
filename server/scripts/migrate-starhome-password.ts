import sql from '../database.js';

async function migrate() {
    try {
        console.log('Iniciando migração...');
        await sql`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS starhome_password TEXT;
        `;
        console.log('✅ Coluna starhome_password adicionada na tabela clients!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
