import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface ReservationData {
  courtId: string;
  courtName: string;
  date: string;
  timeSlots: {
    id: string;
    startTime: string;
    endTime: string;
  }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: Timestamp;
}

/**
 * Create a new reservation in Firestore
 */
export async function createReservation(
  reservationData: Omit<ReservationData, 'createdAt' | 'paymentStatus'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'reservations'), {
      ...reservationData,
      paymentStatus: 'completed',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

/**
 * Check if a court is available for specific date and time slots
 */
export async function checkCourtAvailability(
  courtId: string,
  date: string,
  timeSlotIds: string[]
): Promise<boolean> {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, where('courtId', '==', courtId), where('date', '==', date));

    const querySnapshot = await getDocs(q);

    // Check if any of the requested time slots overlap with existing reservations
    for (const doc of querySnapshot.docs) {
      const reservation = doc.data();
      const bookedTimeSlotIds = reservation.timeSlots.map((slot: any) => slot.id);

      // Check if there's any overlap between requested and booked time slots
      const hasOverlap = timeSlotIds.some((id) => bookedTimeSlotIds.includes(id));
      if (hasOverlap) {
        return false; // Court is not available
      }
    }

    return true; // Court is available
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

/**
 * Get all reserved court IDs for a specific date and time slots
 */
export async function getReservedCourts(date: string, timeSlotIds: string[]): Promise<string[]> {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(reservationsRef, where('date', '==', date));

    const querySnapshot = await getDocs(q);
    const reservedCourtIds = new Set<string>();

    querySnapshot.forEach((doc) => {
      const reservation = doc.data();
      const bookedTimeSlotIds = reservation.timeSlots.map((slot: any) => slot.id);

      // Check if any of the requested time slots are already booked
      const hasOverlap = timeSlotIds.some((id) => bookedTimeSlotIds.includes(id));
      if (hasOverlap) {
        reservedCourtIds.add(reservation.courtId);
      }
    });

    return Array.from(reservedCourtIds);
  } catch (error) {
    console.error('Error getting reserved courts:', error);
    throw error;
  }
}
