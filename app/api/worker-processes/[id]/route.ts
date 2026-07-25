import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { roleCodeFromLabel } from '@/lib/workerProcesses'

const DB_NAME = process.env.DB_NAME || 'factory_db'
const COLLECTION = 'worker_processes'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id
    const body = await request.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION)

    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Process not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (body.label !== undefined) updateData.label = String(body.label).trim()
    if (body.roleCode !== undefined) {
      updateData.roleCode = String(body.roleCode || roleCodeFromLabel(String(body.label || existing.label)))
        .trim()
        .toUpperCase()
    }
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder) || existing.sortOrder
    if (body.active !== undefined) updateData.active = body.active !== false
    // key and productionKey are immutable after create

    if (updateData.roleCode) {
      const roleConflict = await collection.findOne({
        roleCode: updateData.roleCode,
        _id: { $ne: new ObjectId(id) },
      })
      if (roleConflict) {
        return NextResponse.json(
          { success: false, error: `Role code "${updateData.roleCode}" already exists` },
          { status: 400 },
        )
      }
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })
    return NextResponse.json({ success: true, message: 'Process updated successfully' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating worker process:', error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION)

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Process not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Process deleted successfully' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting worker process:', error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
