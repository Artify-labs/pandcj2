const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB || 'pandc'

async function main() {
  const email = 'pandcjewellery@gmail.com'
  const password = 'preetb121106'
  const hashed = await bcrypt.hash(password, 10)

  const client = new MongoClient(MONGO_URI)
  try {
    await client.connect()
    const db = client.db(DB_NAME)
    const users = db.collection('users')

    const id = 'admin-' + Math.random().toString(36).slice(2, 9)

    const res = await users.updateOne(
      { email },
      { $set: { id, name: 'Admin', email, password: hashed, role: 'ADMIN', image: '' } },
      { upsert: true }
    )

    console.log('Admin user upserted (ok):', { email, upsertedCount: res.upsertedCount })
  } catch (err) {
    console.error('Failed to upsert admin user', err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
