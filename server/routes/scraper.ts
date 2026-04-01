import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { verifyAdmin } from '../middleware/admin.js';
import logger, { sendTelegramNotification } from '../utils/logger.js';
import sql from '../database.js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

router.use(verifyToken);
router.use(verifyAdmin);

// ============================================================
// POST /api/admin/sync-starhome — Iniciar sincronização
// ============================================================
router.post('/sync-starhome', async (req: AuthRequest, res: Response) => {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write('message: 🔄 Iniciando sincronização com Starhome...\n\n');
        
        await sendTelegramNotification('🔄 *Sincronização Starhome iniciada!*');

        const scraperDir = path.join(process.cwd(), 'scraper', 'src');
        
        res.write('message: 📂 Diretório do scraper: ' + scraperDir + '\n\n');

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
            res.write(`message: ⚠️ ${text}\n\n`);
        });

        child.on('close', async (code: number) => {
            if (code !== 0) {
                res.write(`message: 🚨 Erro ao executar scraper (código ${code})\n\n`);
                res.write(`message: Detalhes: ${stderr.slice(-500)}\n\n`);
                await sendTelegramNotification(`🚨 *Erro na sincronização!*\n\nCódigo: ${code}`);
                res.end();
                return;
            }

            res.write('message: ✅ Scraping concluído! Verificando dados...\n\n');

            try {
                const jsonPath = path.join(process.cwd(), 'scraper', 'output', 'clients.json');
                
                if (fs.existsSync(jsonPath)) {
                    const fileContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    const clientsData = fileContent.clients || [];
                    res.write(`message: 📊 Encontrados ${clientsData.length} clientes no arquivo.\n\n`);

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

                    res.write(`message: ✅ Sincronização concluída! ${updated} atualizados, ${created} novos.\n\n`);
                    await sendTelegramNotification(`✅ *Sincronização concluída!*\n\n📊 ${updated} clientes atualizados\n🆔 ${created} novos`);
                } else {
                    res.write(`message: ⚠️ Arquivo não encontrado: ${jsonPath}\n\n`);
                }
            } catch (err: any) {
                res.write(`message: 🚨 Erro ao processar dados: ${err}\n\n`);
                await sendTelegramNotification(`🚨 *Erro ao processar dados!*\n\n${err}`);
            }

            res.end();
        });

        child.on('error', async (err: Error) => {
            res.write(`message: 🚨 Erro ao iniciar scraper: ${err.message}\n\n`);
            await sendTelegramNotification(`🚨 *Erro ao iniciar scraper!*\n\n${err.message}`);
            res.end();
        });

    } catch (error) {
        logger.error('Erro ao sincronizar Starhome:', error);
        res.write(`message: Erro interno: ${error}\n\n`);
        res.end();
    }
});

// ============================================================
// GET /api/admin/sync-status — Verificar status
// ============================================================
router.get('/sync-status', async (req: AuthRequest, res: Response) => {
    try {
        const [result] = await sql`
            SELECT MAX(created_at) as last_sync, COUNT(*) as total_clients
            FROM clients
        `;

        const clientsAtivos = await sql`
            SELECT COUNT(*) as count FROM clients WHERE status = 'Ativo'
        `;

        const clientsInativos = await sql`
            SELECT COUNT(*) as count FROM clients WHERE status = 'Inativo'
        `;

        res.json({
            last_sync: result.last_sync,
            total_clients: parseInt(result.total_clients || 0),
            clients_ativos: parseInt(clientsAtivos[0]?.count || 0),
            clients_inativos: parseInt(clientsInativos[0]?.count || 0),
        });
    } catch (error) {
        logger.error('Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro ao buscar status.' });
    }
});

export default router;
