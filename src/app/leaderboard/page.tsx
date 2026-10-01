'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';

interface User {
  _id: string;
  fullName: string;
  points: number;
  level: number;
  badges: string[];
  totalTrips: number;
  profilePicture?: string;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/users/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const topThree = users.slice(0, 3);

  return (
    <div className="page-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 mb-8 gap-4">
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
                Global Explorer Leaderboard
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-6">
              Track top globetrotters, earn explorer points by visiting landmarks, and claim the #1 spot.
            </p>
          </div>
          <div className="flex items-center space-x-3 self-start sm:self-auto ml-6 sm:ml-0">
            <Link href="/plan-trip" className="btn-primary text-sm shadow-xs">
              + Earn Points
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading rankings...</p>
          </div>
        ) : error ? (
          <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="mt-12 bg-white rounded-2xl shadow-card border border-slate-100 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl">
              🏆
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Explorers Ranked Yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Be the first to complete a journey and take the lead on the global leaderboard!
            </p>
            <Link href="/plan-trip" className="btn-primary inline-flex items-center space-x-2 shadow-xs">
              <span>Start Your First Trip</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 Podium Cards */}
            {topThree.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col items-center text-center relative hover:shadow-elevated transition-all order-2 md:order-1">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs">
                      🥈 2nd Place
                    </div>
                    <div className="mt-2 mb-3">
                      <Avatar
                        src={topThree[1].profilePicture}
                        name={topThree[1].fullName}
                        size="lg"
                        className="ring-4 ring-slate-100"
                      />
                    </div>
                    <Link
                      href={`/profile/${topThree[1]._id}`}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors"
                    >
                      {topThree[1].fullName}
                    </Link>
                    <div className="mt-1 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                      <span>Level {topThree[1].level}</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
                      {topThree[1].points.toLocaleString()}{' '}
                      <span className="text-xs font-semibold text-slate-400">pts</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{topThree[1].totalTrips} journeys completed</p>
                  </div>
                )}

                {/* 1st Place (Champion) */}
                {topThree[0] && (
                  <div className="bg-gradient-to-b from-amber-50 via-white to-white rounded-2xl border border-amber-200 shadow-elevated p-6 sm:p-7 flex flex-col items-center text-center relative md:-translate-y-2 order-1 md:order-2">
                    <div className="absolute -top-3.5 px-4 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-xs flex items-center space-x-1">
                      <span>👑</span>
                      <span>1st Champion</span>
                    </div>
                    <div className="mt-2 mb-3">
                      <Avatar
                        src={topThree[0].profilePicture}
                        name={topThree[0].fullName}
                        size="xl"
                        className="ring-4 ring-amber-200 shadow-sm"
                      />
                    </div>
                    <Link
                      href={`/profile/${topThree[0]._id}`}
                      className="font-extrabold text-slate-900 text-lg hover:text-blue-600 transition-colors"
                    >
                      {topThree[0].fullName}
                    </Link>
                    <div className="mt-1 inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      <span>⭐ Level {topThree[0].level} Explorer</span>
                    </div>
                    <p className="mt-3 text-3xl font-black text-amber-600 tracking-tight">
                      {topThree[0].points.toLocaleString()}{' '}
                      <span className="text-sm font-semibold text-slate-400">pts</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {topThree[0].totalTrips} journeys completed
                    </p>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col items-center text-center relative hover:shadow-elevated transition-all order-3">
                    <div className="absolute -top-3 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                      🥉 3rd Place
                    </div>
                    <div className="mt-2 mb-3">
                      <Avatar
                        src={topThree[2].profilePicture}
                        name={topThree[2].fullName}
                        size="lg"
                        className="ring-4 ring-amber-50"
                      />
                    </div>
                    <Link
                      href={`/profile/${topThree[2]._id}`}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors"
                    >
                      {topThree[2].fullName}
                    </Link>
                    <div className="mt-1 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                      <span>Level {topThree[2].level}</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
                      {topThree[2].points.toLocaleString()}{' '}
                      <span className="text-xs font-semibold text-slate-400">pts</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{topThree[2].totalTrips} journeys completed</p>
                  </div>
                )}
              </div>
            )}

            {/* Rankings Table */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  All Ranked Explorers ({users.length})
                </h3>
                <span className="text-xs text-slate-400">Updated in Real Time</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 w-16 text-center">Rank</th>
                      <th className="px-5 py-3.5">Traveler</th>
                      <th className="px-5 py-3.5">Level</th>
                      <th className="px-5 py-3.5 hidden sm:table-cell">Badges</th>
                      <th className="px-5 py-3.5 text-right">Points</th>
                      <th className="px-5 py-3.5 text-right hidden sm:table-cell">Trips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;

                      return (
                        <tr
                          key={user._id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          <td className="px-5 py-4 text-center font-bold">
                            {rank === 1 ? (
                              <span className="text-lg">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-lg">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-lg">🥉</span>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">#{rank}</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-3">
                              <Avatar
                                src={user.profilePicture}
                                name={user.fullName}
                                size="sm"
                                className="shrink-0"
                              />
                              <div className="min-w-0">
                                <Link
                                  href={`/profile/${user._id}`}
                                  className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate block"
                                >
                                  {user.fullName}
                                </Link>
                                <span className="text-xs text-slate-400 sm:hidden">
                                  {user.totalTrips} trips &bull; {user.badges?.length || 0} badges
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                              Level {user.level}
                            </span>
                          </td>

                          <td className="px-5 py-4 hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.badges && user.badges.length > 0 ? (
                                user.badges.slice(0, 3).map((badge, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700"
                                  >
                                    {badge}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                              {user.badges && user.badges.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-semibold self-center">
                                  +{user.badges.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap font-black text-slate-900">
                            {user.points.toLocaleString()}
                            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap text-slate-500 font-medium hidden sm:table-cell">
                            {user.totalTrips}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 