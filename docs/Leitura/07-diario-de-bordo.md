# 📖 Diário de Bordo — Evolução Reybraztech

Este arquivo rastreia todas as alterações feitas de acordo com o **Guia 06 — Roadmap e Melhorias**. O objetivo é que você possa ler o que foi feito, entender os conceitos e testar na prática.

---

## 🛡️ Semana 1: Segurança Básica

### Dia 1: Gerar um JWT_SECRET seguro e configurar o `.env`
**Data:** 15/03/2026

**O que foi feito:**
1. Geramos uma string aleatória muito longa e segura (usando formato hexadecimal de 64 bytes).
2. Substituímos a chave insegura (`reybraztech_super_secret_key_2026_mude_em_producao`) pelo novo segredo no seu arquivo `.env`.
3. Atualizamos completamente o arquivo `.env.example`, que estava com variáveis não relacionadas ao seu projeto, incluindo um template para as novas variáveis do banco de dados (Supabase), do SendPulse e os links de pagamento.

**Por que isso importa?**
O JWT (JSON Web Token) é usado para manter você conectado no dashboard. Ele assina digitalmente os dados do usuário usando essa chave secreta (`JWT_SECRET`). Se a chave secreta for fraca ou for parar no Github, qualquer hacker consegue gerar tokens válidos e acessar contas de administrador ou contas pagas dentro do sistema.

**Como Testar / Verificar:**
1. Abra o arquivo `.env` no seu VS Code.
2. Observe que a linha `JWT_SECRET=` agora possui um código gigante de mais de 100 caracteres.
3. Abra o arquivo `.env.example` e verá que ele agora reflete a estrutura exata do seu projeto, contendo as chaves necessárias mas deixadas vazias ou com exemplos padrão, para servir de guia quando for hospedar em outro lugar.
4. Você pode tentar deslogar do sistema em seu navegador se ele já estiver rodando e logar novamente - o login funcionará porque o servidor está usando a nova chave agora. *(Nota: tokens antigos expirarão imediatamente ou darão erro, o que é esperado ao trocar a chave!)*

***

### Dia 2: Validação de variáveis de ambiente no Servidor
**Data:** 15/03/2026

**O que foi feito:**
1. No arquivo principal da API (`server/index.ts`), criamos um "segurança de porta", um loop de validação logo quando a aplicação liga. Ele varre uma lista de variáveis obrigatórias (no caso, a `JWT_SECRET`).
2. Se qualquer uma estiver faltando, o servidor envia um erro para o terminal e **falece de propósito** (`process.exit(1)`).
3. Entramos nas rotas de autenticação (`server/routes/auth.ts`) e no validador do token (`server/middleware/auth.ts`) e **arrancamos** o plano B (`|| 'reybraztech_secret...'`). Colocamos uma exclamação no final que, no TypeScript, diz com convicção: `"Eu garanto que essa variável existe no .env, pois meu servidor só acorda se ela estiver lá."`

**Por que isso importa?**
Em produção, se nosso serviço de hospedagem (Render) desse pane e por alguma razão não conseguisse reler o `.env`, o servidor ia reiniciar usando a chave *"reybraztech_secret_key_change_in_production"*. Hackers que analisam código conhecem chaves comuns e até compram bancos de dados de "chaves fracas". Com essa proteção, garantimos que nosso servidor jamais nascerá enfraquecido: ele simplesmente se recusa a rodar se faltar sua blindagem primordial.

**Como Testar / Verificar:**
1. Abra o arquivo `server/index.ts` e procure por `const REQUIRED_ENV = ['JWT_SECRET']`.
2. Para testar se a barreira funciona: vá no seu `.env` rápido, mude o nome de `JWT_SECRET` para `JWT_SECRET_TESTE` e salve.
3. Se seu backend estivesse rodando (porta 3001), ele imediatamente iria fechar com um erro em vermelho mostrando "**ERRO FATAL: Variável JWT_SECRET não encontrada no .env!**" no seu console.
4. Lembrar de voltar o nome para `JWT_SECRET` no arquivo `.env` para o servidor reviver!

***

### Dia 3: Defesas HTTP (Helmet) e Rate Limit
**Data:** 16/03/2026

**O que foi feito:**
1. Instalamos as bibliotecas `helmet` e `express-rate-limit` no servidor (`npm install helmet express-rate-limit`).
2. Adicionamos a configuração `app.set('trust proxy', 1)` no `server/index.ts`. Isso é essencial para que o Rate Limit funcione corretamente quando hospedado com proxies na frente (como o Render).
3. Injetamos o middleware do `helmet()` para adicionar automaticamente uma camada de dezenas de cabeçalhos de segurança (HTTP headers) às respostas do servidor.
4. Configuramos o `rateLimit`, limitando os usuários a 100 requisições a cada 15 minutos na nossa API.

**Por que isso importa?**
*   **Helmet:** Ele retira o cabeçalho `X-Powered-By: Express` (que grita aos hackers qual tecnologia estamos usando) e adiciona proteções contra ataques comuns, como Clickjacking, Sniffing de variáveis, e manipulação de scripts (XSS).
*   **Rate Limit:** Se alguém tentar chutar milhares de senhas por segundo na nossa tela de login usando um robô (Ataque de Força Bruta) ou tentar derrubar o nosso servidor fazendo milhares de requisições de OTP do WhatsApp (DDoS), o servidor agora simplesmente bloqueará o IP deles antes que cheguem ao banco de dados, protegendo tanto nossos custos (mensagens SendPulse) quanto nossa infraestrutura.
*   **Proxy (`trust proxy`):** Sem isso, em provedores como o Render ou AWS API Gateway, todos os usuários pareceriam vir do "mesmo IP interno" do provedor de serviço, e uma única pessoa estourando o Rate Limit derrubaria todo o sistema para todos os outros clientes autênticos.

**Como Testar / Verificar:**
1. Se o backend estiver rodando, recarregue a página e abra o **Inspecionar Elemento (F12)** -> aba **Network** (Rede).
2. Clique em qualquer requisição feita para a `/api/` e olhe as opções de "Response Headers" (Cabeçalhos de Resposta).
3. Você vai ver novos campos blindando o site como `Content-Security-Policy`, `X-DNS-Prefetch-Control`, e `Strict-Transport-Security` (todos providos silenciosamente pelo Helmet).
4. Para testar o Rate Limit: Tente dar "F5" desesperadamente mais de 100 vezes seguidas no Dashboard em menos de 15 minutos (ou acesse a rota repetidamente). Logo o servidor lhe mostrará a mensagem de IP bloqueado.

***

### Dia 4: Proxy no Frontend (Vite)
**Data:** 16/03/2026

**O que foi feito:**
1. Atualizamos o `vite.config.ts`, inserindo a regra `proxy`.
2. Essa regra força o navegador em ambiente de desenvolvimento a redirecionar internamente toda chamada `/api/*` da porta do React (3000/5173) direto para o servidor Express (3001).

**Por que isso importa?**
* Elimina a necessidade de colocar `http://localhost:3001` chumbado no código do Frontend. Agora ele imita perfeitamente como funcionará quando for pro Cloudflare/Render, sem gerar bloqueios chatos de CORS enquanto estamos testando na nossa própria máquina.

***

### Dia 5: Blindagem de Dados com Zod
**Data:** 16/03/2026

**O que foi feito:**
1. Instalamos a biblioteca `zod` (`npm install zod`).
2. Entramos no arquivo de registro (`server/routes/auth.ts`) e substituímos os vários `if/else` básicos (que só checavam se a variável existia) por um "Schema Zod" super restrito.
3. Agora, quando o front envia o pedido de cadastro, o banco de dados nem abre a boca se o e-mail estiver mal formatado, a senha tiver menos de 6 números ou faltar o dispositivo.

**Por que isso importa?**
* Segurança e Custo. Antes, se faltasse algum dado estrutural no pacote recebido, isso chegaria ao Supabase e *ele* que daria erro fatal no servidor. O Zod é um segurança de balada na porta: ele barra a requisição maliciosa *antes* dela consumir processamento da sua API ou recursos no banco de dados.

***

### Dia 7: Prevenção Contra Vazamentos e `.gitignore` Segura
**Data:** 16/03/2026

**O que foi feito:**
1. Reescrevemos por completo o arquivo `.gitignore` na raiz do projeto. Ele serve para dizer ao Git: *"Quando eu for enviar minhas coisas pro GitHub, certifique-se de ignorar tudo o que estiver listado aqui"*.
2. Adicionamos restrições rígidas para diretórios de log, do Windows/Mac (`.DS_Store`, `Thumbs.db`), pastas de *build* que só pesam o repositório e de editores de código (`.vscode/`).
3. **Ponto Crítico:** Garanti que os bancos de dados antigos do SQLite (`*.db`, `*.sqlite`, etc.) fiquem para sempre restritos ao seu computador.
4. Identificamos que arquivos do seu banco de dados local (`reybraztech.db`, `reybraztech.db-shm`, `reybraztech.db-wal`) estavam, de fato, sendo rastreados pelo Git, e usamos o comando `git rm --cached <arquivos>` para desvincular imediatamente eles do Github, apagando esse rastro de lá no próximo commit, mas sem deletar do seu PC.

**Por que isso importa?**
* Se um arquivo de banco de dados SQLite com as informações dos seus usuários locais for parar no Github, basta alguém baixar o repositório, abrir o `.db` e acessar tudo o que você testou (as vezes, CPFs, e-mails de clientes reais se não for só teste).
* Manter lixo no repositório (como a pasta do VS Code ou arquivos ocultos do Windows/Mac) gera conflitos quando outras pessoas e computadores vão trabalhar no código, e apenas torna tudo de difícil manutenção.

***

### Dia 6: Expiração de Token e Limpeza do Navegador
**Data:** 16/03/2026

**O que foi feito:**
1. Instalamos a biblioteca `jwt-decode` no frontend (`npm install jwt-decode`).
2. Atualizamos o componente guardião do React, o `src/components/ProtectedRoute.tsx`.
3. Criamos uma função de verificação constante (`isTokenValid`) que decodifica o JWT local que fica salvo no navegador do usuário e lê o campo `exp` (data de expiração) dele.
4. Se o usuário estiver tentando acessar o Dashboard e o token dele for um lixo digital (malformado) ou já tiver passado da data de validade, o componente imediatamente apaga esse registro morto do navegador (`localStorage.removeItem`) e manda o usuário de volta para a tela de Login.

**Por que isso importa?**
* **Experiência do Usuário (UX):** Antes, o React apenas olhava se "existia alguma coisa" salva com o nome de token no navegador e te deixava passar. Mas como a validade no backend é estrita (ex: expira em x horas ou x dias), o usuário entrava no painel, a API do backend negava carregar os dados, e a tela ficava toda preta ou desconfigurada porque os dados dele não chegavam. Agora, o próprio React percebe que o tempo do token venceu antes de carregar a tela e despacha ele com educação para refazer o login perfeitamente.

***

### Dia 8, 9 e 10: Estrutura do Painel Administrativo e Permissões Seguras
**Data:** 16/03/2026

**O que foi feito:**
1. **(Dia 8) Modificação no Banco:** Criamos um script que injetou a coluna de poder (`is_admin BOOLEAN NOT NULL DEFAULT FALSE`) lá no seu banco da Supabase (PostgreSQL), diretamente nos dados de clientes já existentes. Ninguém precisou refazer conta.
2. **Setup do seu usuário Admin:** Criei um arquivo temporário em `server/scripts/make-admin.ts` com um script automatizado. Basta você colocar seu e-mail/whatsapp nele e rodar para magicamente transformar a sua conta em "Super Usuário" do sistema, caso ainda não tenha feito pelo próprio site da Supabase!
3. **(Dia 9) Proteção Dupla (Middleware de Admin):** Criamos a pasta base para o servidor ter o cargo de checagem em `server/middleware/admin.ts`. Agora, se um usuário tentar acessar dados do Admin com um token JWT válido, a API ainda assim faz uma última validação no banco: *"Ah, ok, você tem o passaporte, mas você também é da diretoria (is_admin é TRUE)?"*. Se não for, barra por Permissão Negada (Status 403).
4. **(Dia 10) Ponto de Acesso (Rotas do Admin):** Criamos o arquivo especial `server/routes/admin.ts` inteiro blindado pela checagem de logado (`verifyToken`) e diretor (`verifyAdmin`). E já registramos a criação de nossa primeira rota exclusiva, que no caso permite um GET em `/api/admin/clients` listando, ordenados do mais novo para o mais velho, os usuários registrados.

**Por que isso importa?**
* Escalonamento e Independência. Agora você não depende de olhar no banco de dados para ver números, status da mensalidade ou gerenciar perfis. Você como lojista possui rotas onde as engrenagens já rodam, com toda a rigidez de segurança nas portas criadas nas Semanas 1 e 2!

***

### Dia 11: Frontend do Painel Admin (Caminho Oculto)
**Data:** 16/03/2026

**O que foi feito:**
1. Criamos a página visual principal do administrador em `src/pages/AdminPage.tsx`. Essa tela se conecta à nossa API restrita (`/api/admin/clients`) e lista todos os clientes usando uma visualização moderna e com design minimalista.
2. Em vez de adicionar um botão escrito "Admin" explícito no site, injetamos uma Rota Oculta (`/admlogin`) no roteador principal (`App.tsx`). 
3. Toda a tela do backend exibe uma barreira visual que repele e expulsa clientes normais que por acaso tentarem adivinhar o link do painel, mostrando uma tela imersiva de "Acesso Bloqueado", antes de jogá-los de volta para o Dashboard normal.

**Por que isso importa?**
* Se não existe porta, não existe tentativa de arrombamento da porta. Usar um caminho isolado na URL não linkado em lugar nenhum e protegido ativamente impede qualquer intruso ou atacante de ver qual é a base do seu painel e testar senhas. 

***

---

## 🔗 Integrações e UX Avançada (pós Semana 3)

### Migração para Supabase e OTP WhatsApp
**Data:** Março/2026

**O que foi feito:**
1. Banco migrado de SQLite local para **PostgreSQL na nuvem (Supabase)**, região São Paulo.
2. Integrada a **API SendPulse** para envio de OTP via WhatsApp com cache de token OAuth2.
3. Lógica de variantes de telefone (com e sem 9° dígito) implementada em `server/services/whatsapp.ts`.

**Por que isso importa?**
* O SQLite é um banco de arquivo — não aceita conexões simultâneas e não escala. O Supabase dá PostgreSQL gerenciado com backups, RLS e acesso via API.
* OTP via WhatsApp é mais acessível que SMS para o público brasileiro e elimina a necessidade de e-mail verificado.

***

### Recuperação de Senha com Deep Linking WhatsApp
**Data:** Março/2026

**O que foi feito:**
1. Criado `src/components/PasswordRecoveryModal.tsx` — modal de 3 etapas para redefinir senha.
2. **Bypass da regra de 24h do SendPulse:** O usuário é forçado a abrir o WhatsApp primeiro (via deep link `wa.me/...`) para iniciar a janela de conversa, permitindo o envio do OTP.
3. **Validation Shield:** Overlay `<div absolute>` invisível que captura cliques prematuros e impede o usuário de pular etapas do fluxo.
4. **Refatoração do OTP:** Parâmetro opcional `consume` adicionado no `server/services/otp.ts` — permite verificar o token sem queimá-lo (Passo 2 valida, Passo 3 consome).

**Por que isso importa?**
* A regra de 24h da Meta impede envio de mensagens proativas se o cliente nunca falou com o bot. O deep link resolve isso de forma elegante sem depender de templates aprovados.
* O parâmetro `consume` evita que o token seja queimado prematuramente em fluxos multi-etapa.

***

### Monitoramento e Alertas (Winston + Sentry + Telegram)
**Data:** Março/2026

**O que foi feito:**
1. Criado `server/utils/logger.ts` com Winston para logs estruturados.
2. Integrado **Sentry** para rastreamento de erros em produção (frontend e backend).
3. Implementado **Telegram Bot** que envia alertas em tempo real quando erros ocorrem no servidor.
4. Comandos do bot: `/logs` (últimos 20 logs), `/status` (uptime e memória do servidor).
5. Stack traces sanitizados com RegEx antes de enviar ao Telegram.

**Por que isso importa?**
* Em produção, `console.log` não é visível. Sem monitoramento, bugs passam despercebidos por dias.
* Telegram dá alertas instantâneos no celular — muito mais rápido que verificar dashboards.

***

### Deploy: Cloudflare Pages + Render
**Data:** Março/2026

**O que foi feito:**
1. Frontend deployado no **Cloudflare Pages** (build automático via GitHub).
2. Backend deployado no **Render** (Node.js, free tier).
3. Health check `/api/health` chamado no `App.tsx` ao carregar para evitar cold start do Render.
4. Variáveis de ambiente configuradas em ambos os serviços.

***

### Melhorias de Frontend (CSS e Animações)
**Data:** Março/2026

**O que foi feito:**
1. **Navbar mobile:** Corrigido flickering trocando toggle de `display` por transição de `height` com `overflow-hidden`.
2. **Botões CTA:** Adicionada animação de "respiração" com `Framer Motion` (scale pulsante).
3. **LoginPage:** Olho animado que segue o cursor com `useMousePosition` hook customizado.

***

**Próximo Passo (Semana 3 - Dia 12):** Funcionalidade Interativa. Implementar a lógica para interagir com a tabela do admin, colocando botões que conseguem ativar/inativar o acesso dos clientes ou suspender a assinatura do plano. Ver [06-roadmap.md](./06-roadmap.md) para o plano completo.
