import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import * as readline from 'readline';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Envia uma foto para o chat do Telegram configurado.
 */
export async function sendCaptchaToTelegram(imagePath: string, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('  ⚠️  TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados no .env para envio do Captcha.');
    return false;
  }

  try {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('caption', message);
    form.append('photo', fs.createReadStream(imagePath));

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, form, {
      headers: form.getHeaders(),
    });
    
    console.log(`  📱 Captcha enviado para o Telegram (Chat ID: ${TELEGRAM_CHAT_ID})!`);
    return true;
  } catch (error: any) {
    console.log(`  ❌ Erro ao enviar para o Telegram: ${error.message}`);
    return false;
  }
}

/**
 * Puxa as mensagens recentes do bot e retorna o texto da última mensagem do usuário (com 4 dígitos).
 */
export async function waitForCaptchaFromTelegram(timeoutMs: number = 60000): Promise<string | null> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;

  console.log(`  ⏳ Aguardando os 4 dígitos pelo Telegram (timeout: ${timeoutMs / 1000}s)...`);
  
  const startTime = Date.now();
  let lastUpdateId = 0;

  // Tenta limpar updates antigos
  try {
    const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`);
    if (res.data && res.data.ok && res.data.result.length > 0) {
      lastUpdateId = res.data.result[0].update_id;
    }
  } catch (e: any) {
    if (e.response && e.response.status === 409) {
       console.log('  ⚠️  O bot do Telegram está em conflito (possivelmente ligado a um Webhook no SendPulse).');
       console.log('      Para receber mensagens, crie um Bot específico via BotFather sem Webhook.');
       return null;
    }
  }

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
      
      if (res.data.ok && res.data.result.length > 0) {
        for (const update of res.data.result) {
          lastUpdateId = update.update_id;
          
          if (update.message && String(update.message.chat.id) === String(TELEGRAM_CHAT_ID)) {
            const text = (update.message.text || '').trim();
            // Verifica se é um número de 4 dígitos (captcha)
            if (/^\d{4}$/.test(text)) {
              console.log(`  ✅ Captcha [${text}] recebido do Telegram!`);
              // Confirma o recebimento
              await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: `✅ Entendido: ${text}. Retomando login...`
              }).catch(() => {});

              return text;
            } else if (text) {
              await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: '⚠️ Por favor, envie apenas os 4 dígitos numéricos do captcha.'
              }).catch(() => {});
            }
          }
        }
      }
    } catch (error: any) {
      // Ignora erro de timeout ou rede e continua tentando
    }
    
    // Espera 2s antes de tentar de novo
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('  ⏰ Tempo esgotado aguardando o Telegram.');
  return null;
}

/**
 * Pede o captcha pelo terminal como Fallback.
 */
export async function askCaptchaTerminal(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n  ➡️  Digite os 4 dígitos do captcha: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
