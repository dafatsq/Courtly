import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Timeslot = { id: string; label: string }

function generateTimeslots(): Timeslot[] {
  const slots: Timeslot[] = []
  for (let h = 8; h < 22; h++) {
    const id = `${h.toString().padStart(2, '0')}:00-${(h + 1).toString().padStart(2, '0')}:00`
    const label = `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`
    slots.push({ id, label })
  }
  return slots
}

export async function GET() {
  const timeslots = generateTimeslots()
  return NextResponse.json({ timeslots })
}
