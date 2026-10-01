'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { calculateLevel, formatDate, formatPoints } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

interface UserProfilePageProps {
  params: {
    userId: string;
  };
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
  bio?: string;
  currentTrip?: {
    destination: string;
    startDate: string;
    endDate: string;
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = params;
  const router = useRouter();
  const { user: currentUser, loading: authLoading, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setIsOwnProfile(currentUser._id === userId);
    fetchUserProfile();
  }, [userId, currentUser, authLoading, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const userData = await response.json();
      setUser(userData);
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
      });
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user._id,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditing(false);
      await refreshUser();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    setSelectedFile(e.target.files[0]);
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('userId', user._id);

      const response = await fetch('/api/users/upload-profile', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const resData = await response.json();
      setUser((prev) => (prev ? { ...prev, profilePicture: resData.profilePicture } : null));
      setSelectedFile(null);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-slate-50">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">{error}</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full mt-2"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center max-w-sm w-full">
          <h2 className="text-lg font-bold text-slate-900 mb-2">User Not Found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full mt-2"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-canvas py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 mb-8">
          <div className="flex items-center space-x-2">
            <Link
              href="/leaderboard"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 -ml-1.5 rounded-lg"
              title="Back to Leaderboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Traveler Profile</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/chat/${userId}`}
              className="btn-primary text-sm shadow-xs inline-flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Send Message</span>
            </Link>
            <Link href="/leaderboard" className="btn-secondary text-sm">
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/90 overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 bg-blue-600 text-white flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar
              src={user.profilePicture}
              name={user.fullName}
              size="xl"
              className="ring-4 ring-white/20 shadow-md shrink-0"
            />
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                  Level {user.level} Explorer
                </span>
                <span className="text-xs text-blue-100 font-medium">
                  {user.totalTrips} Journeys
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {user.fullName}
              </h2>
              <p className="text-sm text-blue-100 mt-1 font-medium">
                {formatPoints(user.points)} Total Explorer Points
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Bio Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">About Explorer</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                {user.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* Current Trip Section with Google Maps */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Active Adventure</h3>
              {user.currentTrip ? (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{user.currentTrip.destination}</h4>
                    <p className="text-xs text-blue-700 font-medium mt-0.5">
                      {formatDate(user.currentTrip.startDate)} – {formatDate(user.currentTrip.endDate)}
                    </p>
                  </div>
                  <GoogleMapsButton
                    placeName={user.currentTrip.destination}
                    variant="compact"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs flex items-center space-x-2 border border-slate-100">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Active destination is kept private or no trip is currently scheduled.</span>
                </div>
              )}
            </div>

            {/* Badges Section */}
            {user.badges && user.badges.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Unlocked Badges ({user.badges.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs"
                    >
                      <span>🏅</span>
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 