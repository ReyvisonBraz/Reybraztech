# Scraper — Como o Robô Puppeteer Funciona

> Abra `scraper/src/login.ts` e `scraper/src/renew.ts` enquanto lê.

---

## O que é o scraper e por que existe

O StarHome é o sistema externo de IPTV onde os serviços dos clientes vivem.
Ele não tem API pública — é um painel web (interface Ant Design).

O scraper é um **robô que controla um navegador Chrome real** para:
1. Fazer login no painel StarHome
2. Extrair dados dos clientes (lista, status, plano)
3. Renovar serviços clicando nos botões do painel

É um módulo independente — roda separado do frontend e backend.

---

## Por que Puppeteer (e não uma API)?

O StarHome não expõe API. A única forma de automatizar é simular um humano:
- Abrir o navegador
- Navegar para a URL
- Digitar login e senha
- Resolver o captcha
- Clicar nos botões

O Puppeteer faz isso programaticamente.

---

## A estrutura do scraper

```
scraper/src/
├── index.ts      ← Ponto de entrada: orquestra tudo
├── login.ts      ← Faz login no painel (com captcha, 2FA, cookies)
├── scrape.ts     ← Extrai lista de clientes do painel
├── renew.ts      ← Renova o serviço de um cliente
├── captcha.ts    ← Resolve captchas via 2captcha API
├── telegram.ts   ← Envia alertas e recebe comandos via Telegram
├── export.ts     ← Exporta dados para JSON/CSV
├── debug.ts      ← Ferramentas de inspeção e dump do DOM
└── spy.ts        ← Observa requisições de rede (HAR)
```

---

## login.ts — Como o login funciona

### Problema: bots são detectados

Sites modernos detectam automação por vários sinais:
- `navigator.webdriver = true` (flag do Chrome automático)
- Headers HTTP específicos de bots
- Comportamento mecânico (digitar muito rápido, sem movimentos de mouse)
- IP suspeito

**Soluções usadas:**
- `puppeteer-extra-plugin-stealth`: esconde 20+ sinais de automação
- `humanDelay()`: espera aleatória entre ações (300ms a 1200ms)
- User-Agent real do Chrome
- `navigator.webdriver` forçado como `false`

---

### O fluxo de login

```
1. Inicia o browser com flags anti-detecção
2. Tenta carregar cookies salvos (evita 2FA repetido)
3. Navega para /#/login
4. Verifica se já está logado (cookies funcionaram?)
5. Se não:
   a. Preenche username com delay humano
   b. Preenche password com delay humano
   c. Resolve captcha (via 2captcha ou Tesseract)
   d. Marca "Remember me"
   e. Clica em Login
   f. Aguarda navegação
6. Detecta 2FA:
   a. Clica em "Send" para disparar o SMS/email
   b. Envia alerta no Telegram pedindo o código
   c. Aguarda resposta no Telegram (5 minutos)
   d. Preenche o código e confirma
7. Salva cookies para próxima sessão
8. Retorna { browser, page } para uso nas próximas operações
```

---

### Cookies — por que são salvos

```ts
// scraper/cookies/session.json
// Após login bem-sucedido, os cookies de sessão são salvos aqui.
// Na próxima execução, esses cookies são carregados antes de navegar.
// Se ainda forem válidos → pula o login inteiro (incluindo captcha e 2FA).
```

Isso é crucial: o 2FA aparece só em dispositivos/IPs desconhecidos.
Com cookies válidos, o painel reconhece a sessão e não pede 2FA.

---

## captcha.ts — Como os captchas são resolvidos

O painel tem uma imagem de captcha no login (letras/números distorcidos).

**Processo:**
1. Tira screenshot da imagem do captcha
2. Envia para a API do 2captcha (serviço pago com humanos/IA resolvendo)
3. Aguarda a resposta (geralmente 10-30 segundos)
4. Usa o código retornado no campo de captcha

**Fallback:** se 2captcha falhar, tenta Tesseract (OCR local). É menos preciso.

---

## renew.ts — Como a renovação funciona

O modal de edição do StarHome (Ant Design) é complexo — tem múltiplos formulários dentro do mesmo modal.

### Desafio: clicar no botão errado cria conta nova ao invés de renovar!

O modal tem:
- Formulário de **criação** de contas (parece igual)
- Formulário de **renovação** (identificado pelo atributo `confirmtext="Please confirm whether to renew..."`)
- Formulário de **edição** de dados

**Solução usada:**
```ts
// Encontra o formulário de renovação pelo atributo
const forms = modal.querySelectorAll('form');
for (const form of Array.from(forms)) {
  if (form.getAttribute('confirmtext')?.includes('renew')) {
    renewForm = form; // achou o formulário certo
    break;
  }
}
```

### Por que `page.evaluate()` ao invés de `ElementHandle.click()`?

O Puppeteer v24 tem um bug com modais do Ant Design:
```
Error: Node is not clickable or not an HTMLElement
```

O Ant Design usa transformações CSS e z-index complexos dentro de modais.
O Puppeteer não consegue calcular o "ponto clicável" do elemento.

**Solução:** usar `page.evaluate()` para executar o `.click()` **dentro do contexto do browser**:
```ts
await page.evaluate(() => {
  const btn = document.querySelector('.ant-btn-primary');
  (btn as HTMLElement).click(); // clique no DOM real, sem passar pelo Puppeteer
});
```

---

## telegram.ts — Como o Telegram é usado

O scraper usa o Telegram para:
1. **Notificações:** avisa quando o scraper termina, quando há erro
2. **Input interativo:** pede o código 2FA e aguarda resposta
3. **Comandos remotos:** executar o scraper de qualquer lugar

```ts
// Envia mensagem
await sendTelegramMessage('🔐 Código 2FA necessário! Responda com o código.');

// Aguarda resposta por até 5 minutos
const code = await waitForTelegramReply(300000, 'código 2FA');
```

O bot usa **long polling** — fica consultando a API do Telegram a cada segundo esperando novas mensagens.

---

## Como rodar o scraper

```bash
cd scraper

# Instalar dependências (primeira vez)
npm install

# Rodar
npm start
# ou em desenvolvimento:
npx ts-node src/index.ts
```

**Variáveis necessárias em `scraper/.env`:**
```bash
STARHOME_URL=https://...
STARHOME_ACCOUNT=seu_login
STARHOME_PASSWORD=sua_senha
TWOCAPTCHA_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
HEADLESS=false  # false = abre janela do Chrome (útil para debug)
```

---

## Dicas para entender o scraper

1. **Rode com `HEADLESS=false`** — você vê o Chrome abrindo e o robô operando em tempo real.

2. **Screenshots de debug** — o scraper salva screenshots em `scraper/output/` em cada etapa crítica. Se falhar, olhe o screenshot para ver o estado do painel naquele momento.

3. **`page.evaluate()`** é a chave — tudo que precisa interagir com o DOM de forma complexa usa evaluate. É código JavaScript rodando dentro do Chrome, não no Node.js.

4. **`waitForFunction`** é mais confiável que `delay`** — espera uma condição real ao invés de um tempo fixo:
   ```ts
   // Frágil: espera 2s torcendo para ter carregado
   await delay(2000);

   // Robusto: espera até o elemento aparecer
   await page.waitForFunction(() =>
     document.querySelectorAll('.ant-table-row').length > 0
   );
   ```
