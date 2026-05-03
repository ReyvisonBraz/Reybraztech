// ⚠️ NÃO usar dotenv aqui - usar variáveis do sistema (Render/Vercel)
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// FORÇAR valor correto - NUNCA usar o ID do bot
const FINAL_CHAT_ID = '7403274322';
console.log('[DEBUG] TELEGRAM_CHAT_ID do .env:', CHAT_ID);
console.log('[DEBUG] FINAL_CHAT_ID (forçado):', FINAL_CHAT_ID);
const API_KEY = process.env.SCRAPER_API_KEY || 'scraper_secret_key_aqui';
const SCRAPER_URL = process.env.SCRAPER_URL;
const SCRAPER_KEY = process.env.SCRAPER_API_KEY || 'scraper_secret_key_aqui';

// DEBUG: Log das variáveis
console.log('=== DEBUG START ===');
console.log('TELEGRAM_BOT_TOKEN:', TOKEN ? 'set' : 'MISSING');
console.log('TELEGRAM_CHAT_ID:', CHAT_ID ? 'set' : 'MISSING');
console.log('SCRAPER_API_KEY:', API_KEY ? 'set' : 'MISSING');
console.log('SCRAPER_URL:', SCRAPER_URL ? 'set' : 'MISSING');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING');
console.log('=== DEBUG END ===');

interface InlineButton {
  text: string;
  callback_data: string;
}

interface InlineKeyboard {
  inline_keyboard: InlineButton[][];
}

async function sendTelegram(text: string, replyMarkup?: InlineKeyboard): Promise<void> {
  if (!TOKEN || !FINAL_CHAT_ID) {
    console.error('❌ Telegram não configurado');
    return;
  }
  console.log('[TELEGRAM DEBUG] Enviando para chat_id:', FINAL_CHAT_ID, ' tipo:', typeof FINAL_CHAT_ID);
  try {
    const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: FINAL_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || undefined
    });
    console.log('[TELEGRAM] Mensagem enviada com sucesso');
  } catch (err: any) {
    console.error('❌ Erro ao enviar Telegram:', err.message);
    if (err.response?.data) {
      console.error('[TELEGRAM] Detalhes:', JSON.stringify(err.response.data));
    }
  }
}

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    console.error('[AUTH] SCRAPER_API_KEY não configurado');
    res.status(500).json({ error: 'Servidor mal configurado' });
    return;
  }
  const provided = req.headers['x-api-key'] as string;
  if (!provided || provided !== apiKey) {
    console.warn('[AUTH] Tentativa de acesso não autorizado');
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }
  next();
}

async function runScraper(): Promise<{ success: boolean; clients: number; error?: string }> {
  return new Promise((resolve) => {
    const projectRoot = process.cwd();
    const scraperDir = path.join(projectRoot, 'scraper');
    
    console.log('🔄 Executando scraper...');
    console.log('🔄 Scraper dir:', scraperDir);
    
    // Usar npx ts-node para garantir que funcione
    const child = spawn('npm install && npx ts-node src/index.ts --sync', {
      cwd: scraperDir,
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
        const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'clients.json');
        if (fs.existsSync(jsonPath)) {
          const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const clientsData = fileContent.clients || [];
          resolve({ success: true, clients: clientsData.length });
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
    const scraperDir = path.join(process.cwd(), 'scraper');
    console.log('🔍 Executando busca:', query, 'tipo:', searchBy);

    const args = ['--search=' + query];
    if (searchBy !== 'account') {
      args.push('--by=' + (searchBy === 'buyer_name' ? 'name' : searchBy));
    }

    // Usar npx ts-node para garantir funcionamento
    const child = spawn('npx ts-node src/index.ts ' + args.join(' '), {
      cwd: scraperDir,
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
        const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'client_search.json');
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

    if (result.success) {
      await sendTelegram(
        `✅ <b>Sincronização Concluída!</b>\n\n📊 ${result.clients} clientes encontrados.`
      );
    } else {
      const safeError = (result.error || 'Erro desconhecido').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      await sendTelegram(
        `🚨 <b>Erro na Sincronização!</b>\n\n<pre>${safeError}</pre>`
      );
    }

    return res.json({ success: result.success, clients: result.clients });
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

// ==========================================
// 🤖 TELEGRAM WEBHOOK (recebe comandos)
// ==========================================

async function runSearchInServer(query: string, searchBy: string): Promise<void> {
  const getDb = async () => (await import('./database.js')).default;
  const sql = await getDb();
  
  let results;
  
  if (searchBy === 'buyer_name') {
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE buyer_name ILIKE ${'%' + query + '%'}
      ORDER BY days_remaining DESC
      LIMIT 5
    `;
  } else if (searchBy === 'phone') {
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE buyer_name LIKE ${'%' + query + '%'}
      ORDER BY days_remaining DESC
      LIMIT 5
    `;
  } else {
    results = await sql`
      SELECT account, buyer_name, password, package_name, days_remaining, in_use, expiration_date
      FROM starhome_clients
      WHERE account = ${query}
      LIMIT 1
    `;
  }
  
  if (results.length === 0) {
    await sendTelegram(`❌ Cliente não encontrado: "${query}"\n\nTente buscar por outro termo ou use /sync para sincronizar.`);
    return;
  }
  
  for (const c of results) {
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
  }
}

const handleTelegramWebhook = async (req: express.Request, res: express.Response) => {
  res.status(200).json({ ok: true });
  
  const token = process.env.TELEGRAM_BOT_TOKEN;

  // FORÇAR Chat ID correto
  const adminChatId = FINAL_CHAT_ID;

  if (!adminChatId || !token) {
    console.error('[Telegram] Missing env vars!');
    return;
  }

  try {
    const update = req.body;
    console.log('[Telegram] Update received:', JSON.stringify(update).substring(0, 200));
    
    const callbackQuery = update?.callback_query;
    if (callbackQuery) {
      const callbackData = callbackQuery.data;
      const callbackChatId = callbackQuery.message?.chat.id;
      
      if (callbackChatId?.toString() !== adminChatId) return;
      
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id
      });
      
      if (callbackData.startsWith('cmd|')) {
        const cmd = callbackData.replace('cmd|', '');
        
        if (cmd === 'sync' && SCRAPER_URL && SCRAPER_KEY) {
          await sendTelegram(`⏳ Sincronização iniciada!\nO scraper está sendo executado...\n\nVocê receberá uma notificação quando concluir.`);
          
          try {
            await axios.post(
              `${SCRAPER_URL}/run`,
              { action: 'sync' },
              { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 300000 }
            );
          } catch (err: any) {
            await sendTelegram(`🚨 <b>Erro ao executar scraper:</b>\n\n${err.message}`);
          }
        } else if (cmd === 'status') {
          const getDb = async () => (await import('./database.js')).default;
          const sql = await getDb();
          
          let dbStatus = '❌ Offline';
          let dbTime = '';
          try {
            const [row] = await sql`SELECT NOW() as t`;
            dbStatus = '✅ Online';
            dbTime = new Date(row.t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          } catch {}
          
          let totalClientes = 0;
          let ativos = 0;
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients`;
            totalClientes = row.total;
          } catch {}
          try {
            const [row] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Used'`;
            ativos = row.total;
          } catch {}
          
          await sendTelegram(
            `📊 <b>Status Reybraztech</b>\n\n` +
            `🗄️ <b>Banco:</b> ${dbStatus}\n` +
            `🕐 <b>Hora:</b> ${dbTime || 'N/A'}\n` +
            `📦 <b>Total Clientes:</b> ${totalClientes}\n` +
            `✅ <b>Ativos:</b> ${ativos}\n` +
            `❌ <b>Inativos:</b> ${totalClientes - ativos}\n\n` +
            `🤖 <b>Bot:</b> Respondendo normalmente`
          );
        }
      }
      return;
    }

    const message = update?.message;
    if (!message?.text) return;

    if (message.chat.id.toString() !== adminChatId) return;

    const text = message.text.trim();
    const textLower = text.toLowerCase();

    console.log('[Telegram] Processing command:', text);

    // /ajuda
    if (textLower === '/ajuda' || textLower === '/help' || textLower === '/start') {
      await sendTelegram(
        `🤖 <b>Comandos Reybraztech</b>\n\n` +
        `📊 <b>Monitoramento:</b>\n` +
        `• /status — Saúde geral\n` +
        `• /inativos — Clientes inativos\n\n` +
        `🔄 <b>Scraper:</b>\n` +
        `• /sync — Sincronizar clientes\n` +
        `• /buscar [conta] — Buscar cliente\n\n` +
        `🔧 <b>Outros:</b>\n` +
        `• /menu — Menu interativo\n` +
        `• /ajuda — Esta mensagem`
      );
      return;
    }

    // /status
    if (textLower === '/status') {
      console.log('[STATUS] Tentando conectar ao banco...');
      let dbStatus = '❌ Offline';
      let dbTime = '';
      let totalClientes = 0;
      let ativos = 0;
      
      try {
        console.log('[STATUS] Importando database.js...');
        const getDb = async () => (await import('./database.js')).default;
        const sql = await getDb();
        console.log('[STATUS] Executando query...');
        
        const [row] = await sql`SELECT NOW() as t`;
        dbStatus = '✅ Online';
        dbTime = new Date(row.t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        
        const [row2] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients`;
        totalClientes = row2.total;
        
        const [row3] = await sql`SELECT COUNT(*)::int as total FROM starhome_clients WHERE in_use = 'Used'`;
        ativos = row3.total;
        
        console.log('[STATUS] Banco online, clientes:', totalClientes);
      } catch (err: any) {
        console.error('[STATUS] Erro ao conectar banco:', err.message);
      }
      
      await sendTelegram(
        `📊 <b>Status Reybraztech</b>\n\n` +
        `🗄️ <b>Banco:</b> ${dbStatus}\n` +
        `🕐 <b>Hora:</b> ${dbTime || 'N/A'}\n` +
        `📦 <b>Total Clientes:</b> ${totalClientes}\n` +
        `✅ <b>Ativos:</b> ${ativos}\n` +
        `❌ <b>Inativos:</b> ${totalClientes - ativos}\n\n` +
        `🤖 <b>Bot:</b> Respondendo normalmente`
      );
      return;
    }

    // /sync
    if (textLower === '/sync' || textLower === '/sincronizar') {
      if (!SCRAPER_URL || !SCRAPER_KEY) {
        await sendTelegram(`⚠️ <b>Scraper não configurado!</b>\n\nVariáveis SCRAPER_URL e SCRAPER_API_KEY não estão definidas.`);
      } else {
        await sendTelegram(`⏳ Sincronização iniciada!\nO scraper está sendo executado...\n\nVocê receberá uma notificação quando concluir.`);
        
        try {
          await axios.post(
            `${SCRAPER_URL}/run`,
            { action: 'sync' },
            { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 300000 }
          );
        } catch (err: any) {
          await sendTelegram(`🚨 <b>Erro ao executar scraper:</b>\n\n${err.message}`);
        }
      }
      return;
    }

    // /buscar
    if (textLower.startsWith('/buscar') || textLower.startsWith('/search') || textLower.startsWith('/busca')) {
      const queryMatch = text.match(/\/buscar\s+(.+)|\/search\s+(.+)|\/busca\s+(.+)/i);
      let query = queryMatch ? (queryMatch[1] || queryMatch[2] || queryMatch[3] || '').trim() : '';
      
      let explicitType = '';
      if (text.match(/--account|--conta/i)) explicitType = 'account';
      else if (text.match(/--nome|--name/i)) explicitType = 'buyer_name';
      else if (text.match(/--telefone|--phone/i)) explicitType = 'phone';
      
      if (!query) {
        await sendTelegram(
          `🔍 <b>Como deseja buscar?</b>\n\n` +
          `Use: /buscar [conta]\n` +
          `Exemplos:\n` +
          `• /buscar conta123\n` +
          `• /buscar "João Silva"\n` +
          `• /buscar 11999999999`
        );
        return;
      }
      
      if (explicitType && SCRAPER_URL && SCRAPER_KEY) {
        await sendTelegram(`🔍 <b>Buscando "${query}"</b> por ${explicitType}...`);
        
        try {
          await axios.post(
            `${SCRAPER_URL}/run`,
            { action: 'search', query, searchBy: explicitType },
            { headers: { 'x-api-key': SCRAPER_KEY }, timeout: 60000 }
          );
        } catch (err: any) {
          await sendTelegram(`❌ Erro na busca: ${err.message}`);
        }
      } else {
        const detectedType = /^\d{10,11}$/.test(query.replace(/\s/g, '')) ? 'phone' : 
                            /[A-Za-zÀ-ÿ]/.test(query) ? 'buyer_name' : 'account';
        
        await sendTelegram(`🔍 <b>Buscando "${query}"</b> no banco local...`);
        
        try {
          await runSearchInServer(query, detectedType);
        } catch (err: any) {
          await sendTelegram(`❌ Erro: ${err.message}`);
        }
      }
      return;
    }

    // /menu
    if (textLower === '/menu') {
      await sendTelegram(
        `📋 <b>Menu Reybraztech</b>\n\nEscolha uma opção:`,
        {
          inline_keyboard: [
            [{ text: '🔄 Sincronizar', callback_data: 'cmd|sync' }],
            [{ text: '📊 Status', callback_data: 'cmd|status' }],
            [{ text: '❌ Inativos', callback_data: 'cmd|inativos' }]
          ]
        }
      );
      return;
    }

    // /inativos
    if (textLower === '/inativos') {
      const getDb = async () => (await import('./database.js')).default;
      const sql = await getDb();
      
      const clients = await sql`
        SELECT account, buyer_name, package_name, days_remaining
        FROM starhome_clients
        WHERE in_use = 'Unused'
        ORDER BY days_remaining ASC
        LIMIT 10
      `;
      
      if (clients.length === 0) {
        await sendTelegram(`✅ <b>Nenhum cliente inativo!</b>`);
        return;
      }
      
      let list = '';
      for (const c of clients) {
        list += `\n• <b>${c.account}</b> - ${c.buyer_name} (${c.days_remaining} dias)`;
      }
      
      await sendTelegram(`❌ <b>Clientes Inativos (${clients.length})</b>${list}`);
      return;
    }

  } catch (err: any) {
    console.error('[Telegram] Error:', err.message);
  }
};

app.post('/api/telegram-webhook', handleTelegramWebhook);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
  console.log(`📱 Webhook: POST /api/telegram-webhook`);
});