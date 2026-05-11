import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7')

    const link = await db.link.findUnique({ where: { id } })
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const since = new Date()
    since.setDate(since.getDate() - days)

    const clickEvents = await db.clickEvent.findMany({
      where: { linkId: id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    })

    // Aggregate stats
    const clicksByDay = await db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE(createdAt) as day, COUNT(*) as count
      FROM ClickEvent
      WHERE linkId = ${id} AND createdAt >= ${since}
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
    `

    const referrers = await db.$queryRaw<Array<{ referrer: string; count: bigint }>>`
      SELECT referrer, COUNT(*) as count
      FROM ClickEvent
      WHERE linkId = ${id} AND createdAt >= ${since}
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `

    const browsers = await db.$queryRaw<Array<{ browser: string; count: bigint }>>`
      SELECT browser, COUNT(*) as count
      FROM ClickEvent
      WHERE linkId = ${id} AND createdAt >= ${since}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `

    const devices = await db.$queryRaw<Array<{ device: string; count: bigint }>>`
      SELECT device, COUNT(*) as count
      FROM ClickEvent
      WHERE linkId = ${id} AND createdAt >= ${since}
      GROUP BY device
      ORDER BY count DESC
      LIMIT 10
    `

    const countries = await db.$queryRaw<Array<{ country: string; count: bigint }>>`
      SELECT country, COUNT(*) as count
      FROM ClickEvent
      WHERE linkId = ${id} AND createdAt >= ${since}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `

    return NextResponse.json({
      link,
      totalClicks: link.clicks,
      periodClicks: clickEvents.length,
      clicksByDay: clicksByDay.map((d) => ({
        day: d.day,
        count: Number(d.count),
      })),
      referrers: referrers.map((r) => ({
        referrer: r.referrer || 'Direct',
        count: Number(r.count),
      })),
      browsers: browsers.map((b) => ({
        browser: b.browser || 'Unknown',
        count: Number(b.count),
      })),
      devices: devices.map((d) => ({
        device: d.device || 'Unknown',
        count: Number(d.count),
      })),
      countries: countries.map((c) => ({
        country: c.country || 'Unknown',
        count: Number(c.count),
      })),
      recentClicks: clickEvents.slice(0, 20),
    })
  } catch (error) {
    console.error('Error fetching link stats:', error)
    return NextResponse.json({ error: 'Failed to fetch link stats' }, { status: 500 })
  }
}
