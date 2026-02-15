import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all workers
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('workers')
    const workers = await collection.find({}).sort({ worker_id: 1 }).toArray()

    return NextResponse.json({ success: true, workers })
  } catch (error: any) {
    console.error('Error fetching workers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST create a new worker
export async function POST(request: NextRequest) {
  try {
    const workerData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('workers')

    // Get the highest worker_id and increment
    const lastWorker = await collection.find({}).sort({ worker_id: -1 }).limit(1).toArray()
    const nextWorkerId = lastWorker.length > 0 ? lastWorker[0].worker_id + 1 : 1

    // Add worker_id and timestamp
    workerData.worker_id = nextWorkerId
    workerData.createdAt = new Date()
    workerData.updatedAt = new Date()

    const result = await collection.insertOne(workerData)

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        worker: workerData
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating worker:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
