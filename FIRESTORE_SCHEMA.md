# Firestore Database Structure

## Collections

### 1. courts

Stores information about badminton courts.

```json
{
  "id": "auto-generated",
  "name": "Court 1",
  "description": "Premium wooden flooring, professional lighting",
  "pricePerHour": 25.0,
  "active": true
}
```

**Fields:**

- `name` (string): Name of the court
- `description` (string): Description of court features
- `pricePerHour` (number): Hourly rental price
- `active` (boolean): Whether the court is available for booking

### 2. reservations

Stores booking information.

```json
{
  "id": "auto-generated",
  "courtId": "1",
  "courtName": "Court 1",
  "date": "2025-10-20",
  "timeSlotId": "5",
  "startTime": "14:00",
  "endTime": "15:00",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "totalPrice": 25.0,
  "paymentStatus": "completed",
  "paymentIntentId": "pi_xxx",
  "createdAt": "2025-10-17T10:30:00Z"
}
```

**Fields:**

- `courtId` (string): Reference to court
- `courtName` (string): Name of the court (denormalized)
- `date` (string): Reservation date (YYYY-MM-DD)
- `timeSlotId` (string): ID of the time slot
- `startTime` (string): Start time (HH:MM)
- `endTime` (string): End time (HH:MM)
- `customerName` (string): Customer's full name
- `customerEmail` (string): Customer's email
- `customerPhone` (string): Customer's phone number
- `totalPrice` (number): Total payment amount
- `paymentStatus` (string): Payment status (pending/completed/failed)
- `createdAt` (timestamp): When the reservation was created

## Indexes

For optimal query performance, create the following composite indexes in Firestore:

1. **reservations collection**:

   - Fields: `date` (Ascending), `timeSlotId` (Ascending), `courtId` (Ascending)
   - Query scope: Collection

2. **reservations collection** (for availability checks):
   - Fields: `date` (Ascending), `timeSlotId` (Ascending)
   - Query scope: Collection

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Courts collection - read-only for clients
    match /courts/{courtId} {
      allow read: if true;
      allow write: if false; // Only admin can modify
    }

    // Reservations collection
    match /reservations/{reservationId} {
      allow read: if true;
      allow create: if request.resource.data.customerEmail != null
                    && request.resource.data.customerName != null
                    && request.resource.data.date != null;
      allow update, delete: if false; // Prevent modifications
    }
  }
}
```

## Initial Data Setup

To populate your Firestore database with initial data, use the Firebase Console or the following approach:

### Using Firebase Console:

1. Go to Firebase Console > Firestore Database
2. Create a collection named `courts`
3. Add documents with the structure shown above

### Sample Courts Data:

```json
[
  {
    "name": "Court 1",
    "description": "Premium wooden flooring, professional lighting",
    "pricePerHour": 25,
    "active": true
  },
  {
    "name": "Court 2",
    "description": "Standard court with good ventilation",
    "pricePerHour": 20,
    "active": true
  },
  {
    "name": "Court 3",
    "description": "Competition-ready court with gallery seating",
    "pricePerHour": 30,
    "active": true
  }
]
```
