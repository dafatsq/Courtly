'use client';

import { useState } from 'react';
import { Court, TimeSlot } from '@/types';
import { FaCreditCard, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { createReservation, checkCourtAvailability } from '@/lib/firestore';

interface PaymentModalProps {
  court: Court;
  date: Date;
  timeSlots: TimeSlot[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess: (reservationId: string) => void;
  onCancel: () => void;
}

export default function PaymentModal({
  court,
  date,
  timeSlots,
  customerInfo,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const timeSlotIds = timeSlots.map((slot) => slot.id);

      // Check if court is still available
      const isAvailable = await checkCourtAvailability(court.id, dateStr, timeSlotIds);

      if (!isAvailable) {
        setError(
          'This court is no longer available for the selected time. Please choose another court or time slot.'
        );
        setLoading(false);
        return;
      }

      // Create reservation data
      const reservationData = {
        courtId: court.id,
        courtName: court.name,
        date: dateStr,
        timeSlots: timeSlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        totalPrice: court.pricePerHour * timeSlots.length,
      };

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save reservation to Firestore
      const reservationId = await createReservation(reservationData);

      onSuccess(reservationId);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300"
            disabled={loading}
          >
            <FaTimes size={24} />
          </button>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2 text-white">Booking Summary</h3>
          <div className="space-y-1 text-sm text-gray-300">
            <p>
              <span className="font-medium text-white">Court:</span> {court.name}
            </p>
            <p>
              <span className="font-medium text-white">Date:</span> {format(date, 'MMM dd, yyyy')}
            </p>
            <p>
              <span className="font-medium text-white">Time Slots:</span>{' '}
              {timeSlots.map((slot) => `${slot.startTime} - ${slot.endTime}`).join(', ')}
            </p>
            <p>
              <span className="font-medium text-white">Duration:</span> {timeSlots.length} hour
              {timeSlots.length > 1 ? 's' : ''}
            </p>
            <p>
              <span className="font-medium text-white">Name:</span> {customerInfo.name}
            </p>
            <div className="pt-2 border-t border-gray-600 mt-2">
              <p className="text-lg font-bold text-primary-400">
                Total: Rp {(court.pricePerHour * timeSlots.length).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border-2 border-gray-600 rounded-lg cursor-pointer hover:border-primary-400 bg-gray-700">
              <input
                type="radio"
                name="payment"
                value="mock"
                checked={true}
                readOnly
                className="mr-3"
              />
              <div>
                <div className="font-medium text-white">Mock Payment</div>
                <div className="text-sm text-gray-400">Demo payment (for testing)</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <FaCreditCard className="mr-2" />
                Pay Rp {(court.pricePerHour * timeSlots.length).toLocaleString('id-ID')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
