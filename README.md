# Book My Court

Simple Badminton Reservation App — Next.js (App Router) + Go (Vercel serverless) + Firebase + Stripe.

## Features
- Select date, available timeslot, and available court.
- Stripe Checkout before confirming the booking.
- Firestore-backed reservation to prevent double bookings.

## Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Go 1.21 (Vercel Serverless Functions)
- Firebase Firestore (via Admin SDK)
- Stripe Checkout

## Getting Started (Local)
1. Copy env vars:
   - Copy `.env.example` to `.env.local` and fill in values.
2. Install Node deps:
   - `npm install`
3. Install Go deps:
   - `go mod tidy`
4. Run dev:
   - `npx vercel dev`

Note: Using Vercel CLI runs both Next.js and Go functions locally.

## Deploy
- Connect repo to Vercel, add environment variables in Vercel Project Settings.
- Deploy; Vercel will build Next.js and Go functions.

## Data Model
- Firestore collection: `reservations`
- Document fields:
  - `date` (string, YYYY-MM-DD)
  - `timeslotId` (string, e.g., "08:00-09:00")
  - `courtId` (string, e.g., "court-1")
  - `userEmail` (string)
  - `amount` (number, cents)
  - `status` (string: "paid")
  - `createdAt` (number, unix seconds)
  - `paymentRef` (string, Stripe session id)

## Notes
- Availability logic keeps it simple: static courts list, hourly slots 08:00–22:00.
- Courts availability is computed by querying existing reservations for a given date + timeslot.