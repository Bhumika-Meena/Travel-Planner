'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

interface Place {
  name: string;
  description: string;
  points: number;
  isSelected: boolean;
}

export default function PlanTrip() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
  });
  const [newPlace, setNewPlace] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch suggestions when form data changes
  useEffect(() => {
    if (formData.destination && formData.startDate && formData.endDate) {
      fetchSuggestions();
    }
  }, [formData]);

  const fetchSuggestions = async () => {
    try {
      setFetchingSuggestions(true);
      const response = await fetch('/api/trips/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          places: selectedPlaces,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to create trip');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSuggestion = (place: Place) => {
    setSelectedPlaces((prev) => [...prev, place]);
    setSuggestions((prev) => prev.filter((p) => p.name !== place.name));
  };

  const handleAddManualPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlace.name && newPlace.description) {
      const place: Place = {
        ...newPlace,
        points: 2,
        isSelected: true,
      };
      setSelectedPlaces((prev) => [...prev, place]);
      setNewPlace({ name: '', description: '' });
    }
  };

  const handleRemovePlace = (index: number) => {
    setSelectedPlaces((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPointsPlanned = selectedPlaces.reduce((sum, p) => sum + (p.points || 0), 0);

  return (
    <div className="page-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Plan Your Next Adventure
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Set dates, generate AI recommendations, and review spots on Google Maps.
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm self-start sm:self-auto">
            Cancel
          </Link>
        </div>

        {/* Form Container */}
        <div className="surface p-6 sm:p-8 mb-8">
          <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Trip Destination & Schedule</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="destination" className="form-label">
                  Destination City / Country
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    required
                    value={formData.destination}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g. Kyoto, Japan or Rome, Italy"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="startDate" className="form-label">
                  Departure Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label htmlFor="endDate" className="form-label">
                  Return Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input-field"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {error && (
              <div className="alert-error flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
              <div className="text-sm text-slate-500 flex items-center space-x-2">
                <span className="font-semibold text-slate-800">{selectedPlaces.length} places selected</span>
                <span>&bull;</span>
                <span className="font-semibold text-blue-600">+{totalPointsPlanned} potential points</span>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedPlaces.length === 0}
                  className="btn-primary w-full sm:w-auto shadow-sm"
                >
                  {loading ? 'Creating Journey...' : 'Confirm & Save Trip'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Suggestions Column */}
          <div className="surface p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    ✨
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">AI Suggested Landmarks</h2>
                    <p className="text-xs text-slate-400">Curated points of interest for {formData.destination || 'your destination'}</p>
                  </div>
                </div>
                {fetchingSuggestions && (
                  <span className="text-xs text-blue-600 font-medium flex items-center space-x-1 animate-pulse">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Generating...</span>
                  </span>
                )}
              </div>

              <div className="space-y-3.5">
                {suggestions.map((place, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400/70 hover:shadow-xs transition-all bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{place.name}</h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 shrink-0">
                          +{place.points} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{place.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <GoogleMapsButton
                        placeName={place.name}
                        destination={formData.destination}
                        variant="compact"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSuggestion(place)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs"
                      >
                        <span>+ Add to Trip</span>
                      </button>
                    </div>
                  </div>
                ))}

                {suggestions.length === 0 && !fetchingSuggestions && (
                  <div className="empty-state">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      📍
                    </div>
                    <p className="text-sm font-medium text-slate-700">No suggestions yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Fill in destination and travel dates above to automatically generate AI landmark ideas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Places Column */}
          <div className="surface p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    🎒
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Your Chosen Itinerary</h2>
                    <p className="text-xs text-slate-400">Places included in this journey ({selectedPlaces.length})</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 mb-6">
                {selectedPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold text-slate-900 text-sm">{place.name}</h3>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                          +{place.points} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 ml-7 leading-relaxed">{place.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <GoogleMapsButton
                        placeName={place.name}
                        destination={formData.destination}
                        variant="compact"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePlace(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline px-1 py-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {selectedPlaces.length === 0 && (
                  <div className="empty-state">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      🗺️
                    </div>
                    <p className="text-sm font-medium text-slate-700">No places added to your itinerary yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Add suggested landmarks from the left or create your own custom places below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Custom Place Form */}
            <div className="pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                + Add Custom Landmark / Activity
              </h3>
              <form onSubmit={handleAddManualPlace} className="space-y-3">
                <div>
                  <input
                    type="text"
                    id="newPlaceName"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Place name (e.g. Fushimi Inari Shrine)"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newPlace.description}
                    onChange={(e) => setNewPlace((prev) => ({ ...prev, description: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="Short description or notes..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newPlace.name || !newPlace.description}
                  className="btn-secondary w-full text-sm font-semibold"
                >
                  Add Custom Place
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 