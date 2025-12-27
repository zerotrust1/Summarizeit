'use client';

import React from 'react';
import Image from 'next/image';
import { useUser } from '@/app/context/UserContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useUser();

  if (!isOpen || !user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const quotaPercentage = Math.round((user.quotaUsed / user.quotaLimit) * 100);
  const filledBars = Math.floor((user.quotaUsed / user.quotaLimit) * 10);
  const emptyBars = 10 - filledBars;
  const quotaBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

  const resetDate = new Date(user.quotaResetAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                {user.photoUrl ? (
                  <Image
                    src={user.photoUrl}
                    alt={fullName}
                    fill
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                  </span>
                )}

                {/* Premium Badge */}
                {user.isPremium && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold border-2 border-white">
                    ✓
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                {fullName}
              </h3>
              {user.username && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  @{user.username}
                </p>
              )}
            </div>

            {/* Premium Status */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
              {user.isPremium ? (
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full mb-2">
                    <span className="text-lg">⭐</span>
                    <span className="font-semibold">Premium Active</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Unlimited summaries
                  </p>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full mb-2">
                    <span className="text-lg">⚪</span>
                    <span className="font-semibold">Free Plan</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Limited to 10 summaries/day
                  </p>
                </div>
              )}
            </div>

            {/* Quota Section (only show if not premium) */}
            {!user.isPremium && (
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  📊 Daily Quota
                </h4>

                {/* Quota Bar */}
                <div className="mb-3">
                  <div className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-2">
                    {quotaBar}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {user.quotaUsed}/{user.quotaLimit} summaries used ({quotaPercentage}%)
                  </p>
                </div>

                {/* Remaining Info */}
                <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
                  {user.quotaRemaining > 0 ? (
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {user.quotaRemaining}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Summaries remaining today
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        Limit Reached
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reset in {diffHours}h {diffMins}m
                      </p>
                    </div>
                  )}
                </div>

                {/* Reset Time */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  ⏰ Resets at{' '}
                  {resetDate.toLocaleTimeString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Premium Upsell (for free users) */}
            {!user.isPremium && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:from-opacity-20 dark:to-purple-900 dark:to-opacity-20 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Upgrade to Premium
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Get unlimited summaries
                </p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow">
                  Upgrade Now
                </button>
              </div>
            )}

            {/* Account Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>User ID:</span>
                <span className="font-mono text-gray-900 dark:text-white">{user.userId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
