'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@/components/Avatar';
import { AuthUser } from '@/context/AuthContext';
import { UnreadMessage } from '@/hooks/useDashboard';

interface DashboardNavProps {
  user: AuthUser | null;
  unreadMessages: UnreadMessage[];
  onLogout: () => Promise<void>;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({
  user,
  unreadMessages,
  onLogout,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const totalUnreadCount = unreadMessages.reduce((sum, item) => sum + item.count, 0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Travel Planner
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="border-primary text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/plan-trip"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Plan Trip
              </Link>
              <Link
                href="/my-trips"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                My Trips
              </Link>
              <Link
                href="/chat"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium group"
              >
                <svg className="w-4 h-4 mr-1 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
                {totalUnreadCount > 0 && (
                  <span className="ml-1.5 bg-primary text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/leaderboard"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="View messages"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Unread Messages Dropdown */}
              {showDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-2 px-4 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-sm">Messages</span>
                    <span className="text-xs text-gray-400">{unreadMessages.length} conversations</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {unreadMessages.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No unread messages</div>
                    ) : (
                      unreadMessages.map((msg) => (
                        <Link
                          key={msg.userId}
                          href={`/chat/${msg.userId}`}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {msg.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{msg.fullName}</p>
                              <p className="text-xs text-gray-500">New message waiting</p>
                            </div>
                          </div>
                          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            {msg.count}
                          </span>
                        </Link>
                      ))
                    )}
                    {unreadMessages.length > 0 && (
                      <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                        <Link
                          href="/chat"
                          onClick={() => setShowDropdown(false)}
                          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors block py-1"
                        >
                          View all in Messages Inbox &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Name */}
            <Link href="/profile" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 group">
              <Avatar
                src={user?.profilePicture}
                name={user?.fullName || 'User'}
                size="sm"
                className="border border-gray-200"
              />
              <span className="hidden md:inline font-medium group-hover:text-primary transition-colors">
                {user?.fullName || 'Explorer'}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
