# O que pode melhorar

Este arquivo lista melhorias possiveis, separadas por objetivo.

## 1. Ajudar o cliente a entender o servico

Melhorias:

- Deixar a primeira dobra mais direta: o que e, onde funciona, como testar e como comprar.
- Colocar uma secao simples "Como funciona em 3 passos".
- Explicar melhor compatibilidade: Android TV, TV Box, Fire Stick, celular Android, web player, iOS via navegador.
- Evitar promessas ambiguas como "3 dias" em um lugar e "3 a 7 dias" em outro.
- Revisar texto para cliente leigo, evitando termos muito tecnicos.

Resultado esperado:

- Menos duvidas antes do clique.
- Mais cliques em teste gratis e checkout.

## 2. Facilitar teste gratis

Melhorias:

- Mascara de WhatsApp com DDD.
- Se WhatsApp ja existe, oferecer "Entrar na minha conta" ou "Falar com suporte".
- Salvar etapa do tutorial onde o cliente parou.
- Enviar mensagem automatica para suporte quando cliente clicar "Nao consegui".
- Mostrar botao de WhatsApp com texto pronto durante o tutorial.
- Padronizar prazo do teste.

Resultado esperado:

- Mais testes completados.
- Suporte recebe contexto melhor.

## 3. Facilitar cadastro

Melhorias:

- Definir um fluxo oficial:
  - teste gratis cria conta antes;
  - compra nova cria pedido antes e cadastro depois do pagamento;
  - cliente existente renova logado.
- Evitar tres caminhos parecidos confundindo o usuario.
- Usar WhatsApp como chave principal.
- Ter mensagens amigaveis para duplicidade.

Resultado esperado:

- Menos cliente preso em erro de "WhatsApp ja cadastrado".
- Menos cadastro inativo abandonado.

## 4. Facilitar compra

Melhorias:

- Criar pagina de status do pedido.
- Retornar Mercado Pago para status do pedido, nao direto para dashboard.
- Mostrar estado: aguardando pagamento, pago, cadastro pendente, acesso liberado.
- Enviar link de completar cadastro pelo WhatsApp apos pagamento aprovado.
- Remover ou esconder gateway que nao estiver 100% pronto.
- Corrigir fallback dos planos que estao como `#`.

Resultado esperado:

- Compra mais segura e com menos suporte manual.
- Cliente sabe exatamente o que fazer depois de pagar.

## 5. Facilitar renovacao

Melhorias:

- Mostrar "vence em X dias" com destaque.
- Pre-selecionar plano recomendado.
- Permitir trocar plano direto no dashboard.
- Explicar se renova agora soma dias ou reinicia periodo.
- Manter login do cliente quando ele ja tem credenciais.
- Confirmar pagamento e atualizar dashboard sem precisar sair e voltar.

Resultado esperado:

- Renovacao mais rapida.
- Menos medo de perder acesso.

## 6. Melhorar pos-compra e entrega de acesso

Melhorias:

- Quando cliente paga e nao existe cadastro, enviar link automatico para finalizar.
- Quando cliente ja existe, atualizar plano e mostrar sucesso no dashboard.
- Quando pool estiver vazio, mostrar estado claro e acionar suporte automaticamente.
- Enviar WhatsApp de confirmacao com resumo do plano e proximo passo.

Resultado esperado:

- Cliente nao fica perdido depois de pagar.
- Menos acionamento manual pelo Telegram.

## 7. Melhorar dashboard

Melhorias:

- Transformar dashboard em checklist de primeiro acesso:
  - baixar app;
  - instalar;
  - abrir;
  - ver login/senha;
  - falar com suporte.
- Botao suporte com link real.
- Melhorar card de credenciais para copiar usuario e senha.
- Mostrar status do StarHome de forma mais simples.
- Melhorar historico de pagamentos em mobile.

Resultado esperado:

- Cliente entende o painel sem precisar perguntar.

## 8. Melhorar scraper e renovacao StarHome

Melhorias:

- Renovar sempre por account, nao por nome.
- Fazer busca primeiro e confirmar cliente antes de renovar.
- Criar dry-run pelo painel admin.
- Remover script legado ou renomear para evitar uso errado.
- Registrar historico de sync/renew.
- Mostrar 2FA pendente no admin de forma bem clara.

Resultado esperado:

- Menos risco operacional.
- Mais confianca para renovar pelo sistema.

## 9. Melhorar organizacao tecnica

Melhorias:

- Centralizar definicao de planos.
- Quebrar paginas grandes em componentes.
- Centralizar fetch/API client.
- Criar tipos compartilhados.
- Criar mensagens padronizadas de erro e sucesso.
- Revisar encoding/textos.

Resultado esperado:

- Codigo mais facil de manter.
- Menos erros repetidos.

## 10. Melhorar confiabilidade

Melhorias:

- Criar checklist de variaveis `.env`.
- Validar envs importantes no startup.
- Criar testes simples para auth, orders e payments.
- Criar simulacao local de webhook.
- Ter logs mais rastreaveis por `orderId` e `whatsapp`.

Resultado esperado:

- Menos surpresa em producao.
- Correcoes mais rapidas quando algo falhar.
