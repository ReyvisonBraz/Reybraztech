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

**Próximo Passo (Dia 4):** Ocultar/apagar arquivos sensíveis do repositório público (criar `.gitignore` e checar vazamentos).
