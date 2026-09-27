'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardTrip } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';

interface PastTripsCardProps {
  pastTrips: DashboardTrip[];
}

export const PastTripsCard: React.FC<PastTripsCardProps> = ({ pastTrips }) => {
  if (pastTrips.length === 0) {
    return null;
  }

  const displayedTrips = pastTrips.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-900">Recent Completed Trips</h3>
        <Link href="/my-trips" className="text-sm font-semibold text-primary hover:text-secondary">
          View All Past Trips ({pastTrips.length}) →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedTrips.map((trip) => (
          <div
            key={trip._id}
            className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{trip.destination}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                +{trip.totalPoints} pts
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
              <span>{trip.places.length} landmarks visited</span>
              <span className="text-emerald-600 font-medium">Completed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
