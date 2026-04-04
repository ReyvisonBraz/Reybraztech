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
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │  STARHOME   │───▶│   SCRAPER    │───▶│   JSON      │───▶│  UPSERT    │ │
│  │  (Painel)   │    │  (Extração)  │    │  (Output)   │    │  (Import)  │ │
│  └─────────────┘    └──────────────┘    └─────────────┘    └────────────┘ │
│                                                                      │      │
│                                                                      ▼      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      SUPABASE (PostgreSQL)                         │  │
│  │                                                                      │  │
│  │   ┌─────────────────────────────────────────────────────────────┐  │  │
│  │   │                    TABELA: clients                          │  │  │
│  │   │                                                              │  │  │
│  │   │   COLUNAS PADRÃO:           COLUNAS STARHOME:               │  │  │
│  │   │   ─────────────────          ─────────────────               │  │  │
│  │   │   • id                      • starhome_account             │  │  │
│  │   │   • name                   • starhome_password_hash       │  │  │
│  │   │   • whatsapp               • starhome_days_remaining      │  │  │
│  │   │   • email                  • starhome_package             │  │  │
│  │   │   • password_hash          • starhome_in_use              │  │  │
│  │   │   • plan                   • starhome_last_sync           │  │  │
│  │   │   • status                 • starhome_expiration_date     │  │  │
│  │   │   • created_at                                               │  │  │
│  │   └─────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     TELEGRAM BOT (Polling)                         │  │
│  │                                                                      │  │
│  │   Comandos disponíveis:                                            │  │
│  │   • /status  → Estatísticas gerais (App + StarHome)                 │  │
│  │   • /sync    → Executa scraper e atualiza banco                   │  │
│  │   • /buscar  → Busca cliente por nome, whatsapp ou account         │  │
│  │   • /menu    → Menu interativo                                     │  │
│  │   • /ajuda   → Ajuda                                               │  │
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

---

## 👨‍💻 Desenvolvedor

Criado por: Reyvison Braz  
Data: 04/04/2026

---

*Este documento deve ser atualizado conforme novas funcionalidades forem adicionadas ao sistema.*