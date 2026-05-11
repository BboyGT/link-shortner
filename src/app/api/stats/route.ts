import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const totalLinks = await db.link.count()
    const totalClicks = await db.link.aggregate({ _sum: { clicks: true } })
    const activeLinks = await db.link.count({ where: { isActive: true } })
    const expiredLinks = await db.link.count({
      where: { expiresAt: { lte: new Date() } },
    })

    // Clicks over last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentClicks = await db.clickEvent.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // Clicks by day for last 7 days
    const clicksByDay = await db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE(createdAt) as day, COUNT(*) as count
      FROM ClickEvent
      WHERE createdAt >= ${sevenDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
    `

    // Top links by clicks
    const topLinks = await db.link.findMany({
      orderBy: { clicks: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      totalLinks,
      totalClicks: totalClicks._sum.clicks || 0,
      activeLinks,
      expiredLinks,
      recentClicks,
      clicksByDay: clicksByDay.map((d) => ({
        day: d.day,
        count: Number(d.count),
      })),
      topLinks,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
