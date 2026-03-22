// server/services/otp.ts
import sql from '../database.js';

/**
 * Gera um código OTP aleatório de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Salva o token OTP no banco (Supabase/PostgreSQL).
 * - Invalida tokens anteriores do mesmo número e tipo
 * - O token expira em 5 minutos
 */
export async function saveOTP(whatsapp: string, token: string, type: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Invalidar tokens anteriores do mesmo número/tipo
  await sql`
    UPDATE otp_tokens SET used = TRUE
    WHERE whatsapp = ${whatsapp} AND type = ${type} AND used = FALSE
  `;

  // Salvar o novo token
  await sql`
    INSERT INTO otp_tokens (whatsapp, token, type, expires_at)
    VALUES (${whatsapp}, ${token}, ${type}, ${expiresAt})
  `;
}

/**
 * Valida o token OTP.
 * Retorna true se válido, false se inválido/expirado/já usado.
 */
export async function verifyOTP(whatsapp: string, token: string, type: string, consume: boolean = true): Promise<boolean> {
  const [record] = await sql`
    SELECT id FROM otp_tokens
    WHERE whatsapp = ${whatsapp} AND token = ${token} AND type = ${type}
    AND used = FALSE AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!record) return false;

  if (consume) {
    // Marcar como usado
    await sql`UPDATE otp_tokens SET used = TRUE WHERE id = ${record.id}`;
  }
  return true;
}
