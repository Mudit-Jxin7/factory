import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all colors
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('colors')
    const colors = await collection.find({}).sort({ name: 1 }).toArray()

    return NextResponse.json({ success: true, colors })
  } catch (error: any) {
    console.error('Error fetching colors:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST create a new color
export async function POST(request: NextRequest) {
  try {
    const colorData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('colors')

    // Check if color already exists
    const existingColor = await collection.findOne({ name: colorData.name })
    if (existingColor) {
      return NextResponse.json(
        { success: false, error: 'Color already exists' },
        { status: 400 }
      )
    }

    // Add timestamp
    colorData.createdAt = new Date()
    colorData.updatedAt = new Date()

    const result = await collection.insertOne(colorData)

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        color: colorData
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating color:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
