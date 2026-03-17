import type { Page } from 'puppeteer';

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

  // Configura itens por página para 100 (máximo)
  await setItemsPerPage(page, itemsPerPage);
  await delay(2000);

  const allClients: ClientData[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    console.log(`  📄 Extraindo página ${currentPage}...`);

    // Aguarda a tabela carregar
    await page.waitForSelector('.el-table__body-wrapper table tbody, table tbody', {
      timeout: 15000,
    }).catch(() => {
      console.log('  ⚠️  Tabela não encontrada, tentando outro seletor...');
    });

    await delay(1500);

    // Extrai dados da tabela
    const pageClients = await extractTableData(page);
    console.log(`  ✅ Extraídos ${pageClients.length} clientes da página ${currentPage}`);

    // Revela as senhas clicando nelas
    const clientsWithPasswords = await revealPasswords(page, pageClients);
    allClients.push(...clientsWithPasswords);

    // Verifica se tem próxima página
    hasNextPage = await goToNextPage(page);
    if (hasNextPage) {
      currentPage++;
      await delay(2000);
    }
  }

  console.log(`\n  🎉 Total de clientes extraídos: ${allClients.length}\n`);
  return allClients;
}

/**
 * Configura a quantidade de itens por página.
 */
async function setItemsPerPage(page: Page, items: number): Promise<void> {
  try {
    const pageSizeSelectors = [
      '.el-pagination .el-select',
      '.el-pagination__sizes .el-select',
    ];

    for (const selector of pageSizeSelectors) {
      const dropdown = await page.$(selector);
      if (dropdown) {
        await dropdown.click();
        await delay(500);

        const options = await page.$$('.el-select-dropdown__item, .el-dropdown-menu__item');
        for (const option of options) {
          const text = await option.evaluate((el: Element) => el.textContent || '');
          if (text.includes(String(items)) || text.includes('100')) {
            await option.click();
            console.log(`  📐 Configurado para ${items} itens por página`);
            await delay(1500);
            return;
          }
        }
        break;
      }
    }

    console.log('  ℹ️  Não encontrou seletor de itens por página, mantendo padrão');
  } catch (error) {
    console.log(`  ⚠️  Erro ao configurar itens por página: ${error}`);
  }
}

/**
 * Extrai os dados da tabela de contas da página atual.
 */
async function extractTableData(page: Page): Promise<ClientData[]> {
  const clients: ClientData[] = await page.evaluate(() => {
    const rows = document.querySelectorAll(
      '.el-table__body-wrapper table tbody tr, table.el-table__body tbody tr'
    );
    const data: Array<{
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
    }> = [];

    rows.forEach((row: Element) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 8) return;

      const getCellText = (cell: Element): string => {
        return (cell.textContent || '').trim();
      };

      // Colunas da tabela:
      // 0: Checkbox | 1: Index | 2: Account | 3: Password | 4: Days Remaining |
      // 5: Package name | 6: Buyer name | 7: Time of first login |
      // 8: Account expiration date | 9: Creation time | 10: In use | 11: Expired | 12: Operate
      const client = {
        index: parseInt(getCellText(cells[1])) || 0,
        account: getCellText(cells[2]),
        password: getCellText(cells[3]) || '***',
        days_remaining: parseInt(getCellText(cells[4])) || 0,
        package_name: getCellText(cells[5]),
        buyer_name: getCellText(cells[6]),
        first_login: getCellText(cells[7]) || null,
        expiration_date: getCellText(cells[8]) || null,
        creation_time: getCellText(cells[9]) || null,
        in_use: getCellText(cells[10]) || '',
        expired: getCellText(cells[11]) || '',
      };

      if (client.account && client.account !== '') {
        data.push(client);
      }
    });

    return data;
  });

  return clients;
}

/**
 * Clica nas senhas mascaradas para revelar a senha real de cada cliente.
 */
async function revealPasswords(page: Page, clients: ClientData[]): Promise<ClientData[]> {
  console.log('  🔓 Revelando senhas...');

  // Encontra as células de senha na tabela (coluna 4 = Password, index 3 com checkbox)
  const passwordCells = await page.$$(
    '.el-table__body-wrapper table tbody tr td:nth-child(4)'
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
      '.el-pagination button.btn-next:not(.is-disabled)'
    );

    if (nextButton) {
      const isDisabled = await nextButton.evaluate((el: Element) => {
        return el.classList.contains('disabled') ||
               el.classList.contains('is-disabled') ||
               el.hasAttribute('disabled');
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
