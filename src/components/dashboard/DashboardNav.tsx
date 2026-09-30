'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Plan Trip', href: '/plan-trip' },
    { label: 'My Trips', href: '/my-trips' },
    {
      label: 'Messages',
      href: '/chat',
      badge: totalUnreadCount > 0 ? totalUnreadCount : null,
      icon: (
        <svg className="w-4 h-4 mr-1.5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    { label: 'Leaderboard', href: '/leaderboard' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
                ✈
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Travel<span className="text-blue-600">Planner</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-xs">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="View messages"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                )}
              </button>

              {/* Unread Messages Dropdown */}
              {showDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-elevated bg-white border border-slate-100 ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden">
                  <div className="py-3 px-4 bg-slate-50/70 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Messages</span>
                    <span className="text-xs text-slate-500 font-medium">{unreadMessages.length} conversations</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {unreadMessages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1.5">
                          ✓
                        </div>
                        No unread messages
                      </div>
                    ) : (
                      unreadMessages.map((msg) => (
                        <Link
                          key={msg.userId}
                          href={`/chat/${msg.userId}`}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {msg.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-900 truncate">{msg.fullName}</p>
                              <p className="text-[11px] text-slate-500">New message waiting</p>
                            </div>
                          </div>
                          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0">
                            {msg.count}
                          </span>
                        </Link>
                      ))
                    )}
                    {unreadMessages.length > 0 && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Link
                          href="/chat"
                          onClick={() => setShowDropdown(false)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors block py-1"
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
            <Link
              href="/profile"
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors group"
            >
              <Avatar
                src={user?.profilePicture}
                name={user?.fullName || 'User'}
                size="sm"
                className="border border-slate-200/80"
              />
              <span className="hidden lg:inline text-xs font-semibold group-hover:text-blue-600 transition-colors">
                {user?.fullName || 'Explorer'}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="hidden sm:inline-flex text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors px-2.5 py-1.5 rounded-lg"
            >
              Sign out
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center">
                  {link.icon}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600"
            >
              My Profile
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

