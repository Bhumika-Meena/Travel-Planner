'use client';

import React from 'react';
import Link from 'next/link';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CurrentTripCard } from '@/components/dashboard/CurrentTripCard';
import { PastTripsCard } from '@/components/dashboard/PastTripsCard';
import { DeleteTripModal } from '@/components/dashboard/DeleteTripModal';
import { NotificationBanner } from '@/components/dashboard/NotificationBanner';

export default function Dashboard() {
  const {
    user,
    loading,
    actionLoading,
    error,
    currentTrip,
    pastTrips,
    notifications,
    unreadMessages,
    messageToast,
    setMessageToast,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleTaskComplete,
    handleDeleteTrip,
    handleLogout,
  } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-canvas">
      <DashboardNav
        user={user}
        unreadMessages={unreadMessages}
        onLogout={handleLogout}
      />

      <NotificationBanner
        notifications={notifications}
        messageToast={messageToast}
        onDismissToast={() => setMessageToast(null)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.fullName || 'Traveler'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track your active trips, check off landmarks, and climb the leaderboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="btn-secondary"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Messages</span>
            </Link>
            <Link href="/plan-trip" className="btn-primary">
              <span>+ Plan New Adventure</span>
            </Link>
          </div>
        </div>

        <StatsCards user={user} />

        <CurrentTripCard
          currentTrip={currentTrip}
          actionLoading={actionLoading}
          onTaskComplete={handleTaskComplete}
          onOpenDeleteConfirm={() => setShowDeleteConfirm(true)}
        />

        <PastTripsCard pastTrips={pastTrips} />

        <DeleteTripModal
          isOpen={showDeleteConfirm}
          actionLoading={actionLoading}
          onConfirm={handleDeleteTrip}
          onClose={() => setShowDeleteConfirm(false)}
        />
      </main>
    </div>
  );
}