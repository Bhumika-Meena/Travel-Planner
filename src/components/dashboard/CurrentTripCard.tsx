'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardTrip, TripPlace } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

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
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-12 text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1.5">No Active Trip Planned</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Create your next AI-tailored adventure, earn explorer points, and level up your traveler rank!
        </p>
        <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2 shadow-sm">
          <span>Plan a New Trip</span>
          <span aria-hidden="true">&rarr;</span>
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
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isTripFinished = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 overflow-hidden mb-8 transition-shadow hover:shadow-elevated">
      {/* Trip Header Banner */}
      <div className="p-6 sm:p-7 bg-blue-600 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm shadow-xs">
                Current Adventure
              </span>
              <span className="text-xs text-blue-100 flex items-center gap-1 font-medium">
                <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(currentTrip.startDate)} – {formatDate(currentTrip.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentTrip.destination}
              </h2>
              <GoogleMapsButton
                placeName={currentTrip.destination}
                variant="pill"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20 text-xs backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <div className="text-right">
              <p className="text-xs font-medium text-blue-100/80">Completed</p>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {completedCount} <span className="text-sm font-normal text-blue-200">/ {totalCount}</span>
              </p>
            </div>
            <button
              onClick={onOpenDeleteConfirm}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors backdrop-blur-sm"
              title="Delete Trip"
              aria-label="Delete Trip"
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

        {/* Progress Bar */}
        <div className="mt-5 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-1.5">
            <span>Exploration Progress</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task / Places Checklist */}
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Itinerary Landmarks & Tasks ({totalCount})
          </h3>
          <span className="text-xs text-slate-400">Sorted: Pending First</span>
        </div>

        <div className="space-y-3">
          {sortedPlaces.map((place) => {
            const isPending = place.isSelected;
            return (
              <div
                key={place.originalIndex}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  isPending
                    ? 'border-slate-200/80 bg-white hover:border-blue-400/70 hover:shadow-xs'
                    : 'border-emerald-100 bg-emerald-50/40 text-slate-600'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-base font-semibold leading-snug ${
                        isPending ? 'text-slate-900' : 'text-slate-400 line-through'
                      }`}
                    >
                      {place.name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                        isPending
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                      }`}
                    >
                      +{place.points} pts
                    </span>
                  </div>
                  {place.description && (
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isPending ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {place.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <GoogleMapsButton
                    placeName={place.name}
                    destination={currentTrip.destination}
                    variant="compact"
                  />

                  <button
                    disabled={!isPending || actionLoading}
                    onClick={() => onTaskComplete(place.originalIndex)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs ${
                      isPending
                        ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50'
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
          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl text-center shadow-xs">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-emerald-900">
              🎉 Congratulations! You have completed all places in this trip!
            </h4>
            <p className="text-emerald-700 text-sm mt-1 mb-5 max-w-md mx-auto">
              All points have been credited to your explorer rank. Ready for your next journey?
            </p>
            <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2 shadow-sm">
              <span>Plan Your Next Trip</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

