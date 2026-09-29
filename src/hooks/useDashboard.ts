'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth, AuthUser } from '@/context/AuthContext';
import { calculateLevel } from '@/lib/gamification';

export interface TripPlace {
  name: string;
  description?: string;
  points: number;
  isSelected: boolean;
  originalIndex?: number;
}

export interface DashboardTrip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  createdAt: string;
  status: 'current' | 'past';
  places: TripPlace[];
}

export interface UnreadMessage {
  userId: string;
  fullName: string;
  count: number;
}

export interface MessageToast {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'http://localhost:3001';

export function useDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, loading: authLoading, logout, refreshUser } = useAuth();

  const [currentTrip, setCurrentTrip] = useState<DashboardTrip | null>(null);
  const [pastTrips, setPastTrips] = useState<DashboardTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState<{
    levelUp?: boolean;
    newLevel?: number;
    newBadges?: string[];
  }>({});
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [messageToast, setMessageToast] = useState<MessageToast | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setCurrentTrip(data.currentTrip || null);
      setPastTrips(data.pastTrips || []);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchTrips();
  }, [authUser, authLoading, router, fetchTrips]);

  // Real-time notifications for incoming messages with authenticated handshake
  useEffect(() => {
    if (!authUser) return;
    const currentUserId = authUser._id;
    let socket: Socket | null = null;
    let isMounted = true;

    async function initNotificationSocket() {
      let token = '';
      try {
        const tokenRes = await fetch('/api/auth/chat-token');
        if (tokenRes.ok) {
          const data = await tokenRes.json();
          token = data.token || '';
        }
      } catch (err) {
        console.warn('Could not retrieve chat auth token:', err);
      }

      if (!isMounted) return;

      socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        reconnectionAttempts: 4,
        timeout: 6000,
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.emit('joinRoom', { userId: currentUserId, otherUserId: null });

      socket.on('receiveMessage', (msg: any) => {
        if (msg.receiverId === currentUserId && msg.senderId !== currentUserId) {
          // Do not show notification toast if user is already inside that conversation
          const inConversation = pathname === `/chat/${msg.senderId}`;

          setUnreadMessages((prev) => {
            const existing = prev.find((u) => u.userId === msg.senderId);
            if (existing) {
              return prev.map((u) =>
                u.userId === msg.senderId ? { ...u, count: inConversation ? u.count : u.count + 1 } : u
              );
            } else {
              return [...prev, { userId: msg.senderId, fullName: msg.senderName || 'Traveler', count: inConversation ? 0 : 1 }];
            }
          });

          if (!inConversation) {
            setMessageToast({
              id: Date.now().toString(),
              senderId: msg.senderId,
              senderName: msg.senderName || 'Traveler',
              content: msg.content || 'Sent a message'
            });
            setTimeout(() => {
              setMessageToast(null);
            }, 6000);
          }
        }
      });
    }

    initNotificationSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [authUser, pathname]);

  // Clear unread indicator when navigating to chat
  useEffect(() => {
    const match = pathname.match(/\/chat\/([^/]+)/);
    if (match) {
      const chatUserId = match[1];
      setUnreadMessages((prev) => prev.filter((u) => u.userId !== chatUserId));
    }
  }, [pathname]);

  const handleTaskComplete = async (placeIndex: number) => {
    if (!currentTrip || !authUser) return;

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/trips/${currentTrip._id}/complete-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || (typeof errorData.error === 'string' ? errorData.error : 'Failed to complete task'));
      }

      const data = await response.json();

      if (data.progressUpdate) {
        setNotifications(data.progressUpdate);
        setTimeout(() => setNotifications({}), 6000);
      }

      // Check if all tasks in trip are now done
      const updatedTripRes = await fetch(`/api/trips/${currentTrip._id}`);
      if (updatedTripRes.ok) {
        const updatedTrip = await updatedTripRes.json();
        const allCompleted = updatedTrip.places?.every((p: TripPlace) => !p.isSelected);
        if (allCompleted) {
          await fetch(`/api/trips/${currentTrip._id}/complete`, { method: 'POST' });
        }
      }

      await Promise.all([fetchTrips(), refreshUser()]);
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!currentTrip || !authUser) return;

    try {
      setActionLoading(true);
      setError('');

      const res = await fetch(`/api/trips/${currentTrip._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || data.message || data.details || (typeof data.error === 'string' ? data.error : 'Failed to delete trip'));
      }

      setShowDeleteConfirm(false);
      await Promise.all([fetchTrips(), refreshUser()]);
    } catch (err: any) {
      console.error('Error deleting trip:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    user: authUser,
    loading: loading || authLoading,
    actionLoading,
    error,
    setError,
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
    handleLogout: logout,
    fetchTrips,
  };
}
