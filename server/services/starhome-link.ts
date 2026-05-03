import sql from '../database.js';
import logger from '../utils/logger.js';

/**
 * Tenta vincular um cliente ao seu registro no StarHome pelo número de WhatsApp.
 * Busca no campo buyer_name da tabela starhome_clients pelo número de telefone.
 * Se encontrar, copia os dados (account, password, pacote, etc) para o cliente.
 */
export async function linkClientByWhatsapp(whatsapp: string): Promise<{
  linked: boolean;
  account?: string;
  days_remaining?: number;
}> {
  try {
    // Normalizar WhatsApp: remover tudo que não for dígito
    const digits = whatsapp.replace(/\D/g, '');

    // Verificar se o cliente existe e já tem vínculo
    const [client] = await sql`
      SELECT id, name, whatsapp, starhome_account
      FROM clients
      WHERE whatsapp = ${whatsapp}
    `;

    if (!client) {
      logger.info(`[StarHome Link] Cliente não encontrado para WhatsApp ${whatsapp}`);
      return { linked: false };
    }

    // Se já vinculado, não precisa fazer nada
    if (client.starhome_account) {
      logger.info(`[StarHome Link] Cliente ${client.id} já vinculado ao StarHome: ${client.starhome_account}`);
      return { linked: true, account: client.starhome_account };
    }

    // Procurar no starhome_clients pelo número no buyer_name
    // Tenta várias combinações: número completo, sem DDD, sem nono dígito
    const searchPatterns: string[] = [digits];

    if (digits.length >= 11) {
      // Sem prefixo 55: 91993170497
      const without55 = digits.startsWith('55') ? digits.slice(2) : digits;
      searchPatterns.push(without55);

      // Sem o nono dígito (formato antigo): 9193170497
      if (without55.length === 11) {
        const ddd = without55.slice(0, 2);
        const rest = without55.slice(3); // remove o nono dígito
        searchPatterns.push(ddd + rest);
      }
    }

    // Busca pelo padrão mais específico primeiro
    let match: any = null;
    for (const pattern of searchPatterns) {
      const [found] = await sql`
        SELECT account, password, buyer_name, package_name,
               days_remaining, in_use, expiration_date
        FROM starhome_clients
        WHERE buyer_name LIKE ${'%' + pattern + '%'}
        ORDER BY days_remaining DESC
        LIMIT 1
      `;
      if (found) {
        match = found;
        break;
      }
    }

    // Fallback: busca pelos últimos 8-9 dígitos (número local)
    if (!match && digits.length >= 8) {
      const lastDigits = digits.slice(-9); // últimos 9 dígitos
      const [found] = await sql`
        SELECT account, password, buyer_name, package_name,
               days_remaining, in_use, expiration_date
        FROM starhome_clients
        WHERE buyer_name LIKE ${'%' + lastDigits + '%'}
        ORDER BY days_remaining DESC
        LIMIT 1
      `;
      match = found;
    }

    if (!match) {
      logger.info(`[StarHome Link] Nenhum registro StarHome encontrado para WhatsApp ${digits}`);
      return { linked: false };
    }

    // Vincular: copiar dados do StarHome para o cliente
    const statusMap: Record<string, string> = {
      'Used': 'Em uso',
      'Unused': 'Disponível',
    };

    await sql`
      UPDATE clients SET
        starhome_account = ${match.account},
        starhome_password = ${match.password},
        starhome_days_remaining = ${match.days_remaining},
        starhome_package = ${match.package_name},
        starhome_in_use = ${statusMap[match.in_use] || match.in_use},
        starhome_expiration_date = ${match.expiration_date || null},
        starhome_last_sync = NOW()
      WHERE id = ${client.id}
    `;

    logger.info(`✅ [StarHome Link] Cliente ${client.id} (${client.name}) vinculado ao StarHome: ${match.account}`);
    return { linked: true, account: match.account, days_remaining: match.days_remaining };
  } catch (error) {
    logger.error('[StarHome Link] Erro ao vincular cliente:', error);
    return { linked: false };
  }
}
