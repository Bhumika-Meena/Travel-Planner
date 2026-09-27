'use client';

import React from 'react';
import { AuthUser } from '@/context/AuthContext';
import { getLevelProgress } from '@/lib/gamification';

interface StatsCardsProps {
  user: AuthUser | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ user }) => {
  const points = user?.points || 0;
  const progress = getLevelProgress(points);
  const badges = user?.badges || [];
  const totalTrips = user?.totalTrips || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Points */}
      <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 border border-gray-100 transition-all hover:shadow-md">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500">Total Points</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{points.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Level & Progress */}
      <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 border border-gray-100 transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Explorer Level</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">Level {progress.currentLevel}</p>
            </div>
          </div>
        </div>
        {/* Level XP Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{points} pts</span>
            <span>Next: {progress.thresholdEnd} pts</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 border border-gray-100 transition-all hover:shadow-md">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500">Badges Earned</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{badges.length}</p>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {badges.slice(0, 3).map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700"
              >
                {badge}
              </span>
            ))}
            {badges.length > 3 && (
              <span className="text-xs text-gray-400 self-center">+{badges.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Total Trips */}
      <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 border border-gray-100 transition-all hover:shadow-md">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-500">Trips Explored</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalTrips}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
