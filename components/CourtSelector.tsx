'use client';

import { useState, useEffect } from 'react';
import { Court, TimeSlot } from '@/types';
import { FaTrophy, FaLock } from 'react-icons/fa';
import { format } from 'date-fns';
import { getReservedCourts } from '@/lib/firestore';

interface CourtSelectorProps {
  selectedDate: Date;
  selectedTimeSlots: TimeSlot[];
  selectedCourt: Court | null;
  onCourtSelect: (court: Court) => void;
}

export default function CourtSelector({
  selectedDate,
  selectedTimeSlots,
  selectedCourt,
  onCourtSelect,
}: CourtSelectorProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservedCourtIds, setReservedCourtIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableCourts = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const timeslotIds = selectedTimeSlots.map((slot) => slot.id);

      // Default courts list
      const allCourts: Court[] = [
        {
          id: '1',
          name: 'Court 1',
          description: 'Premium wooden flooring, professional lighting',
          pricePerHour: 100000,
        },
        {
          id: '2',
          name: 'Court 2',
          description: 'Standard court with good ventilation',
          pricePerHour: 50000,
        },
        {
          id: '3',
          name: 'Court 3',
          description: 'Competition-ready court with gallery seating',
          pricePerHour: 120000,
        },
        {
          id: '4',
          name: 'Court 4',
          description: 'VIP court with air conditioning and equipment rental',
          pricePerHour: 80000,
        },
      ];

      // Get reserved courts from Firestore
      if (timeslotIds.length > 0) {
        const reserved = await getReservedCourts(dateStr, timeslotIds);
        setReservedCourtIds(reserved);
      } else {
        setReservedCourtIds([]);
      }

      setCourts(allCourts);
    } catch (error) {
      console.error('Error fetching courts:', error);
      // Still show default courts even if Firestore fails
      const defaultCourts: Court[] = [
        {
          id: '1',
          name: 'Court 1',
          description: 'Premium wooden flooring, professional lighting',
          pricePerHour: 100000,
        },
        {
          id: '2',
          name: 'Court 2',
          description: 'Standard court with good ventilation',
          pricePerHour: 50000,
        },
        {
          id: '3',
          name: 'Court 3',
          description: 'Competition-ready court with gallery seating',
          pricePerHour: 120000,
        },
        {
          id: '4',
          name: 'Court 4',
          description: 'VIP court with air conditioning and equipment rental',
          pricePerHour: 80000,
        },
      ];
      setCourts(defaultCourts);
      setReservedCourtIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableCourts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedTimeSlots]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading courts...</p>
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No courts available for this time slot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courts.map((court) => {
        const isSelected = selectedCourt?.id === court.id;
        const isReserved = reservedCourtIds.includes(court.id);

        return (
          <button
            key={court.id}
            onClick={() => !isReserved && onCourtSelect(court)}
            disabled={isReserved}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              isReserved
                ? 'border-gray-700 bg-gray-800 opacity-60 cursor-not-allowed'
                : isSelected
                ? 'border-primary-500 bg-primary-900 shadow-md'
                : 'border-gray-600 hover:border-primary-400 hover:bg-gray-700 cursor-pointer'
            }`}
          >
            <div className="flex items-start">
              {isReserved ? (
                <FaLock className="mr-3 mt-1 text-xl text-gray-500" />
              ) : (
                <FaTrophy
                  className={`mr-3 mt-1 text-xl ${
                    isSelected ? 'text-primary-400' : 'text-gray-400'
                  }`}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div
                    className={`font-semibold text-lg ${
                      isReserved ? 'text-gray-500' : isSelected ? 'text-white' : 'text-gray-200'
                    }`}
                  >
                    {court.name}
                  </div>
                  {isReserved && (
                    <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                      BOOKED
                    </span>
                  )}
                </div>
                <div className={`text-sm ${isReserved ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
                  {court.description}
                </div>
                <div
                  className={`font-bold ${
                    isReserved ? 'text-gray-600' : isSelected ? 'text-primary-400' : 'text-gray-200'
                  }`}
                >
                  Rp {court.pricePerHour.toLocaleString('id-ID')}/hour
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
