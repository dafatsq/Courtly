"use client"
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

function SuccessInner() {
  const sp = useSearchParams()
  const bookingId = sp.get('bookingId')

  return (
    <main className="space-y-4">
      <h2 className="text-2xl font-semibold">Payment Success</h2>
      <div className="text-green-700">
        Reservation confirmed! 
        {bookingId && <div className="mt-2">Booking ID: <span className="font-mono font-bold">{bookingId}</span></div>}
      </div>
      <p className="text-gray-600">Your court has been successfully booked.</p>
      <a href="/" className="text-brand underline">Back to home</a>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="space-y-4"><h2 className="text-2xl font-semibold">Payment Success</h2><div>Loading…</div></main>}>
      <SuccessInner />
    </Suspense>
  )
}
