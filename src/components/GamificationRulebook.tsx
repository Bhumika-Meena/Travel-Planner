'use client';

import React, { useState } from 'react';
import { BADGES, LEVEL_THRESHOLDS, LEVEL_NAMES } from '@/lib/gamification';

export function GamificationRulebook() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'points' | 'levels' | 'badges'>('points');

  return (
    <div className="surface mb-8 border border-slate-200/80 overflow-hidden shadow-xs transition-all">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            🎯
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Explorer Rewards & Gamification Rulebook
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Official Guide
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              How points work (10/12/15 pts), level thresholds, and unlockable badges
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 ml-3">
          <span className="text-xs font-semibold text-blue-600 hidden sm:inline-block">
            {isOpen ? 'Hide Rulebook' : 'View Rulebook'}
          </span>
          <div
            className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/40">
          {/* Internal Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-200/70 pb-3 mb-5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'points'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🎯 How Points Work (10 / 12 / 15 pts)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('levels')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'levels'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📈 Explorer Levels (1 – 10+)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'badges'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🏆 Badges & Milestones (10 Badges)
            </button>
          </div>

          {/* TAB 1: HOW POINTS WORK */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Points are calculated server-authoritatively based on the detail and scope of each activity in your itinerary. Completing activities on your trip awards verified exploration points directly to your account.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 10 pts */}
                <div className="p-4 rounded-xl border border-blue-200/70 bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard Spot</span>
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        +10 pts
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Quick Stop / Landmark</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Standard activity or landmark with concise notes (under 50 characters).
                    </p>
                  </div>
                  <div className="mt-3 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                    Base reward for all itinerary places
                  </div>
                </div>

                {/* 12 pts */}
                <div className="p-4 rounded-xl border border-indigo-200/70 bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Detailed Spot</span>
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        +12 pts
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Curated Activity</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Rich activity details with &ge; 50 characters of sightseeing context or cultural history.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 text-[11px] text-indigo-500 font-medium border-t border-slate-100">
                    50+ characters in description
                  </div>
                </div>

                {/* 15 pts */}
                <div className="p-4 rounded-xl border border-amber-200/80 bg-white shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Comprehensive</span>
                      <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        +15 pts
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">Major Expedition</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      In-depth guide with &ge; 100 characters detailing schedule, tips, or full excursions.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 text-[11px] text-amber-600 font-medium border-t border-slate-100">
                    100+ characters in description
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/40 text-[11px] text-blue-900 flex items-start space-x-2">
                <span className="text-sm shrink-0">💡</span>
                <span>
                  <strong>Anti-Cheat Verification:</strong> Potential points shown in the planner become verified exploration points only when you check off landmarks in your active trip dashboard.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: LEVELS */}
          {activeTab === 'levels' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                As you complete activities, your total verified points push you through 10 progressive tiers. Beyond Level 10, infinite prestige scaling unlocks +1 level for every 1,500 points earned.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {LEVEL_THRESHOLDS.map((threshold, idx) => {
                  const levelNum = idx + 1;
                  const nextThreshold = LEVEL_THRESHOLDS[idx + 1];
                  const title = LEVEL_NAMES[levelNum] || 'Explorer';
                  const isMax = idx === LEVEL_THRESHOLDS.length - 1;

                  return (
                    <div
                      key={levelNum}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-black text-[10px] flex items-center justify-center">
                          L{levelNum}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {isMax ? '3,500+ pts' : `${threshold}–${nextThreshold - 1} pts`}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs mt-2 truncate" title={title}>
                        {title}
                      </h5>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>⭐ <strong>Prestige Levels:</strong> Level 11 and beyond grant +1 level per 1,500 points.</span>
                <span className="font-bold text-blue-600">Level 10+</span>
              </div>
            </div>
          )}

          {/* TAB 3: BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Earn permanent achievement badges showcased on your public profile and on the global leaderboard.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BADGES.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs flex items-start space-x-3"
                  >
                    <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      {b.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-slate-900 text-xs truncate">{b.name}</h5>
                        {b.id === 'first_step' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            First Activity
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
