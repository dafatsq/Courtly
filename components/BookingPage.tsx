'use client';

import { useState } from 'react';
import DateSelector from './DateSelector';
import TimeSlotSelector from './TimeSlotSelector';
import CourtSelector from './CourtSelector';
import CustomerForm from './CustomerForm';
import PaymentModal from './PaymentModal';
import { Court, TimeSlot, Reservation } from '@/types';
import { FaCheckCircle } from 'react-icons/fa';
import CurrentDateTime from './CurrentDateTime';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [reservationId, setReservationId] = useState<string>('');

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlots([]);
    setSelectedCourt(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlots((prev) => {
      const isSelected = prev.some((s) => s.id === slot.id);
      if (isSelected) {
        // Remove if already selected
        return prev.filter((s) => s.id !== slot.id);
      } else {
        // Add and sort by start time
        return [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
    });
    setSelectedCourt(null);
  };

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
  };

  const handleCustomerSubmit = (info: { name: string; email: string; phone: string }) => {
    setCustomerInfo(info);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (resId: string) => {
    setReservationId(resId);
    setReservationComplete(true);
    setShowPayment(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setSelectedCourt(null);
    setSelectedTimeSlots([]);
    setCustomerInfo(null);
    setShowPayment(false);
    setReservationComplete(false);
    setReservationId('');
  };

  if (reservationComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <FaCheckCircle className="text-green-400 text-6xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Reservation Successful! 🎉</h1>
            <p className="text-gray-300 mb-6">Your booking has been confirmed.</p>

            <div className="bg-gray-700 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-lg mb-4 text-white">Booking Details:</h2>
              <div className="space-y-2 text-gray-300">
                <p>
                  <span className="font-medium text-white">Reservation ID:</span> {reservationId}
                </p>
                <p>
                  <span className="font-medium text-white">Court:</span> {selectedCourt?.name}
                </p>
                <p>
                  <span className="font-medium text-white">Date:</span>{' '}
                  {selectedDate?.toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium text-white">Time Slots:</span>{' '}
                  {selectedTimeSlots
                    .map((slot) => `${slot.startTime} - ${slot.endTime}`)
                    .join(', ')}
                </p>
                <p>
                  <span className="font-medium text-white">Duration:</span>{' '}
                  {selectedTimeSlots.length} hour{selectedTimeSlots.length > 1 ? 's' : ''}
                </p>
                <p>
                  <span className="font-medium text-white">Name:</span> {customerInfo?.name}
                </p>
                <p>
                  <span className="font-medium text-white">Email:</span> {customerInfo?.email}
                </p>
                <p>
                  <span className="font-medium text-white">Total:</span> Rp{' '}
                  {((selectedCourt?.pricePerHour || 0) * selectedTimeSlots.length).toLocaleString(
                    'id-ID'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={resetBooking}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Make Another Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">🏸 Courtly</h1>
        <p className="text-center text-gray-300 mb-4">
          Reserve your badminton court in just a few clicks
        </p>

        {/* Current Date & Time Display */}
        <CurrentDateTime />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1: Date Selection */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-[600px] transition-all duration-300">
            <div className="flex items-center mb-4 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                1
              </div>
              <h2 className="text-xl font-semibold text-white">Select Date</h2>
            </div>
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              <DateSelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />
            </div>
          </div>

          {/* Step 2: Time Slot Selection */}
          <div
            className={`bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col transition-all duration-300 ${
              selectedDate ? 'h-[600px]' : 'h-[120px]'
            }`}
          >
            <div className="flex items-center mb-4 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                  selectedDate ? 'bg-primary-600 text-white' : 'bg-gray-600 text-gray-400'
                }`}
              >
                2
              </div>
              <h2 className="text-xl font-semibold text-white">Select Time</h2>
            </div>
            {selectedDate && (
              <div className="overflow-y-auto flex-1 scrollbar-hide">
                <TimeSlotSelector
                  selectedDate={selectedDate}
                  selectedTimeSlots={selectedTimeSlots}
                  onTimeSlotSelect={handleTimeSlotSelect}
                />
              </div>
            )}
            {!selectedDate && (
              <p className="text-gray-400 text-center text-sm mt-2">Please select a date first</p>
            )}
          </div>

          {/* Step 3: Court Selection */}
          <div
            className={`bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col transition-all duration-300 ${
              selectedTimeSlots.length > 0 ? 'h-[600px]' : 'h-[120px]'
            }`}
          >
            <div className="flex items-center mb-4 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                  selectedTimeSlots.length > 0
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                3
              </div>
              <h2 className="text-xl font-semibold text-white">Select Court</h2>
            </div>
            {selectedTimeSlots.length > 0 && selectedDate && (
              <div className="overflow-y-auto flex-1 scrollbar-hide">
                <CourtSelector
                  selectedDate={selectedDate}
                  selectedTimeSlots={selectedTimeSlots}
                  selectedCourt={selectedCourt}
                  onCourtSelect={handleCourtSelect}
                />
              </div>
            )}
            {(!selectedTimeSlots.length || !selectedDate) && (
              <p className="text-gray-400 text-center text-sm mt-2">
                Please select time slot first
              </p>
            )}
          </div>
        </div>

        {/* Customer Form */}
        {selectedCourt && selectedTimeSlots.length > 0 && selectedDate && (
          <div className="mt-6 bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                4
              </div>
              <h2 className="text-xl font-semibold text-white">Your Details</h2>
            </div>
            <CustomerForm
              court={selectedCourt}
              timeSlots={selectedTimeSlots}
              onSubmit={handleCustomerSubmit}
            />
          </div>
        )}

        {/* Payment Modal */}
        {showPayment &&
          selectedCourt &&
          selectedTimeSlots.length > 0 &&
          selectedDate &&
          customerInfo && (
            <PaymentModal
              court={selectedCourt}
              date={selectedDate}
              timeSlots={selectedTimeSlots}
              customerInfo={customerInfo}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
      </div>
    </div>
  );
}
