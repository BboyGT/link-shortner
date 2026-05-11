import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseUserAgent(ua: string) {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Safari/')) browser = 'Safari'
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) device = 'Mobile'
  else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet'

  return { browser, os, device }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const link = await db.link.findUnique({ where: { shortCode: code } })

    if (!link) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (!link.isActive) {
      return NextResponse.redirect(new URL('/?error=inactive', req.url))
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/?error=expired', req.url))
    }

    // Track click
    const ua = req.headers.get('user-agent') || ''
    const { browser, os, device } = parseUserAgent(ua)
    const referrer = req.headers.get('referer') || null

    await db.$transaction([
      db.clickEvent.create({
        data: {
          linkId: link.id,
          referrer,
          browser,
          os,
          device,
          country: 'Local',
        },
      }),
      db.link.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } },
      }),
    ])

    return NextResponse.redirect(link.originalUrl)
  } catch (error) {
    console.error('Error redirecting:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}
