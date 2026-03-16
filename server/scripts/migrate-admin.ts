import sql from '../database.js';

async function migrate() {
    try {
        console.log('Iniciando migração...');
        // Verifica se a tabela clients já tem is_admin (não quebre se já tiver)
        await sql`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
        `;
        console.log('✅ Coluna is_admin adicionada com sucesso na tabela clients!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
