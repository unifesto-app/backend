const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'unifesto-chat-migration.sql'), 'utf8');
  const statements = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${statements.length} statements to run.\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('OK');
    } catch (err) {
      console.log('FAILED');
      console.error(err.message);
      process.exit(1);
    }
  }
  console.log('\nAll statements applied successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
