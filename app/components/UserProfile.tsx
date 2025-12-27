'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/app/context/UserContext';
import ProfileModal from './ProfileModal';

export default function UserProfile() {
  const { user, loading } = useUser();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse w-10 h-10 bg-gray-300 rounded-full" />
    );
  }

  if (!user) {
    return null;
  }

  // Get initials for fallback avatar
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
        title={`${user.firstName} ${user.lastName}`.trim()}
      >
        {/* Profile Picture */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={`${user.firstName} ${user.lastName}`.trim()}
              fill
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback to initials if image fails to load
              }}
              unoptimized
            />
          ) : null}

          {/* Initials fallback */}
          {!user.photoUrl && (
            <span className="text-white text-sm font-bold">{initials}</span>
          )}

          {/* Premium badge */}
          {user.isPremium && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
              ✓
            </div>
          )}
        </div>

        {/* Name & Status */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user.isPremium ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                Premium
              </span>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">
                {user.quotaRemaining}/{user.quotaLimit} left
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Profile Modal */}
      <ProfileModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
