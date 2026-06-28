/**
 * One-time cleanup script: for each lot (_id), keeps the oldest job card
 * and deletes all duplicates that were created by repeated page visits.
 *
 * NOTE: lot numbers are NOT unique — the same number can appear on multiple
 * lots. Deduplication is therefore done by lotId (the lot's MongoDB _id)
 * for new job cards, and by lotNumber only for legacy cards that pre-date
 * the lotId field.
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

  let totalDeleted = 0

  // --- Pass 1: dedup by lotId (job cards that have the field) ---
  const dupsByLotId = await col.aggregate([
    { $match: { lotId: { $exists: true, $ne: null } } },
    { $sort: { createdAt: 1 } },
    { $group: { _id: '$lotId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray()

  for (const { _id: lotId, ids } of dupsByLotId) {
    const toDelete = ids.slice(1)
    const result = await col.deleteMany({ _id: { $in: toDelete } })
    console.log(`  lotId ${lotId}: kept 1, deleted ${result.deletedCount} duplicate(s)`)
    totalDeleted += result.deletedCount
  }

  // --- Pass 2: dedup by lotNumber for legacy cards without lotId ---
  const dupsByLotNumber = await col.aggregate([
    { $match: { lotId: { $exists: false } } },
    { $sort: { createdAt: 1 } },
    { $group: { _id: '$lotNumber', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray()

  for (const { _id: lotNumber, ids } of dupsByLotNumber) {
    const toDelete = ids.slice(1)
    const result = await col.deleteMany({ _id: { $in: toDelete } })
    console.log(`  lotNumber "${lotNumber}" (legacy): kept 1, deleted ${result.deletedCount} duplicate(s)`)
    totalDeleted += result.deletedCount
  }

  console.log(`\nTotal duplicates removed: ${totalDeleted}`)
  console.log('No unique index added — lot numbers are not unique across lots.')
} finally {
  await client.close()
}
