'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';

export default function Home() {
  const { user } = useAuth();

  const previewPlaces = [
    { name: 'Fushimi Inari-Taisha', tag: 'Shrine & Hiking', pts: 5, time: 'Morning' },
    { name: 'Kinkaku-ji (Golden Pavilion)', tag: 'Zen Temple', pts: 4, time: 'Midday' },
    { name: 'Arashiyama Bamboo Grove', tag: 'Nature Walk', pts: 4, time: 'Afternoon' },
  ];

  return (
    <div className="page-canvas">
      {/* Top Navbar */}
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
                href="/about"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-block"
              >
                About
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn-primary shadow-xs">
                  <span>Go to Dashboard</span>
                  <span aria-hidden="true" className="ml-1">&rarr;</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary text-sm">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary text-sm shadow-xs">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 sm:pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                <span>AI itineraries with explorer rewards</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.12]">
                Plan trips with clarity.
                <span className="block text-blue-600 mt-1">Travel with purpose.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Generate tailored day-by-day travel itineraries in seconds with AI. Check off real-world landmarks, view pins directly on Google Maps, earn explorer points, and climb the traveler ranks.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href={user ? '/plan-trip' : '/register'}
                  className="w-full sm:w-auto btn-primary px-7 py-3.5 text-base"
                >
                  <span>{user ? 'Plan a New Trip' : 'Start Planning Free'}</span>
                  <span aria-hidden="true" className="ml-2">&rarr;</span>
                </Link>
                <Link
                  href="/about"
                  className="w-full sm:w-auto btn-secondary px-6 py-3.5 text-base rounded-xl font-semibold"
                >
                  Explore Features
                </Link>
              </div>

              {/* Trust & Stats Ticker */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">AI</div>
                  <div className="text-xs text-slate-500 font-medium">Smart Itineraries</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600 tracking-tight">1-Click</div>
                  <div className="text-xs text-slate-500 font-medium">Google Maps Pin</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">XP</div>
                  <div className="text-xs text-slate-500 font-medium">Explorer Rewards</div>
                </div>
              </div>
            </motion.div>

            {/* Right Visual Preview Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative mx-auto max-w-md">
                <div className="relative bg-white rounded-2xl shadow-elevated border border-slate-200/80 overflow-hidden">
                  <div className="p-5 bg-blue-600 text-white">
                    <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 font-semibold backdrop-blur-xs">
                        Active Journey
                      </span>
                      <span>Apr 12 – Apr 18</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <h3 className="text-xl font-extrabold text-white">Kyoto, Japan</h3>
                      <span className="text-xs font-bold px-2 py-0.5 bg-emerald-400 text-slate-900 rounded-full">
                        Level 4 Explorer
                      </span>
                    </div>
                  </div>

                  {/* Landmarks List Preview */}
                  <div className="p-5 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>Curated Itinerary</span>
                      <span>Map & Reward</span>
                    </div>

                    {previewPlaces.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                          </div>
                          <p className="text-xs text-slate-400 ml-5.5 mt-0.5">{p.tag}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <GoogleMapsButton placeName={p.name} destination="Kyoto, Japan" variant="pill" />
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{p.pts} pts
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center text-emerald-600 font-medium">
                        ✓ Real-time Sync & Offline Ready
                      </span>
                      <span className="text-blue-600 font-semibold">+13 pts total</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Grid Section */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="section-kicker mb-2">
              Everything You Need
            </h2>
            <p className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
              Built for real travel days
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-card hover:shadow-elevated hover:border-slate-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-4">
                🗺️
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Google Maps Connected</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Open every planned landmark directly into Google Maps with one click for turn-by-turn navigation and directions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-card hover:shadow-elevated hover:border-slate-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl mb-4">
                🏆
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Gamified Exploration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Turn your vacations into real-life quests. Check off places to gain points, unlock badges, and level up your traveler rank.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-card hover:shadow-elevated hover:border-slate-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mb-4">
                💬
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Messaging</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Coordinate with travel companions or connect with fellow globetrotters using real-time Socket.IO chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Travel Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}
 