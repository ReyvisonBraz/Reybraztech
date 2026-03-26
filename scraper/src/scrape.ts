import type { Page } from 'puppeteer';
import * as path from 'path';

/** Estrutura de dados de um cliente extraído do painel */
export interface ClientData {
  index: number;
  account: string;
  password: string;
  days_remaining: number;
  package_name: string;
  buyer_name: string;
  first_login: string | null;
  expiration_date: string | null;
  creation_time: string | null;
  in_use: string;
  expired: string;
}

/** Espera N milissegundos */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Navega para a página de Account List e extrai os dados dos clientes.
 */
export async function scrapeClients(page: Page, itemsPerPage: number = 100): Promise<ClientData[]> {
  console.log('\n📊 Iniciando extração de dados dos clientes...\n');

  // Navega para Account List
  const panelUrl = page.url().split('#')[0];
  const accountListUrl = `${panelUrl}#/account/list`;
  console.log(`  🌐 Navegando para: ${accountListUrl}`);
  await page.goto(accountListUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);

  await setItemsPerPage(page, itemsPerPage);

  // Aguarda a tabela aparecer com dados
  await page.waitForSelector('.ant-table-row', { timeout: 20000 }).catch(() => {
    console.log('  ⚠️  Linhas da tabela não apareceram em 20s.');
  });
  await delay(2000);

  // Extração direta e automática (sem interação humana)
  // Mecanismo confirmado: senha está em <span style="display: none;"> sem font-size no DOM
  console.log('\n  🤖 Iniciando extração automática (modo background)...');

  // =====================================================================
  // EXTRAÇÃO: Lê senhas ocultas direto do DOM sem nenhum clique
  // =====================================================================
  const allClients: ClientData[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  const pageLimit = parseInt(process.env.PAGE_LIMIT || '0'); // 0 = sem limite

  while (hasNextPage) {
    console.log(`\n  📄 Extraindo página ${currentPage}...`);

    const pageClients = await extractTableData(page);
    console.log(`    ✅ ${pageClients.length} clientes extraídos na página ${currentPage}`);

    allClients.push(...pageClients);

    // Para se atingiu o limite de páginas (útil para testes)
    if (pageLimit > 0 && currentPage >= pageLimit) {
      console.log(`  🛑 Limite de ${pageLimit} página(s) atingido.`);
      break;
    }

    hasNextPage = await goToNextPage(page);
    if (hasNextPage) {
      currentPage++;
      await delay(2500);
      await page.waitForSelector('.ant-table-row', { timeout: 10000 }).catch(() => {});
    }
  }

  console.log(`\n  🎉 Extração concluída! Total: ${allClients.length} clientes.`);

  const fs = await import('fs');
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}h${String(now.getMinutes()).padStart(2,'0')}`;

  // Salva em output/ (working dir)
  const outputPath = path.join(__dirname, '..', 'output', 'clients_extracted.json');
  fs.writeFileSync(outputPath, JSON.stringify(allClients, null, 2));

  // Salva em docs/ com timestamp (histórico permanente)
  const docsDir = path.join(__dirname, '..', '..', 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const docsPath = path.join(docsDir, `clients_${timestamp}.json`);
  fs.writeFileSync(docsPath, JSON.stringify(allClients, null, 2));

  console.log(`  💾 output/clients_extracted.json`);
  console.log(`  💾 docs/clients_${timestamp}.json`);

  return allClients;
}

/**
 * Configura a quantidade de itens por página.
 */
async function setItemsPerPage(page: Page, items: number): Promise<void> {
  console.log(`  🔍 Rolando para o rodapé e buscando componente ElementUI para a quantia de ${items}...`);
  try {
    // Força o viewport exibir toda a janela para que a paginação apareça
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(1000);

    const pageSizeSelectors = [
      '.ant-pagination-options-size-changer', // Ant Design
      '.ant-select-selector', // Ant Design genérico
      '.el-pagination__sizes .el-select',
      '.el-pagination .el-select',
    ];

    for (const selector of pageSizeSelectors) {
      const dropdown = await page.$(selector);
      if (dropdown) {
        // Encontrou a caixa sem prever pixels na tela; ele acha o Elemento
        await dropdown.click();
        console.log(`  🎯 Elemento clique exato: ${selector}`);
        await delay(1000); // Animação renderizar o popover

        // Pega as opções renderedas no HTML
        const options = await page.$$('li.el-select-dropdown__item span, .ant-select-item-option-content');
        let configFeita = false;
        
        for (const option of options) {
          const text = await option.evaluate((el: Element) => el.textContent || '');
          if (text.includes(String(items)) || text.includes('100')) {
            // Sem coordenadas XY; o driver calcula e atira no centro desse 'span'
            await option.click();
            console.log(`  📐 Clicado no node: ${text.trim()}`);
            configFeita = true;
            await delay(3000); // Carrega os 100 itens da rede (backend deles)
            break;
          }
        }
        
        if (configFeita) return;
        break;
      }
    }

    console.log('  ℹ️  Seletor el-pagination__sizes não encontrado, usando visualização padrão.');
  } catch (error) {
    console.log(`  ⚠️  Erro no DOM durante click da paginação: ${error}`);
  }
}

/**
 * Extrai os dados da tabela de contas da página atual.
 *
 * MECANISMO DAS SENHAS (confirmado via MutationObserver):
 *  - Span com senha: style="display: none;" (sem font-size) — contém a senha real
 *  - Basta ler o textContent do span com display:none e sem font-size
 *
 * IMPORTANTE: usa page.evaluate com código SEM function declarations nomeadas
 * para evitar o bug "__name is not defined" do compilador tsx/esbuild.
 */
async function extractTableData(page: Page): Promise<ClientData[]> {
  const clients = await page.evaluate(function () {
    var results: any[] = [];
    var rows = document.querySelectorAll('tr.ant-table-row');

    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].querySelectorAll('td');
      if (cells.length < 5) continue;

      // Leitura direta das células (sem function declaration para evitar __name)
      var col1 = cells[1] ? (cells[1].textContent || '').trim() : '';
      var col2 = cells[2] ? (cells[2].textContent || '').trim() : '';
      var col4 = cells[4] ? (cells[4].textContent || '').trim() : '';
      var col5 = cells[5] ? (cells[5].textContent || '').trim() : '';
      var col6 = cells[6] ? (cells[6].textContent || '').trim() : '';
      var col7 = cells[7] ? (cells[7].textContent || '').trim() : '';
      var col8 = cells[8] ? (cells[8].textContent || '').trim() : '';
      var col9 = cells[9] ? (cells[9].textContent || '').trim() : '';
      var col10 = cells[10] ? (cells[10].textContent || '').trim() : '';
      var col11 = cells[11] ? (cells[11].textContent || '').trim() : '';

      if (!col2) continue; // Sem account, ignora

      // Senha: span com display:none E sem font-size = span da senha (não do ícone)
      var pwd = '***';
      var pwdCell = cells[3];
      if (pwdCell) {
        var spans = pwdCell.querySelectorAll('span');
        for (var j = 0; j < spans.length; j++) {
          var s = spans[j] as HTMLElement;
          var st = s.getAttribute('style') || '';
          var val = (s.textContent || '').trim();
          if (st.indexOf('display: none') >= 0 && st.indexOf('font-size') < 0 && val.length > 0) {
            pwd = val;
            break;
          }
        }
        // Fallback: qualquer span com valor e sem asterisco
        if (pwd === '***') {
          for (var k = 0; k < spans.length; k++) {
            var t2 = (spans[k].textContent || '').trim();
            if (t2.length > 0 && t2 !== '***') {
              pwd = t2;
              break;
            }
          }
        }
      }

      results.push({
        index: parseInt(col1, 10) || 0,
        account: col2,
        password: pwd,
        days_remaining: parseInt(col4, 10) || 0,
        package_name: col5,
        buyer_name: col6,
        first_login: col7,
        expiration_date: col8,
        creation_time: col9,
        in_use: col10,
        expired: col11,
      });
    }

    return results;
  });

  const result = (clients || []) as ClientData[];
  console.log(`    → Extraídos ${result.length} clientes da tabela`);
  return result;
}

/**
 * Clica nas senhas mascaradas para revelar a senha real de cada cliente.
 */
async function revealPasswords(page: Page, clients: ClientData[]): Promise<ClientData[]> {
  console.log('  🔓 Revelando senhas...');

  // Encontra as células de senha na tabela (coluna 4 = Password, index 3 com checkbox ou coluna dependendo do framework)
  // Em Ant-Design a coluna de senha costuma ser a mesma posição (índice nth-child 4 ou 5)
  const passwordCells = await page.$$(
    '.el-table__body-wrapper table tbody tr td:nth-child(4), .ant-table-tbody tr td:nth-child(4)'
  );

  for (let i = 0; i < passwordCells.length && i < clients.length; i++) {
    try {
      const cellText = await passwordCells[i].evaluate((el: Element) => el.textContent || '');

      // Se a senha está mascarada, clica para revelar
      if (cellText.includes('***') || cellText.includes('•') || cellText.includes('···')) {
        await passwordCells[i].click();
        await delay(600);

        // Depois do clique, tenta ler a senha revelada
        const revealed = await passwordCells[i].evaluate((el: Element) => el.textContent || '');
        if (revealed && !revealed.includes('***') && !revealed.includes('•') && !revealed.includes('···')) {
          clients[i].password = revealed.trim();
        }
      } else if (cellText && cellText !== '') {
        clients[i].password = cellText.trim();
      }
    } catch {
      // Ignora erros individuais e continua
    }
  }

  const revealed = clients.filter((c) => c.password !== '***').length;
  console.log(`  ✅ ${revealed}/${clients.length} senhas reveladas`);
  return clients;
}

/**
 * Tenta ir para a próxima página da tabela.
 */
async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextButton = await page.$(
      '.el-pagination .btn-next:not(.disabled):not([disabled]), ' +
      '.el-pagination button.btn-next:not(.is-disabled), ' +
      'li.ant-pagination-next:not(.ant-pagination-disabled) button, ' +
      'li.ant-pagination-next:not(.ant-pagination-disabled)'
    );

    if (nextButton) {
      const isDisabled = await nextButton.evaluate((el: Element) => {
        return el.classList.contains('disabled') ||
               el.classList.contains('is-disabled') ||
               el.classList.contains('ant-pagination-disabled') ||
               el.hasAttribute('disabled') || 
               el.parentElement?.classList.contains('ant-pagination-disabled');
      });

      if (!isDisabled) {
        await nextButton.click();
        console.log('  ➡️  Indo para próxima página...');
        return true;
      }
    }
  } catch {
    // Sem mais páginas
  }

  console.log('  📋 Última página alcançada');
  return false;
}
