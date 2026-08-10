-- ============================================================
-- Schema do Banco de Dados - Reybraztech
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- Drop se existir (para recriar com tipos corretos)
DROP TABLE IF EXISTS pending_orders;

-- ============================================================
-- Tabela de Pedidos Temporários (pending_orders)
-- Armazena checkout e trials em andamento
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  device VARCHAR(50),
  mp_preference_id VARCHAR(50),
  mp_payment_id VARCHAR(50),
  client_id BIGINT REFERENCES clients(id),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  registered_at TIMESTAMP
);

-- Index para buscar pedidos por WhatsApp
CREATE INDEX IF NOT EXISTS idx_pending_orders_whatsapp ON pending_orders(whatsapp);

-- Index para buscar pedidos por status
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_orders(status);

-- ============================================================
-- Adicionar colunas na tabela clients (se não existirem)
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS device VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Verificar estrutura final
-- ============================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'pending_orders';

-- ============================================================
-- Tabela de Logs de Login (login_logs)
-- Criada automaticamente pelo código mas definida aqui para referência
-- ============================================================
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
);

CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_whatsapp ON login_logs(whatsapp);
CREATE INDEX IF NOT EXISTS idx_login_logs_action ON login_logs(action);

-- ============================================================
-- SEGURANÇA: RLS (Row Level Security)
-- Bloqueia acesso via PostgREST/Data API para essas tabelas.
-- O backend usa service_role que bypassa RLS automaticamente.
-- ============================================================
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Revogar acesso do role anon (usuários não autenticados via API)
REVOKE ALL ON TABLE public.pending_orders FROM anon;
REVOKE ALL ON TABLE public.login_logs FROM anon;

-- Garantir que service_role mantém acesso total
GRANT ALL ON TABLE public.pending_orders TO service_role;
GRANT ALL ON TABLE public.login_logs TO service_role;
