import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Court = { id: string; name: string }

function getCourts(): Court[] {
  return [
    { id: 'court-1', name: 'Court 1' },
    { id: 'court-2', name: 'Court 2' },
    { id: 'court-3', name: 'Court 3' },
    { id: 'court-4', name: 'Court 4' },
  ]
}

export async function GET() {
  // TODO: Add Firebase filtering logic here when needed
  const courts = getCourts()
  return NextResponse.json({ courts })
}
