import dotenv from 'dotenv';
dotenv.config();

async function checkBots() {
  try {
    const tokenRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.SENDPULSE_CLIENT_ID!,
        client_secret: process.env.SENDPULSE_CLIENT_SECRET!,
      }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    const botsRes = await fetch('https://api.sendpulse.com/whatsapp/bots', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const bots = await botsRes.json();
    console.log("============ SEUS BOTS NO SENDPULSE ============");
    bots.data.forEach((bot: any) => {
        console.log(`- Nome: ${bot.name} | Número: ${bot.channel_data.phone} | BOT_ID: ${bot.id}`);
    });
    console.log("================================================");
  } catch (err) {
    console.error("Erro no script:", err);
  } finally {
      process.exit(0);
  }
}

checkBots();
