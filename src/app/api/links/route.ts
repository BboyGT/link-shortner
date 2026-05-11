import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 7)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { originalUrl, shortCode, title, expiresAt } = body

    if (!originalUrl) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 })
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(originalUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Generate or validate short code
    let code = shortCode?.trim() || nanoid()

    if (code.length < 3) {
      return NextResponse.json({ error: 'Short code must be at least 3 characters' }, { status: 400 })
    }

    // Check if short code already exists
    const existing = await db.link.findUnique({ where: { shortCode: code } })
    if (existing) {
      return NextResponse.json({ error: 'This short code is already taken' }, { status: 409 })
    }

    const link = await db.link.create({
      data: {
        originalUrl: parsedUrl.toString(),
        shortCode: code,
        title: title || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { originalUrl: { contains: search } },
            { shortCode: { contains: search } },
          ],
        }
      : {}

    const [links, total] = await Promise.all([
      db.link.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.link.count({ where }),
    ])

    return NextResponse.json({
      links,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
  }
}
