
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserThemeSettings } from '@/types';
import { DEFAULT_THEME_NAME } from '@/lib/themes';
import { DEFAULT_APP_MODE_NAME } from '@/lib/modes';

const defaultSettings: UserThemeSettings = {
  themeColor: DEFAULT_THEME_NAME,
  fontFamily: 'sans',
  textShadow: 'subtle-outline',
  hasSeenNewEpisodeDefaultsInfo: false,
  hasProvisionedInitialContent: false,
  tutorialViewedAt: null,
  showProTips: true,
  guidedTourDashboardCompleted: false,
  guidedTourSettingsCompleted: false,
  selectedAppModeName: DEFAULT_APP_MODE_NAME,
  userClearedMockEpisodesOnce: false, 
};

interface UserSettingsContextType {
  settings: UserThemeSettings;
  loadingSettings: boolean;
  refreshUserSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserThemeSettings>) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserThemeSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadUserSettings = useCallback(async (userId: string) => {
    setLoadingSettings(true);
    try {
      const docRef = doc(db, 'usersettings', userId);
      const docSnap = await getDoc(docRef);
      let resolvedSettings: UserThemeSettings;
      if (docSnap.exists()) {
        const userSpecificSettings = docSnap.data() as Partial<UserThemeSettings>;
        resolvedSettings = { ...defaultSettings, ...userSpecificSettings };
      } else {
        // Critical Fix: If the document does not exist, create it with defaults.
        await setDoc(docRef, defaultSettings);
        resolvedSettings = defaultSettings;
      }
      setSettings(resolvedSettings);
      localStorage.setItem(`user-theme-settings-${userId}`, JSON.stringify(resolvedSettings));
    } catch (error) {
      console.error("Error loading user settings from Firestore:", error);
      const cachedSettings = localStorage.getItem(`user-theme-settings-${userId}`);
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      } else {
        setSettings(defaultSettings);
      }
    } finally {
        setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoadingSettings(true);
      return;
    }
    if (user?.uid) {
      loadUserSettings(user.uid);
    } else {
      setSettings(defaultSettings);
      setLoadingSettings(false);
    }
  }, [user, authLoading, loadUserSettings]);

  const refreshUserSettings = useCallback(async () => {
    if (user?.uid) {
      await loadUserSettings(user.uid);
    } else {
      setSettings(defaultSettings);
    }
  }, [user, loadUserSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<UserThemeSettings>) => {
    const currentUserId = user?.uid;
    
    // Optimistic UI update
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    if (currentUserId) {
      try {
        localStorage.setItem(`user-theme-settings-${currentUserId}`, JSON.stringify(updatedSettings));
        const docRef = doc(db, 'usersettings', currentUserId);
        // Use set with merge to create the document if it somehow doesn't exist, or update it if it does.
        await setDoc(docRef, newSettings, { merge: true });
      } catch (error: any) {
        console.error("Error updating user settings in Firestore:", error);
        // Optionally revert optimistic update on error
        // refreshUserSettings(); 
      }
    }
  }, [user, settings]);

  const memoizedValue = useMemo(() => ({
    settings,
    loadingSettings,
    refreshUserSettings,
    updateSettings
  }), [settings, loadingSettings, refreshUserSettings, updateSettings]);

  return (
    <UserSettingsContext.Provider value={memoizedValue}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};
