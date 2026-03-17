import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { loginToPanel } from './login';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function debugHTML() {
  const config = {
    url: process.env.PANEL_URL || 'https://panel.web.starhome.vip',
    account: process.env.PANEL_ACCOUNT || '',
    password: process.env.PANEL_PASSWORD || '',
    headless: process.env.HEADLESS === 'true',
  };

  const session = await loginToPanel(config);
  const page = session.page;

  const panelUrl = page.url().split('#')[0];
  const accountListUrl = `${panelUrl}#/account/list`;
  console.log(`Navigating to ${accountListUrl}`);
  await page.goto(accountListUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 8000)); // wait 8 seconds

  const html = await page.content();
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'page_dump.html'), html);
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'page_dump.png') });
  
  console.log('Saved page_dump.html and page_dump.png');
  await session.browser.close();
}

debugHTML().catch(console.error);
