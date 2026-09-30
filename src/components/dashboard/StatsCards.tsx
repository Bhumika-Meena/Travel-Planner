'use client';

import React from 'react';
import Link from 'next/link';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Total Points */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 transition-all duration-300 hover:shadow-elevated flex flex-col justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Points</h3>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{points.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold">+ points from places</span>
          <Link href="/leaderboard" className="font-semibold text-blue-600 hover:text-blue-700">Rankings &rarr;</Link>
        </div>
      </div>

      {/* Level & Progress */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 transition-all duration-300 hover:shadow-elevated flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Explorer Level</h3>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Level {progress.currentLevel}</p>
            </div>
          </div>
        </div>
        {/* Level XP Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
            <span>{points} pts</span>
            <span>Next: {progress.thresholdEnd} pts</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 transition-all duration-300 hover:shadow-elevated flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Badges Unlocked</h3>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{badges.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100">
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 items-center">
              {badges.slice(0, 2).map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[120px]"
                >
                  🏅 {badge}
                </span>
              ))}
              {badges.length > 2 && (
                <span className="text-[10px] text-slate-400 font-semibold">+{badges.length - 2} more</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Complete tasks to unlock badges</p>
          )}
        </div>
      </div>

      {/* Total Trips */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 p-5 sm:p-6 transition-all duration-300 hover:shadow-elevated flex flex-col justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trips Explored</h3>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{totalTrips}</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Active & Completed</span>
          <Link href="/my-trips" className="font-semibold text-emerald-600 hover:text-emerald-700">Past Archives &rarr;</Link>
        </div>
      </div>
    </div>
  );
};

