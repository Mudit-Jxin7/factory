import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all fabrics
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('fabrics')
    const fabrics = await collection.find({}).sort({ name: 1 }).toArray()

    return NextResponse.json({ success: true, fabrics })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching fabrics:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST create a new fabric
export async function POST(request: NextRequest) {
  try {
    const fabricData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('fabrics')

    const existingFabric = await collection.findOne({ name: fabricData.name })
    if (existingFabric) {
      return NextResponse.json(
        { success: false, error: 'Fabric already exists' },
        { status: 400 }
      )
    }

    fabricData.createdAt = new Date()
    fabricData.updatedAt = new Date()

    const result = await collection.insertOne(fabricData)

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        fabric: fabricData,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating fabric:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
