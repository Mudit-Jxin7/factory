/**
 * One-time cleanup script: keeps the oldest job card per lotNumber,
 * deletes all duplicates, then adds a unique index to prevent recurrence.
 *
 * Usage:
 *   MONGODB_URI=<your-uri> DB_NAME=factory_db node scripts/dedup-jobcards.mjs
 */

import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const dbName = process.env.DB_NAME || 'factory_db'

if (!uri) {
  console.error('Error: MONGODB_URI environment variable is required.')
  process.exit(1)
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbName)
  const col = db.collection('jobcards')

  // Find every lotNumber that has more than one document
  const duplicates = await col.aggregate([
    { $sort: { createdAt: 1 } },           // oldest first
    { $group: {
        _id: '$lotNumber',
        ids: { $push: '$_id' },
        count: { $sum: 1 },
    }},
    { $match: { count: { $gt: 1 } } },
  ]).toArray()

  let totalDeleted = 0

  for (const { _id: lotNumber, ids } of duplicates) {
    // ids are already sorted oldest-first; keep ids[0], delete the rest
    const toDelete = ids.slice(1)
    const result = await col.deleteMany({ _id: { $in: toDelete } })
    console.log(`  ${lotNumber}: kept 1, deleted ${result.deletedCount} duplicate(s)`)
    totalDeleted += result.deletedCount
  }

  console.log(`\nTotal duplicates removed: ${totalDeleted}`)

  // Add unique index so this can never happen again
  await col.createIndex({ lotNumber: 1 }, { unique: true, name: 'lotNumber_unique' })
  console.log('Unique index on lotNumber created (or already exists).')
} finally {
  await client.close()
}
