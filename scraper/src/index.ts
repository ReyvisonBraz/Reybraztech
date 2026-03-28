import * as dotenv from 'dotenv';
import * as path from 'path';
import { loginToPanel } from './login';
import { scrapeClients } from './scrape';
import { exportAll } from './export';

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Função principal do scraper (exportada para ser usada no bot ou terminal)
 */
export async function runScraper() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🕷️  Scraper ResellerSystem - StarHome      ║');
  console.log('║   📦 Reybraztech — Extração de Clientes     ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Verifica variáveis de ambiente
  const config = {
    url: process.env.PANEL_URL || 'https://panel.web.starhome.vip',
    account: process.env.PANEL_ACCOUNT || '',
    password: process.env.PANEL_PASSWORD || '',
    headless: process.env.HEADLESS === 'true',
    itemsPerPage: parseInt(process.env.ITEMS_PER_PAGE || '100'),
  };

  if (!config.account || !config.password) {
    throw new Error('PANEL_ACCOUNT e PANEL_PASSWORD são obrigatórios no .env');
  }

  console.log(`\n📋 Configuração:`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Account: ${config.account}`);
  console.log(`   Headless: ${config.headless}`);
  console.log(`   Itens/página: ${config.itemsPerPage}`);

  let browser;

  try {
    // 1. Login
    const session = await loginToPanel({
      url: config.url,
      account: config.account,
      password: config.password,
      headless: config.headless,
    });
    browser = session.browser;

    // 2. Scraping
    const clients = await scrapeClients(session.page, config.itemsPerPage);

    if (clients.length === 0) {
      console.log('\n⚠️  Nenhum cliente encontrado. Verifique se o login foi bem sucedido.');
      return [];
    }

    // 3. Exportação
    const { json, csv } = exportAll(clients);

    // Resumo final
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║            ✅ EXTRAÇÃO CONCLUÍDA             ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Total de clientes: ${String(clients.length).padEnd(24)}║`);
    console.log(`║  JSON: ${path.basename(json).padEnd(37)}║`);
    console.log(`║  CSV:  ${path.basename(csv).padEnd(37)}║`);
    console.log('╚══════════════════════════════════════════════╝');

    // Estatísticas úteis
    const active = clients.filter((c) => c.in_use === 'Used').length;
    const inactive = clients.filter((c) => c.in_use === 'Unused').length;
    const expiring = clients.filter((c) => c.days_remaining <= 3 && c.days_remaining > 0).length;
    const expired = clients.filter((c) => c.days_remaining <= 0 || c.expired === 'Expired').length;

    console.log('\n📊 Estatísticas:');
    console.log(`   🟢 Ativos (Used): ${active}`);
    console.log(`   ⚪ Inativos (Unused): ${inactive}`);
    console.log(`   🟡 Vencendo em 3 dias: ${expiring}`);
    console.log(`   🔴 Expirados: ${expired}\n`);

    return clients;

  } catch (error) {
    console.error('\n❌ Erro durante a execução:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('🔒 Fechando navegador...');
      await browser.close();
    }
  }
}

// Se o arquivo for rodado diretamente (não importado)
if (require.main === module) {
  runScraper().catch(() => process.exit(1));
}
