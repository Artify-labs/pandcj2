const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => console.log('OK'))
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => p.$disconnect());