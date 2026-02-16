import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all patterns
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('patterns')
    const patterns = await collection.find({}).sort({ name: 1 }).toArray()

    return NextResponse.json({ success: true, patterns })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching patterns:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST create a new pattern
export async function POST(request: NextRequest) {
  try {
    const patternData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('patterns')

    const existingPattern = await collection.findOne({ name: patternData.name })
    if (existingPattern) {
      return NextResponse.json(
        { success: false, error: 'Pattern already exists' },
        { status: 400 }
      )
    }

    patternData.createdAt = new Date()
    patternData.updatedAt = new Date()

    const result = await collection.insertOne(patternData)

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        pattern: patternData,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating pattern:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
