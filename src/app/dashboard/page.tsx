'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';

interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  createdAt: string;
  status: 'current' | 'past';
  places: Array<{
    name: string;
    description: string;
    points: number;
    isSelected: boolean;
  }>;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  points: number;
  profilePicture?: string;
  level: number;
  badges: string[];
  totalTrips: number;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'http://localhost:4000';

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState<{
    levelUp?: number;
    newBadges?: string[];
  }>({});
  const [unreadMessages, setUnreadMessages] = useState<{ userId: string; fullName: string; count: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userCookie = Cookies.get('user');
    if (!userCookie) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userCookie);
      if (!userData._id) {
        Cookies.remove('user');
        router.push('/login');
        return;
      }
      setUser(userData);
      // Fetch fresh data
      fetchUserData();
      fetchTrips();
    } catch (error) {
      Cookies.remove('user');
      router.push('/login');
      return;
    }
  }, [router]);

  const fetchTrips = async () => {
    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userCookie);
      const requestId = `fetch-${Date.now()}`;
      const response = await fetch('/api/trips', {
        headers: {
          'user-id': user._id,
          'x-request-id': requestId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      setCurrentTrip(data.currentTrip);
      setPastTrips(data.pastTrips || []);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userCookie);
      const response = await fetch(`/api/users/${user._id}`, {
        headers: {
          'user-id': user._id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      // Update the state with the latest user data
      const updatedUserData = {
        ...userData,
        level: calculateLevel(userData.points || 0)
      };
      
      setUser(updatedUserData);
      
      console.log('Updated user data:', {
        points: updatedUserData.points,
        totalTrips: updatedUserData.totalTrips,
        level: updatedUserData.level,
        profilePicture: updatedUserData.profilePicture
      });
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    }
  };

  const handleTaskComplete = async (placeIndex: number) => {
    if (!currentTrip) {
      console.error('No current trip selected');
      setError('No current trip selected');
      return;
    }

    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userCookie);
      console.log('Attempting to complete task:', {
        tripId: currentTrip._id,
        placeIndex,
        userId: user._id
      });

      // First verify the trip exists
      const tripResponse = await fetch(`/api/trips/${currentTrip._id}`, {
        headers: {
          'user-id': user._id
        }
      });

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(errorData.error || 'Trip not found');
      }

      const tripData = await tripResponse.json();
      console.log('Verified trip exists:', tripData._id);

      // Now complete the task
      const response = await fetch(`/api/trips/${currentTrip._id}/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user._id
        },
        body: JSON.stringify({ placeIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }

      // Check if all tasks are completed
      const updatedTripResponse = await fetch(`/api/trips/${currentTrip._id}`, {
        headers: {
          'user-id': user._id
        }
      });

      if (!updatedTripResponse.ok) {
        throw new Error('Failed to fetch updated trip data');
      }

      const updatedTrip = await updatedTripResponse.json();
      const allTasksCompleted = updatedTrip.places.every((place: any) => !place.isSelected);

      if (allTasksCompleted) {
        // Mark trip as completed
        const completeResponse = await fetch(`/api/trips/${currentTrip._id}/complete`, {
          method: 'POST',
          headers: {
            'user-id': user._id
          }
        });

        if (!completeResponse.ok) {
          throw new Error('Failed to mark trip as completed');
        }
      }

      // Show notifications if there are any
      const data = await response.json();
      if (data.progressUpdate) {
        setNotifications(data.progressUpdate);
        // Clear notifications after 5 seconds
        setTimeout(() => setNotifications({}), 5000);
      }

      // Refresh both trips and user data
      await Promise.all([fetchTrips(), fetchUserData()]);
      console.log('Task completed successfully');
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError(err.message);
      // If the trip is not found, refresh the trips list
      if (err.message.includes('Trip not found')) {
        await fetchTrips();
      }
    }
  };

  const handleLogout = () => {
    Cookies.remove('user');
    router.push('/login');
  };

  // Sort places to show completed tasks at the end
  const getSortedPlaces = (places: Trip['places']) => {
    return places.map((place, originalIndex) => ({
      ...place,
      originalIndex
    })).sort((a, b) => {
      if (a.isSelected === b.isSelected) return 0;
      return a.isSelected ? 1 : -1;
    });
  };

  // Calculate user level based on points
  const calculateLevel = (points: number) => {
    return Math.floor(points / 1000) + 1;
  };

  const handleDeleteTrip = async () => {
    if (!currentTrip) {
      setError('No trip selected to delete');
      return;
    }

    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        throw new Error('User not authenticated');
      }

      const user = JSON.parse(userCookie);
      console.log('Attempting to delete trip:', {
        tripId: currentTrip._id,
        userId: user._id
      });

      // First verify the trip exists
      const tripResponse = await fetch(`/api/trips/${currentTrip._id}`, {
        headers: {
          'user-id': user._id
        }
      });

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(errorData.details || errorData.error || 'Trip not found');
      }

      // Delete the trip
      const deleteResponse = await fetch(`/api/trips/${currentTrip._id}`, {
        method: 'DELETE',
        headers: {
          'user-id': user._id
        }
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to delete trip');
      }

      // Refresh both trips and user data
      await Promise.all([fetchTrips(), fetchUserData()]);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Error deleting trip:', err);
      setError(err.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Real-time notifications for new messages
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('joinRoom', { userId: user._id, otherUserId: null }); // Join a personal room for notifications
    console.log('Socket.IO: Joined notification room', `user-${user._id}`);
    socket.on('receiveMessage', (msg) => {
      console.log('Socket.IO: Received message notification', msg);
      // Only notify if the message is not from the current user
      if (msg.receiverId === user._id && msg.senderId !== user._id) {
        setUnreadMessages((prev) => {
          const existing = prev.find((u) => u.userId === msg.senderId);
          if (existing) {
            return prev.map((u) =>
              u.userId === msg.senderId ? { ...u, count: u.count + 1 } : u
            );
          } else {
            return [...prev, { userId: msg.senderId, fullName: msg.senderName || 'User', count: 1 }];
          }
        });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Mark messages as read when visiting a chat room
  useEffect(() => {
    const match = pathname.match(/\/chat\/([^/]+)/);
    if (!match) return;
    const chatUserId = match[1];
    setUnreadMessages((prev) => prev.filter((u) => u.userId !== chatUserId));
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {user?.fullName || 'User'}!
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/my-trips" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                My Trips
              </Link>
              <Link href="/leaderboard" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Leaderboard
              </Link>
              <Link href="/profile" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md">
                My Profile
              </Link>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => setShowDropdown((v) => !v)}
                  className="relative p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Notifications"
                >
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadMessages.reduce((sum, u) => sum + u.count, 0)}
                    </span>
                  )}
                </button>
                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2 font-semibold text-gray-700 border-b">New Messages</div>
                    {unreadMessages.length === 0 ? (
                      <div className="p-4 text-gray-500 text-sm">No new messages</div>
                    ) : (
                      <ul>
                        {unreadMessages.map((u) => (
                          <li key={u.userId}>
                            <Link
                              href={`/chat/${u.userId}`}
                              className="flex items-center px-4 py-2 hover:bg-blue-50 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <span className="font-medium text-blue-700">{u.fullName}</span>
                              <span className="ml-auto bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                                {u.count}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column (1/3 width) */}
            <div className="col-span-1 space-y-6">
              {/* Profile Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                      {user?.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{user?.fullName}</h2>
                    <p className="text-gray-600">{user?.email}</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-2 text-gray-700">Level {calculateLevel(user?.points || 0)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                        </svg>
                        <span className="ml-2 text-gray-700">{user?.points || 0} Points</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="ml-2 text-gray-700">{user?.totalTrips || 0} Trips</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Badges</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user?.badges?.length ? (
                      user.badges.map((badge, index) => (
                        <div key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          {badge}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No badges yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Past Trips Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Trips</h2>
                {pastTrips.length > 0 ? (
                  <div className="space-y-4">
                    {pastTrips.map(trip => (
                      <div key={trip._id} className="border-b pb-4 last:border-0">
                        <h3 className="font-medium text-gray-900">{trip.destination}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-primary mt-1">{trip.totalPoints} points</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No past trips yet</p>
                    <Link href="/plan-trip" className="text-primary hover:text-primary-dark mt-2 inline-block">
                      Explore more
                    </Link>
                  </div>
                )}
        </div>
      </div>

            {/* Right Column (2/3 width) - Current Trip Section */}
            <div className="col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Current Trip</h2>
                  {currentTrip && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Trip</span>
                    </button>
                  )}
                </div>
              {currentTrip ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{currentTrip.destination}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(currentTrip.startDate).toLocaleDateString()} - {new Date(currentTrip.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-3">
                      {getSortedPlaces(currentTrip.places).map((place) => (
                      <div
                          key={place.originalIndex}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          place.isSelected ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{place.name}</h4>
                          <p className="text-sm text-gray-600">{place.description}</p>
                        </div>
                        <button
                            onClick={() => handleTaskComplete(place.originalIndex)}
                          disabled={!place.isSelected}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            place.isSelected
                              ? 'bg-primary text-white hover:bg-primary-dark'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {place.isSelected ? 'Complete' : 'Completed'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {currentTrip.places.every(place => !place.isSelected) && (
                    <div className="mt-6 text-center">
                      <p className="text-green-600 mb-4">Congratulations! You've completed all tasks!</p>
                      <Link href="/plan-trip" className="btn-primary">
                        Plan a New Trip
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No current trip planned</p>
                  <Link href="/plan-trip" className="btn-primary">
                    Plan a New Trip
                  </Link>
                </div>
              )}
            </div>
          </div>
                    </div>
                </div>
                </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Trip</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this trip? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {(notifications.levelUp || notifications.newBadges?.length) && (
        <div className="fixed top-4 right-4 z-50">
          {notifications.levelUp && (
            <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <p className="font-bold">Level Up!</p>
              </div>
              <p>Congratulations! You've reached level {notifications.levelUp}!</p>
            </div>
          )}

          {notifications.newBadges?.map((badge, index) => (
            <div key={index} className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <p className="font-bold">New Badge!</p>
              </div>
              <p>You've earned the {badge} badge!</p>
            </div>
          ))}
      </div>
      )}
    </div>
  );
} 