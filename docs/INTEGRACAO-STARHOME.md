# 📋 Integração StarHome - Documentação Técnica

## Visão Geral

Este documento descreve a arquitetura e os processos implementados para integrar os dados do painel StarHome com o banco de dados Supabase, incluindo criptografia de senhas e consultas via Telegram Bot.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE DADOS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐   │
│  │  STARHOME   │───▶│   SCRAPER    │───▶│   SUPA     │◀───│   TELEGRAM │   │
│  │  (Painel)   │    │  (Extração)  │    │   BASE     │    │    BOT     │   │
│  └─────────────┘    └──────────────┘    └─────────────┘    └────────────┘   │
│         │                                        │                 │          │
│         │                                        ▼                 │          │
│         │                              ┌──────────────────┐        │          │
│         │                              │  TABELA clients │◀───────┘          │
│         │                              │                  │                   │
│         │                              │ Dados unificados │  /buscar          │
│         │                              │ (App + StarHome) │  /status           │
│         │                              └──────────────────┘                   │
│         │                                                                         │
│         └─────────────────────────────────────────────────────────────────────►│
│                            (salva direto no banco)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Sincronização

```
/sync (Telegram)
    ↓
Scraper extrai dados do StarHome
    ↓
updateDatabase() → Salva DIRETO no Supabase (criptografado)
    ↓
Bot lê do Supabase ✓
```

### Detalhes do Fluxo:
1. Usuário envia `/sync` ao bot
2. Bot chama scraper no Render (POST /run)
3. Scraper extrai dados do painel StarHome
4. Função `updateDatabase()` salva diretamente no Supabase:
   - Usa **bcrypt** para criptografar senhas
   - Faz **UPDATE** em registros existentes
   - Usa matching inteligente (account → nome → telefone)
5. Bot notifica conclusão
6. `/buscar` e `/status` leem do banco atualizado
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Criptografia de Senhas

### Biblioteca Utilizada
- **bcryptjs** (versão 3.0.3)
- Mesma biblioteca já utilizada no sistema para senhas dos usuários

### Processo de Criptografia

```typescript
import bcrypt from 'bcryptjs';

// Gerar salt e hash
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(senha_original, salt);

// Resultado exemplo: $2a$10$X7K9... (60 caracteres)
```

### Por que bcrypt?
- ✅ Segurança robusta (adaptive function)
- ✅ Resistência a ataques de rainbow table
- ✅ Configurável custo computacional
- ✅ Já utilizado no projeto (consistência)

---

## 📦 Scripts Implementados

### 1. Migração de Colunas
**Arquivo:** `server/scripts/migrate-starhome-columns.ts`

**Função:** Adiciona as colunas necesarias para armazenar dados do StarHome na tabela `clients`.

**Colunas adicionadas:**
| Coluna | Tipo | Descrição |
|--------|------|------------|
| `starhome_account` | VARCHAR(50) | Código da conta StarHome |
| `starhome_password_hash` | VARCHAR(255) | Senha criptografada |
| `starhome_days_remaining` | INT | Dias restantes |
| `starhome_package` | VARCHAR(100) | Nome do plano |
| `starhome_in_use` | VARCHAR(20) | Status (Ativo/Inativo) |
| `starhome_last_sync` | TIMESTAMP | Última sincronização |
| `starhome_expiration_date` | VARCHAR(50) | Data de expiração |

**Execução:**
```bash
npm run migrate:starhome
```

---

### 2. Importação/Upsert de Dados
**Arquivo:** `server/scripts/upsert-starhome.ts`

**Função:** Lê o arquivo JSON mais recente do scraper e importa/atualiza os dados no banco.

**Fluxo:**
1. Encontra o arquivo JSON mais recente na pasta `docs/`
2. Para cada cliente:
   - Gera hash bcrypt da senha
   - Verifica se já existe pelo `starhome_account`
   - Se existe → atualiza
   - Se não → cria novo registro
3. Mostra estatísticas finais

**Execução:**
```bash
npm run import:starhome
```

**Saída esperada:**
```
🔄 Iniciando importação de dados do StarHome...

📁 Usando arquivo: clients_2026-04-03_15h37.json
📊 Total de clientes no JSON: 1328

✅ Importação concluída!
   📝 150 novos clientes inseridos
   🔄 1178 clientes atualizados
   ❌ 0 erros

📊 Estatísticas do banco:
   Total de clientes: 1328
   Com dados StarHome: 1328
   Ativos no StarHome: 850
```

---

## 🤖 Telegram Bot - Comandos

### Comandos Disponíveis

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `/status` | Mostra estatísticas do sistema | `/status` |
| `/sync` | Executa scraper e sincroniza dados | `/sync` |
| `/buscar` | Busca cliente por nome, WhatsApp ou account | `/buscar 11999999999` |
| `/menu` | Menu interativo com botões | `/menu` |
| `/ajuda` | Lista de comandos | `/ajuda` |

### Exemplo de Resposta /status

```
📊 Status Reybraztech

👥 Usuários do App:
   📦 Total: 150
   ✅ Ativos: 120
   ❌ Inativos: 30

🔐 Clientes StarHome:
   📦 Total: 1328
   ✅ Ativos: 850
   ❌ Inativos: 478

🤖 Bot: OK
```

### Exemplo de Resposta /buscar

```
✅ Cliente

👤 Nome: João Silva
📱 WhatsApp: 11999999999
📦 Plano App: Premium
📊 Status App: Ativo

🔐 Dados StarHome:
   📋 Account: kc3vpt
   📦 Plano: Basic Plan
   ⏰ Dias: 31
   📊 Status: Inativo
```

---

## 🔄 Fluxo de Sincronização

### Modo Automático (via Telegram)

1. Usuário envia `/sync` ao bot
2. Bot envia confirmação ao usuário
3. Scrapers executar no Render
4. Dados são salvos no JSON
5. Script de upsert é executado
6. Banco é atualizado com dados criptografados
7. Bot notifica conclusão ao usuário

### Modo Manual (via terminal)

```bash
# 1. Executar scraper
npm run scraper:sync

# 2. Migrar colunas (primeira vez)
npm run migrate:starhome

# 3. Importar dados
npm run import:starhome
```

---

## 📁 Estrutura de Arquivos

```
/
├── docs/
│   └── clients_*.json          # Dados exportados do scraper
├── server/
│   ├── index.ts                # Bot Telegram + API
│   ├── database.ts             # Conexão PostgreSQL
│   ├── scripts/
│   │   ├── migrate-starhome-columns.ts   # Migração de colunas
│   │   └── upsert-starhome.ts             # Importação de dados
│   └── routes/
│       └── ...                 # Rotas da API
├── scraper/
│   └── src/
│       ├── index.ts            # Entry point do scraper
│       ├── scrape.ts           # Lógica de scraping
│       └── update-db.ts        # Atualização do banco
└── package.json                # Scripts npm
```

---

## ⚙️ Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL=postgres://...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Scraper (no Render)
SCRAPER_URL=https://reybraztech-scraper.onrender.com
SCRAPER_API_KEY=...
PANEL_ACCOUNT=...
PANEL_PASSWORD=...
```

---

## ✅ Boas Práticas Implementadas

1. **Criptografia de senhas** - bcrypt com salt automático
2. **Upsert (não apenas Insert)** - atualiza existentes, cria novos
3. **Logging** - cada operação é logada
4. **Validação** - verificação de dados antes de inserir
5. **Estatísticas** - relatório ao final de cada importação
6. **Modularidade** - scripts separados para cada função
7. **Fallback** - se não encontrar por account, tenta por nome

---

## 🔧 Troubleshooting

### Problema: "relation starhome_clients does not exist"
**Solução:** Executar migração primeiro:
```bash
npm run migrate:starhome
```

### Problema: Bot não responde
**Solução:** Verificar se o polling está ativo nos logs do Render.

### Problema: Erro ao importar dados
**Solução:** Verificar se o arquivo JSON está na pasta `docs/` e tem formato válido.

---

## 📝 Histórico de Alterações

| Data | Descrição |
|------|------------|
| 2026-04-04 | Implementação inicial da integração |
| 2026-04-04 | Adição de criptografia bcrypt |
| 2026-04-04 | Atualização do bot para mostrar dados StarHome |
| 2026-04-04 | **CORREÇÃO**: Script agora faz apenas UPDATE (não cria registros duplicados) |
| 2026-04-04 | **CORREÇÃO**: /status agora mostra clientes unificados |
| 2026-04-04 | **MELHORIA**: Scraper agora salva DIRETO no Supabase (sem JSON intermediário) |
| 2026-04-04 | **MELHORIA**: Scraper usa bcrypt para criptografar senhas |
| 2026-04-04 | **MELHORIA**: Matching melhorado (account → nome → telefone) |

---

## 🔧 Arquivo: scraper/src/update-db.ts

Este arquivo é o coração da integração - responsável por salvar os dados extraídos diretamente no Supabase.

### Funções implementadas:

1. **Criptografia bcrypt** - Todas as senhas são hasheadas antes de salvar
2. **Campos salvos**:
   - `starhome_account` - Código da conta
   - `starhome_password_hash` - Senha criptografada
   - `starhome_days_remaining` - Dias restantes
   - `starhome_package` - Nome do plano
   - `starhome_in_use` - Status (Ativo/Inativo)
   - `starhome_expiration_date` - Data de expiração
   - `starhome_last_sync` - Timestamp da última sincronização

3. **Matching inteligente** (em ordem de prioridade):
   1. Por `starhome_account` (se já vinculado antes)
   2. Por nome completo (firstName + lastName)
   3. Por primeiro nome
   4. Por telefone (extraído do buyer_name)

### Fluxo completo:
```
/sync → Scraper → updateDatabase() → Supabase (criptografado)
```

---

## ✅ Pronto para Uso

O sistema agora funciona de forma integrada:
- Scraper extrai e salva diretamente no banco
- Bot consulta dados atualizados do Supabase
- Tudo com senhas criptografadas

---

## ⚠️ ATENÇÃO - Correção Importante

### Problema Anterior:
O script de importação criava **novos registros** quando não encontrava匹配, causando duplicação:
- "Usuários do App" vs "Clientes StarHome" separados

### Solução Implementada:
- Script `sync:starhome` agora **apenas atualiza** registros existentes
- Não cria novos registros
- Se não encontrar匹配, simplesmente pula (não cria nada)
- `/status` agora mostra dados unificados

### Scripts Disponíveis:
```bash
# Adicionar colunas (primeira vez)
npm run migrate:starhome

# Sincronizar dados (apenas atualiza, não cria)
npm run sync:starhome
```

---

## 👨‍💻 Desenvolvedor

Criado por: Reyvison Braz  
Data: 04/04/2026

---

*Este documento deve ser atualizado conforme novas funcionalidades forem adicionadas ao sistema.*