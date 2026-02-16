import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// PUT update a fabric
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id
    const fabricData = await request.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('fabrics')

    if (fabricData.name) {
      const existingFabric = await collection.findOne({
        name: fabricData.name,
        _id: { $ne: new ObjectId(id) },
      })
      if (existingFabric) {
        return NextResponse.json(
          { success: false, error: 'Fabric name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...fabricData,
      updatedAt: new Date(),
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Fabric updated successfully',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating fabric:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE a fabric
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('fabrics')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Fabric not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Fabric deleted successfully',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting fabric:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
