import { z } from 'zod';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../database.js';
import logger from '../utils/logger.js';

const router = Router();

// Schema de validação do login
const loginSchema = z.object({
    identifier: z.string().min(1, 'WhatsApp/E-mail é obrigatório'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema de validação usando Zod
const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    whatsapp: z.string().min(10, 'WhatsApp inválido'),
    device: z.string().min(1, 'Informe o dispositivo'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// ============================================================
// POST /api/auth/register — Cadastrar novo cliente
// ============================================================
router.post('/register', async (req: Request, res: Response) => {
    // Usar Zod para validar os dados do pacote enviado pelo front
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.issues[0].message });
        return;
    }

    const { name, whatsapp, device, email, password } = result.data;

    try {
        // Verificar se o WhatsApp já existe
        const [existingWhatsapp] = await sql`
          SELECT id FROM clients WHERE whatsapp = ${whatsapp}
        `;
        if (existingWhatsapp) {
            res.status(409).json({ error: 'Este WhatsApp já está cadastrado.' });
            return;
        }

        // Se forneceu email, verificar se já existe
        if (email && email.trim() !== '') {
            const [existingEmail] = await sql`
              SELECT id FROM clients WHERE email = ${email}
            `;
            if (existingEmail) {
                res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
                return;
            }
        }

        // Criptografar senha
        const JWT_SECRET = process.env.JWT_SECRET!;
        const passwordHash = await bcrypt.hash(password, 12);

        // Salvar no banco (email pode ser null)
        const [newClient] = await sql`
          INSERT INTO clients (name, whatsapp, device, email, password_hash, plan, status)
          VALUES (${name}, ${whatsapp}, ${device}, ${email || null}, ${passwordHash}, 'mensal', 'Ativo')
          RETURNING id, name, email, plan, status
        `;

        const logMsg = [
            `✅ <b>Novo cliente cadastrado!</b>`,
            `👤 <b>Nome:</b> ${name}`,
            `📱 <b>WhatsApp:</b> ${whatsapp}`,
            `🖥️ <b>Dispositivo:</b> ${device}`,
            `📧 <b>E-mail:</b> ${email || 'Não informado'}`,
            `🆔 <b>ID no Banco:</b> ${newClient.id}`
        ].join('\n');

        logger.info(logMsg);

        // Gerar JWT para auto-login após cadastro
        const token = jwt.sign(
            { id: newClient.id, email: email || whatsapp },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                name: newClient.name,
                plan: newClient.plan,
                status: newClient.status,
                whatsapp,
                email: email || null,
            },
        });
    } catch (error) {
        logger.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

// ============================================================
// POST /api/auth/login — Autenticar cliente e retornar JWT
// O frontend envia { identifier, password }
// identifier pode ser um WhatsApp (telefone) ou um e-mail
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.issues[0].message });
        return;
    }

    const { identifier, password } = result.data;

    try {
        const startTime = performance.now();

        // Verificar se parece email (contém @) ou telefone
        const isEmail = identifier.includes('@');

        let client: any;

        const dbStart = performance.now();
        if (isEmail) {
            [client] = await sql`
              SELECT * FROM clients WHERE email = ${identifier}
            `;
        } else {
            // Limpar o telefone (remover espaços, traços, parênteses)
            const cleanPhone = identifier.replace(/[\s\-\(\)]/g, '');
            [client] = await sql`
              SELECT * FROM clients WHERE whatsapp = ${cleanPhone}
            `;
        }
        const dbEnd = performance.now();

        if (!client) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }

        // Comparar senha
        const bcryptStart = performance.now();
        const passwordMatch = await bcrypt.compare(password, client.password_hash);
        const bcryptEnd = performance.now();

        if (!passwordMatch) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }

        const jwtStart = performance.now();
        const JWT_SECRET = process.env.JWT_SECRET!;
        const token = jwt.sign(
            { id: client.id, email: client.email || client.whatsapp },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        const jwtEnd = performance.now();

        const totalTime = performance.now() - startTime;

        logger.info(`⚡ [Performance] Login ${client.name}:
  - DB Lookup: ${(dbEnd - dbStart).toFixed(2)}ms
  - Bcrypt: ${(bcryptEnd - bcryptStart).toFixed(2)}ms
  - JWT: ${(jwtEnd - jwtStart).toFixed(2)}ms
  - Total: ${totalTime.toFixed(2)}ms`);

        res.json({
            success: true,
            token,
            user: {
                name: client.name,
                plan: client.plan,
                status: client.status,
                whatsapp: client.whatsapp,
            },
        });
    } catch (error) {
        logger.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

export default router;
