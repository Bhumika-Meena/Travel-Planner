'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  places: {
    name: string;
    description: string;
    completed: boolean;
    points?: number;
  }[];
  completed: boolean;
  totalPoints: number;
  status: 'current' | 'past';
}

export default function MyTrips() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTrips();
  }, [user, authLoading, router]);

  const fetchTrips = async () => {
    try {
      const tripsResponse = await fetch('/api/trips');

      if (!tripsResponse.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await tripsResponse.json();
      setTrips(data.pastTrips || []);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Failed to fetch trips')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTripDetails = (tripId: string) => {
    setExpandedTrip(expandedTrip === tripId ? null : tripId);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded-lg"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Past Journeys
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-6">
              Review your completed itineraries, visited landmarks, and earned points.
            </p>
          </div>
          <div className="flex items-center space-x-3 self-start sm:self-auto ml-6 sm:ml-0">
            <Link href="/plan-trip" className="btn-primary text-sm shadow-xs">
              + Plan New Adventure
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading your travel archives...</p>
          </div>
        ) : error ? (
          <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        ) : trips.length === 0 ? (
          <div className="mt-12 bg-white rounded-2xl shadow-card border border-slate-100 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Past Trips Found</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              When you finish an active trip and complete its landmarks, it will be archived here with your points.
            </p>
            <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2 shadow-xs">
              <span>Start Your First Trip</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {trips.map((trip) => {
              const isExpanded = expandedTrip === trip._id;
              const formattedStart = format(new Date(trip.startDate), 'MMM d, yyyy');
              const formattedEnd = format(new Date(trip.endDate), 'MMM d, yyyy');

              return (
                <div
                  key={trip._id}
                  className="bg-white rounded-2xl shadow-card border border-slate-100/90 overflow-hidden transition-all duration-200 hover:shadow-elevated"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Completed
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {formattedStart} — {formattedEnd}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {trip.destination}
                          </h3>
                          <GoogleMapsButton
                            placeName={trip.destination}
                            variant="pill"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {trip.places.length} landmarks explored &middot; {trip.places.filter(p => p.completed).length} checked off
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          +{trip.totalPoints} pts
                        </span>

                        <button
                          onClick={() => toggleTripDetails(trip._id)}
                          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isExpanded
                              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200/70 hover:bg-blue-100'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Itinerary'}</span>
                          <svg
                            className={`w-3.5 h-3.5 ml-1.5 transform transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-7">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Itinerary Landmarks & Locations ({trip.places.length})
                        </h4>
                        <span className="text-xs text-slate-400">Click any landmark to open in Google Maps</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trip.places.map((place, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  {place.completed ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                                    </div>
                                  )}
                                  <h5 className="text-sm font-semibold text-slate-900 truncate">
                                    {place.name}
                                  </h5>
                                </div>

                                {place.points && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                                    +{place.points}
                                  </span>
                                )}
                              </div>

                              {place.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed ml-6.5">
                                  {place.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                              <GoogleMapsButton
                                placeName={place.name}
                                destination={trip.destination}
                                variant="compact"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
 