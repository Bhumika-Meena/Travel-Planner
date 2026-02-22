'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { parseCookies } from 'nookies';

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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      // Get user ID from cookies
      const cookies = parseCookies();
      const userCookie = cookies['user'];
      
      if (!userCookie) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userCookie);
      
      if (!user || !user._id) {
        router.push('/login');
        return;
      }

      // Fetch trips with user ID in headers
      const tripsResponse = await fetch('/api/trips', {
        headers: {
          'user-id': user._id
        }
      });

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Past Trips</h1>
          <Link href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 text-center">Loading...</div>
        ) : error ? (
          <div className="mt-8 text-center text-red-600">{error}</div>
        ) : trips.length === 0 ? (
          <div className="mt-8 text-center text-gray-500">No past trips found.</div>
        ) : (
          <div className="mt-8 space-y-4">
            {trips.map((trip) => (
              <div key={trip._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {trip.destination}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {format(new Date(trip.startDate), 'MMM d, yyyy')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {trip.totalPoints} points earned
                      </span>
                      <button
                        onClick={() => toggleTripDetails(trip._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {expandedTrip === trip._id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedTrip === trip._id && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Places Visited</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {trip.places.map((place, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start">
                              {place.completed ? (
                                <svg className="w-5 h-5 text-green-500 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-400 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{place.name}</h5>
                                <p className="mt-1 text-sm text-gray-500">{place.description}</p>
                                {place.points && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    {place.points} points
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 