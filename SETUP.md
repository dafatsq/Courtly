# Quick Setup Guide

Follow these steps to get Courtly running locally:

## 1. Firebase Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enable **Firestore Database**:

   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location close to you

4. Get Web App Credentials:

   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click web icon (</>) to add a web app
   - Copy the firebaseConfig values

5. Get Service Account Key (for backend):

   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `backend/serviceAccountKey.json`

6. Set up Firestore data:
   - Go to Firestore Database
   - Create collection `courts`
   - Add 3 documents with this structure:
     ```json
     {
       "name": "Court 1",
       "description": "Premium wooden flooring, professional lighting",
       "pricePerHour": 25,
       "active": true
     }
     ```
   - Repeat for Court 2 ($20) and Court 3 ($30)

## 2. Frontend Setup (2 minutes)

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local and add your Firebase config values:
# - Open .env.local in your editor
# - Paste values from Firebase console
# - Save the file
```

## 3. Backend Setup (2 minutes)

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env and add:
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json

# Install Go dependencies
go mod download
```

## 4. Run the Application

### Terminal 1 - Backend:

```bash
cd backend
go run main.go
```

You should see: `Server starting on port 8080`

### Terminal 2 - Frontend:

```bash
npm run dev
```

You should see: `Ready on http://localhost:3000`

## 5. Test the Application

1. Open browser to `http://localhost:3000`
2. You should see the Courtly interface
3. Try making a booking:
   - Select today's date
   - Choose a time slot
   - Select a court
   - Fill in your details
   - Click "Proceed to Payment"
   - Use "Mock Payment" for testing
   - You should see a success confirmation!

## 6. Verify in Firestore

1. Go to Firebase Console > Firestore
2. You should see a new `reservations` collection
3. Your test booking should be there!

## Troubleshooting

### Frontend won't start:

- Make sure you ran `npm install`
- Check that `.env.local` has all values filled in
- Try `rm -rf .next` and restart

### Backend won't start:

- Make sure `serviceAccountKey.json` is in the backend folder
- Check that `.env` has correct values
- Try `go mod tidy` then `go run main.go`

### "Court not available" error:

- This means a court is already booked for that time
- Try a different time slot or date
- Or check Firestore and delete test reservations

### API connection error:

- Make sure backend is running on port 8080
- Check that `NEXT_PUBLIC_API_URL=http://localhost:8080` in `.env.local`
- Try refreshing the browser

## Next Steps

- Deploy frontend to Vercel: `vercel`
- Deploy backend to Cloud Run (see README.md)
- Customize courts and pricing
- Add more features!

## Need Help?

Check the detailed README.md for more information or create an issue on GitHub.

Happy booking! 🏸
