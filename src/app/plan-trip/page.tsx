'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Place {
  name: string;
  description: string;
  points: number;
  isSelected: boolean;
}

export default function PlanTrip() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  // Fetch suggestions when form data changes
  useEffect(() => {
    if (formData.destination && formData.startDate && formData.endDate) {
      fetchSuggestions();
    }
  }, [formData]);

  const fetchSuggestions = async () => {
    try {
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
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userCookie);
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user._id
        },
        body: JSON.stringify({
          ...formData,
          places: selectedPlaces
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create trip');
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSuggestion = (place: Place) => {
    setSelectedPlaces(prev => [...prev, place]);
    setSuggestions(prev => prev.filter(p => p.name !== place.name));
  };

  const handleAddManualPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlace.name && newPlace.description) {
      const place: Place = {
        ...newPlace,
        points: 2,
        isSelected: true
      };
      setSelectedPlaces(prev => [...prev, place]);
      setNewPlace({ name: '', description: '' });
    }
  };

  const handleRemovePlace = (index: number) => {
    setSelectedPlaces(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Plan Your New Trip</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                required
                value={formData.destination}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Enter your destination"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedPlaces.length === 0}
                className="btn-primary"
              >
                {loading ? 'Creating Trip...' : 'Create Trip'}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* AI Suggestions Column */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Suggested Places</h2>
            <div className="space-y-4">
              {suggestions.map((place, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{place.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{place.description}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-primary">{place.points} points</span>
                    <button
                      onClick={() => handleAddSuggestion(place)}
                      className="btn-primary text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Enter trip details above to see AI suggestions
                </p>
              )}
            </div>
          </div>

          {/* Selected Places Column */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Trip Places</h2>
            <div className="space-y-4">
              {selectedPlaces.map((place, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{place.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{place.description}</p>
                      <span className="text-sm text-primary mt-2 block">{place.points} points</span>
                    </div>
                    <button
                      onClick={() => handleRemovePlace(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {selectedPlaces.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No places added yet
                </p>
              )}
            </div>

            {/* Add Manual Place Form */}
            <form onSubmit={handleAddManualPlace} className="mt-6 space-y-4">
              <div>
                <label htmlFor="newPlaceName" className="block text-sm font-medium text-gray-700">
                  Add Custom Place
                </label>
                <input
                  type="text"
                  id="newPlaceName"
                  value={newPlace.name}
                  onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Place name"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newPlace.description}
                  onChange={(e) => setNewPlace(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Description"
                />
              </div>
              <button
                type="submit"
                disabled={!newPlace.name || !newPlace.description}
                className="btn-primary w-full"
              >
                Add Place
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 