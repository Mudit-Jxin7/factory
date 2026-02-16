import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.DB_NAME || 'factory_db'

// GET all brands
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('brands')
    const brands = await collection.find({}).sort({ name: 1 }).toArray()

    return NextResponse.json({ success: true, brands })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST create a new brand
export async function POST(request: NextRequest) {
  try {
    const brandData = await request.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection('brands')

    const existingBrand = await collection.findOne({ name: brandData.name })
    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand already exists' },
        { status: 400 }
      )
    }

    brandData.createdAt = new Date()
    brandData.updatedAt = new Date()

    const result = await collection.insertOne(brandData)

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId,
        brand: brandData,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
