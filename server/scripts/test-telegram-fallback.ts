import logger from '../utils/logger.js';

async function testFallback() {
  console.log("Sending log with invalid HTML to test Telegram fallback...");
  
  // <br> is valid in HTML, but <invalid_tag> is not, or just unclosed <
  logger.info("✅ Teste de Fallback: Nome <John Doe> Sem Fechar Tag");

  console.log("\nWaiting 3 seconds for async delivery...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("Done. Check if you received it on phone without bold formatting (if names are correct).");
  process.exit(0);
}

testFallback();
