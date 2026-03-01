# 📘 Guia do Projeto — Reybraztech

> **Última atualização:** Março de 2026
> Este é o guia vivo do projeto. Aqui você aprende como tudo funciona, como está organizado e o que ainda precisa ser melhorado.

---

## 🗺️ Visão Geral: Como o projeto funciona

O projeto é uma plataforma completa de assinaturas com **frontend + backend**, dividida em duas partes que conversam entre si:

| Camada | Tecnologia | Porta | Comando |
|--------|-----------|-------|---------|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS | `3000` | `npm run dev` |
| **Backend** | Node.js + Express + TypeScript | `3001` | `npm run server` |
| **Banco de Dados** | SQLite (arquivo `reybraztech.db`) | — | Automático |

O usuário acessa o site pelo frontend (React), que faz chamadas HTTP (`fetch`) para o backend (Express), que por sua vez lê e grava dados no banco SQLite.

---

## 📁 Estrutura de Pastas

```
Reybraztech/
├── src/                        ← Frontend (React)
│   ├── App.tsx                 ← Roteador principal (define as URLs)
│   ├── main.tsx                ← Ponto de entrada, injeta React no HTML
│   ├── index.css               ← Estilos globais e variáveis CSS
│   ├── pages/                  ← Telas completas do site
│   │   ├── LandingPage.tsx     ← Página inicial (marketing)
│   │   ├── CheckoutPage.tsx    ← Escolha de plano e pagamento
│   │   ├── RegisterPage.tsx    ← Cadastro de novo cliente
│   │   ├── LoginPage.tsx       ← Tela de login
│   │   └── DashboardPage.tsx   ← Painel do cliente logado
│   └── components/             ← Pedaços reutilizáveis de interface
│       ├── Navbar.tsx          ← Cabeçalho de navegação
│       ├── Footer.tsx          ← Rodapé
│       ├── FloatingWhatsApp.tsx ← Botão flutuante do WhatsApp
│       ├── ContentCarousel.tsx ← Carrossel de conteúdo
│       └── ProtectedRoute.tsx  ← Guarda das rotas privadas
│
├── server/                     ← Backend (Express/Node.js)
│   ├── index.ts                ← Servidor Express (configuração e inicialização)
│   ├── database.ts             ← Conexão e criação do banco SQLite
│   ├── middleware/
│   │   └── auth.ts             ← Middleware de verificação do token JWT
│   └── routes/
│       ├── auth.ts             ← Rotas de registro e login (/api/auth/*)
│       └── dashboard.ts        ← Rota do painel do cliente (/api/dashboard)
│
├── reybraztech.db              ← Arquivo do banco de dados SQLite
├── .env                        ← Variáveis de ambiente (segredos)
├── .env.example                ← Modelo do .env para compartilhar
└── vite.config.ts              ← Configuração do Vite (proxy para o backend)
```

---

## 🗄️ O Banco de Dados (SQLite)

O banco tem **duas tabelas** criadas automaticamente ao iniciar o servidor:

### Tabela `clients` — Clientes cadastrados
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INTEGER | Chave primária, auto-gerada |
| `name` | TEXT | Nome completo |
| `whatsapp` | TEXT | Número do WhatsApp |
| `device` | TEXT | Dispositivo (ex: Android, iPhone) |
| `email` | TEXT UNIQUE | E-mail (usado para login) |
| `password_hash` | TEXT | Senha criptografada com bcrypt |
| `plan` | TEXT | Plano contratado (ex: `mensal`) |
| `status` | TEXT | Estado da conta (`Ativo`, `Inativo`) |
| `days_remaining` | INTEGER | Dias restantes na assinatura |
| `app_account` | TEXT | Login do aplicativo do cliente |
| `app_password` | TEXT | Senha do aplicativo do cliente |
| `created_at` | TEXT | Data/hora do cadastro |

### Tabela `payments` — Histórico de pagamentos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INTEGER | Chave primária |
| `client_id` | INTEGER | FK referenciando o cliente |
| `plan` | TEXT | Plano pago |
| `value` | TEXT | Valor pago |
| `status` | TEXT | Status do pagamento (`Pago`) |
| `paid_at` | TEXT | Data do pagamento |

---

## 🔌 A API (Rotas do Backend)

O backend expõe as seguintes rotas HTTP:

### Autenticação — `/api/auth/`
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| `POST` | `/api/auth/register` | Cadastra novo cliente | Não |
| `POST` | `/api/auth/login` | Faz login e retorna token JWT | Não |

### Painel — `/api/dashboard/`
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| `GET` | `/api/dashboard` | Retorna dados + histórico do cliente | **Sim (JWT)** |

### Saúde do servidor
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Verifica se o servidor está rodando |

---

## 🔐 Como Funciona a Autenticação (JWT)

1. O usuário preenche e-mail + senha na `LoginPage.tsx`.
2. O frontend faz `POST /api/auth/login` com os dados.
3. O backend compara a senha com o hash salvo no banco (`bcryptjs`).
4. Se correto, gera um **token JWT** (válido por 2 horas) com o `id` e `email` do cliente.
5. O frontend salva esse token no `localStorage` do navegador.
6. Em qualquer rota protegida (ex: `/dashboard`), o token é enviado no header `Authorization: Bearer <token>`.
7. O middleware `server/middleware/auth.ts` valida o token antes de processar a requisição.
8. O `ProtectedRoute.tsx` no frontend redireciona para `/login` se não houver token salvo.

---

## 🗺️ Rotas do Site (Frontend)

Definidas em `src/App.tsx`:

| URL | Componente | Protegida? |
|-----|-----------|------------|
| `/` | `LandingPage` | Não |
| `/checkout` | `CheckoutPage` | Não |
| `/login` | `LoginPage` | Não |
| `/register` | `RegisterPage` | Não |
| `/dashboard` | `DashboardPage` | **Sim** |

---

## 🛠️ Como Fazer Alterações (Guia Rápido)

O projeto usa **Tailwind CSS** — as classes de estilo ficam diretamente dentro do atributo `className=""` de cada componente.

### Mudar um texto na tela
Encontre o texto entre as tags HTML e troque. Use `Ctrl+F` no VSCode para achar rapidamente.
```tsx
// Antes
<h1>Bem-vindo ao sistema</h1>

// Depois
<h1>Bem-vindo à Reybraztech</h1>
```

### Mudar uma cor
Procure pelas classes `bg-` (cor de fundo) ou `text-` (cor do texto):
```tsx
// Fundo verde → fundo azul
className="bg-green-500"  →  className="bg-blue-500"

// Texto cinza → texto amarelo
className="text-slate-400"  →  className="text-yellow-400"
```

### Adicionar uma nova página
1. Crie o arquivo em `src/pages/NovaPagina.tsx`
2. Exporte o componente: `export function NovaPagina() { return <div>...</div>; }`
3. Importe e registre a rota em `src/App.tsx`:
```tsx
import { NovaPagina } from './pages/NovaPagina';
// ...dentro de <Routes>:
<Route path="/nova-pagina" element={<NovaPagina />} />
```

### Navegar entre páginas (link interno)
Use sempre `<Link>` do React Router para navegação interna (nunca `<a>` para rotas internas):
```tsx
import { Link } from 'react-router-dom';

<Link to="/checkout" className="bg-cyan-500 text-white px-4 py-2 rounded">
  Ver Planos
</Link>
```

### Link externo (redes sociais, etc.)
```tsx
<a href="https://instagram.com/reybraztech" target="_blank" rel="noopener noreferrer">
  Instagram
</a>
```

---

## 🚀 Como Rodar o Projeto

Você precisa de **dois terminais** abertos ao mesmo tempo:

**Terminal 1 — Backend (API):**
```bash
npm run server
```
Deverá exibir: `🚀 Servidor Reybraztech Online! → http://localhost:3001`

**Terminal 2 — Frontend (Site):**
```bash
npm run dev
```
Deverá exibir o endereço `http://localhost:3000`

> **Dica:** O Vite está configurado para fazer um "proxy" — quando o frontend chama `/api/...`, ele automaticamente redireciona para `localhost:3001`. Isso está configurado no `vite.config.ts`.

---

## ⚠️ O Que Ainda Precisa Melhorar (Próximos Passos)

Esta seção registra as fragilidades atuais e o que deve ser implementado para o projeto ficar mais robusto e pronto para produção.

### 🔴 Alta Prioridade

- **`app_password` armazenado em texto puro:** O campo `app_password` na tabela `clients` guarda a senha do aplicativo do cliente sem criptografia. Isso é um risco de segurança. O ideal é criptografar com `bcrypt` antes de salvar, ou usar criptografia reversível (AES) se o sistema precisar descriptografar depois.

- **Admin Panel inexistente:** Não existe ainda uma área de administrador para gerenciar clientes (visualizar todos, editar `days_remaining`, marcar pagamentos, etc.). Para sincronizar com clientes vindos pelo WhatsApp, isso é essencial.

- **Sincronização de `days_remaining`:** O campo existe no banco, mas não há lógica automática que decrementa os dias ou que detecta clientes vencidos. Isso deveria ser feito via um job agendado (ex: `node-cron`).

### 🟡 Média Prioridade

- **Sem renovação automática:** O sistema ainda não gera links de pagamento nem avisa o cliente automaticamente quando a assinatura está próxima de vencer. Um sistema de alertas por WhatsApp (via API) seria o próximo grande passo.

- **Validação de formulários fraca:** Os formulários de cadastro e login fazem apenas validações simples. Usar uma biblioteca como `zod` ou `react-hook-form` tornaria os erros mais precisos e amigáveis.

- **Dashboard não exibe `days_remaining`:** A rota `/api/dashboard` busca `days_remaining` do banco, mas esse campo não é exibido para o cliente na `DashboardPage.tsx`. Adicionar uma seção "Dias restantes na assinatura" seria útil.

- **Token JWT sem refresh:** O token expira em 2 horas e o usuário é deslogado sem aviso. Implementar um "refresh token" evitaria essa quebra de experiência.

### 🟢 Baixa Prioridade / Melhorias Futuras

- **Testes automatizados:** Não existem testes unitários ou de integração. Ferramentas como `vitest` (frontend) e `jest` (backend) poderiam garantir que o sistema não quebra ao evoluir.

- **Variável `JWT_SECRET` hardcoded como fallback:** Em `server/routes/auth.ts`, se o `.env` não tiver `JWT_SECRET`, ele usa uma string padrão. Em produção, isso é inseguro — o servidor não deveria nem subir sem essa variável.

- **Deploy:** O projeto ainda roda apenas localmente. O próximo passo seria fazer o deploy do backend em um serviço como Railway ou Render, e do frontend no Vercel ou Netlify.
