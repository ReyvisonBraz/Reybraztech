import logger from '../utils/logger.js';

async function testTrigger() {
  console.log("Sending log with ✅ to trigger Telegram...");
  logger.info("✅ Mensagem de teste de sucesso com ✅ para ver se chega no Telegram!");
  
  console.log("\nSending log with 🚨 error to trigger Telegram...");
  logger.error("🚨 Erro de teste com 🚨 para ver se chega no Telegram!");

  console.log("\nWaiting 3 seconds to see output...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log("Done.");
  process.exit(0);
}

testTrigger();
