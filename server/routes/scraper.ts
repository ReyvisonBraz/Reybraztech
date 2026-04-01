import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger, { sendTelegramNotification } from '../utils/logger.js';
import sql from '../database.js';

const router = Router();

router.use(verifyToken);
router.use(verifyAdmin);

interface StarhomeClient {
    account: string;
    password: string;
    days_remaining: number;
    package_name: string;
    buyer_name: string;
    in_use: string;
    expired: string;
    expiration_date: string | null;
}

async function runScraper(): Promise<StarhomeClient[]> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
        const results: StarhomeClient[] = [];
        let stdout = '';
        let stderr = '';

        const scraperPath = process.cwd() + '/scraper/src/index.ts';
        
        const child = spawn('npx', ['ts-node', scraperPath], {
            cwd: process.cwd(),
            env: { ...process.env },
            shell: true
        });

        child.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(data.toString());
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(data.toString());
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(results);
            } else {
                reject(new Error(`Scraper exited with code ${code}: ${stderr}`));
            }
        });

        setTimeout(() => {
            child.kill();
            reject(new Error('Scraper timeout after 5 minutes'));
        }, 300000);
    });
}

router.post('/sync-starhome', async (req: AuthRequest, res: Response) => {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write('message: Iniciando sincronização com Starhome...\n\n');
        
        await sendTelegramNotification('🔄 *Sincronização Starhome iniciada!* \n\nAguardando execução do scraper...', 'info');

        const panelUrl = process.env.PANEL_URL || 'https://panel.web.starhome.vip';
        const panelAccount = process.env.PANEL_ACCOUNT || '';
        const panelPassword = process.env.PANEL_PASSWORD || '';

        if (!panelAccount || !panelPassword) {
            res.write('message: Erro: Credenciais do Starhome não configuradas no servidor.\n\n');
            res.end();
            return;
        }

        res.write('message: Fazendo login no painel Starhome...\n\n');
        await sendTelegramNotification('🔐 *Fazendo login no painel Starhome...*', 'info');

        const { spawn } = require('child_process');
        const path = require('path');

        const scraperDir = path.join(process.cwd(), 'scraper', 'src');

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
            res.write(`message: ${text}\n\n`);
        });

        child.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            stderr += text;
            res.write(`message: ${text}\n\n`);
        });

        child.on('close', async (code: number) => {
            if (code !== 0) {
                res.write(`message: Erro ao executar scraper (código ${code})\n\n`);
                await sendTelegramNotification(`🚨 *Erro na sincronização!*\n\nCódigo do erro: ${code}`, 'error');
                res.end();
                return;
            }

            res.write('message: Verificando dados extraídos...\n\n');

            try {
                const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'clients.json');
                const fs = require('fs');
                
                if (fs.existsSync(jsonPath)) {
                    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    const clientsData = fileContent.clients || [];
                    res.write(`message: Encontrados ${clientsData.length} clientes no arquivo.\n\n`);

                    let updated = 0;
                    let created = 0;

                    for (const client of clientsData) {
                        const [existing] = await sql`
                            SELECT id FROM clients WHERE whatsapp = ${client.account}
                        `;

                        if (existing) {
                            await sql`
                                UPDATE clients 
                                SET days_remaining = ${client.days_remaining},
                                    status = ${client.in_use === 'Used' && client.expired !== 'Expired' ? 'Ativo' : 'Inativo'}
                                WHERE whatsapp = ${client.account}
                            `;
                            updated++;
                        } else {
                            created++;
                        }
                    }

                    res.write(`message: Sincronização concluída! ${updated} atualizados, ${created} novos.\n\n`);
                    await sendTelegramNotification(`✅ *Sincronização concluída!* \n\n📊 ${updated} clientes atualizados\n🆔 ${created} novos clientes`, 'info');
                } else {
                    res.write(`message: Arquivo não encontrado em: ${jsonPath}\n\n`);
                }
            } catch (err: any) {
                const errorMsg = `Erro ao processar dados: ${err}`;
                res.write(`message: ${errorMsg}\n\n`);
                await sendTelegramNotification(`🚨 *Erro ao processar dados!*\n\n${err}`, 'error');
            }

            res.end();
        });

        child.on('error', async (err: Error) => {
            const errorMsg = `Erro ao iniciar scraper: ${err.message}`;
            res.write(`message: ${errorMsg}\n\n`);
            await sendTelegramNotification(`🚨 *Erro ao iniciar scraper!*\n\n${err.message}`, 'error');
            res.end();
        });

    } catch (error) {
        logger.error('Erro ao sincronizar Starhome:', error);
        const errorMsg = `Erro interno: ${error}`;
        res.write(`message: ${errorMsg}\n\n`);
        await sendTelegramNotification(`🚨 *Erro interno na sincronização!*\n\n${error}`, 'error');
        res.end();
    }
});

export default router;
