import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tz = process.env.TIME_ZONE || 'Asia/Jakarta'
  const now = new Date()
  
  // Calculate timezone offset
  const localeString = now.toLocaleString('en-US', { timeZone: tz })
  const localDate = new Date(localeString)
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const offsetMinutes = Math.round((localDate.getTime() - utcDate.getTime()) / (1000 * 60))
  
  return NextResponse.json({
    nowUnixMs: now.getTime(),
    nowISO: now.toISOString(),
    timezone: tz,
    utcOffsetMinutes: offsetMinutes,
  })
}
