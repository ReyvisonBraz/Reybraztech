import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import type { Page, ElementHandle } from 'puppeteer';
import { sendCaptchaToTelegram, waitForCaptchaFromTelegram, askCaptchaTerminal } from './telegram';

/**
 * Captura o captcha da página de login e tenta resolver com OCR.
 * Se falhar, pede input via Telegram, e se não tiver, no terminal.
 */
export async function solveCaptcha(page: Page): Promise<string> {
  console.log('🔍 Capturando captcha...');

  // Aguarda o elemento do captcha aparecer
  await page.waitForSelector('.verify-code-area img, canvas, .code-img, .captcha-img, img[src*="captcha"], img[src*="code"]', {
    timeout: 10000,
  }).catch(() => null);

  // Tenta encontrar a imagem do captcha por diferentes seletores
  const captchaSelectors = [
    '.verify-code-area img',
    '.code-img',
    '.captcha-img',
    'img[src*="captcha"]',
    'img[src*="code"]',
    'img[src*="verify"]',
  ];

  let captchaElement: ElementHandle | null = null;

  for (const selector of captchaSelectors) {
    captchaElement = await page.$(selector);
    if (captchaElement) {
      console.log(`  ✅ Captcha encontrado com seletor: ${selector}`);
      break;
    }
  }

  // Se não achou por seletores conhecidos, tenta encontrar qualquer imagem no formulário de login
  if (!captchaElement) {
    console.log('  ⚠️  Seletor padrão não funcionou, buscando imagem no formulário...');
    const images = await page.$$('form img, .login-form img, .el-form img');
    if (images.length > 0) {
      // Pega a última imagem do formulário (geralmente é o captcha)
      captchaElement = images[images.length - 1];
      console.log('  ✅ Imagem do captcha encontrada no formulário');
    }
  }

  if (!captchaElement) {
    console.log('  ❌ Não consegui encontrar o captcha automaticamente.');
    return await askCaptchaTerminal();
  }

  // Garante que o diretório de output existe
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Tira screenshot do captcha
  const captchaPath = path.join(outputDir, 'captcha.png');
  await captchaElement.screenshot({ path: captchaPath });
  console.log(`  📸 Screenshot do captcha salvo em: ${captchaPath}`);

  // Tenta OCR com Tesseract.js
  try {
    const result = await Tesseract.recognize(captchaPath, 'eng', {
      logger: () => {}, // silencia logs do tesseract
    });

    // Extrai apenas dígitos do resultado
    const digits = result.data.text.replace(/[^0-9]/g, '');

    if (digits.length === 4) {
      console.log(`  🎯 Captcha reconhecido: ${digits}`);
      return digits;
    }

    console.log(`  ⚠️  OCR retornou "${result.data.text.trim()}" → dígitos extraídos: "${digits}" (esperava 4 dígitos)`);
  } catch (error) {
    console.log(`  ⚠️  Erro no OCR: ${error}`);
  }

  // Fallback 1: Telegram
  console.log('  🔄 Fallback Opcional: Tentando via Telegram...');
  const sent = await sendCaptchaToTelegram(captchaPath, '🔐 Novo captcha detectado! Por favor, responda a esta mensagem apenas com os 4 números da imagem:');
  
  if (sent) {
    const telegramCode = await waitForCaptchaFromTelegram(60000); // 60s timeout
    if (telegramCode) {
      return telegramCode;
    }
  }

  // Fallback 2: Terminal
  console.log('  🔄 Fallback 2: Pedindo captcha manualmente pelo terminal...');
  if (captchaPath) {
    console.log(`\n  📷 Veja a imagem do captcha em: ${captchaPath}`);
  }
  console.log('  ⌨️  O navegador está aberto — veja o captcha na tela.');
  
  const manualCode = await askCaptchaTerminal();
  console.log(`  ✅ Captcha inserido: ${manualCode}`);
  return manualCode;
}
