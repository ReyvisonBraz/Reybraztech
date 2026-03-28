# Tecnologias do Projeto

> Para cada tecnologia: o que é, por que foi usada e onde aparece no código.

---

## Frontend

### React 19
**O que é:** Biblioteca JavaScript para construir interfaces. Em vez de manipular o HTML diretamente, você descreve como a tela deve parecer e o React cuida das atualizações.

**Por que aqui:** É o padrão do mercado para SPAs (Single Page Apps). Toda a interface do usuário está em `src/`.

**Onde ver:** `src/main.tsx` (ponto de entrada), `src/App.tsx` (roteador), `src/pages/*.tsx` (cada tela).

---

### Vite
**O que é:** Ferramenta de build. Em desenvolvimento, serve os arquivos em tempo real (sem precisar compilar tudo). Em produção, gera os arquivos otimizados.

**Por que aqui:** Muito mais rápido que o antigo Create React App. Também tem proxy embutido (redireciona `/api/` para o backend em dev).

**Onde ver:** `vite.config.ts` — note o `proxy` que redireciona chamadas `/api/*` para `localhost:3001`.

---

### TypeScript
**O que é:** JavaScript com tipos. Em vez de `let x = "hello"`, você escreve `let x: string = "hello"`. Pega erros antes de rodar.

**Por que aqui:** Projetos maiores ficam ingerenciáveis sem tipos. Com TS, o editor avisa se você errou um nome de campo ou passou o tipo errado.

**Onde ver:** Todos os arquivos `.ts` e `.tsx`. O `tsconfig.json` configura o compilador.

---

### Tailwind CSS
**O que é:** Framework CSS baseado em classes utilitárias. Em vez de criar um `.css` com `.botao { background: blue }`, você escreve diretamente no HTML: `className="bg-blue-500"`.

**Por que aqui:** Mais rápido para iterar. Toda a estilização fica junta com o componente.

**Onde ver:** Qualquer componente em `src/components/` ou `src/pages/`. Veja as classes `className="..."`.

---

### React Router DOM
**O que é:** Gerencia as URLs do site (roteamento). Sem recarregar a página, troca o que é exibido conforme a URL muda.

**Por que aqui:** É o padrão para navegação em apps React.

**Onde ver:** `src/App.tsx` — cada `<Route>` define uma URL e qual componente renderizar.

---

### shadcn/ui + Radix UI
**O que é:** Biblioteca de componentes de interface (botões, inputs, checkboxes) acessíveis e personalizáveis.

**Por que aqui:** Componentes prontos com acessibilidade garantida, sem precisar criar do zero.

**Onde ver:** `src/components/ui/` — os componentes base. São usados nas páginas com `<Button>`, `<Input>`, etc.

---

## Backend

### Node.js + Express
**O que é:** Node.js permite rodar JavaScript fora do navegador (no servidor). Express é o framework minimalista para criar servidores HTTP.

**Por que aqui:** Mesma linguagem (TypeScript) no frontend e backend — menos contexto a trocar.

**Onde ver:** `server/index.ts` (servidor principal), `server/routes/` (cada rota da API).

---

### tsx
**O que é:** Ferramenta que executa TypeScript diretamente sem precisar compilar antes.

**Por que aqui:** No desenvolvimento, `npm run server` roda `tsx server/index.ts` — não precisa compilar.

**Onde ver:** `package.json`, script `"server": "tsx server/index.ts"`.

---

### bcryptjs
**O que é:** Biblioteca para criptografar senhas de forma segura (hash unidirecional). Você nunca salva a senha em texto puro.

**Por que aqui:** Segurança fundamental. Mesmo que o banco vaze, as senhas não ficam expostas.

**Como funciona:**
```
senha original: "minha123"
bcrypt.hash()  → "$2b$10$xK8..." (hash — não tem como reverter)
bcrypt.compare("minha123", hash) → true
bcrypt.compare("outra", hash)    → false
```

**Onde ver:** `server/routes/auth.ts` — no registro e no login.

---

### jsonwebtoken (JWT)
**O que é:** Padrão para criar tokens de autenticação. O servidor gera um token assinado com uma chave secreta. O cliente guarda e envia em cada requisição.

**Por que aqui:** Permite autenticação sem sessão no servidor (stateless). O token carrega as informações do usuário.

**Como funciona:**
```
Header.Payload.Signature
eyJhbGci....eyJpZCI6IjEy....HMAC-SHA256

Payload decodificado: { id: "uuid", is_admin: false, iat: ..., exp: ... }
```

**Onde ver:** `server/routes/auth.ts` (geração), `server/middleware/auth.ts` (verificação).

---

### Zod
**O que é:** Biblioteca de validação e parsing de dados com TypeScript.

**Por que aqui:** Valida os dados que chegam nas rotas antes de processar. Se alguém mandar um WhatsApp inválido, o Zod rejeita antes de chegar ao banco.

**Onde ver:** `server/routes/auth.ts` — os schemas `registerSchema` e `loginSchema`.

---

### Helmet
**O que é:** Middleware que adiciona headers de segurança HTTP automaticamente.

**Por que aqui:** Protege contra ataques comuns (XSS, clickjacking) com uma linha de código.

**Onde ver:** `server/index.ts` — `app.use(helmet())`.

---

### express-rate-limit
**O que é:** Limita quantas requisições um IP pode fazer em um período.

**Por que aqui:** Previne ataques de força bruta no login e spam no envio de OTP.

**Onde ver:** `server/index.ts`.

---

### Winston
**O que é:** Biblioteca de logging estruturado. Em vez de `console.log`, grava logs com nível (info, warn, error), timestamp e formato.

**Onde ver:** `server/utils/logger.ts`.

---

### Sentry
**O que é:** Plataforma de monitoramento de erros. Quando um erro acontece em produção, envia um alerta com stack trace completo.

**Onde ver:** `server/index.ts` (backend), `src/main.tsx` (frontend).

---

## Banco de Dados

### Supabase
**O que é:** PostgreSQL como serviço na nuvem. Você não instala banco, só usa a URL de conexão.

**Por que aqui:** Rápido para começar, tem plano gratuito generoso e é PostgreSQL puro por baixo.

**Onde ver:** `server/database.ts` — a conexão. As queries SQL ficam nas rotas e serviços.

---

### postgres (driver)
**O que é:** Driver para conectar ao PostgreSQL via Node.js. Permite rodar queries SQL direto.

**Por que aqui:** Mais leve que ORMs como Prisma ou TypeORM. As queries são SQL puro — você aprende o banco de verdade.

**Onde ver:** `server/database.ts` — `sql\`SELECT * FROM clients\``.

---

## Scraper

### Puppeteer + puppeteer-extra-plugin-stealth
**O que é:** Puppeteer controla um navegador Chrome real via código. O plugin Stealth esconde os sinais de que é um bot (evita detecção).

**Por que aqui:** O painel StarHome é uma aplicação web (Ant Design) que não tem API pública. A única forma de automatizar é controlando o navegador como um usuário humano.

**Onde ver:** `scraper/src/login.ts` — veja o `puppeteer.launch()` e os cliques simulados.

---

### 2captcha (@2captcha/captcha-solver)
**O que é:** Serviço pago que resolve captchas enviando a imagem para humanos ou IA.

**Por que aqui:** O painel StarHome tem captcha no login. Sem resolver, o bot não entra.

**Onde ver:** `scraper/src/captcha.ts`.

---

### Cheerio
**O que é:** Parseia HTML e permite buscar elementos como jQuery (`$('tr td').text()`).

**Por que aqui:** Para extrair dados do HTML quando não precisa de browser completo.

**Onde ver:** `scraper/src/scrape.ts`.

---

## Deploy e Infraestrutura

### Vercel
**O que é:** Plataforma de hospedagem para o frontend (arquivos estáticos).

**Onde ver:** `vercel.json` (configuração de redirects para SPA).

### Render
**O que é:** Plataforma para hospedar o backend Node.js.

### Cloudflare
**O que é:** CDN + DNS + proteção DDoS para o domínio.

---

## Serviços externos

| Serviço | Para que serve | Variável .env |
|---------|---------------|---------------|
| Supabase | Banco de dados PostgreSQL | `SUPABASE_URL`, `SUPABASE_DB_PASSWORD` |
| SendPulse | Envio de mensagens WhatsApp (OTP) | `SENDPULSE_ID`, `SENDPULSE_SECRET` |
| Mercado Pago | Pagamentos (em desenvolvimento) | `MERCADO_PAGO_ACCESS_TOKEN` |
| 2captcha | Resolver captchas do painel StarHome | `TWOCAPTCHA_API_KEY` |
| Telegram Bot | Notificações e comandos remotos | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Sentry | Monitoramento de erros em produção | `SENTRY_DSN` |
