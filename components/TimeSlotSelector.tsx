'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types';
import { FaClock, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { format, isToday, parse } from 'date-fns';

interface TimeSlotSelectorProps {
  selectedDate: Date;
  selectedTimeSlots: TimeSlot[];
  onTimeSlotSelect: (slot: TimeSlot) => void;
}

export default function TimeSlotSelector({
  selectedDate,
  selectedTimeSlots,
  onTimeSlotSelect,
}: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every minute to check for passed slots
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTimeSlots();
  }, [selectedDate]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await axios.get(`${apiUrl}/api/timeslots?date=${dateStr}`);

      if (response.data.success) {
        setTimeSlots(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      // Fallback to default time slots
      const defaultSlots: TimeSlot[] = [
        { id: '1', startTime: '08:00', endTime: '09:00', available: true },
        { id: '2', startTime: '09:00', endTime: '10:00', available: true },
        { id: '3', startTime: '10:00', endTime: '11:00', available: true },
        { id: '4', startTime: '11:00', endTime: '12:00', available: true },
        { id: '5', startTime: '12:00', endTime: '13:00', available: true },
        { id: '6', startTime: '13:00', endTime: '14:00', available: true },
        { id: '7', startTime: '14:00', endTime: '15:00', available: true },
        { id: '8', startTime: '15:00', endTime: '16:00', available: true },
        { id: '9', startTime: '16:00', endTime: '17:00', available: true },
        { id: '10', startTime: '17:00', endTime: '18:00', available: true },
        { id: '11', startTime: '18:00', endTime: '19:00', available: true },
        { id: '12', startTime: '19:00', endTime: '20:00', available: true },
      ];
      setTimeSlots(defaultSlots);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a time slot has passed
  const isTimePassed = (slotStartTime: string): boolean => {
    // Only check if the selected date is today
    if (!isToday(selectedDate)) {
      return false; // Future dates are always available
    }

    try {
      // Parse the slot time (format: "HH:mm")
      const [hours, minutes] = slotStartTime.split(':').map(Number);
      const slotDateTime = new Date();
      slotDateTime.setHours(hours, minutes, 0, 0);

      // Check if the slot start time has passed
      return currentTime >= slotDateTime;
    } catch (error) {
      console.error('Error parsing time:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading time slots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectedTimeSlots.length > 0 && (
        <div className="bg-primary-900 border-2 border-primary-500 rounded-lg p-3 mb-3">
          <p className="text-sm font-semibold text-primary-300">
            {selectedTimeSlots.length} time slot{selectedTimeSlots.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-gray-400 mt-1">Click on slots to add or remove them</p>
        </div>
      )}
      {timeSlots.map((slot) => {
        const isSelected = selectedTimeSlots.some((s) => s.id === slot.id);
        const hasPassed = isTimePassed(slot.startTime);
        const isDisabled = !slot.available || hasPassed;

        // Determine the reason for being unavailable
        let unavailableReason = '';
        if (hasPassed) {
          unavailableReason = 'Passed';
        } else if (!slot.available) {
          unavailableReason = 'Booked';
        }

        return (
          <button
            key={slot.id}
            onClick={() => !isDisabled && onTimeSlotSelect(slot)}
            disabled={isDisabled}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-900 shadow-md'
                : !isDisabled
                ? 'border-gray-600 hover:border-primary-400 hover:bg-gray-700'
                : 'border-gray-700 bg-gray-800 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {hasPassed ? (
                  <FaLock className={`mr-3 text-xl text-gray-600`} />
                ) : (
                  <FaClock
                    className={`mr-3 text-xl ${
                      isSelected
                        ? 'text-primary-400'
                        : !isDisabled
                        ? 'text-gray-400'
                        : 'text-gray-300'
                    }`}
                  />
                )}
                <div className="text-left">
                  <div
                    className={`font-semibold ${
                      isSelected ? 'text-white' : isDisabled ? 'text-gray-500' : 'text-gray-200'
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isDisabled
                      ? hasPassed
                        ? 'Time has passed'
                        : 'Already booked'
                      : '1 hour session'}
                  </div>
                </div>
              </div>
              {unavailableReason && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    hasPassed ? 'bg-gray-700 text-gray-400' : 'bg-red-900 text-red-300'
                  }`}
                >
                  {unavailableReason}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
