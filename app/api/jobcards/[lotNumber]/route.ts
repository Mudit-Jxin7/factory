import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET a specific job card by lot number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lotNumber: string }> | { lotNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const lotNumber = decodeURIComponent(resolvedParams.lotNumber)
    
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('jobcards')
    
    let jobCard = await collection.findOne({ lotNumber })
    
    if (!jobCard) {
      jobCard = await collection.findOne({
        lotNumber: { $regex: new RegExp(`^${lotNumber}$`, 'i') }
      })
    }
    
    if (!jobCard) {
      return NextResponse.json(
        { success: false, error: 'Job card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, jobCard })
  } catch (error: any) {
    console.error('Error fetching job card:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT update a job card by lot number
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lotNumber: string }> | { lotNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const lotNumber = decodeURIComponent(resolvedParams.lotNumber)
    const jobCardData = await request.json()
    
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('jobcards')
    
    const existingJobCard = await collection.findOne({ lotNumber })
    
    if (!existingJobCard) {
      return NextResponse.json(
        { success: false, error: 'Job card not found' },
        { status: 404 }
      )
    }
    
    const updateData = {
      ...jobCardData,
      lotNumber,
      createdAt: existingJobCard.createdAt,
      updatedAt: new Date(),
    }
    
    const result = await collection.updateOne(
      { lotNumber },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Job card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lotNumber,
      message: 'Job card updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating job card:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE a job card by lot number
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lotNumber: string }> | { lotNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params
    const lotNumber = decodeURIComponent(resolvedParams.lotNumber)
    
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('jobcards')
    
    const existingJobCard = await collection.findOne({ lotNumber })
    
    if (!existingJobCard) {
      return NextResponse.json(
        { success: false, error: 'Job card not found' },
        { status: 404 }
      )
    }
    
    const result = await collection.deleteOne({ lotNumber })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Job card not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      lotNumber,
      message: 'Job card deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting job card:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
