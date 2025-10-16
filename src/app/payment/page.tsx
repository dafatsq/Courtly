"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PaymentForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  
  // Form fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  
  // Booking details from URL params
  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    timeslots: [] as string[],
    courtId: '',
    amount: 0
  })

  useEffect(() => {
    const date = searchParams.get('date') || ''
    const timeslots = searchParams.get('timeslots')?.split(',') || []
    const courtId = searchParams.get('courtId') || ''
    const amount = parseInt(searchParams.get('amount') || '0', 10)
    
    setBookingDetails({ date, timeslots, courtId, amount })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(undefined)

    // Simple validation - just check if fields are filled
    if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      // Send "payment" to backend
      const res = await fetch('/api/process_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: bookingDetails.date,
          timeslots: bookingDetails.timeslots,
          courtId: bookingDetails.courtId,
          amount: bookingDetails.amount,
          // Include card details (they won't be validated, just accepted)
          cardNumber,
          cardName,
          expiryMonth,
          expiryYear,
          cvv
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Redirect to success page with booking ID
        window.location.href = `/success?bookingId=${data.bookingId}`
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const amountFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(bookingDetails.amount)

  return (
    <main className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Payment Details</h1>
        
        {/* Booking Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Booking Summary</h2>
          <p className="text-sm text-gray-700">Date: {bookingDetails.date}</p>
          <p className="text-sm text-gray-700">Court: {bookingDetails.courtId}</p>
          <p className="text-sm text-gray-700">Time slots: {bookingDetails.timeslots.length}</p>
          <p className="text-lg font-bold mt-2">Total: {amountFormatted}</p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              id="cardName"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="expiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Month
              </label>
              <input
                id="expiryMonth"
                type="text"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                placeholder="MM"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Year
              </label>
              <input
                id="expiryYear"
                type="text"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                placeholder="YY"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                id="cvv"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 rounded text-white font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand hover:bg-brand-dark'
              }`}
            >
              {loading ? 'Processing...' : `Pay ${amountFormatted}`}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          This is a demo payment system. Any card number will be accepted.
        </p>
      </div>
    </main>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentForm />
    </Suspense>
  )
}
