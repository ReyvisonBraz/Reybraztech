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

  // Tenta extrair a imagem em alta definição diretamente do DOM (útil para background/headless)
  const captchaPath = path.join(outputDir, 'captcha.png');
  try {
    const base64Data = await page.evaluate((el: any) => {
      // Se for tag IMG
      if (el.tagName && el.tagName.toLowerCase() === 'img') {
        if (el.src && el.src.startsWith('data:image')) {
          return el.src; // Pega direto do src se já for base64 inline
        }
        // Se a imagem não for inline, converte injetando ela num canvas temporário
        const canvas = document.createElement('canvas');
        canvas.width = el.width || el.naturalWidth || 100;
        canvas.height = el.height || el.naturalHeight || 40;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(el, 0, 0);
            return canvas.toDataURL('image/png');
        }
      }
      // Se for tag CANVAS nativa do painel
      else if (el.tagName && el.tagName.toLowerCase() === 'canvas') {
        return el.toDataURL('image/png');
      }
      return null;
    }, captchaElement);

    if (base64Data) {
      // Limpa os cabeçalhos de tipo MIME do base64
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(captchaPath, base64Image, 'base64');
      console.log(`  📥 Imagem do captcha extraída perfeitamente da memória do DOM.`);
    } else {
      // Fallback: Tira screenshot visual das coordenadas do elemento html
      await captchaElement.screenshot({ path: captchaPath });
      console.log(`  📸 Captura visual das coordenadas do captcha (Fallback) salva.`);
    }
  } catch (err) {
    // Fallback de segurança se der timeout no evaluate
    await captchaElement.screenshot({ path: captchaPath });
    console.log(`  📸 Captura visual do captcha salva em: ${captchaPath}`);
  }

  // Tenta OCR com Tesseract.js (Até 3 tentativas com refresh)
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`  🕒 Tentativa ${attempts}/${maxAttempts} de OCR...`);

    // Tira screenshot/captura do elemento atual e aplica filtro de contraste/P&B + Resizing 2x
    let base64Data: string | null = null;
    try {
      base64Data = await page.evaluate((el: any) => {
        if (el.tagName && (el.tagName.toLowerCase() === 'img' || el.tagName.toLowerCase() === 'canvas')) {
          const originalWidth = el.width || el.naturalWidth || 100;
          const originalHeight = el.height || el.naturalHeight || 40;
          
          const canvas = document.createElement('canvas');
          // ESCALA 2X para ajudar o OCR a ver letras pequenas
          canvas.width = originalWidth * 2;
          canvas.height = originalHeight * 2;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Desativa suavização para manter bordas nítidas
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
            
            // FILTRO DE CONTRASTE (P&B)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              // Limiar dinâmico: se for escuro (letra), vira PRETO (0). Se for claro (fundo), vira BRANCO (255).
              const val = avg < 128 ? 0 : 255;
              data[i] = data[i+1] = data[i+2] = val;
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas.toDataURL('image/png');
          }
        }
        return null;
      }, captchaElement);
    } catch (e) {
      // Fallback normal
    }

    if (base64Data) {
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(captchaPath, base64Image, 'base64');
    } else {
      await captchaElement.screenshot({ path: captchaPath });
    }

    try {
      const result = await Tesseract.recognize(captchaPath, 'eng');
      const digits = result.data.text.replace(/[^0-9]/g, '');

      if (digits.length === 4) {
        console.log(`    🎯 OCR capturou com sucesso: ${digits}`);
        return digits;
      }
      if (digits.length > 0) {
        console.log(`    ⚠️  OCR capturou fragmentos: "${digits}"`);
      }
    } catch (error) {
      console.log(`    ⚠️  Erro no OCR: ${error}`);
    }

    // Se falhou e ainda tem tentativas, atualiza e tenta de novo
    if (attempts < maxAttempts) {
      console.log(`  🔄 [${attempts}/${maxAttempts}] Novo captcha (Scaling 2x ativado)...`);
      await captchaElement.click();
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Falhou OCR, vamos para os fallbacks
  console.log('  ❌ OCR automático falhou após 3 captchas processados com Scaling 2x.');

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
