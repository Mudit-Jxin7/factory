import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all lots
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('lots')
    const lots = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ success: true, lots })
  } catch (error: any) {
    console.error('Error fetching lots:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST save a lot
export async function POST(request: NextRequest) {
  try {
    const lotData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('lots')
    
    // Add timestamp
    lotData.createdAt = new Date()
    lotData.updatedAt = new Date()
    
    const result = await collection.insertOne(lotData)
    
    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        lotNumber: lotData.lotNumber
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error saving lot:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
