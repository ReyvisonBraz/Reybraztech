import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'reybraztech_secret_key_change_in_production';

// ============================================================
// POST /api/auth/register — Cadastrar novo cliente
// ============================================================
router.post('/register', async (req: Request, res: Response) => {
    const { name, whatsapp, device, email, password } = req.body;

    // Validação básica
    if (!name || !whatsapp || !device || !email || !password) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        return;
    }

    if (password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
    }

    try {
        // Verificar se e-mail já existe
        const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
        if (existing) {
            res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
            return;
        }

        // Criptografar senha
        const passwordHash = await bcrypt.hash(password, 12);

        // Salvar no banco
        const stmt = db.prepare(`
      INSERT INTO clients (name, whatsapp, device, email, password_hash, plan, status)
      VALUES (?, ?, ?, ?, ?, 'mensal', 'Ativo')
    `);

        const result = stmt.run(name, whatsapp, device, email, passwordHash);

        console.log(`✅ Novo cliente cadastrado: ${name} (ID: ${result.lastInsertRowid})`);

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso! Faça login para continuar.',
        });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

// ============================================================
// POST /api/auth/login — Autenticar cliente e retornar JWT
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }

    try {
        // Buscar cliente pelo e-mail
        const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email) as any;

        if (!client) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }

        // Comparar senha
        const passwordMatch = await bcrypt.compare(password, client.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }

        // Gerar token JWT (expira em 2 horas por segurança)
        const token = jwt.sign(
            { id: client.id, email: client.email },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log(`✅ Login realizado: ${client.name} (${client.email})`);

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
