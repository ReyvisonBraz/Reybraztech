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

let pendingSearch: { query: string; chatId: number } | null = null;

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

async function runSearch(query: string, searchBy: string = 'account'): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const scraperDir = path.join(process.cwd(), 'scraper', 'src');
        
        console.log('🔍 Executando busca:', query, 'tipo:', searchBy);
        
        const args = ['--search=' + query];
        if (searchBy !== 'account') {
            const byArg = searchBy === 'nome' ? 'name' : searchBy;
            args.push('--by=' + byArg);
        }
        
        const child = spawn('npx', ['ts-node', 'index.ts', ...args], {
            cwd: scraperDir,
            env: { ...process.env },
            shell: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data: Buffer) => {
            const text = data.toString();
            stdout += text;
            console.log('[Search]', text);
        });

        child.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            stderr += text;
            console.error('[Search Error]', text);
        });

        child.on('close', async (code: number) => {
            console.log('🔍 Busca encerrou com código:', code);
            
            if (code !== 0) {
                await sendMessage(`🚨 <b>Erro na Busca!</b>\n\nCódigo: ${code}\n\n<pre>${stderr.slice(-500)}</pre>`);
                reject(new Error(`Search exited with code ${code}`));
                return;
            }

            try {
                const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'client_search.json');
                
                if (fs.existsSync(jsonPath)) {
                    const clientData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    
                    if (clientData && clientData.length > 0) {
                        const c = clientData[0];
                        await sendMessage(
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
                        await sendMessage(`❌ Cliente não encontrado: "${query}"\n\nTente buscar por outro termo ou use /sync para sincronizar todos os clientes.`);
                    }
                    resolve();
                } else {
                    await sendMessage(`❌ Cliente não encontrado: "${query}"\n\nTente buscar por outro termo ou use /sync para sincronizar todos os clientes.`);
                    resolve();
                }
            } catch (err: any) {
                await sendMessage(`❌ Cliente não encontrado: "${query}"\n\nTente buscar por outro termo ou use /sync para sincronizar todos os clientes.`);
                resolve();
            }
        });

        child.on('error', async (err: Error) => {
            await sendMessage(`🚨 <b>Erro ao iniciar busca:</b>\n\n${err.message}`);
            reject(err);
        });
    });
}

function detectSearchType(query: string): 'account' | 'buyer_name' | 'phone' {
    const cleaned = query.replace(/\s/g, '');
    if (/^\d{10,11}$/.test(cleaned)) {
        return 'phone';
    }
    if (query.includes(' ') || /^[A-Za-zÀ-ÿ\s]+$/.test(query)) {
        return 'buyer_name';
    }
    return 'account';
}

async function handleSearchMode(text: string, chatId: number): Promise<boolean> {
    if (!pendingSearch || pendingSearch.chatId !== chatId) {
        return false;
    }

    const choice = text.trim().toLowerCase();
    let searchBy: string = 'account';

    if (choice === '1') {
        searchBy = 'account';
    } else if (choice === '2') {
        searchBy = 'nome';
    } else if (choice === '3') {
        searchBy = 'telefone';
    } else {
        await sendMessage('❌ Opção inválida. Digite 1, 2 ou 3.');
        return true;
    }

    const query = pendingSearch.query;
    pendingSearch = null;

    await sendMessage(`🔍 <b>Buscando "${query}"</b> por ${searchBy}...\n\nAguarde, isso leva apenas alguns segundos...`);
    
    try {
        await runSearch(query, searchBy);
    } catch {}
    
    return true;
}

async function processCommand(text: string): Promise<boolean> {
    const cmd = text.trim().toLowerCase();
    const originalText = text.trim();
    
    if (cmd.startsWith('/buscar') || cmd.startsWith('/search') || cmd.startsWith('/busca')) {
        const queryMatch = originalText.match(/\/buscar\s+(.+)|\/search\s+(.+)|\/busca\s+(.+)/i);
        
        let query = '';
        let explicitType = '';
        
        if (queryMatch) {
            query = (queryMatch[1] || queryMatch[2] || queryMatch[3] || '').trim();
        }
        
        if (originalText.match(/--account|--conta/i)) {
            explicitType = 'account';
        } else if (originalText.match(/--nome|--name/i)) {
            explicitType = 'buyer_name';
        } else if (originalText.match(/--telefone|--phone/i)) {
            explicitType = 'phone';
        }
        
        if (!query) {
            await sendMessage(
                '🔍 <b>Como deseja buscar?</b>\n\n' +
                'Use: /buscar [conta]\n' +
                'Exemplos:\n' +
                '• /buscar conta123\n' +
                '• /buscar "João Silva"\n' +
                '• /buscar 11999999999\n\n' +
                'Também pode usar:\n' +
                '• /buscar conta123 --account\n' +
                '• /buscar "João Silva" --nome\n' +
                '• /buscar 11999999999 --telefone'
            );
            return true;
        }
        
        if (explicitType) {
            await sendMessage(`🔍 <b>Buscando "${query}"</b> por ${explicitType}...\n\nAguarde, isso leva apenas alguns segundos...`);
            try {
                await runSearch(query, explicitType);
            } catch {}
            return true;
        }
        
        const detectedType = detectSearchType(query);
        
        if (detectedType === 'phone') {
            await sendMessage(
                `🔍 <b>Buscando "${query}"</b>\n\n` +
                `Detectei que é um telefone. Confirmar?\n\n` +
                `1. 📱 Buscar por telefone\n` +
                `2. ❌ Cancelar`
            );
            pendingSearch = { query, chatId: parseInt(CHAT_ID) };
            return true;
        }
        
        if (detectedType === 'buyer_name') {
            await sendMessage(
                `🔍 <b>Buscando "${query}"</b>\n\n` +
                `Detectei que é um nome. Confirmar?\n\n` +
                `1. 👤 Buscar por nome\n` +
                `2. ❌ Cancelar`
            );
            pendingSearch = { query, chatId: parseInt(CHAT_ID) };
            return true;
        }
        
        await sendMessage(`🔍 <b>Buscando "${query}"</b> por account...\n\nAguarde, isso leva apenas alguns segundos...`);
        try {
            await runSearch(query, 'account');
        } catch {}
        return true;
    }
    
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
            '🔄 /sync — Sincronização completa\n' +
            '🔍 /buscar [conta] — Busca rápida\n' +
            '   Exemplos:\n' +
            '   • /buscar conta123\n' +
            '   • /buscar "João Silva"\n' +
            '   • /buscar 11999999999 --telefone\n' +
            '❓ /ajuda — Esta mensagem'
        );
        return true;
    }
    
    if (cmd === '1' || cmd === '2' || cmd === '3') {
        const chatId = parseInt(CHAT_ID);
        const handled = await handleSearchMode(text, chatId);
        if (handled) return true;
    }
    
    if (cmd === 'cancelar' || cmd === 'cancel' || cmd === 'não' || cmd === 'nao') {
        if (pendingSearch) {
            pendingSearch = null;
            await sendMessage('❌ Busca cancelada.');
            return true;
        }
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
