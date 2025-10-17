'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { FaCalendarAlt } from 'react-icons/fa';

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateSelect }: DateSelectorProps) {
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());

  // Update current date and set up auto-refresh at midnight
  useEffect(() => {
    // Update to ensure we have the latest date
    setCurrentDate(startOfToday());

    // Calculate milliseconds until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set up timer to refresh at midnight
    const midnightTimer = setTimeout(() => {
      setCurrentDate(startOfToday());

      // Set up recurring daily refresh
      const dailyInterval = setInterval(() => {
        setCurrentDate(startOfToday());
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    // Also refresh every hour as a backup (in case user leaves tab open)
    const hourlyCheck = setInterval(() => {
      const newToday = startOfToday();
      if (format(newToday, 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd')) {
        setCurrentDate(newToday);
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(hourlyCheck);
    };
  }, [currentDate]);

  const today = currentDate;
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="space-y-3">
      {availableDates.map((date) => {
        const isSelected =
          selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

        return (
          <button
            key={date.toString()}
            onClick={() => onDateSelect(date)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-900 shadow-md'
                : 'border-gray-600 hover:border-primary-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCalendarAlt
                  className={`mr-3 text-xl ${isSelected ? 'text-primary-400' : 'text-gray-400'}`}
                />
                <div className="text-left">
                  <div
                    className={`font-semibold text-base ${
                      isSelected ? 'text-white' : 'text-gray-200'
                    }`}
                  >
                    {format(date, 'EEEE')}
                  </div>
                  <div className="text-sm text-gray-400">{format(date, 'MMM dd, yyyy')}</div>
                </div>
              </div>
              {isToday && (
                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">Today</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
