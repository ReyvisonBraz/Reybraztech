# Backlog priorizado

## Prioridade alta: compra e cadastro

### A1. Corrigir volta do Mercado Pago para cliente novo

Problema: `server/routes/orders.ts` envia sucesso para `/dashboard?payment=success`, mas cliente novo ainda nao tem login.

Melhoria:

- criar rota/pagina `/order-status?order=...`;
- usar essa pagina em `back_urls.success`, `pending` e talvez `failure`;
- se pedido estiver `paid` e cliente nao existir, mostrar botao "Finalizar cadastro";
- se cliente ja existir, mandar para dashboard.

Arquivos provaveis:

- `server/routes/orders.ts`
- `server/routes/payments.ts`
- `src/pages/CompleteRegistrationPage.tsx`
- nova pagina `src/pages/OrderStatusPage.tsx`
- `src/App.tsx`

### A2. Permitir consultar pedido sem JWT com token seguro

Problema: `GET /api/orders/:id` exige JWT, mas o cliente novo ainda nao tem token.

Melhoria:

- criar endpoint publico limitado, por exemplo `/api/orders/public/:id?wa=ultimos4` ou com `order_access_token`;
- retornar apenas dados seguros: status, plano, valor, se precisa cadastro;
- nao expor dados sensiveis.

### A3. Enviar link de completar cadastro apos pagamento aprovado

Problema: pagamento sem cadastro hoje depende de alerta manual no Telegram.

Melhoria:

- quando o webhook aprovar pedido sem cliente, enviar WhatsApp com link `/complete-registration?order=...`;
- manter alerta no Telegram, mas como monitoramento, nao como unica solucao.

Observacao: existe `server/services/whatsapp.ts` com referencia a `/complete-registration?order=...`; verificar e aproveitar antes de criar do zero.

### A4. Melhorar checkout para compra rapida

Melhorias pequenas:

- remover escolha de gateway se InfinityPay nao estiver totalmente pronto;
- explicar claramente "PIX ou cartao no ambiente seguro";
- mostrar "nome + WhatsApp" em uma etapa curta;
- guardar plano selecionado e voltar sem perder dados;
- trocar fallback `#` por suporte quando link real nao existir.

## Prioridade alta: teste gratis

### B1. Deixar o trial mais confiavel

Pontos bons:

- fluxo guiado por dispositivo;
- tutorial com codigo `850811`;
- pergunta se funcionou;
- aciona suporte se nao funcionou.

Melhorias:

- validar WhatsApp com mascara e DDD antes de enviar;
- oferecer "ja tenho conta, quero testar" para quem tentou duplicado;
- quando WhatsApp ja existe, direcionar para login ou painel em vez de erro seco;
- registrar qual etapa o cliente parou, para suporte agir melhor.

### B2. Revisar promessa do teste

Na landing aparece "Teste Gratis 3 Dias" e em outro texto "3 a 7 dias". Padronizar para evitar duvida.

## Prioridade media: dashboard e renovacao

### C1. Renovacao deve mostrar plano atual e vencimento real

Hoje o card de renovacao e bom, mas generico. Melhorar com:

- "Seu plano vence em X dias";
- plano recomendado pre-selecionado;
- botoes rapidos: Mensal, Trimestral, Semestral, Anual;
- aviso se o cliente esta vencido;
- CTA "Renovar com PIX/cartao".

### C2. Pos-renovacao precisa atualizar acesso automaticamente

Verificar regra atual:

- pagamento aprovado de cliente existente atualiza `days_remaining`;
- se existe login disponivel, atribui `app_account`;
- se pool vazio, ativa sem login e mostra "Solicitar acesso".

Melhorias:

- se cliente ja tem `app_account`, renovacao nao deveria trocar login sem necessidade;
- somar dias restantes em vez de substituir dias, se essa for a regra comercial;
- registrar historico de renovacao com pedido e plano.

### C3. Botao suporte no dashboard

O botao "Suporte" em acesso rapido precisa abrir WhatsApp/chat com mensagem contextual.

## Prioridade media: entendimento da landing

### D1. Primeira dobra deve ser mais direta para cliente leigo

A landing e bonita, mas pode explicar melhor:

- "Funciona em TV Box, Fire Stick, Android e Smart TV Android";
- "Teste gratis";
- "Pague por PIX/cartao";
- "Receba acesso e tutorial".

### D2. Compatibilidade sem ambiguidade

Melhorar copy:

- Roku nao compativel;
- iOS via navegador;
- TVs Samsung/LG podem precisar alternativa;
- internet minima recomendada.

## Prioridade baixa: limpeza tecnica

### E1. Refatorar paginas grandes

`LandingPage.tsx` e `DashboardPage.tsx` sao grandes. Quebrar depois que o funil estiver corrigido.

Sugestao:

- `landing/Hero.tsx`
- `landing/Pricing.tsx`
- `landing/Compatibility.tsx`
- `dashboard/SubscriptionCard.tsx`
- `dashboard/AccessCredentials.tsx`
- `dashboard/RenewalCard.tsx`

### E2. Centralizar planos

Hoje precos/dias aparecem em frontend e backend. Criar fonte compartilhada ou pelo menos arquivo espelho bem controlado:

- ids dos planos;
- nomes;
- dias;
- precos;
- destaque;
- features.

### E3. Revisar textos e encoding

Fazer uma passada em todos os textos visiveis e mensagens WhatsApp/Telegram.

Itens:

- acentos;
- emojis quebrados;
- termos mistos ingles/portugues;
- promessas nao implementadas;
- tom mais simples.
