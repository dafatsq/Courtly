# 🏸 Courtly - Badminton Court Reservation System

A modern, full-stack badminton court reservation application built with **Next.js**, **Golang**, **Firebase/Firestore**, and deployed on **Vercel** and **Google Cloud Run**.

## ✨ Features

- 📅 **Smart Date Selection**: Choose from next 7 days with auto-refresh at midnight
- ⏰ **Intelligent Time Slots**: View available slots (8 AM - 8 PM) with automatic disabling of past times
- 🕐 **Real-Time Clock**: Live date/time display with timezone information
- 🔒 **Past Time Prevention**: Automatically disables booking slots that have passed
- 🏟️ **Court Selection**: Choose from multiple courts with different pricing
- ✅ **Instant Confirmation**: Real-time booking confirmation
- 📱 **Responsive Design**: Beautiful UI with Tailwind CSS
- 🔥 **Real-time Updates**: Firebase Firestore for live data & automatic date/time shifts
- 🚀 **Fast & Scalable**: Deployed on Vercel (frontend) and Cloud Run (backend)

## 🏗️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **HTTP Client**: Axios
- **Date Handling**: date-fns

### Backend

- **Language**: Golang
- **Framework**: Gin
- **Database**: Cloud Firestore
- **Authentication**: Firebase Admin SDK
- **CORS**: gin-contrib/cors

### Infrastructure

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Google Cloud Run
- **Database**: Firebase Firestore
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
Courtly/
├── app/                          # Next.js app directory
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── BookingPage.tsx          # Main booking flow
│   ├── DateSelector.tsx         # Date picker component
│   ├── TimeSlotSelector.tsx     # Time slot picker
│   ├── CourtSelector.tsx        # Court selection
│   ├── CustomerForm.tsx         # Customer information form
│   └── PaymentModal.tsx         # Payment processing
├── lib/                         # Utility libraries
│   └── firebase.ts              # Firebase configuration
├── types/                       # TypeScript type definitions
│   └── index.ts                 # Shared types
├── backend/                     # Golang backend
│   ├── config/                  # Configuration files
│   │   └── firebase.go          # Firebase setup
│   ├── handlers/                # HTTP request handlers
│   │   └── handlers.go          # API handlers
│   ├── models/                  # Data models
│   │   └── models.go            # Struct definitions
│   ├── routes/                  # API routes
│   │   └── routes.go            # Route definitions
│   ├── main.go                  # Entry point
│   ├── go.mod                   # Go dependencies
│   ├── Dockerfile               # Docker configuration
│   └── .env.example             # Environment variables template
├── .github/
│   └── workflows/
│       └── deploy-backend.yml   # GitHub Actions workflow
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── next.config.mjs              # Next.js configuration
├── vercel.json                  # Vercel deployment config
├── FIRESTORE_SCHEMA.md          # Database schema documentation
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Go 1.21+
- Firebase project
- Vercel account (for frontend deployment)
- Google Cloud Platform account (for backend deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/courtly.git
cd courtly
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Create a web app and get your Firebase configuration
4. Download the service account key JSON file for backend
5. Set up Firestore security rules and initial data (see `FIRESTORE_SCHEMA.md`)

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your Firebase and API credentials
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ... etc

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json

# Download Go dependencies
go mod download

# Run the server
go run main.go
```

The backend API will be available at `http://localhost:8080`

## 📊 Database Schema

See [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) for detailed information about:

- Collection structures
- Field descriptions
- Required indexes
- Security rules
- Sample data

## 🔑 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (.env)

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
PORT=8080
```

## 🌐 API Endpoints

| Method | Endpoint                                            | Description              |
| ------ | --------------------------------------------------- | ------------------------ |
| GET    | `/api/health`                                       | Health check             |
| GET    | `/api/timeslots?date=YYYY-MM-DD`                    | Get available time slots |
| GET    | `/api/courts`                                       | Get all courts           |
| GET    | `/api/courts/available?date=YYYY-MM-DD&timeslot=ID` | Get available courts     |
| POST   | `/api/reservations`                                 | Create a reservation     |
| GET    | `/api/reservations/:id`                             | Get reservation details  |

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Backend (Google Cloud Run)

1. Set up GitHub secrets:

   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (service account key)
   - `FIREBASE_PROJECT_ID`

2. Push to main branch - GitHub Actions will automatically deploy

Or manually:

```bash
cd backend

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/courtly-api .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/courtly-api

# Deploy to Cloud Run
gcloud run deploy courtly-api \
  --image gcr.io/YOUR_PROJECT_ID/courtly-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🧪 Testing

### Test the Booking Flow

1. Select a date from the next 7 days
2. Choose an available time slot
3. Select a court
4. Fill in customer details
5. Complete payment
6. View confirmation with reservation ID

## 📝 Features Completed

- ✅ Date selection
- ✅ Time slot selection based on selected date
- ✅ Court selection based on date & time slot
- ✅ Customer information form with validation
- ✅ Successful reservation confirmation
- ✅ Real-time availability checking
- ✅ Responsive, beautiful UI
- ✅ Backend API with Golang
- ✅ Firestore database integration
- ✅ Deployment configuration
- ✅ Complete documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for the backend infrastructure
- Tailwind CSS for styling utilities

---

Made with ❤️ for DIRO App Technical Test
