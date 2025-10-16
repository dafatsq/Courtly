"use client"
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
export const dynamic = 'force-dynamic'

type Timeslot = { id: string; label: string }
type Court = { id: string; name: string }

type ServerNow = { nowMs: number; tz: string; offsetMin: number }

function fmtDateYMDInTZ(ms: number, timeZone: string): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
}

function fmtDow(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(ms))
}

function fmtMonthDay(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(new Date(ms))
}

// Convert a venue-local date (YYYY-MM-DD) and time (HH:mm) into absolute ms using venue offset
function venueDateTimeToMs(dateYMD: string, hhmm: string, offsetMin: number): number {
  const [y, m, d] = dateYMD.split('-').map((v) => parseInt(v, 10))
  const [hh, mm] = hhmm.split(':').map((v) => parseInt(v, 10))
  // Create UTC ms, then subtract venue offset to get absolute instant
  const utcMs = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0)
  return utcMs - offsetMin * 60_000
}

export default function HomePage() {
  const [serverNow, setServerNow] = useState<ServerNow | null>(null)
  const [date, setDate] = useState<string>('')
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  // Fetch server time initially and then every minute
  useEffect(() => {
    let cancelled = false
    async function fetchNow() {
      try {
        const res = await fetch('/api/now', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }
        const text = await res.text()
        const data = JSON.parse(text)
        const nowMs = typeof data.nowUnixMs === 'number' ? data.nowUnixMs : Date.now()
        const tz = data.timezone || 'Asia/Jakarta'
        const offsetMin = typeof data.utcOffsetMinutes === 'number' ? data.utcOffsetMinutes : 420
        if (!cancelled) {
          setServerNow({ nowMs, tz, offsetMin })
          setError(undefined)
        }
      } catch (err) {
        console.error('Failed to fetch /api/now:', err)
        if (!cancelled) {
          // Fallback to local clock, assume Asia/Jakarta offset +420
          setServerNow({ nowMs: Date.now(), tz: 'Asia/Jakarta', offsetMin: 420 })
          setError(undefined) // Clear the error since we have a fallback
        }
      }
    }
    fetchNow()
    const id = setInterval(fetchNow, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Build next 14 venue days from server time
  const next14 = useMemo(() => {
    if (!serverNow) return [] as { value: string; ms: number }[]
    const baseDayStr = fmtDateYMDInTZ(serverNow.nowMs, serverNow.tz)
    const [y, m, d] = baseDayStr.split('-').map((v) => parseInt(v, 10))
    const baseMidnightMs = Date.UTC(y, (m || 1) - 1, d || 1) - serverNow.offsetMin * 60_000
    return Array.from({ length: 14 }).map((_, i) => {
      const dayMs = baseMidnightMs + i * 86_400_000
      const value = fmtDateYMDInTZ(dayMs, serverNow.tz)
      return { value, ms: dayMs }
    })
  }, [serverNow])

  // Initialize date to server 'today' and keep it inside the rolling window
  useEffect(() => {
    if (!serverNow || next14.length === 0) return
    if (!date) {
      setDate(next14[0].value)
      return
    }
    const inWindow = next14.some((d) => d.value === date)
    if (!inWindow) setDate(next14[0].value)
  }, [serverNow, next14])

  useEffect(() => {
    setSelectedTimeslots([])
    setSelectedCourt(undefined)
    setError(undefined)
    async function loadTimeslots() {
      setLoading(true)
      try {
        const res = await fetch(`/api/timeslots?date=${date}`)
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }
        const data = await res.json()
        setTimeslots(data.timeslots || [])
      } catch (e: any) {
        console.error('Failed to load timeslots:', e)
        setTimeslots([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    loadTimeslots()
  }, [date])

  useEffect(() => {
    if (selectedTimeslots.length === 0) return
    setSelectedCourt(undefined)
    setError(undefined)
    async function loadCourts() {
      setLoading(true)
      try {
        const res = await fetch(`/api/courts?date=${date}&timeslots=${encodeURIComponent(selectedTimeslots.join(','))}`)
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }
        const data = await res.json()
        setCourts(data.courts || [])
      } catch (e: any) {
        console.error('Failed to load courts:', e)
        setCourts([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }
    loadCourts()
  }, [date, selectedTimeslots])

  const canReserve = !!(date && selectedTimeslots.length > 0 && selectedCourt)
  const pricePerSlot = Number(process.env.NEXT_PUBLIC_PRICE_PER_SLOT || '50000')
  const total = selectedTimeslots.length * pricePerSlot
  const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)

  const onReserve = async () => {
    if (!canReserve) return
    setLoading(true)
    setError(undefined)
    try {
      // Redirect to custom payment page with booking details
      const params = new URLSearchParams({
        date,
        timeslots: selectedTimeslots.join(','),
        courtId: selectedCourt,
        amount: total.toString()
      })
      window.location.href = `/payment?${params.toString()}`
    } catch (e: any) {
      setError(e?.message || 'Failed to proceed to payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      )}
      <section>
        <h2 className="text-xl font-semibold mb-2">Select a date</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {next14.map((d) => {
            const value = d.value
            const isSelected = date === value
            return (
              <button
                key={value}
                className={`px-4 py-2 rounded border ${isSelected ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-gray-50'} `}
                onClick={() => setDate(value)}
              >
                <div className="text-sm">{serverNow ? fmtDow(d.ms, serverNow.tz) : ''}</div>
                <div className="font-medium">{serverNow ? fmtMonthDay(d.ms, serverNow.tz) : ''}</div>
              </button>
            )
          })}
        </div>
      </section>

      <section>
  <h2 className="text-xl font-semibold mb-2">Select time(s)</h2>
        {loading && timeslots.length === 0 ? (
          <div className="text-gray-500 text-sm">Loading timeslots…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {timeslots.map((t) => {
              // Disable past timeslots for today (server time + 30 minutes) in venue timezone
              let disabled = false
              if (serverNow) {
                const [startStr] = t.id.split('-') // 'HH:MM'
                const cutoffMs = serverNow.nowMs + 30 * 60_000
                const slotStartMs = venueDateTimeToMs(date, startStr, serverNow.offsetMin)
                // Only disable if the selected date equals server 'today' in venue TZ and slot is before cutoff
                const serverTodayStr = fmtDateYMDInTZ(serverNow.nowMs, serverNow.tz)
                if (date === serverTodayStr && slotStartMs < cutoffMs) {
                  disabled = true
                }
              }
              const selected = selectedTimeslots.includes(t.id)
              return (
              <button
                key={t.id}
                onClick={() => {
                  if (disabled) return
                  setSelectedTimeslots((prev) =>
                    prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                  )
                }}
                disabled={disabled}
                className={`px-3 py-2 rounded border text-sm ${
                  selected ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t.label}
              </button>
            )})}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Select a court</h2>
        {selectedTimeslots.length === 0 ? (
          <div className="text-gray-500 text-sm">Pick a time to see available courts</div>
        ) : loading && courts.length === 0 ? (
          <div className="text-gray-500 text-sm">Loading courts…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {courts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourt(c.id)}
                className={`px-3 py-2 rounded border text-sm ${selectedCourt === c.id ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-gray-50'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="pt-2">
        {selectedTimeslots.length > 0 && (
          <div className="mb-2 text-sm text-gray-700">Total ({selectedTimeslots.length} slot{selectedTimeslots.length>1?'s':''}): <span className="font-semibold">{totalFormatted}</span></div>
        )}
        <button
          disabled={!canReserve || loading}
          onClick={onReserve}
          className={`px-4 py-2 rounded text-white ${canReserve ? 'bg-brand hover:bg-brand-dark' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Processing…' : 'Reserve & Pay'}
        </button>
      </div>
    </main>
  )
}
