import 'dotenv/config';
import sql from '../database.js';

async function migrate() {
  console.log('🔄 Criando tabela login_logs...');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS login_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(50) NOT NULL,
        whatsapp VARCHAR(20),
        email VARCHAR(255),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('✅ Tabela login_logs criada!');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC)
    `;
    console.log('✅ Índice criado!');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_login_logs_whatsapp ON login_logs(whatsapp)
    `;
    console.log('✅ Índice WhatsApp criado!');
    
  } catch (err: any) {
    console.error('❌ Erro:', err.message);
  }
  
  process.exit(0);
}

migrate();
