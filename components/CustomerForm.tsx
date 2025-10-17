'use client';

import { useState } from 'react';
import { Court, TimeSlot } from '@/types';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

interface CustomerFormProps {
  court: Court;
  timeSlots: TimeSlot[];
  onSubmit: (info: { name: string; email: string; phone: string }) => void;
}

export default function CustomerForm({ court, timeSlots, onSubmit }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({ name, email, phone });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FaUser className="inline mr-2" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white bg-gray-700 ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FaEnvelope className="inline mr-2" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white bg-gray-700 ${
              errors.email ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FaPhone className="inline mr-2" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white bg-gray-700 ${
              errors.phone ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="+1234567890"
          />
          {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div className="flex items-end">
          <div className="w-full p-4 bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-300">
              Total Amount ({timeSlots.length} hour{timeSlots.length > 1 ? 's' : ''})
            </div>
            <div className="text-2xl font-bold text-primary-400">
              Rp {(court.pricePerHour * timeSlots.length).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
      >
        Proceed to Payment
      </button>
    </form>
  );
}
