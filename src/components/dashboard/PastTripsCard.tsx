'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardTrip } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

interface PastTripsCardProps {
  pastTrips: DashboardTrip[];
}

export const PastTripsCard: React.FC<PastTripsCardProps> = ({ pastTrips }) => {
  if (pastTrips.length === 0) {
    return null;
  }

  const displayedTrips = pastTrips.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-6 sm:p-7 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Completed Adventures</h3>
          <p className="text-xs text-slate-400 mt-0.5">Your finished itineraries and explorer accomplishments</p>
        </div>
        <Link
          href="/my-trips"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center space-x-1 self-start sm:self-auto"
        >
          <span>View All Past Journeys ({pastTrips.length})</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedTrips.map((trip) => (
          <div
            key={trip._id}
            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{trip.destination}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0">
                  +{trip.totalPoints} pts
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span>{trip.places.length} landmarks</span>
              <GoogleMapsButton placeName={trip.destination} variant="pill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

