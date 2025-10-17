export interface Court {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Reservation {
  id?: string;
  courtId: string;
  courtName: string;
  date: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentIntentId?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
