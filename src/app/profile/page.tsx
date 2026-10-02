'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeInput, validateEmail, validateName, validateBio } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

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
  isTripPublic?: boolean;
  currentTrip?: {
    destination: string;
    startDate: string;
    endDate: string;
  };
}

const formatPoints = (points: number): string => {
  return points.toLocaleString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function Profile() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bio: '',
    isTripPublic: false
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    bio: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchUserData = useCallback(async (id?: string) => {
    try {
      const targetId = id || user?._id || authUser?._id;
      if (!targetId) return;

      const response = await fetch(`/api/users/${targetId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      setUser(userData);
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
        bio: userData.bio || '',
        isTripPublic: userData.isTripPublic === true
      });
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id, authUser?._id]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }

    setFormData({
      fullName: authUser.fullName,
      email: authUser.email,
      bio: authUser.bio || '',
      isTripPublic: false
    });
    fetchUserData(authUser._id);
  }, [authUser, authLoading, router, fetchUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      fullName: '',
      email: '',
      bio: ''
    };

    let isValid = true;

    if (!validateName(formData.fullName)) {
      newErrors.fullName = 'Please enter a valid name (2-50 characters, letters, spaces, hyphens, and apostrophes only)';
      isValid = false;
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (formData.bio && !validateBio(formData.bio)) {
      newErrors.bio = 'Bio can only contain letters, numbers, spaces, and common punctuation (max 500 characters)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user._id
        },
        body: JSON.stringify(formData)
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

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size client-side (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please select a smaller file.');
      e.target.value = '';
      return;
    }

    // Validate MIME type client-side
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Invalid format. Only JPG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadError('');
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user._id);

      const response = await fetch('/api/users/upload-profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile picture');
      }

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setUser(prev => (prev ? { ...prev, profilePicture: data.profilePicture } : null));
      setUploadSuccess('Profile picture updated successfully!');
      await refreshUser();
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setUploadError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="page-canvas flex items-center justify-center text-slate-500 text-sm">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page-canvas">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <Link href="/dashboard" className="btn-secondary self-start">
            Back to Dashboard
          </Link>
        </div>

        <div className="surface p-6 sm:p-8">
          {/* Profile header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative shrink-0">
              <Avatar
                src={previewUrl || user.profilePicture}
                name={user.fullName}
                size="xl"
              />
              {previewUrl && (
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  Preview
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.fullName}</h1>
              <div className="mt-2 space-y-1">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-2 text-slate-700">Level {user.level}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                  </svg>
                  <span className="ml-2 text-slate-700">{formatPoints(user.points)} Points</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-2 text-slate-700">{user.totalTrips} Trips</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Trip Section */}
          <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">Current Adventure</h3>
              {user.currentTrip && (
                <GoogleMapsButton
                  placeName={user.currentTrip.destination}
                  variant="pill"
                />
              )}
            </div>
            <div>
              {user.currentTrip ? (
                <div className="space-y-1">
                  <p className="text-blue-950 font-bold text-base">
                    {user.currentTrip.destination}
                  </p>
                  <p className="text-blue-700 text-xs font-medium">
                    {formatDate(user.currentTrip.startDate)} – {formatDate(user.currentTrip.endDate)}
                  </p>
                </div>
              ) : (
                <p className="text-blue-700 text-xs">No active trip currently in progress</p>
              )}
            </div>
          </div>

          {/* Profile editing form */}
          <div className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={`input-field ${
                    errors.fullName ? 'border-red-500' : ''
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={`input-field ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="form-label">
                  Bio
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!editing}
                  rows={3}
                  className={`input-field ${
                    errors.bio ? 'border-red-500' : ''
                  }`}
                  placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
              </div>

              {/* Trip Privacy Setting */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isTripPublic"
                      name="isTripPublic"
                      type="checkbox"
                      checked={formData.isTripPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isTripPublic: e.target.checked }))}
                      disabled={!editing}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded disabled:opacity-60 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isTripPublic" className="font-medium text-slate-700 cursor-pointer">
                      Share Current Trip on Public Profile
                    </label>
                    <p className="text-slate-500 text-xs mt-0.5">
                      When unchecked (default), your active destination and travel dates remain strictly private and invisible to other travelers.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">
                  Profile Picture
                </label>
                <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, or WebP up to 5MB</p>

                {uploadError && (
                  <div className="mt-2 alert-error flex items-center">
                    <svg className="w-4 h-4 mr-2 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-2 alert-success flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfilePictureChange}
                    className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleProfilePictureUpload}
                        disabled={uploading}
                        className="btn-primary"
                      >
                        {uploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          'Upload Picture'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPreview}
                        disabled={uploading}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="btn-primary"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Badges section */}
          {user.badges && user.badges.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Badges</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="badge-pill bg-amber-50 text-amber-800 border border-amber-200/70"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 