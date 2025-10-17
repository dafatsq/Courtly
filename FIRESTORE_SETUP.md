# 🔥 Firebase/Firestore Setup Instructions

## Step 1: Configure Firestore Security Rules

You need to update your Firestore security rules to allow the app to create reservations.

### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **courtly-f91eb**
3. Click on **Firestore Database** in the left menu
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Courts collection - read only for all users
    match /courts/{courtId} {
      allow read: if true;
      allow write: if false;
    }

    // Reservations collection - allow read and create for all users
    match /reservations/{reservationId} {
      allow read: if true;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }

    // Time slots collection - read only
    match /timeslots/{timeslotId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

6. Click **Publish**

### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Step 2: Verify Your Firestore Database

Make sure your Firestore database is created:

1. In Firebase Console, go to **Firestore Database**
2. If you see "Create database", click it
3. Choose **Start in production mode** (we'll use custom rules)
4. Select your preferred location (e.g., `us-central`)
5. Click **Enable**

## Step 3: Test the Application

1. Open your app at http://localhost:3000
2. Make a test reservation:
   - Select a date
   - Choose a time slot
   - Select a court
   - Fill in customer details
   - Complete payment
3. Check Firebase Console → Firestore Database to see your reservation saved!

## Step 4: (Optional) Add Sample Courts Data

To have courts data in Firestore instead of hardcoded:

1. Go to Firestore Database
2. Click **Start collection**
3. Collection ID: `courts`
4. Add documents with this structure:

```json
{
  "name": "Court 1",
  "description": "Premium wooden flooring, professional lighting",
  "pricePerHour": 100000,
  "active": true
}
```

Repeat for all courts (Court 1, Court 2, Court 3, Court 4)

## Troubleshooting

### "Missing or insufficient permissions" Error

This means your Firestore rules are too restrictive. Make sure you've:

- ✅ Published the new security rules
- ✅ Waited a few seconds for rules to propagate
- ✅ Refreshed your browser

### Database Not Created

- Go to Firebase Console → Firestore Database
- Click "Create database" if you haven't already
- Follow the setup wizard

### Rules Not Working

- Check that you clicked "Publish" in the Rules tab
- Rules take a few seconds to deploy
- Try refreshing your app and testing again

## Security Notes

These rules allow anyone to:

- ✅ Read all data (courts, reservations)
- ✅ Create new reservations
- ❌ Update or delete existing reservations
- ❌ Modify courts data

For production, you should add authentication and more restrictive rules based on user authentication.

## Next Steps

Once working:

1. Test creating multiple reservations
2. Verify that booked courts show as "BOOKED"
3. Try booking different time slots
4. Check that the same court can't be double-booked

🎉 Your Firestore integration should now be fully functional!
