'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  partnerLevel: number;
  partnerPoints: number;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

function formatChatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ChatInbox() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function loadConversations() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/chat/conversations');
        if (!res.ok) {
          throw new Error('Failed to load conversations');
        }
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        setError(err.message || 'Unable to fetch your conversations');
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [user, authLoading, router]);

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="page-canvas">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-100"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h1>
              {totalUnread > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {totalUnread} new
                </span>
              )}
            </div>
          </div>

          <Link
            href="/leaderboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Find Travelers</span>
          </Link>
        </div>
      </header>

      {/* Main Inbox Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search travelers or messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 bg-white"
          />
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-card overflow-hidden">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-12" />
              </div>
            ))}
          </div>
        )}

        {/* Conversations List */}
        {!loading && filteredConversations.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-card overflow-hidden">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.partnerId}
                href={`/chat/${conv.partnerId}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-4">
                  <div className="relative">
                    <Avatar
                      src={conv.partnerAvatar}
                      name={conv.partnerName}
                      size="md"
                      className="border border-slate-100 shadow-xs"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {conv.partnerName}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        Lv {conv.partnerLevel}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                      {conv.lastMessage || 'Sent an attachment'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatChatTime(conv.timestamp)}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty Search Result */}
        {!loading && conversations.length > 0 && filteredConversations.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
            <p className="text-slate-500 text-sm">No conversations match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}

        {/* Empty State (No Conversations Yet) */}
        {!loading && conversations.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-12 text-center shadow-card max-w-lg mx-auto mt-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">No messages yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Connect with other travelers from the leaderboard to ask for destination recommendations, plan joint itineraries, or chat about adventures!
            </p>
            <Link
              href="/leaderboard"
              className="btn-primary inline-flex items-center space-x-2 px-5 py-2.5 text-sm"
            >
              <span>Explore Travelers on Leaderboard</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
