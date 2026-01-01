const path = require('path')
const { pathToFileURL } = require('url')

;(async () => {
  console.log('Starting migration: lib/migratePublicToMongo.ensureMigrated()')
  try {
    const modPath = path.join(process.cwd(), 'lib', 'migratePublicToMongo.js')
    const mod = await import(pathToFileURL(modPath).href)
    if (!mod || typeof mod.ensureMigrated !== 'function') {
      console.error('Migration module not found or missing ensureMigrated export')
      process.exit(1)
    }

    // show env hints
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***present***' : '---not set---')
    console.log('MONGODB_DB:', process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || '(not set)')

    await mod.ensureMigrated()
    console.log('Migration completed')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err && (err.stack || err.message || err))
    process.exit(1)
  }
})()
