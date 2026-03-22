# 🚨 Guia 10 — Fluxo de Recuperação de Senha & Estratégias de UX

> **Para quem é este guia?** Se você é estudante de ADS (Análise e Desenvolvimento de Sistemas), este guia é um estudo de caso prático de como resolver problemas de regras de negócios externas (WhatsApp) usando criatividade no Frontend (React) e Lógica no Backend (Node.js).

---

## 📅 O Problema Original

Nós tínhamos o fluxo de "Cadastro" e "Login via WhatsApp" funcionando. Mas o cliente não tinha como **Redefinir a Senha** caso esquecesse.
Mais grave ainda: As APIs oficiais do WhatsApp (como a SendPulse) possuem uma regra inflexível chamada **Janela de 24 Horas**. 
- O servidor não pode enviar uma mensagem "do nada" para um cliente.
- A menos que se pague por um "Template de Mensagem Aprovado pela Meta".

Como nossa missão é manter os custos zero sempre que possível, como faríamos o cliente receber o "Código de Recuperação (OTP)" sem pagar por templates Mêta?

---

## 🧠 A Solução: A Estratégia Burlar as 24h (Inversão de Iniciativa)

No Desenvolvimento de Software, quando não podemos mudar a API de terceiros, mudamos a **Jornada do Usuário (UX)**. A janela de 24h *abre de graça* no momento em que o cliente manda a primeira mensagem para você.

**O Fluxo Antigo (Caro e Bloqueado):**
1. Cliente escreve o número no site e clica "Recuperar".
2. Servidor tenta mandar OTP.
3. SendPulse bloqueia (Erro 400), pois o cliente nunca falou com o robô antes.

**O Fluxo Novo (Inteligente e Grátis):**
1. O site mostra um botão verde gigante que diz "1. Iniciar Atendimento WhatsApp".
2. Esse botão é um link direto (usando a API da SendPulse / `wa.me`) com um texto pré-preenchido. Ex: *"Olá, preciso recuperar minha senha..."*
3. O cliente clica, o celular dele abre o WhatsApp e envia essa mensagem.
4. **BINGO!** O cliente abriu a janela de 24h sozinho. 
5. Agora o cliente volta para o site, preenche o número e o Servidor não é mais bloqueado ao enviar o OTP de graça.

---

## 🧱 Como as Telas (Mockups) foram construídas

Para implementar essa estratégia, precisamos construir uma interface (Frontend) amigável que obrigue o cliente a seguir esses passos de forma natural.

### Componente Criado: `PasswordRecoveryModal.tsx`

Nós criamos um **Modal** (uma janela que flutua na tela de Login) contendo 3 **Passos Restritos (Steps)**. Em sistemas web avançados, chamamos isso de *Wizard* ou *Stepper*.

### 🛡️ O Bloqueador Visual (Anti-Bypass de UX)

**O Desafio de Interface:**
O cliente ansioso costuma pular regras. Se ele só visse os campos para digitar o telefone, ele ia digitar e clicar "Avançar" sem clicar antes no link do WhatsApp. E o sistema ia falhar (pois o SendPulse barraria).

**A Arquitetura de Prevenção (React):**
Dentro do Passo 1 do arquivo `src/components/PasswordRecoveryModal.tsx`, nós criamos uma barreira invisível sobre as caixas de texto.
- Como foi feito? Com CSS! Nós colocamos `absolute inset-0 z-10 cursor-not-allowed` em cima da caixa de texto, caso a variável temporal `whatsappSent` fosse *Falsa*.
- O que acontece se ele clicar? Nós capturamos o clique (`onClickCapture`) usando React e ativamos um **Toast/Alerta em Vermelho** vibrante: *"⚠️ Ação Requerida: Você precisa clicar no botão verde..."*.
- Resultado: **UX Punitiva Positiva.** Nós não o deixamos errar; nós bloqueamos o erro visualmente e indicamos o caminho correto, garantindo a solidez da API de Backend que depende dessa ação.

---

## 🔒 Consumo Inteligente de Tokens (OTP API)

Depois que o cliente recebia a mensagem no WhatsApp, enfrentamos mais um Bug no Backend: ele digitava o OTP e ia pro Passo 3 (digitar a nova senha). Porém, quando clicava em "Salvar Nova Senha", dava erro de "Código Inválido".

**Por que esse erro existia? (Problema Crasso de Lógica)**
1. A função `verifyOTP` (criada no `server/routes/otp.ts`) marcava o token no banco de dados como `used = 1` assim que o Passo 2 era validado.
2. Quando o Passo 3 mandava a API finalmente salvar a nova senha, a API rodava o `verifyOTP` de novo (para garantir a segurança).
3. E o que a API lia? *"Opa, esse OTP já foi consumido (`used=1`) há 5 segundos, negado!"*.

**A Correção (Refatoração de Parâmetros opcionais):**
Em ADS, chamamos isso de **Injeção de Dependência Opcional**. Fomos no arquivo `server/services/otp.ts` e mudamos a assinatura da função:
De: `function verifyOTP(whatsapp, token, type)`
Para: `function verifyOTP(whatsapp, token, type, consume = true)`

O que essa flag `consume` faz?
- No Passo 2 (Pura checagem visual de "Código Certo?"), o sistema agora avisa: `verifyOTP(...consume = false)`. Ou seja, *"Só olhe no banco se a senha táerta, mas não queime ela ainda"*.
- No Passo 3 (Trocou a senha e Salvou), o sistema manda `verifyOTP(...consume = true)`. O Token agora foi consumido e não serve pra mais nada. Acesso seguro!

---

## 💅 Detalhe Estético: Animações Orgânicas e Responsividade

O Desenvolvimento de Frontend moderno vai além de caixas e textos. A Retenção Visual e Conversão definem um software de sucesso.
- **Botão Pulsante (`LoginPage.tsx`):** Usamos a biblioteca de animação em Física de Partículas chamada `Framer Motion` (módulo `motion.div`). Com as diretivas mágicas de `animate={{ scale: [1, 1.05, 1] }}` criamos um Botão de *"Criar Conta"* que respira infinitamente (suavemente ficando maior e menor), atraindo como um ímã a atenção do novo consumidor do Streaming.
- **Menu Cortina Responsivo (`Navbar.tsx`):** Em celulares, abrir o menu antes dava uma pequena "piscada" esquisita (Glitch Visual), devido ao CSS mudar do estado Desaparecido (`opacity-0 hidden`) para Aparente em um milésimo de segundo. A solução Front End Clássica: Nós amarramos o menu a uma altura variável e ativamos a propriedade `overflow-hidden`. O menu agora "desce" deslizando as bordas. Engajamento liso e imperceptível.

---

### Resumo para o seu TCC (Conceitos Envolvidos nesta fase)
1. Integração de API de Terceiros e Lógica Bypassing (SendPulse Meta API)
2. Gestão de Estado Global/Local (React `useState`, `step`)
3. Manipulação Comportamental (React DOM Interception de Eventos)
4. Lógica de Parâmetros Flag Opcionais no Backend (Node.js/TypeScript)
5. Framer/CSS Dinâmico (Experiência do Usuário). 
