import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function initFirebase() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID not set')
    }

    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson)
      initializeApp({
        credential: cert(credentials),
        projectId,
      })
    } else {
      initializeApp({ projectId })
    }
  }
  return getFirestore()
}

export const db = initFirebase()

export type Reservation = {
  date: string
  timeslotId: string
  courtId: string
  userEmail?: string
  amount: number
  status: string
  createdAt: number
  paymentRef: string
}
