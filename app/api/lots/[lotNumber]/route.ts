import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET a specific lot by lot number
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lotNumber: string }> | { lotNumber: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = 'then' in params ? await params : params
    // Decode URL-encoded lot number
    const lotNumber = decodeURIComponent(resolvedParams.lotNumber)
    console.log('Fetching lot with lotNumber:', lotNumber)
    
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('lots')
    
    // Try exact match first
    let lot = await collection.findOne({ lotNumber })
    
    // If not found, try case-insensitive search
    if (!lot) {
      lot = await collection.findOne({
        lotNumber: { $regex: new RegExp(`^${lotNumber}$`, 'i') }
      })
    }
    
    console.log('Lot found:', lot ? 'Yes' : 'No')
    
    if (!lot) {
      return NextResponse.json(
        { success: false, error: 'Lot not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, lot })
  } catch (error: any) {
    console.error('Error fetching lot:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
