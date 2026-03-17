import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { solveCaptcha } from './captcha';
import type { Page, Browser } from 'puppeteer';

const COOKIES_DIR = path.join(__dirname, '..', 'cookies');
const COOKIES_FILE = path.join(COOKIES_DIR, 'session.json');

/** Espera N milissegundos */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Salva os cookies da sessão atual para reusar depois (evita 2FA repetido).
 */
async function saveCookies(page: Page): Promise<void> {
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log('  💾 Cookies salvos para próximas sessões');
}

/**
 * Carrega cookies salvos previamente.
 */
async function loadCookies(page: Page): Promise<boolean> {
  if (fs.existsSync(COOKIES_FILE)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
      await page.setCookie(...cookies);
      console.log('  🍪 Cookies carregados de sessão anterior');
      return true;
    } catch {
      console.log('  ⚠️  Falha ao carregar cookies, fazendo login normal');
    }
  }
  return false;
}

/**
 * Pede um código de verificação 2FA ao usuário no terminal.
 */
async function ask2FACode(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n  🔐 Digite o código 2FA recebido por e-mail/telefone: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Verifica se a tela de 2FA apareceu (seja modal ou redirecionamento) e lida com ela.
 */
async function handle2FA(page: Page): Promise<boolean> {
  await delay(2000);

  // Procura o botão de enviar código ou o input de código para confirmar que é realmente 2FA
  let has2FAElements = false;
  
  const detectButtons = await page.$$('button, span.text-primary, a.text-primary');
  for (const btn of detectButtons) {
    const text = await btn.evaluate((el: Element) => el.textContent || '');
    if (text.includes('Send') || text.includes('Enviar') || text.includes('Get code')) {
      const isVisible = await btn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
      });
      if (isVisible) {
        has2FAElements = true;
        break;
      }
    }
  }

  if (!has2FAElements) {
     const inputs = await page.$$('input[type="text"]');
     for (const input of inputs) {
       const isVisible = await input.evaluate((el) => {
         const style = window.getComputedStyle(el);
         return style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
       });
       if (isVisible) {
         const ph = await input.evaluate(el => el.getAttribute('placeholder') || '');
         if (ph.toLowerCase().includes('code') || ph.toLowerCase().includes('código')) {
           has2FAElements = true;
           break;
         }
       }
     }
  }

  const url = page.url();
  let isSecurityPage = url.includes('/info/accountSecurity');

  if (!has2FAElements && !isSecurityPage) {
    return false;
  }
  
  if (!has2FAElements) {
     // Even if it's security page, if no 2FA elements are visible, it was probably just a dashboard that looks like security page
     return false;
  }

  console.log('\n  🔒 Verificação de 2FA detectada! (Dispositivo / Navegador desconhecido)');
  console.log('  📧 Verifique seu e-mail ou telefone para o código de verificação.');

  // Procura e clica no botão "Send"
  let sendClicked = false;
  const sendButtons = await page.$$('button');
  for (const btn of sendButtons) {
    const text = await btn.evaluate((el: Element) => el.textContent || '');
    if (text.includes('Send') || text.includes('Enviar') || text.includes('Get code')) {
      await btn.click();
      console.log('  📤 Código de verificação enviado!');
      sendClicked = true;
      await delay(1000);
      break;
    }
  }

  // Se for a página /info/accountSecurity, os botões e campos podem estar diferentes
  if (!sendClicked && isSecurityPage) {
    // Tenta encontrar o botão "Send" em links ou spans que agem como botões
    const sendElements = await page.$$('.send-code, span.text-primary, a.text-primary');
    for (const el of sendElements) {
      const text = await el.evaluate((e: Element) => e.textContent || '');
      if (text.includes('Send') || text.includes('Enviar')) {
        await (el as any).click();
        console.log('  📤 Código de verificação enviado!');
        await delay(1000);
        break;
      }
    }
  }

  // Pede o código ao usuário
  const code = await ask2FACode();

  // Encontra o campo de input do código e preenche
  const codeInputSelectors = [
    '.el-dialog input[type="text"]',
    '.el-dialog input',
    'input[placeholder*="code"]',
    'input[placeholder*="código"]',
    'input[placeholder*="Code"]',
    '.code-input input'
  ];

  let codeInserted = false;
  for (const selector of codeInputSelectors) {
    const input = await page.$(selector);
    if (input) {
      await input.click({ clickCount: 3 });
      await input.type(code);
      codeInserted = true;
      break;
    }
  }

  // Fallback se não achou o input
  if (!codeInserted) {
    const allInputs = await page.$$('input[type="text"]');
    for (const input of allInputs) {
      const ph = await input.evaluate(el => el.getAttribute('placeholder') || '');
      if (ph.toLowerCase().includes('code') || ph.toLowerCase().includes('código')) {
        await input.click({ clickCount: 3 });
        await input.type(code);
        break;
      }
    }
  }

  // Clica no botão "Confirm"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate((el: Element) => el.textContent || '');
    if (text.includes('Confirm') || text.includes('确认') || text.includes('Confirmar') || text.includes('Verify')) {
      await btn.click();
      console.log('  ✅ Código 2FA inserido e confirmado!');
      break;
    }
  }

  await delay(3000);
  return true;
}

/**
 * Faz login no painel ResellerSystem.
 */
export async function loginToPanel(config: {
  url: string;
  account: string;
  password: string;
  headless: boolean;
}): Promise<{ browser: Browser; page: Page }> {
  console.log('\n🚀 Iniciando login no painel StarHome...\n');

  const browser = await puppeteer.launch({
    headless: config.headless,
    defaultViewport: null, // Deixa o puppeteer usar o tamanho da janela
    args: [
      '--start-maximized', // Abre maximizado
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  // User agent realista
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  );

  // Esconde sinais de automação
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Carrega cookies se existirem
  await loadCookies(page);

  // Navega para a página de login
  console.log(`  🌐 Acessando ${config.url}/#/login`);
  await page.goto(`${config.url}/#/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000);

  // Verifica se já está logado (cookies funcionaram)
  const currentUrl = page.url();
  if (!currentUrl.includes('login')) {
    console.log('  ✅ Já autenticado via cookies salvos!');
    return { browser, page };
  }

  console.log('  📝 Preenchendo formulário de login...');

  // Preenche os campos usando a lista de inputs do formulário
  const inputs = await page.$$('input.el-input__inner, input[type="text"], input[type="password"]');

  if (inputs.length >= 3) {
    // Input 0: Account
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type(config.account, { delay: 50 });
    console.log('  ✅ Account preenchido');

    // Input 1: Password
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type(config.password, { delay: 50 });
    console.log('  ✅ Password preenchido');

    // Resolve o captcha
    const captchaCode = await solveCaptcha(page);

    // Input 2: Captcha
    await inputs[2].click({ clickCount: 3 });
    await inputs[2].type(captchaCode, { delay: 50 });
    console.log('  ✅ Captcha preenchido');
  } else {
    // Fallback: tenta por placeholder
    const accountInput = await page.$('input[placeholder*="Account"], input[placeholder*="account"]');
    const passwordInput = await page.$('input[type="password"], input[placeholder*="Password"]');

    if (accountInput) {
      await accountInput.click({ clickCount: 3 });
      await accountInput.type(config.account, { delay: 50 });
      console.log('  ✅ Account preenchido');
    }

    if (passwordInput) {
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(config.password, { delay: 50 });
      console.log('  ✅ Password preenchido');
    }

    const captchaCode = await solveCaptcha(page);
    const captchaInput = await page.$('input[placeholder*="code"], input[placeholder*="Code"]');
    if (captchaInput) {
      await captchaInput.click({ clickCount: 3 });
      await captchaInput.type(captchaCode, { delay: 50 });
      console.log('  ✅ Captcha preenchido');
    }
  }

  // Clica em Login
  console.log('  🔑 Clicando em Login...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate((el: Element) => el.textContent || '');
    if (text.includes('Login') || text.includes('login') || text.includes('Entrar')) {
      await btn.click();
      break;
    }
  }

  // Aguarda resultado do login
  console.log('  ⏳ Aguardando resposta do login...');
  await delay(3000);

  // Verifica se tem 2FA
  const had2FA = await handle2FA(page);
  if (had2FA) {
    await delay(3000);
  }

  // Verifica se login foi bem sucedido (pode redirecionar para dashboard ou account list)
  let afterLoginUrl = page.url();
  let isLoggedIn = !afterLoginUrl.includes('login') || afterLoginUrl.includes('/info/accountSecurity');

  if (!isLoggedIn) {
    const errorMsg = await page.$('.el-message--error, .el-alert--error');
    if (errorMsg) {
      const errorText = await errorMsg.evaluate((el: Element) => el.textContent || '');
      console.log(`\n  ❌ Erro no login: ${errorText}`);
      console.log('  💡 Verifique se o captcha foi digitado corretamente.');
      console.log('  🔄 Tentando novamente...\n');

      // Recarrega e tenta de novo com captcha manual
      await page.reload({ waitUntil: 'networkidle2' });
      await delay(2000);

      const retryInputs = await page.$$('input.el-input__inner, input[type="text"], input[type="password"]');
      if (retryInputs.length >= 3) {
        await retryInputs[0].click({ clickCount: 3 });
        await retryInputs[0].type(config.account, { delay: 50 });
        await retryInputs[1].click({ clickCount: 3 });
        await retryInputs[1].type(config.password, { delay: 50 });

        const manualCaptcha = await solveCaptcha(page);
        await retryInputs[2].click({ clickCount: 3 });
        await retryInputs[2].type(manualCaptcha, { delay: 50 });

        // Login novamente
        const retryButtons = await page.$$('button');
        for (const btn of retryButtons) {
          const text = await btn.evaluate((el: Element) => el.textContent || '');
          if (text.includes('Login')) {
            await btn.click();
            break;
          }
        }

        await delay(3000);
        const retryHad2FA = await handle2FA(page);
        if (retryHad2FA) await delay(3000);
      }
    }
  }

  // Salva cookies para próximas sessões
  await saveCookies(page);

  const finalUrl = page.url();
  isLoggedIn = !finalUrl.includes('login') || finalUrl.includes('/info/accountSecurity');
  
  if (isLoggedIn) {
    console.log('\n  ✅ Login realizado com sucesso!');
    console.log(`  📍 Página atual: ${finalUrl}\n`);
  } else {
    console.log('\n  ⚠️  Parece que o login não foi concluído.');
    console.log('  📍 Verifique a janela do navegador e faça login manualmente se necessário.');
    console.log('  ⏳ Aguardando 30 segundos para login manual...\n');
    await delay(30000);
    await saveCookies(page);
  }

  return { browser, page };
}
