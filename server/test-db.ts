import sql from './database.js';

async function test() {
  try {
    const res = await sql`SELECT 1 FROM clients LIMIT 1`;
    console.log("Success:", res);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit(0);
  }
}

test();
