import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// PUT update a worker
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id
    const workerData = await request.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('workers')

    const updateData = {
      ...workerData,
      updatedAt: new Date(),
    }

    // Don't allow updating worker_id
    delete updateData.worker_id

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Worker updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating worker:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE a worker
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('workers')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Worker deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting worker:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
