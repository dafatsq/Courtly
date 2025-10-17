'use client';

import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

export default function CurrentDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    setMounted(true);
    setCurrentTime(new Date());

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render anything on server, only after client mount
  if (!mounted || !currentTime) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaClock className="text-primary-400 text-2xl mr-3" />
            <div>
              <div className="text-sm text-gray-400">Current Date & Time</div>
              <div className="text-lg font-semibold text-white">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaClock className="text-primary-400 text-2xl mr-3" />
          <div>
            <div className="text-sm text-gray-400">Current Date & Time</div>
            <div className="text-lg font-semibold text-white">{formatDate(currentTime)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-400 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      </div>
    </div>
  );
}
