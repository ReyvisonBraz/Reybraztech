import { z } from 'zod';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../database.js';
import logger from '../utils/logger.js';
import { sendTrialActivation, sendRegistrationComplete } from '../services/whatsapp.js';

const router = Router();

const PLAN_DAYS: Record<string, number> = {
    mensal: 31,
    trimestral: 93,
    semestral: 186,
    anual: 365,
    trial: 3,
};

async function logLoginEvent(action: string, whatsapp?: string, email?: string, details?: string, success: boolean = true, ip?: string, userAgent?: string) {
  try {
    await sql`
      INSERT INTO login_logs (action, whatsapp, email, details, success, ip_address, user_agent)
      VALUES (${action}, ${whatsapp || null}, ${email || null}, ${details || null}, ${success}, ${ip || null}, ${userAgent || null})
    `;
  } catch (err: any) {
    // Silencioso - não queremos que o logging atrapalhe a operação principal
    console.error('Erro ao salvar log:', err.message);
  }
}

// Schema de validação do login
const loginSchema = z.object({
    identifier: z.string().min(1, 'WhatsApp/E-mail é obrigatório').max(255),
    password: z.string().min(1, 'Senha é obrigatória').max(128),
});

// Schema de validação usando Zod
const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    whatsapp: z.string().min(10, 'WhatsApp inválido').max(20),
    device: z.string().min(1, 'Informe o dispositivo').max(50),
    email: z.string().email('E-mail inválido').max(255).optional().or(z.literal('')),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
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

    // Validar phone format (após extrair whatsapp e antes de consultar DB)
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        res.status(400).json({ error: 'WhatsApp inválido. Forneça um número com DDD.' });
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
        const JWT_SECRET = process.env.JWT_SECRET!;
        const passwordHash = await bcrypt.hash(password, 12);

        // Salvar no banco (email pode ser null)
        const [newClient] = await sql`
          INSERT INTO clients (name, whatsapp, device, email, password_hash, plan, status, days_remaining)
          VALUES (${name}, ${whatsapp}, ${device}, ${email || null}, ${passwordHash}, 'mensal', 'Inativo', 0)
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

        // Log do cadastro
        const userAgent = req.headers['user-agent'] || undefined;
        await logLoginEvent('register', whatsapp, email || undefined, `Novo cliente: ${name}`, true, req.ip || undefined, userAgent);

        // Gerar JWT para auto-login após cadastro
        const token = jwt.sign(
            { id: newClient.id, email: email || whatsapp },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '8h' }
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
        let cleanPhone = '';

        // Validar phone format (após extrair identifier e antes de consultar DB)
        if (!isEmail) {
            cleanPhone = identifier.replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 13) {
                res.status(400).json({ error: 'WhatsApp inválido. Forneça um número com DDD.' });
                return;
            }
        }

        const dbStart = performance.now();
        if (isEmail) {
            [client] = await sql`
              SELECT * FROM clients WHERE email = ${identifier}
            `;
        } else {
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
            // Log de falha de login
            const userAgent = req.headers['user-agent'] || undefined;
            await logLoginEvent('failed_login', cleanPhone, undefined, 'Senha incorreta', false, req.ip || undefined, userAgent);
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }

        // Log de login bem-sucedido
        const userAgent = req.headers['user-agent'] || undefined;
        await logLoginEvent('login', cleanPhone, isEmail ? identifier : undefined, `Login bem-sucedido: ${client.name}`, true, req.ip || undefined, userAgent);

        const jwtStart = performance.now();
        const JWT_SECRET = process.env.JWT_SECRET!;
        const token = jwt.sign(
            { id: client.id, email: client.email || client.whatsapp },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '8h' }
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
                is_admin: client.is_admin,
            },
        });
    } catch (error) {
        logger.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

// ============================================================
// POST /api/auth/register-from-order — Cadastro pós-pagamento/trial
// ============================================================
const registerFromOrderSchema = z.object({
    orderId: z.string().min(1, 'ID do pedido inválido').max(100),
    device: z.string().max(50).optional().or(z.literal('')),
    email: z.string().email('E-mail inválido').max(255).optional().or(z.literal('')),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
});

router.post('/register-from-order', async (req: Request, res: Response) => {
    const result = registerFromOrderSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.issues[0].message });
        return;
    }

    const { orderId, device: formDevice, email, password } = result.data;

    try {
        // Buscar o pedido (status = 'paid' e ainda não registrado)
        const [order] = await sql`
          SELECT id, name, whatsapp, plan, amount, device
          FROM pending_orders
          WHERE id = ${orderId}
            AND status = 'paid'
            AND registered_at IS NULL
        `;

        // Device: usa do formulario, ou do order (trial envia device na criação)
        const device = formDevice || order?.device || '';

        if (!order) {
            res.status(404).json({ error: 'Pedido não encontrado ou já registrado.' });
            return;
        }

        // Verificar se WhatsApp já existe na tabela clients
        const [existingClient] = await sql`
          SELECT id, app_account FROM clients WHERE whatsapp = ${order.whatsapp}
        `;
        if (existingClient) {
            const daysToAdd = PLAN_DAYS[order.plan] ?? 31;
            let poolEntry: any = null;

            if (!existingClient.app_account) {
                [poolEntry] = await sql`
                  UPDATE login_pool
                  SET status = 'em_uso', client_id = ${existingClient.id}, assigned_at = NOW()
                  WHERE id = (
                    SELECT id FROM login_pool
                    WHERE status = 'disponivel'
                    ORDER BY created_at ASC
                    LIMIT 1
                  )
                  RETURNING id, app_account, app_password
                `;
            }

            if (poolEntry) {
                await sql`
                  UPDATE clients
                  SET status = 'Ativo',
                      days_remaining = ${daysToAdd},
                      plan = ${order.plan},
                      app_account = ${poolEntry.app_account},
                      app_password = ${poolEntry.app_password}
                  WHERE id = ${existingClient.id}
                `;
            } else {
                await sql`
                  UPDATE clients
                  SET status = 'Ativo',
                      days_remaining = ${daysToAdd},
                      plan = ${order.plan}
                  WHERE id = ${existingClient.id}
                `;
            }

            // Vincular pedido ao cliente existente
            await sql`
              UPDATE pending_orders
              SET status = 'registered', client_id = ${existingClient.id}, registered_at = NOW()
              WHERE id = ${orderId}
            `;
            // Gerar token para login automático
            const JWT_SECRET = process.env.JWT_SECRET!;
            const token = jwt.sign(
                { id: existingClient.id, email: order.whatsapp },
                JWT_SECRET,
                { algorithm: 'HS256', expiresIn: '8h' }
            );
            res.json({ success: true, token, user: { name: order.name, whatsapp: order.whatsapp } });
            return;
        }

        // Se forneceu email, verificar duplicata
        if (email && email.trim() !== '') {
            const [existingEmail] = await sql`
              SELECT id FROM clients WHERE email = ${email}
            `;
            if (existingEmail) {
                res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
                return;
            }
        }

        // Criar cliente
        const JWT_SECRET = process.env.JWT_SECRET!;
        const passwordHash = await bcrypt.hash(password, 12);

        const daysToAdd = PLAN_DAYS[order.plan] ?? 31;

        const [newClient] = await sql`
          INSERT INTO clients (name, whatsapp, device, email, password_hash, plan, status, days_remaining)
          VALUES (${order.name}, ${order.whatsapp}, ${device}, ${email || null}, ${passwordHash}, ${order.plan}, 'Ativo', ${daysToAdd})
          RETURNING id, name, email, plan, status
        `;

        const [poolEntry] = await sql`
          UPDATE login_pool
          SET status = 'em_uso', client_id = ${newClient.id}, assigned_at = NOW()
          WHERE id = (
            SELECT id FROM login_pool
            WHERE status = 'disponivel'
            ORDER BY created_at ASC
            LIMIT 1
          )
          RETURNING id, app_account, app_password
        `;

        if (poolEntry) {
            await sql`
              UPDATE clients
              SET app_account = ${poolEntry.app_account},
                  app_password = ${poolEntry.app_password}
              WHERE id = ${newClient.id}
            `;
        } else {
            logger.warn(`Pool vazio no cadastro pos-pagamento. Cliente ${newClient.id} criado sem login atribuido.`);
        }

        // Atualizar pedido como registrado
        await sql`
          UPDATE pending_orders
          SET status = 'registered', client_id = ${newClient.id}, registered_at = NOW()
          WHERE id = ${orderId}
        `;

        // Gerar JWT
        const token = jwt.sign(
            { id: newClient.id, email: email || order.whatsapp },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '8h' }
        );

        const logMsg = [
            `✅ <b>Novo cliente via ${order.plan === 'trial' ? 'trial' : 'checkout'}!</b>`,
            `👤 <b>Nome:</b> ${order.name}`,
            `📱 <b>WhatsApp:</b> ${order.whatsapp}`,
            `🖥️ <b>Dispositivo:</b> ${device}`,
            `📋 <b>Plano:</b> ${order.plan}`,
            `🆔 <b>ID:</b> ${newClient.id}`
        ].join('\n');
        logger.info(logMsg);

        // Enviar WhatsApp (best-effort, não bloqueia resposta em caso de falha)
        if (order.plan === 'trial') {
            await sendTrialActivation(order.whatsapp, order.name);
        } else {
            await sendRegistrationComplete(order.whatsapp, order.name);
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                name: newClient.name,
                plan: newClient.plan,
                status: newClient.status,
                whatsapp: order.whatsapp,
                email: email || null,
            },
        });
    } catch (error) {
        logger.error('Erro no register-from-order:', error);
        res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
    }
});

export default router;
