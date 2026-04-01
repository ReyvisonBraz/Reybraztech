import axios from 'axios';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
    console.error('❌ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definido no .env');
    process.exit(1);
}

const LAST_UPDATE_FILE = '.last_update_id';

function getLastUpdateId(): number {
    try {
        if (fs.existsSync(LAST_UPDATE_FILE)) {
            return parseInt(fs.readFileSync(LAST_UPDATE_FILE, 'utf-8'));
        }
    } catch {}
    return 0;
}

function saveLastUpdateId(id: number) {
    fs.writeFileSync(LAST_UPDATE_FILE, id.toString());
}

async function sendMessage(text: string) {
    try {
        await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        });
    } catch (err: any) {
        console.error('❌ Erro ao enviar mensagem:', err.message);
    }
}

async function sendMessageWithRetry(text: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            });
            return;
        } catch (err: any) {
            console.log(`⚠️ Retry ${i + 1}/${retries}:`, err.message);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function runScraper(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const scraperDir = path.join(process.cwd(), 'scraper', 'src');
        
        console.log('🔄 Executando scraper em:', scraperDir);
        
        const child = spawn('npx', ['ts-node', 'index.ts'], {
            cwd: scraperDir,
            env: { ...process.env },
            shell: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data: Buffer) => {
            const text = data.toString();
            stdout += text;
            console.log('[Scraper]', text);
        });

        child.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            stderr += text;
            console.error('[Scraper Error]', text);
        });

        child.on('close', async (code: number) => {
            console.log('🔄 Scraper encerrou com código:', code);
            
            if (code !== 0) {
                await sendMessage(`🚨 <b>Erro no Scraping!</b>\n\nCódigo: ${code}\n\n<pre>${stderr.slice(-500)}</pre>`);
                reject(new Error(`Scraper exited with code ${code}`));
                return;
            }

            try {
                const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'clients.json');
                
                if (fs.existsSync(jsonPath)) {
                    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    const clientsData = fileContent.clients || [];
                    
                    await sendMessage(`✅ <b>Scraping concluído!</b>\n\n📊 ${clientsData.length} clientes encontrados.\n\nAtualizando banco de dados...`);

                    resolve();
                } else {
                    await sendMessage('⚠️ Scraping concluído mas arquivo não encontrado.');
                    reject(new Error('Arquivo não encontrado'));
                }
            } catch (err: any) {
                await sendMessage(`🚨 <b>Erro ao processar dados:</b>\n\n${err.message}`);
                reject(err);
            }
        });

        child.on('error', async (err: Error) => {
            await sendMessage(`🚨 <b>Erro ao iniciar scraper:</b>\n\n${err.message}`);
            reject(err);
        });
    });
}

async function processCommand(text: string): Promise<boolean> {
    const cmd = text.trim().toLowerCase();
    
    if (cmd === '/sync' || cmd === '/sincronizar') {
        await sendMessage('🔄 <b>Sincronização Starhome iniciada!</b>\n\nPor favor aguarde, isso pode levar alguns minutos...');
        
        try {
            await runScraper();
        } catch {}
        return true;
    }
    
    if (cmd === '/ajuda' || cmd === '/help') {
        await sendMessage(
            '🤖 <b>Comandos do Bot</b>\n\n' +
            '🔄 /sync — Executar scraper Starhome\n' +
            '❓ /ajuda — Esta mensagem'
        );
        return true;
    }
    
    return false;
}

async function poll() {
    console.log('🤖 Bot Telegram iniciado...');
    console.log('📱 Envie /sync para executar o scraper');
    
    await sendMessage('🤖 <b>Bot de Sincronização Starhome ativo!</b>\n\nDigite /sync para iniciar a sincronização.');
    
    while (true) {
        try {
            const lastUpdateId = getLastUpdateId();
            
            const response = await axios.get(`https://api.telegram.org/bot${TOKEN}/getUpdates`, {
                params: {
                    offset: lastUpdateId + 1,
                    timeout: 30
                }
            });
            
            const updates = response.data.result;
            
            for (const update of updates) {
                const updateId = update.update_id;
                const message = update.message;
                
                if (message && message.text) {
                    const text = message.text;
                    const chatId = message.chat.id;
                    
                    console.log('📩 Mensagem recebida:', text, 'de', chatId);
                    
                    if (chatId.toString() === CHAT_ID) {
                        const processed = await processCommand(text);
                        
                        if (processed) {
                            saveLastUpdateId(updateId);
                        }
                    } else {
                        console.log('⚠️ Ignorando mensagem de chat não autorizado:', chatId);
                        saveLastUpdateId(updateId);
                    }
                } else {
                    saveLastUpdateId(updateId);
                }
            }
            
            if (updates.length > 0) {
                const lastId = updates[updates.length - 1].update_id;
                saveLastUpdateId(lastId);
            }
            
        } catch (err: any) {
            console.error('❌ Erro no poll:', err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

poll().catch(console.error);
