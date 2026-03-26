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

  // Configura itens por página para 100 (máximo) usando clique em elementos
  console.log('  📸 Salvando print da tela ANTES de definir 100 itens...');
  await page.screenshot({ path: path.join(__dirname, '..', 'output', '01-antes-paginacao.png'), fullPage: true });
  
  await setItemsPerPage(page, itemsPerPage);
  
   await page.screenshot({ path: path.join(__dirname, '..', 'output', '02-apos-paginacao-100.png'), fullPage: true });

  // Aguarda a tabela aparecer com dados
  await page.waitForSelector('.ant-table-row', {
    timeout: 20000,
  }).catch(() => {
    console.log('  ⚠️  Linhas da tabela não apareceram em 20s. Verifique se há clientes cadastrados.');
  });
  await delay(2000);

  const allClients: ClientData[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    console.log(`\n  📄 Processando página ${currentPage}...`);

    // Tira print didático da página
    await page.screenshot({ path: path.join(__dirname, '..', 'output', `tabela-pagina-${currentPage}.png`), fullPage: true });

    // Extrai dados da tabela (incluindo senhas ocultas nos spans)
    const pageClients = await extractTableData(page);
    console.log(`    ✅ ${pageClients.length} clientes capturados na página ${currentPage}`);

    allClients.push(...pageClients);

    // Verifica se tem próxima página
    hasNextPage = await goToNextPage(page);
    if (hasNextPage) {
      currentPage++;
      // Espera um pouco para o conteúdo da nova página renderizar
      await delay(2500);
      await page.waitForSelector('.ant-table-row', { timeout: 10000 }).catch(() => {});
    }
  }

  console.log(`\n  🎉 Extração concluída! Total: ${allClients.length} clientes.`);
  
  // Salva resultado final em JSON para conferência
  const fs = await import('fs');
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'clients_extracted.json'), JSON.stringify(allClients, null, 2));
  console.log('  💾 Dados salvos em output/clients_extracted.json');

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
 * As senhas ficam em <span style="display: none;">SENHA</span> — não precisa clicar.
 * Usa page.$$ (iteração Node) para evitar bugs de serialização do tsx.
 */
async function extractTableData(page: Page): Promise<ClientData[]> {
  const rows = await page.$$('tr.ant-table-row');
  console.log(`    → Encontradas ${rows.length} linhas tr.ant-table-row`);

  const clients: ClientData[] = [];

  for (const row of rows) {
    try {
      // Extrai todos os dados de uma linha de uma vez dentro do browser
      const data = await row.evaluate((el) => {
        const cells = el.querySelectorAll('td');
        if (cells.length < 5) return null;

        const t = (i: number) => {
          const c = cells[i];
          return c ? (c.textContent || '').trim() : '';
        };

        // Senha: pega do span oculto dentro da 4ª célula
        let pwd = '***';
        const pwdCell = cells[3];
        if (pwdCell) {
          const spans = pwdCell.querySelectorAll('span');
          for (let j = 0; j < spans.length; j++) {
            const txt = (spans[j].textContent || '').trim();
            if (txt.length > 0 && txt !== '***') {
              pwd = txt;
              break;
            }
          }
        }

        const account = t(2);
        if (!account) return null;

        return {
          index: parseInt(t(1), 10) || 0,
          account,
          password: pwd,
          days_remaining: parseInt(t(4), 10) || 0,
          package_name: t(5),
          buyer_name: t(6),
          first_login: t(7) || '',
          expiration_date: t(8) || '',
          creation_time: t(9) || '',
          in_use: t(10),
          expired: t(11),
        };
      });

      if (data) {
        clients.push(data as ClientData);
      }
    } catch {
      // Ignora linhas que dão erro (ex: measure-row)
    }
  }

  return clients;
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
