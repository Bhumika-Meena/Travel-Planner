'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon, 
  ShieldCheckIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

export default function AboutPage() {
  const { user } = useAuth();

  const features = [
    {
      title: 'AI-Powered Itineraries',
      description: 'Generate comprehensive day-by-day travel plans customized to your travel style, pace, and destination preferences.',
      icon: SparklesIcon,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Gamification & Rewards',
      description: 'Turn your adventures into a game. Earn points for completed tasks, level up from Novice to Legend, and unlock unique badges.',
      icon: TrophyIcon,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Real-Time Traveler Chat',
      description: 'Connect with fellow explorers via instant Socket.IO messaging to share tips, recommendations, and coordinate meetup plans.',
      icon: ChatBubbleLeftRightIcon,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Privacy & Security First',
      description: 'Your travel schedule and location are private by default. Choose when and with whom you share your active trips.',
      icon: ShieldCheckIcon,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Your Trip',
      desc: 'Pick your destination, dates, and budget. Our AI structures optimal itineraries tailored specifically for you.',
    },
    {
      step: '02',
      title: 'Explore & Check Off',
      desc: 'Follow curated landmarks and activities. Mark places complete as you experience them in the real world.',
    },
    {
      step: '03',
      title: 'Level Up & Connect',
      desc: 'Rack up verified points, climb the global leaderboard, and chat with fellow travelers along the way.',
    },
  ];

  return (
    <div className="page-canvas">
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="brand-mark group-hover:bg-blue-700 transition-colors">✈</div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Travel<span className="text-blue-600">Planner</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                href="/" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-block"
              >
                Home
              </Link>
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="btn-primary text-sm shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="btn-secondary text-sm"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="btn-primary text-sm shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto pt-8 sm:pt-16 pb-12"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <MapPinIcon className="w-4 h-4" />
              <span>Smart Itineraries & Community</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
              About <span className="text-blue-600">Travel Planner</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              We reimagined itinerary planning into an interactive, gamified journey. 
              Discover hidden gems, stay organized effortlessly, and connect with fellow explorers worldwide.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={user ? "/plan-trip" : "/register"}
                className="btn-primary px-6 py-3"
              >
                <span>{user ? "Plan a New Trip" : "Start Planning Free"}</span>
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/"
                className="btn-secondary px-6 py-3"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>

          {/* Core Feature Highlights */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-card hover:shadow-elevated transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center mb-6 shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* How It Works */}
          <div className="mt-20 pt-12 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
              <p className="mt-3 text-slate-600">From first idea to finished itinerary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.step} className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-card">
                  <div className="text-4xl font-bold text-blue-600/20 mb-3">{s.step}</div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Trust Badge */}
          <div className="mt-16 p-8 rounded-2xl bg-blue-50/70 border border-blue-100 text-center max-w-3xl mx-auto">
            <CheckCircleIcon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900">Your Privacy is Protected</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We believe in respectful travel sharing. Your live itinerary dates and destinations are never displayed on public leaderboards or profiles unless you explicitly opt in.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Travel Planner. All rights reserved.</div>
          <div className="flex space-x-6">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors font-medium text-blue-600">About</Link>
            <Link href="/leaderboard" className="hover:text-blue-600 transition-colors">Leaderboard</Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
