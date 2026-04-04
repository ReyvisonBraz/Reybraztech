import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const app = express();
app.use(express.json());

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_KEY = process.env.API_KEY;

interface InlineButton {
  text: string;
  callback_data: string;
}

interface InlineKeyboard {
  inline_keyboard: InlineButton[][];
}

async function sendTelegram(text: string, replyMarkup?: InlineKeyboard): Promise<void> {
  if (!TOKEN || !CHAT_ID) {
    console.error('❌ Telegram não configurado');
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || undefined
    });
  } catch (err: any) {
    console.error('❌ Erro ao enviar Telegram:', err.message);
  }
}

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const providedKey = req.headers['x-api-key'] as string;
  if (!providedKey || providedKey !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

async function runScraper(): Promise<{ success: boolean; clients: number; stats?: any; error?: string }> {
  return new Promise((resolve) => {
    const scraperDir = path.join(__dirname, 'src');
    console.log('🔄 Executando scraper em:', scraperDir);

    const child = spawn('npx', ['ts-node', 'src/index.ts', '--sync'], {
      cwd: __dirname,
      env: { ...process.env },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write('[Scraper] ' + text);
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write('[Scraper Error] ' + text);
    });

    child.on('close', async (code: number) => {
      console.log('🔄 Scraper encerrou com código:', code);

      if (code !== 0) {
        resolve({ success: false, clients: 0, error: stderr.slice(-500) });
        return;
      }

      try {
        const jsonPath = path.join(__dirname, 'output', 'clients.json');
        if (fs.existsSync(jsonPath)) {
          const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const clientsData = fileContent.clients || [];
          
          const active = clientsData.filter((c: any) => c.in_use === 'Used').length;
          const inactive = clientsData.filter((c: any) => c.in_use === 'Unused').length;
          const expiring = clientsData.filter((c: any) => c.days_remaining <= 7 && c.days_remaining > 0).length;
          const expired = clientsData.filter((c: any) => c.days_remaining <= 0 || c.expired === 'Expired').length;

          resolve({ 
            success: true, 
            clients: clientsData.length,
            stats: { active, inactive, expiring, expired }
          });
        } else {
          resolve({ success: true, clients: 0 });
        }
      } catch (err: any) {
        resolve({ success: false, clients: 0, error: err.message });
      }
    });

    child.on('error', async (err: Error) => {
      console.error('❌ Erro ao iniciar scraper:', err.message);
      resolve({ success: false, clients: 0, error: err.message });
    });
  });
}

async function runSearch(query: string, searchBy: string): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const scraperDir = path.join(__dirname, 'src');
    console.log('🔍 Executando busca:', query, 'tipo:', searchBy);

    const args = ['--search=' + query];
    if (searchBy !== 'account') {
      args.push('--by=' + (searchBy === 'buyer_name' ? 'name' : searchBy));
    }

    const child = spawn('npx', ['ts-node', 'src/index.ts', ...args], {
      cwd: __dirname,
      env: { ...process.env },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
      process.stdout.write('[Search] ' + data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      process.stderr.write('[Search Error] ' + data.toString());
    });

    child.on('close', (code: number) => {
      if (code !== 0) {
        resolve({ success: false, error: stderr.slice(-500) });
        return;
      }

      try {
        const jsonPath = path.join(__dirname, 'output', 'client_search.json');
        if (fs.existsSync(jsonPath)) {
          const clientData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          if (clientData && clientData.length > 0) {
            resolve({ success: true, data: clientData });
          } else {
            resolve({ success: false, error: 'Cliente não encontrado' });
          }
        } else {
          resolve({ success: false, error: 'Arquivo não encontrado' });
        }
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });

    child.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
  });
}

app.post('/run', authenticate, async (req, res) => {
  const { action, query, searchBy } = req.body;

  console.log(`📩 Requisição recebida: action=${action}, query=${query}, searchBy=${searchBy}`);

  if (action === 'sync') {
    await sendTelegram('🔄 <b>Scraper iniciado!</b>\n\nExecutando sincronização completa...');

    const result = await runScraper();

    if (result.success && result.stats) {
      await sendTelegram(
        `✅ <b>Sincronização Concluída!</b>\n\n` +
        `📊 Total: ${result.clients} clientes\n` +
        `✅ Ativos: ${result.stats.active}\n` +
        `❌ Inativos: ${result.stats.inactive}\n` +
        `⚠️ Expirando em 7 dias: ${result.stats.expiring}\n` +
        `🔴 Expirados: ${result.stats.expired}`
      );
    } else {
      await sendTelegram(
        `🚨 <b>Erro na Sincronização!</b>\n\n<pre>${result.error || 'Erro desconhecido'}</pre>`
      );
    }

    return res.json(result);
  }

  if (action === 'search') {
    const by = searchBy || 'account';
    await sendTelegram(`🔍 <b>Buscando "${query}"</b> por ${by}...`);

    const result = await runSearch(query, by);

    if (result.success && result.data) {
      const c = result.data[0];
      await sendTelegram(
        `✅ <b>Cliente Encontrado!</b>\n\n` +
        `📋 <b>Account:</b> ${c.account}\n` +
        `👤 <b>Nome:</b> ${c.buyer_name}\n` +
        `🔑 <b>Senha:</b> ${c.password}\n` +
        `📦 <b>Pacote:</b> ${c.package_name}\n` +
        `⏰ <b>Dias restantes:</b> ${c.days_remaining}\n` +
        `📊 <b>Status:</b> ${c.in_use}\n` +
        `📅 <b>Expira:</b> ${c.expiration_date || 'N/A'}`
      );
    } else {
      await sendTelegram(`❌ Cliente não encontrado: "${query}"`);
    }

    return res.json(result);
  }

  res.status(400).json({ error: 'Ação inválida' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Scraper Server rodando na porta ${PORT}`);
});

export default app;