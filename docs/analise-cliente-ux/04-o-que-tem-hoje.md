# O que o projeto tem hoje

Este arquivo lista as partes que ja existem no projeto, para termos clareza antes de mexer.

## 1. Site publico / Landing page

Arquivos principais:

- `src/pages/LandingPage.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/web-gl-shader.tsx`

O que ja existe:

- Hero principal com chamada para teste gratis e planos.
- Secao de compatibilidade por dispositivo.
- Secao de planos com links para checkout.
- FAQ.
- Botoes para WhatsApp e chat ao vivo.
- Visual moderno com animacoes e fundo WebGL.

Observacoes:

- A landing vende bem visualmente.
- Algumas informacoes importantes para cliente leigo podem ficar mais diretas.
- Existem textos com acentos misturados, alguns corretos e alguns sem acento.

## 2. Teste gratis

Arquivo principal:

- `src/pages/TrialPage.tsx`

Backend relacionado:

- `server/routes/auth.ts`
- `server/routes/orders.ts`
- `server/routes/dashboard.ts`

O que ja existe:

- Formulario para criar conta de teste.
- Captura nome, WhatsApp e senha.
- Tutorial separado para celular Android e TV Box/Smart TV.
- Link de download do app.
- Codigo `850811` para Downloader.
- Confirmacao se o app funcionou.
- Ativacao de trial por 3 dias quando o cliente confirma.
- Notificacao de feedback para suporte.

Observacoes:

- E um dos melhores fluxos do projeto.
- Pode virar modelo para o pos-compra.
- Precisa tratar melhor cliente que ja existe.

## 3. Cadastro normal

Arquivo principal:

- `src/pages/RegisterPage.tsx`

Backend relacionado:

- `server/routes/auth.ts`

O que ja existe:

- Cadastro em etapas.
- Campos de nome, sobrenome, dispositivo, WhatsApp e senha.
- Auto-login depois do cadastro.
- Tela de sucesso com escolha de plano.

Observacoes:

- Cria cliente inativo antes do pagamento.
- E funcional, mas compete com o fluxo de checkout e complete-registration.

## 4. Checkout / compra

Arquivo principal:

- `src/pages/CheckoutPage.tsx`

Backend relacionado:

- `server/routes/orders.ts`
- `server/routes/payments.ts`
- `server/services/mercadopago.ts`
- `server/services/infinitypay.ts`

O que ja existe:

- Seleciona plano por query string.
- Detecta se usuario esta logado.
- Para cliente logado, cria pedido de renovacao.
- Para cliente novo, cria pedido com nome, WhatsApp e plano.
- Mercado Pago como gateway principal.
- InfinityPay parcialmente integrada.
- Fallback de link Mercado Pago para mensal.
- Suporte via WhatsApp no checkout.

Observacoes:

- O backend define os precos, o que e correto.
- O ponto fragil e o retorno depois do pagamento.
- Cliente novo pode pagar e nao ter caminho automatico claro para terminar cadastro.

## 5. Cadastro pos-pagamento

Arquivo principal:

- `src/pages/CompleteRegistrationPage.tsx`

Backend relacionado:

- `server/routes/auth.ts`
- `server/routes/orders.ts`

O que ja existe:

- Busca pedido por `order`.
- Aguarda pedido pendente.
- Se pedido estiver pago, permite completar cadastro.
- Solicita dispositivo, e-mail opcional e senha.
- Faz login automatico depois de cadastrar.

Observacoes:

- A pagina e importante, mas hoje nao parece ser usada como retorno principal do pagamento.
- `GET /api/orders/:id` exige JWT, o que dificulta cliente novo consultar pedido.

## 6. Login e recuperacao

Arquivos principais:

- `src/pages/LoginPage.tsx`
- `src/components/PasswordRecoveryModal.tsx`
- `server/routes/auth.ts`
- `server/routes/otp.ts`

O que ja existe:

- Login por WhatsApp ou e-mail.
- Campo de senha com mostrar/ocultar.
- Mensagem de servidor hibernando.
- Modal de recuperacao.
- OTP por WhatsApp.

Observacoes:

- O botao "Lembrar" existe visualmente, mas nao vi comportamento real.
- Login depende do WhatsApp estar no formato esperado pelo banco.

## 7. Dashboard do cliente

Arquivo principal:

- `src/pages/DashboardPage.tsx`

Backend relacionado:

- `server/routes/dashboard.ts`

O que ja existe:

- Dados da assinatura.
- Status do cliente.
- Plano atual.
- WhatsApp.
- Acesso rapido para baixar app, tutorial e web player.
- Credenciais de acesso ao app.
- Estado para cliente inativo.
- Estado para cliente ativo sem login atribuido.
- Historico de pagamentos.
- Card de renovacao.
- Validacao de WhatsApp.
- Dados StarHome quando vinculados.

Observacoes:

- Tem bastante informacao util.
- Pode ficar mais guiado para cliente novo.
- Botao suporte precisa acao.
- Renovacao precisa ficar mais clara e confiavel.

## 8. Admin

Arquivos principais:

- `src/pages/AdminPage.tsx`
- `src/components/admin/*`
- `server/routes/admin.ts`
- `server/routes/scraper.ts`

O que ja existe:

- Area admin protegida.
- Monitoramento de sistema.
- Cards de saude.
- Console/logs.
- Pool de logins.
- Sync StarHome.
- Busca e renovacao via scraper.

Observacoes:

- Ja tem base forte.
- Fluxo de renovacao precisa evitar ambiguidade por nome.

## 9. Pagamentos e pedidos

Arquivos principais:

- `server/routes/orders.ts`
- `server/routes/payments.ts`
- `server/services/mercadopago.ts`
- `server/services/infinitypay.ts`

O que ja existe:

- Criacao de pedido.
- Reuso de pedido pendente recente para cliente novo.
- Renovacao para usuario logado.
- Webhook Mercado Pago.
- Webhook InfinityPay.
- Atualizacao de pedido para `paid` ou `registered`.
- Atribuicao de login do pool quando existe cliente.

Observacoes:

- Precisa melhorar pedido sem cadastro.
- Precisa definir se renovacao soma dias ou substitui dias.
- Precisa decidir se cliente existente mantem login ou recebe outro.

## 10. Scraper StarHome

Arquivos principais:

- `reybraztech-scraper/src/server.ts`
- `reybraztech-scraper/src/index.ts`
- `reybraztech-scraper/src/scrape.ts`
- `reybraztech-scraper/src/renew.ts`
- `reybraztech-scraper/src/update-db.ts`
- `server/routes/scraper.ts`

O que ja existe:

- Servidor separado do scraper.
- Endpoint `/run` para sync, search e renew.
- Jobs assicronos.
- Polling por `/job/:id`.
- Lista de jobs recentes.
- Health e ready check.
- Controle de concorrencia.
- Suporte a 2FA.
- Sync completo.
- Busca por account, nome ou telefone.
- Renovacao por account ou busca.

Observacoes:

- O scraper principal esta bem estruturado.
- `server/scraper-runner.ts` parece legado e precisa revisao.
- Renovacao por nome pode causar erro operacional.

## 11. Infra, configuracao e seguranca

Arquivos principais:

- `.env.example`
- `server/database.ts`
- `server/schema.sql`
- `server/middleware/auth.ts`
- `server/middleware/admin.ts`
- `vercel.json`
- `vite.config.ts`

O que ja existe:

- JWT.
- Rate limits.
- Helmet.
- CORS configurado.
- Supabase/Postgres.
- Logs e Sentry quando configurado.
- Telegram para alertas.

Observacoes:

- `JWT_SECRET` e obrigatorio.
- `DATABASE_URL` e obrigatorio.
- Algumas tabelas sao criadas/migradas parcialmente pelo codigo.
- Seria bom ter checklist de envs por ambiente.
