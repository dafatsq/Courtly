import { NextRequest, NextResponse } from 'next/server'

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

    // Accept any card number - this is a demo!
    // Generate a booking ID
    const bookingId = `BK-${Math.floor(Math.random() * 100000000)}`

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // TODO: Save to Firebase/Firestore here
    // For now, just return success

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
