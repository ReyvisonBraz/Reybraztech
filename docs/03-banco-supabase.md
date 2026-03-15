# 🗄️ Guia 03 — Configurar o Supabase (Banco de Dados na Nuvem)

> **Para quem é esse guia?** Para quem nunca mexeu com banco de dados online.
> Vamos ir devagar, explicando TUDO.

---

## 🤔 Primeiro: O que é um banco de dados?

Pense num banco de dados como uma **planilha do Excel gigante** que guarda informações.
Por exemplo:
- Nome do cliente
- WhatsApp do cliente
- Qual plano ele comprou
- Sua senha (criptografada, claro)

Até agora, seu projeto usava um banco **local** (um arquivo chamado `reybraztech.db` no seu computador). O problema? Quando você publicar o site, esse arquivo não vai junto. Por isso precisamos de um banco **na nuvem** — que fica na internet e qualquer servidor pode acessar.

É aí que entra o **Supabase**.

---

## 🤔 O que é o Supabase?

O Supabase é um **serviço gratuito** que te dá:
- Um banco de dados PostgreSQL (tipo o Excel, mas profissional) **hospedado na internet**
- Uma **interface visual** (um site bonito pra você ver seus dados, tipo o phpMyAdmin)
- Tudo de graça até 500MB (mais que suficiente pro seu projeto)

Pense nele como um "Google Drive do banco de dados" — seus dados ficam salvos na nuvem, acessíveis de qualquer lugar.

---

---

# 📋 PASSO 1 — Criar uma conta no Supabase

### O que vamos fazer?
Criar uma conta gratuita no site do Supabase.

### Como fazer:

1. Abra o navegador e vá para: **[https://supabase.com](https://supabase.com)**
2. Clique no botão **"Start your project"** (ou "Sign Up")
3. Você pode fazer login com:
   - **GitHub** (mais fácil se você já tem conta)
   - **E-mail e senha** (se preferir)
4. Depois de entrar, você vai cair no **Dashboard** (painel de controle)

> ✅ **Pronto?** Me avise quando estiver logado no Supabase!

---

# 📋 PASSO 2 — Criar um novo Projeto

### O que é um "projeto" no Supabase?
É como criar uma pasta separada para o seu app. Cada projeto tem seu próprio banco de dados. Pense como "criar uma nova planilha no Google Sheets".

### Como fazer:

1. No Dashboard do Supabase, clique em **"New Project"** (botão verde)
2. Preencha:
   - **Name (Nome):** `reybraztech`
   - **Database Password (Senha do banco):** Crie uma senha forte (ex: `MinhaS3nh@F0rte!2026`).
     > ⚠️ **ANOTE ESSA SENHA!** Você vai precisar dela depois. Sem ela, não consegue conectar.
   - **Region (Região):** Escolha **South America (São Paulo)** — isso faz os dados ficarem mais perto do Brasil, o que deixa tudo mais rápido.
3. Clique em **"Create new project"**
4. **Aguarde ~2 minutos** — o Supabase vai criar seu banco de dados na nuvem. Você vai ver uma barrinha de progresso.

### O que acabou de acontecer?
O Supabase criou um computador virtual na Amazon (AWS) em São Paulo, instalou um banco de dados PostgreSQL nele, e te deu acesso. Tudo automático e gratuito!

> ✅ **Pronto?** Quando a barrinha de progresso terminar e aparecer o Dashboard do projeto, me avise!

---

# 📋 PASSO 3 — Criar as Tabelas (onde os dados vão morar)

### O que é uma "tabela"?
É literalmente uma tabela, igual no Excel:
- **`clients`** = tabela com os dados dos clientes (nome, whatsapp, senha...)
- **`payments`** = tabela com os pagamentos que os clientes fizeram

### Como fazer:

1. No menu lateral esquerdo do Supabase, clique em **"SQL Editor"**
   - É um lugar onde você pode digitar comandos para o banco de dados
   - Pense nele como um "terminal" do banco
2. Você vai ver uma área de texto grande. **Apague tudo** que estiver lá
3. **Copie e cole** o código abaixo inteiro:

```sql
-- ═══════════════════════════════════════════════
-- TABELA DE CLIENTES
-- Aqui ficam salvos todos os dados dos clientes
-- ═══════════════════════════════════════════════
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,           -- Número único do cliente (1, 2, 3...)
  name TEXT NOT NULL,                  -- Nome completo
  whatsapp TEXT NOT NULL UNIQUE,       -- WhatsApp (com DDD) — não pode repetir
  device TEXT NOT NULL,                -- Dispositivo (tvbox, android, smarttv)
  email TEXT,                          -- E-mail (OPCIONAL — pode ficar vazio)
  password_hash TEXT NOT NULL,         -- Senha criptografada (nunca a senha real!)
  plan TEXT NOT NULL DEFAULT 'mensal', -- Plano atual (mensal, trimestral, etc)
  status TEXT NOT NULL DEFAULT 'Ativo',-- Status da conta (Ativo, Inativo, etc)
  days_remaining INTEGER DEFAULT 0,   -- Dias restantes do plano
  app_account TEXT,                    -- Login do app IPTV (preenchido depois)
  app_password TEXT,                   -- Senha do app IPTV (preenchido depois)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Data de cadastro (automática)
);

-- ═══════════════════════════════════════════════
-- TABELA DE PAGAMENTOS
-- Registra cada pagamento feito por cada cliente
-- ═══════════════════════════════════════════════
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,           -- Número único do pagamento
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                                       -- ↑ Liga este pagamento ao cliente
  plan TEXT NOT NULL,                  -- Qual plano foi pago
  value TEXT NOT NULL,                 -- Valor pago (ex: "35,00")
  status TEXT NOT NULL DEFAULT 'Pago', -- Status (Pago, Pendente, etc)
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Data do pagamento (automática)
);

-- ═══════════════════════════════════════════════
-- ÍNDICES (fazem as buscas serem mais rápidas)
-- ═══════════════════════════════════════════════
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_whatsapp ON clients(whatsapp);

-- ═══════════════════════════════════════════════
-- SEGURANÇA — Ativar proteção contra acesso direto
-- ═══════════════════════════════════════════════
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

4. Clique no botão **"Run"** (▶️) no canto inferior direito (ou pressione `Ctrl+Enter`)
5. Deve aparecer uma mensagem de **"Success"** (sucesso)

### Como confirmar que funcionou?
1. No menu lateral esquerdo, clique em **"Table Editor"**
2. Você deve ver duas tabelas listadas: **`clients`** e **`payments`**
3. Elas estarão vazias (é normal, ainda não tem nenhum cliente cadastrado)

### O que significam os termos no SQL?
| Termo | Significado |
|-------|-------------|
| `CREATE TABLE` | "Criar tabela" |
| `BIGSERIAL PRIMARY KEY` | Número que aumenta sozinho (1, 2, 3...) e identifica cada linha |
| `TEXT NOT NULL` | Campo de texto obrigatório (não pode ficar vazio) |
| `TEXT` | Campo de texto opcional (pode ficar vazio) |
| `UNIQUE` | Não pode ter valores repetidos (ex: 2 clientes com o mesmo WhatsApp) |
| `DEFAULT 'mensal'` | Se não informar, usa "mensal" como padrão |
| `REFERENCES clients(id)` | "Este campo aponta para um cliente" (liga as tabelas) |
| `ON DELETE CASCADE` | Se deletar o cliente, deleta os pagamentos dele também |
| `NOW()` | Preenche automaticamente com a data/hora atual |
| `CREATE INDEX` | Cria um "atalho" para buscas serem mais rápidas |
| `ENABLE ROW LEVEL SECURITY` | Ativa segurança extra (bloqueia acesso externo direto) |

> ✅ **Pronto?** Me avise quando aparecerem as tabelas `clients` e `payments` no Table Editor!

---

# 📋 PASSO 4 — Pegar as credenciais de conexão

### O que são "credenciais"?
São as "senhas" e "endereços" que seu código precisa para se conectar ao banco de dados do Supabase. É como quando você precisa do endereço + login + senha do Wi-Fi para conectar.

### Credencial 1: Connection String (a mais importante!)

É o "endereço completo" do banco de dados. Com ele, seu servidor consegue se conectar.

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem ⚙️)
2. No submenu, clique em **"Database"**
3. Procure a seção **"Connection string"**
4. Clique na aba **"URI"**
5. Você verá algo como:
   ```
   postgresql://postgres.[ID_DO_PROJETO]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
6. Clique em **"Copy"** para copiar
7. **Cole no seu arquivo `.env`** na linha `DATABASE_URL=`:
   ```
   DATABASE_URL=postgresql://postgres.[ID_DO_PROJETO]:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
   > ⚠️ Substitua `[SUA-SENHA]` pela senha que você criou no Passo 2!

### Credencial 2: URL do Projeto e Chaves API

1. Ainda em **"Settings"**, clique em **"API"** (no submenu)
2. Você verá:
   - **Project URL** — ex: `https://xxxxxxxxx.supabase.co`
     → Cole no `.env` em `SUPABASE_URL=`
   - **anon / public key** — uma chave longa começando com `eyJ...`
     → Cole no `.env` em `SUPABASE_ANON_KEY=`
   - **service_role key** — outra chave longa (⚠️ SECRETA!)
     → Cole no `.env` em `SUPABASE_SERVICE_KEY=`
     > 🔴 **NUNCA** compartilhe a `service_role key` com ninguém!

### O que cada chave faz?

| Chave | O que é | Quem usa |
|-------|---------|----------|
| `DATABASE_URL` | Endereço completo do banco | Seu servidor Node.js |
| `SUPABASE_URL` | Endereço do projeto na web | Pode ser usado no frontend |
| `SUPABASE_ANON_KEY` | Chave pública (limitada) | Pode aparecer no frontend |
| `SUPABASE_SERVICE_KEY` | Chave de admin (acesso total!) | **SÓ no servidor, NUNCA no frontend** |

### Como deve ficar o .env final?

Abra o arquivo `.env` na raiz do projeto e ele deve ficar parecido com isso (com SEUS valores):

```bash
# Variáveis de Ambiente — Reybraztech

JWT_SECRET=reybraztech_super_secret_key_2026_mude_em_producao
PORT=3001

MERCADO_PAGO_LINK_MENSAL=https://mpago.la/SEU_LINK_MENSAL_AQUI
MERCADO_PAGO_LINK_TRIMESTRAL=https://mpago.la/SEU_LINK_TRIMESTRAL_AQUI
MERCADO_PAGO_LINK_SEMESTRAL=https://mpago.la/SEU_LINK_SEMESTRAL_AQUI
MERCADO_PAGO_LINK_ANUAL=https://mpago.la/SEU_LINK_ANUAL_AQUI

# == BANCO DE DADOS SUPABASE ==
DATABASE_URL=postgresql://postgres.xxxxx:SuaSenha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
```

> ✅ **Pronto?** Me avise quando tiver colado todas as credenciais no `.env`!

---

# 📋 PASSO 5 — Testar a conexão

### O que vamos fazer?
Rodar o servidor backend para ver se ele consegue se conectar ao banco de dados do Supabase.

### Como fazer:

1. Abra um terminal novo no VS Code (`Ctrl + Shift + '`)
2. Digite:
   ```bash
   npm run server
   ```
3. Se tudo estiver certo, você deve ver:
   ```
   ✅ Conectado ao Supabase (PostgreSQL)!
   🚀 ================================
   🚀  Servidor Reybraztech Online!
   🚀  Porta: http://localhost:3001
   🚀 ================================
   ```

Se der erro, me mande a mensagem de erro que eu te ajudo a resolver!

---

# ✅ Checklist Final

- [ ] Conta criada no Supabase
- [ ] Projeto `reybraztech` criado (região São Paulo)
- [ ] SQL executado — tabelas `clients` e `payments` criadas
- [ ] `DATABASE_URL` colada no `.env`
- [ ] `SUPABASE_URL` colada no `.env`
- [ ] `SUPABASE_ANON_KEY` colada no `.env`
- [ ] `SUPABASE_SERVICE_KEY` colada no `.env`
- [ ] `npm run server` funcionando sem erros
