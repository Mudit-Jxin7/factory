import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// PUT update a color
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id
    const colorData = await request.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('colors')

    // Check if another color with the same name exists
    if (colorData.name) {
      const existingColor = await collection.findOne({
        name: colorData.name,
        _id: { $ne: new ObjectId(id) }
      })
      if (existingColor) {
        return NextResponse.json(
          { success: false, error: 'Color name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...colorData,
      updatedAt: new Date(),
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Color updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating color:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE a color
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const id = resolvedParams.id

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('colors')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Color not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Color deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting color:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
