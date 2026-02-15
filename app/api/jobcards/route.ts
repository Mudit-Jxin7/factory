import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all job cards
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('jobcards')
    const jobCards = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ success: true, jobCards })
  } catch (error: any) {
    console.error('Error fetching job cards:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST create a new job card
export async function POST(request: NextRequest) {
  try {
    const jobCardData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('jobcards')
    
    // Add timestamp
    jobCardData.createdAt = new Date()
    jobCardData.updatedAt = new Date()
    
    const result = await collection.insertOne(jobCardData)
    
    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        lotNumber: jobCardData.lotNumber
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating job card:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
