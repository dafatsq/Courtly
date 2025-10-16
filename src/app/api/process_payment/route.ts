import { NextRequest, NextResponse } from 'next/server'
import { db, type Reservation } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

type PaymentRequest = {
  date: string
  timeslots: string[]
  courtId: string
  amount: number
  cardNumber: string
  cardName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()

    // Basic validation
    if (!body.date || !body.timeslots || body.timeslots.length === 0 || !body.courtId) {
      return NextResponse.json(
        { success: false, error: 'Missing booking details' },
        { status: 400 }
      )
    }

    if (!body.cardNumber || !body.cardName || !body.expiryMonth || !body.expiryYear || !body.cvv) {
      return NextResponse.json(
        { success: false, error: 'Missing card details' },
        { status: 400 }
      )
    }

    // Check if any timeslot is already reserved
    for (const timeslot of body.timeslots) {
      const snapshot = await db
        .collection('reservations')
        .where('date', '==', body.date)
        .where('timeslotId', '==', timeslot)
        .where('courtId', '==', body.courtId)
        .get()
      
      if (!snapshot.empty) {
        return NextResponse.json(
          { success: false, error: 'One or more selected slots already reserved' },
          { status: 400 }
        )
      }
    }

    // Generate a booking ID
    const bookingId = `BK-${Math.floor(Math.random() * 100000000)}`

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Save each timeslot reservation to Firebase
    const batch = db.batch()
    const now = Date.now()
    
    for (const timeslot of body.timeslots) {
      const reservation: Reservation = {
        date: body.date,
        timeslotId: timeslot,
        courtId: body.courtId,
        amount: body.amount,
        status: 'paid',
        createdAt: now,
        paymentRef: bookingId,
      }
      
      const docRef = db.collection('reservations').doc()
      batch.set(docRef, reservation)
    }
    
    await batch.commit()
    
    console.log(`Saved reservations for booking ${bookingId}: ${body.date} | ${body.timeslots.join(', ')} | ${body.courtId}`)

    return NextResponse.json({
      success: true,
      bookingId,
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
