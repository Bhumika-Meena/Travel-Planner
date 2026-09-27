'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardTrip, TripPlace } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';

interface CurrentTripCardProps {
  currentTrip: DashboardTrip | null;
  actionLoading: boolean;
  onTaskComplete: (originalIndex: number) => Promise<void>;
  onOpenDeleteConfirm: () => void;
}

export const CurrentTripCard: React.FC<CurrentTripCardProps> = ({
  currentTrip,
  actionLoading,
  onTaskComplete,
  onOpenDeleteConfirm,
}) => {
  if (!currentTrip) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Trip Planned</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
          Create your next AI-tailored adventure, earn explorer points, and level up your traveler rank!
        </p>
        <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2">
          <span>Plan a New Trip</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  // Preserve original indices for completing tasks while sorting completed items to the bottom
  const placesWithIndices = currentTrip.places.map((place, idx) => ({
    ...place,
    originalIndex: idx,
  }));

  const sortedPlaces = [...placesWithIndices].sort((a, b) => {
    if (a.isSelected === b.isSelected) return 0;
    return a.isSelected ? -1 : 1; // Pending first, completed last
  });

  const completedCount = currentTrip.places.filter((p) => !p.isSelected).length;
  const totalCount = currentTrip.places.length;
  const isTripFinished = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      {/* Trip Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              Current Adventure
            </span>
            <span className="text-xs text-blue-100">
              {formatDate(currentTrip.startDate)} – {formatDate(currentTrip.endDate)}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white">{currentTrip.destination}</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs text-blue-200">Progress</p>
            <p className="text-lg font-bold text-white">
              {completedCount} / {totalCount} Done
            </p>
          </div>
          <button
            onClick={onOpenDeleteConfirm}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Delete Trip"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Task / Places Checklist */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Exploration Tasks & Places
        </h3>

        <div className="space-y-3">
          {sortedPlaces.map((place) => {
            const isPending = place.isSelected;
            return (
              <div
                key={place.originalIndex}
                className={`p-4 rounded-lg border transition-all flex items-center justify-between gap-4 ${
                  isPending
                    ? 'border-gray-200 bg-white hover:border-primary/40'
                    : 'border-emerald-100 bg-emerald-50/40 text-gray-500'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-base font-semibold ${
                        isPending ? 'text-gray-900' : 'text-gray-400 line-through'
                      }`}
                    >
                      {place.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isPending
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      +{place.points} pts
                    </span>
                  </div>
                  {place.description && (
                    <p
                      className={`text-xs mt-1 ${
                        isPending ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {place.description}
                    </p>
                  )}
                </div>

                <div>
                  <button
                    disabled={!isPending || actionLoading}
                    onClick={() => onTaskComplete(place.originalIndex)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isPending
                        ? 'bg-primary text-white hover:bg-secondary disabled:opacity-50'
                        : 'bg-emerald-600 text-white cursor-default'
                    }`}
                  >
                    {isPending ? (actionLoading ? 'Saving...' : 'Complete') : '✓ Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {isTripFinished && (
          <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <h4 className="text-lg font-bold text-emerald-800">
              🎉 Congratulations! You have completed all places in this trip!
            </h4>
            <p className="text-emerald-600 text-sm mt-1 mb-4">
              All points have been credited to your explorer rank. Ready for your next journey?
            </p>
            <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2">
              <span>Plan Your Next Trip</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
