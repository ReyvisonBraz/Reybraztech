# 🚀 Guia 05 — Como Hospedar o Back-end e Fazer o Banco de Dados Funcionar

Este guia explica por que o seu sistema de cadastro parou de funcionar ao hospedar a aplicação no Cloudflare Pages (ou serviços semelhantes como Netlify e Vercel) e como resolver isso passo a passo.

---

## 🧐 Por que parou de funcionar?

No seu ambiente local (no seu computador), o seu projeto funcionava em duas partes diferentes que rodavam ao mesmo tempo:
1. **O Front-end (React/Vite)**: É a interface visual, as páginas, botões e formulários. Ele rodava em uma porta (ex: `localhost:5173`).
2. **O Back-end (Node.js)**: É o "cérebro" da aplicação, que fica na sua pasta `/server`. É ele que recebe os dados de cadastro e se comunica com o Supabase e com a API do WhatsApp. Ele rodava na porta `localhost:3001`.

Quando você hospedou o projeto no **Cloudflare Pages**, você hospedou **apenas o Front-end**.

Como o Back-end não foi junto (o Cloudflare Pages só aceita arquivos estáticos, não roda Node.js), o seu Front-end tenta fazer o cadastro, mas não em lugar nenhum para mandar os dados. Assim, o banco de dados não recebe nada.

Para consertar, você precisa:
1. **Hospedar o seu Back-end em um servidor online**.
2. **Avisar o Front-end (no Cloudflare Pages) qual é o novo endereço do Back-end**.

---

## Passo 1: Hospedando o Back-end (Grátis com Render)

O **Render** (https://render.com) é um serviço excelente e gratuito para hospedar back-ends NodeJS.

### 1.1 - Preparar o Repositório
O Render precisa puxar o código do seu GitHub. Certifique-se de que a pasta `server/` e todo o código foram enviados (pushed) para o seu repositório no GitHub.

### 1.2 - Criar o Serviço no Render
1. Acesse **[Render.com](https://render.com/)** e faça login (pode usar o seu GitHub).
2. Clique em **"New"** (Novo) no topo direito e escolha **"Web Service"**.
3. Selecione a opção para conectar o seu repositório do **GitHub**.
4. Ache o repositório do seu projeto (ex: `Reybraztech`) e clique em **Connect**.

### 1.3 - Configurar o Web Service
Preencha as opções exatamente assim:

- **Name:** Pode ser qualquer nome (ex: `reybraztech-api`).
- **Region:** Escolha `Ohio (US East)` ou qualquer uma próxima.
- **Branch:** `main` (ou a branch que você usa).
- **Runtime:** `Node`
- **Build Command:** Vai depender do seu server. Se você usa `ts-node` e `nodemon` localmente, para produção o ideal seria compilar. Porém, um atalho rápido é rodar `npm install` na pasta server. Portanto:
  - Comando: `cd server && npm install`
- **Start Command:**
  - Comando: `cd server && npm start` (ou o comando que você configurou no `package.json` do server, como `node index.js`).

**Importante:** Se você não tem um `npm start` na pasta server, modifique para `cd server && ts-node src/index.ts` (não recomendado para produção grande, mas funciona para testar).

Selecione o plano **Free ($0/month)**.

### 1.4 - Configurar as Variáveis de Ambiente (Environment Variables)
Essa é a parte MAIS CRÍTICA. Role a página para baixo e clique em **"Advanced"** > **"Add Environment Variable"**.

Copie TODAS as variáveis vitais do seu `.env` local e cole lá. Por exemplo:
- **Chave:** `DATABASE_URL` | **Valor:** `postgresql://postgres:sua-senha...`
- **Chave:** `SUPABASE_URL` | **Valor:** `https://seu-id.supabase.co`
- **Chave:** `JWT_SECRET` | **Valor:** `reybraztech_super_secret_key_...`
- (Inclua também as chaves `SENDPULSE` ou outras que estiverem no seu `.env` que o **banco de dados ou o login precisem**).

### 1.5 - Finalizar e Fazer o Deploy
Role a página até o final e clique em **"Create Web Service"**. O Render vai baixar seu código, instalar as dependências e iniciar o servidor.

Quando os logs mostrarem algo como `Server running on port...`, o deploy foi um sucesso!
No topo esquerdo da página do Render, **copie o link gerado** (Exemplo: `https://reybraztech-api.onrender.com`).

---

## Passo 2: Configurar o Front-end (Cloudflare Pages)

Agora que o back-end está online e o banco de dados tem um intermediário seguro, você precisa informar ao Front-end (que já está online no Cloudflare Pages) o endereço desse back-end.

1. Acesse o **[DashBoard do Cloudflare](https://dash.cloudflare.com/)**.
2. Vá em **"Workers & Pages"** e selecione o seu projeto (`Reybraztech`).
3. Vá na aba **Configurações (Settings)**.
4. Clique em **Variáveis de ambiente (Environment variables)**.
5. Adicione uma nova variável:
   - **Nome (Key):** `VITE_API_URL`
   - **Valor (Value):** O link que você copiou do Render no Passo 1. (Ex: `https://reybraztech-api.onrender.com`)
6. **Atenção:** Certifique-se de que não haja barra extra `/` no final do URL (deixe assim: `.com`).
7. **ÚLTIMO PASSO (MUITO IMPORTANTE):** O Front-end só lê variáveis de ambiente quando é **"Construído"** (Built). Portanto, volte na aba **"Deployments"** do Cloudflare Pages e mande fazer um **"Retry deployment"** ou **"Novo Deploy"**.

---

## Como sei que deu certo?

Assim que o novo Deploy do Cloudflare terminar, acesse a sua página ao vivo.
Tente fazer um cadastro.
1. O Front-end vai usar a URL (`VITE_API_URL`) para enviar os dados.
2. Eles chegarão no Back-end do Render.
3. O Render enviará os dados para o Supabase e salvará.
4. O cadastro vai funcionar com sucesso marcando que tudo está finalizado corretamente!

Se você ainda enfrentar problemas, verifique os "Logs" no painel do seu serviço Render para ver se algum erro foi acusado no Back-end.
