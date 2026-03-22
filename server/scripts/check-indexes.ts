import sql from '../database.js';
import fs from 'fs';

async function checkIndexes() {
  try {
    const res = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'clients';
    `;
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients';
    `;
    
    const output = {
      indexes: res,
      columns: columns
    };

    fs.writeFileSync('server/scripts/check-indexes-output.json', JSON.stringify(output, null, 2));
    console.log("Output written to server/scripts/check-indexes-output.json");

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit(0);
  }
}

checkIndexes();
