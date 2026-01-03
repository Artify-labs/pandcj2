#!/usr/bin/env node
const { MongoClient } = require('mongodb')
require('dotenv').config()

async function deleteUserOrders(email) {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    console.log(`🔍 Searching for orders associated with email: ${email}`)
    
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'pandc')
    const ordersCollection = db.collection('orders')
    
    // Find all orders for this email
    const matchingOrders = await ordersCollection
      .find({ 'address.email': email })
      .toArray()

    if (matchingOrders.length === 0) {
      console.log('❌ No orders found for this email address')
      await client.close()
      return
    }

    console.log(`✅ Found ${matchingOrders.length} order(s) for ${email}`)
    matchingOrders.forEach((order, i) => {
      console.log(`  ${i + 1}. Order ID: ${order.id}`)
      console.log(`     Total: ₹${order.total} | Status: ${order.status}`)
    })

    // Delete all orders
    console.log('\n⚠️  DELETING THESE ORDERS...')
    const result = await ordersCollection.deleteMany({ 'address.email': email })
    
    console.log(`✅ Successfully deleted ${result.deletedCount} order(s)`)
    console.log('Order history cleared for:', email)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/delete-user-orders.js <email>')
  console.error('Example: node scripts/delete-user-orders.js preetbiswas2006@gmail.com')
  process.exit(1)
}

deleteUserOrders(email).then(() => {
  console.log('✨ Done!')
  process.exit(0)
}).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
