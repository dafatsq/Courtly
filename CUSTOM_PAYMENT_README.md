# Custom Payment Implementation

This implementation replaces Stripe with a custom payment page that accepts any input without validation.

## Changes Made

### 1. New Payment Page (`src/app/payment/page.tsx`)
- Custom payment form with credit card inputs (card number, name, expiry, CVV)
- Accepts any values without validation
- Shows booking summary with date, court, timeslots, and total amount
- Submits to custom API endpoint

### 2. New API Endpoint (`api/process_payment/`)
- **handler.go**: Processes "fake" payments
  - Accepts any card details without validation
  - Generates a random booking ID
  - Returns success immediately
  - No actual payment processing
- **main.go**: Entry point for serverless function

### 3. Updated Main Booking Page (`src/app/page.tsx`)
- Modified `onReserve` function to redirect to custom payment page instead of Stripe
- Passes booking details via URL parameters

### 4. Updated Success Page (`src/app/success/page.tsx`)
- Simplified to show booking confirmation
- Displays booking ID from URL parameter
- No longer validates Stripe session

## How It Works

1. User selects date, timeslots, and court on main page
2. Clicks "Reserve & Pay" button
3. Redirects to `/payment` page with booking details
4. User enters any credit card information (no validation)
5. Submits to `/api/process_payment`
6. API accepts any input and generates booking ID
7. Redirects to `/success` page with booking confirmation

## Testing

Users can now enter:
- Any card number (even "1234")
- Any name
- Any expiry date
- Any CVV

The system will accept all inputs and create a "booking" without any real payment processing.

## Note

This is a demo/test system only. Do NOT use in production as it:
- Does not validate card numbers
- Does not process real payments
- Does not store bookings in a database
- Does not reserve actual court slots
