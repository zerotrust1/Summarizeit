'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/app/context/UserContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useUser();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const quotaPercentage = Math.round((user.quotaUsed / user.quotaLimit) * 100);

  const resetDate = new Date(user.quotaResetAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <>
      {/* Backdrop with Blur - Smooth Transition */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
          isOpen
            ? 'backdrop-blur-sm bg-black/30'
            : 'backdrop-blur-0 bg-black/0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal - Smooth Slide & Fade */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`bg-white dark:bg-gradient-to-b dark:from-gray-850 dark:to-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${
            isOpen ? 'scale-100' : 'scale-95'
          }`}
        >
          {/* Header - Minimal Design */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold tracking-wide">Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Close profile"
            >
              ✕
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {/* Profile Picture Section - Centered & Minimal */}
            <div className="flex flex-col items-center pt-4">
              {/* Avatar */}
              <div className="relative mb-4 animate-fade-in">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/30">
                  {user.photoUrl ? (
                    <Image
                      src={user.photoUrl}
                      alt={fullName}
                      fill
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                    </span>
                  )}

                  {/* Premium Badge */}
                  {user.isPremium && (
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-3 border-white dark:border-gray-900 shadow-md animate-pulse">
                      ⭐
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Username */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                {fullName}
              </h3>
              {user.username && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                  @{user.username}
                </p>
              )}
            </div>

            {/* Status Badge - Simplified */}
            <div className="flex justify-center">
              {user.isPremium ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-full border border-yellow-200 dark:border-yellow-800">
                  <span className="text-lg">⭐</span>
                  <span className="font-medium text-yellow-800 dark:text-yellow-300">Premium</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                  <span className="text-lg">📊</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Free Plan</span>
                </div>
              )}
            </div>

            {/* Quota Section (only show if not premium) - Simplified */}
            {!user.isPremium && (
              <div className="space-y-3">
                {/* Quota Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Daily Quota
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.quotaUsed}/{user.quotaLimit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${quotaPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Remaining Count - Highlighted */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-4 text-center">
                  {user.quotaRemaining > 0 ? (
                    <div>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {user.quotaRemaining}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        remaining today
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        Limit Reached
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Reset in {diffHours}h {diffMins}m
                      </p>
                    </div>
                  )}
                </div>

                {/* Reset Time - Minimal */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  ⏰ Resets at {resetDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Premium Upsell (for free users) - Sleek CTA */}
            {!user.isPremium && (
              <button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg active:scale-95 transform">
                <span className="flex items-center justify-center gap-2">
                  <span>⭐</span>
                  Upgrade to Premium
                </span>
              </button>
            )}

            {/* Account Info - Minimal */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center font-mono">
                ID: {user.userId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
