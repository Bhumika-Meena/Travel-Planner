'use client';

import React from 'react';
import Link from 'next/link';

export interface MessageToast {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
}

interface NotificationBannerProps {
  notifications: {
    levelUp?: boolean;
    newLevel?: number;
    newBadges?: string[];
  };
  messageToast?: MessageToast | null;
  onDismissToast?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  messageToast,
  onDismissToast,
}) => {
  const { levelUp, newLevel, newBadges } = notifications;
  const hasGameNotification = levelUp || (newBadges && newBadges.length > 0);

  if (!hasGameNotification && !messageToast) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col space-y-3 max-w-sm">
      {/* Real-time incoming chat message notification */}
      {messageToast && (
        <Link
          href={`/chat/${messageToast.senderId}`}
          onClick={onDismissToast}
          className="bg-white text-gray-900 p-3.5 rounded-2xl shadow-xl border border-gray-200/90 flex items-center space-x-3 hover:bg-gray-50/90 transition-all hover:scale-[1.02] cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors">
                {messageToast.senderName}
              </h4>
              <span className="text-[10px] text-gray-400 font-medium">just now</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{messageToast.content}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismissToast?.();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Link>
      )}

      {/* Gamification alerts */}
      {levelUp && (
        <div className="bg-amber-500 text-white p-4 rounded-xl shadow-xl flex items-center space-x-3 border border-amber-400 animate-bounce">
          <div className="text-2xl">⚡</div>
          <div>
            <h4 className="font-bold text-sm">Level Up!</h4>
            <p className="text-xs text-amber-100">
              Congratulations! You reached Level {newLevel || ''}!
            </p>
          </div>
        </div>
      )}

      {newBadges?.map((badge, idx) => (
        <div
          key={idx}
          className="bg-indigo-600 text-white p-4 rounded-xl shadow-xl flex items-center space-x-3 border border-indigo-500 animate-bounce"
        >
          <div className="text-2xl">🏆</div>
          <div>
            <h4 className="font-bold text-sm">New Badge Unlocked!</h4>
            <p className="text-xs text-indigo-100">You earned the &quot;{badge}&quot; badge!</p>
          </div>
        </div>
      ))}
    </div>
  );
};
