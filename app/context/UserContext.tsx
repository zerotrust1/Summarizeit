'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isPremium: boolean;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
  quotaResetAt: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Telegram initData if available
      const initData = typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData : undefined;

      if (!initData) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data.profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on mount and when initData changes
  useEffect(() => {
    fetchUserProfile();

    // Refresh profile every 30 seconds to keep quota in sync
    const interval = setInterval(fetchUserProfile, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshProfile = async () => {
    await fetchUserProfile();
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshProfile, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
