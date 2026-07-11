import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

export async function PATCH(
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
      return NextResponse.json({ success: false, error: 'Job card not found' }, { status: 404 })
    }

    if (existingJobCard.status !== 'pending_approval') {
      return NextResponse.json(
        { success: false, error: 'Only job cards pending approval can be approved' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { lotNumber },
      { $set: { status: 'complete', updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Job card not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, lotNumber, message: 'Job card approved successfully' })
  } catch (error: any) {
    console.error('Error approving job card:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
