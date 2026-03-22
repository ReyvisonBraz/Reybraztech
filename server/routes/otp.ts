// server/routes/otp.ts
import { Router, Request, Response } from 'express';
import { generateOTP, saveOTP, verifyOTP } from '../services/otp.js';
import { sendOTPMessage } from '../services/whatsapp.js';
import sql from '../database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/otp/send
 * Body: { whatsapp: '11999998888', type: 'login' | 'register' | 'reset_password' }
 * Envia um código OTP para o número informado
 */
router.post('/send', async (req: Request, res: Response) => {
  const { whatsapp, type } = req.body;

  if (!whatsapp || !type) {
    res.status(400).json({ error: 'WhatsApp e tipo são obrigatórios.' });
    return;
  }

  try {
    // Limpar tokens expirados/usados de toda a tabela
    await sql`DELETE FROM otp_tokens WHERE expires_at < NOW() OR used = TRUE`;

    // Para login/reset, verificar se o número existe no banco
    if (type === 'login' || type === 'reset_password') {
      const [client] = await sql`
        SELECT id FROM clients WHERE whatsapp = ${whatsapp}
      `;
      if (!client) {
        res.status(404).json({ error: 'Número não encontrado. Faça o cadastro primeiro.' });
        return;
      }
    }

    const token = generateOTP();
    await saveOTP(whatsapp, token, type);

    const sent = await sendOTPMessage(whatsapp, token, type as any);

    if (!sent) {
      res.status(500).json({ error: 'Não foi possível enviar o código. Tente novamente.' });
      return;
    }

    res.json({ message: 'Código enviado com sucesso!' });
  } catch (error) {
    logger.error('Erro ao enviar OTP:', error);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

/**
 * POST /api/otp/verify
 * Body: { whatsapp: '11999998888', token: '123456', type: 'register' | 'login' | 'reset_password' }
 * Verifica se o código OTP é válido (genérico, funciona para qualquer tipo)
 */
router.post('/verify', async (req: Request, res: Response) => {
  const { whatsapp, token, type } = req.body;

  if (!whatsapp || !token || !type) {
    res.status(400).json({ error: 'WhatsApp, código e tipo são obrigatórios.' });
    return;
  }

  try {
    const consume = type !== 'reset_password';
    const valid = await verifyOTP(whatsapp, token, type, consume);

    if (!valid) {
      res.status(401).json({ error: 'Código inválido ou expirado.' });
      return;
    }

    res.json({ valid: true, message: 'Código verificado com sucesso!' });
  } catch (error) {
    logger.error('Erro ao verificar OTP:', error);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

/**
 * POST /api/otp/verify-login
 * Body: { whatsapp: '11999998888', token: '123456' }
 * Verifica o OTP e retorna o JWT de sessão
 */
router.post('/verify-login', async (req: Request, res: Response) => {
  const { whatsapp, token } = req.body;

  try {
    const valid = await verifyOTP(whatsapp, token, 'login');

    if (!valid) {
      res.status(401).json({ error: 'Código inválido ou expirado.' });
      return;
    }

    const [client] = await sql`
      SELECT * FROM clients WHERE whatsapp = ${whatsapp}
    `;

    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const jwtToken = jwt.sign(
      { id: client.id, email: client.email || client.whatsapp },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    logger.info(`✅ Login via OTP: ${client.name} (${client.whatsapp})`);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        name: client.name,
        plan: client.plan,
        status: client.status,
        whatsapp: client.whatsapp,
      },
    });
  } catch (error) {
    logger.error('Erro ao verificar OTP login:', error);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

/**
 * POST /api/otp/reset-password
 * Body: { whatsapp: '11999998888', token: '123456', newPassword: 'novasenha' }
 * Verifica o OTP e atualiza a senha
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { whatsapp, token, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  try {
    const valid = await verifyOTP(whatsapp, token, 'reset_password');

    if (!valid) {
      logger.error(`🚨 Falha ao redefinir senha: Código inválido ou expirado para o número ${whatsapp}`);
      res.status(401).json({ error: 'Código inválido ou expirado.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await sql`
      UPDATE clients SET password_hash = ${newHash} WHERE whatsapp = ${whatsapp}
    `;

    logger.info(`✅ Senha redefinida via OTP para: ${whatsapp}`);

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    logger.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

export default router;
