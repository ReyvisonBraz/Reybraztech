import { sendWhatsApp } from '../services/whatsapp.js';
import logger from '../utils/logger.js';

async function testSend() {
  const number = '5591993170497'; // Use a real or test number you know
  console.log(`Sending test WhatsApp to ${number}...`);
  
  // Directly trigger to see logs
  const success = await sendWhatsApp(number, 'Teste de validação de 24h!');
  
  console.log(`\nResult: ${success ? '✅ Enviado' : '❌ Falhou'}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  process.exit(0);
}

testSend();
