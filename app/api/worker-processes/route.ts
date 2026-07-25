import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { DEFAULT_WORKER_PROCESSES, roleCodeFromLabel, slugifyProcessKey } from '@/lib/workerProcesses'

const DB_NAME = process.env.DB_NAME || 'factory_db'
const COLLECTION = 'worker_processes'

async function ensureSeeded(collection: any) {
  const count = await collection.countDocuments()
  if (count > 0) return
  const now = new Date()
  await collection.insertMany(
    DEFAULT_WORKER_PROCESSES.map((p) => ({ ...p, createdAt: now, updatedAt: now })),
  )
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION)
    await ensureSeeded(collection)
    const processes = await collection.find({}).sort({ sortOrder: 1, label: 1 }).toArray()
    return NextResponse.json({ success: true, processes })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching worker processes:', error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const label = String(body.label || '').trim()
    if (!label) {
      return NextResponse.json({ success: false, error: 'Label is required' }, { status: 400 })
    }

    const key = slugifyProcessKey(body.key || label)
    if (!key) {
      return NextResponse.json({ success: false, error: 'Invalid key' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION)
    await ensureSeeded(collection)

    const existingKey = await collection.findOne({ key })
    if (existingKey) {
      return NextResponse.json({ success: false, error: `Process key "${key}" already exists` }, { status: 400 })
    }

    const maxOrder = await collection.find({}).sort({ sortOrder: -1 }).limit(1).toArray()
    const nextOrder = (maxOrder[0]?.sortOrder || 0) + 1

    const processData = {
      key,
      productionKey: slugifyProcessKey(body.productionKey || key) || key,
      label,
      roleCode: String(body.roleCode || roleCodeFromLabel(label)).trim().toUpperCase(),
      sortOrder: Number(body.sortOrder) > 0 ? Number(body.sortOrder) : nextOrder,
      active: body.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const existingRole = await collection.findOne({ roleCode: processData.roleCode })
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: `Role code "${processData.roleCode}" already exists` },
        { status: 400 },
      )
    }

    const result = await collection.insertOne(processData)
    return NextResponse.json(
      { success: true, id: result.insertedId, process: processData },
      { status: 201 },
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating worker process:', error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
