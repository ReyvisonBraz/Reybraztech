import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'reybraztech_secret_key_change_in_production';

// ============================================================
// POST /api/auth/register — Cadastrar novo cliente
// ============================================================
router.post('/register', async (req: Request, res: Response) => {
    const { name, whatsapp, device, email, password } = req.body;

    // Validação básica — email é OPCIONAL
    if (!name || !whatsapp || !device || !password) {
        res.status(400).json({ error: 'Nome, WhatsApp, dispositivo e senha são obrigatórios.' });
        return;
    }

    if (password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
    }

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
        const passwordHash = await bcrypt.hash(password, 12);

        // Salvar no banco (email pode ser null)
        const [newClient] = await sql`
          INSERT INTO clients (name, whatsapp, device, email, password_hash, plan, status)
          VALUES (${name}, ${whatsapp}, ${device}, ${email || null}, ${passwordHash}, 'mensal', 'Ativo')
          RETURNING id, name, email, plan, status
        `;

        console.log(`✅ Novo cliente cadastrado: ${name} (ID: ${newClient.id})`);

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
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

// ============================================================
// POST /api/auth/login — Autenticar cliente e retornar JWT
// O frontend envia { identifier, password }
// identifier pode ser um WhatsApp (telefone) ou um e-mail
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        res.status(400).json({ error: 'WhatsApp/E-mail e senha são obrigatórios.' });
        return;
    }

    try {
        // Verificar se parece email (contém @) ou telefone
        const isEmail = identifier.includes('@');

        let client: any;

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

        if (!client) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }

        // Comparar senha
        const passwordMatch = await bcrypt.compare(password, client.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }

        // Gerar token JWT (expira em 2 horas por segurança)
        const token = jwt.sign(
            { id: client.id, email: client.email || client.whatsapp },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        console.log(`✅ Login realizado: ${client.name} (${client.email || client.whatsapp})`);

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
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

export default router;
