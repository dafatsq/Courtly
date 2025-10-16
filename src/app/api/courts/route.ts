import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

type Court = { id: string; name: string }

function getAllCourts(): Court[] {
  return [
    { id: 'court-1', name: 'Court 1' },
    { id: 'court-2', name: 'Court 2' },
    { id: 'court-3', name: 'Court 3' },
    { id: 'court-4', name: 'Court 4' },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const timeslotsParam = searchParams.get('timeslots')
    
    const allCourts = getAllCourts()
    
    // If no date or timeslots, return all courts
    if (!date || !timeslotsParam) {
      return NextResponse.json({ courts: allCourts })
    }
    
    const timeslots = timeslotsParam.split(',').map(t => t.trim()).filter(Boolean)
    
    if (timeslots.length === 0) {
      return NextResponse.json({ courts: allCourts })
    }
    
    // Query Firebase to find occupied courts
    const occupied = new Set<string>()
    
    for (const timeslot of timeslots) {
      const snapshot = await db
        .collection('reservations')
        .where('date', '==', date)
        .where('timeslotId', '==', timeslot)
        .get()
      
      snapshot.forEach(doc => {
        const data = doc.data()
        if (data.courtId) {
          occupied.add(data.courtId)
        }
      })
    }
    
    // Filter out occupied courts
    const availableCourts = allCourts.filter(court => !occupied.has(court.id))
    
    return NextResponse.json({ courts: availableCourts })
  } catch (error) {
    console.error('Error fetching courts:', error)
    // Return all courts on error as fallback
    return NextResponse.json({ courts: getAllCourts() })
  }
}
