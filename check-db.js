const { MongoClient } = require('mongodb')
require('dotenv').config()

const uri = process.env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
client.connect()
  .then(() => { console.log('OK') })
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => client.close())