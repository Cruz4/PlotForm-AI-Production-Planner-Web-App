
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode, useCallback } from 'react';
import type { AppMode } from '@/types';
import { ALL_APP_MODES, DEFAULT_APP_MODE_NAME, getDefaultAppMode } from '@/lib/modes';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';

interface ModeContextType {
  currentMode: AppMode;
  setMode: (modeName: string) => Promise<void>;
  isLoadingMode: boolean;
  ALL_APP_MODES: AppMode[]; // Added this to the context type
  getDefaultAppMode: () => AppMode; // Expose the default getter
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { settings, updateSettings, loadingSettings } = useUserSettings();
  
  const [currentMode, setCurrentMode] = useState<AppMode>(getDefaultAppMode());
  const [isLoadingMode, setIsLoadingMode] = useState(true);

  useEffect(() => {
    if (loadingSettings || authLoading) return;

    const modeName = settings.selectedAppModeName || DEFAULT_APP_MODE_NAME;
    const mode = ALL_APP_MODES.find(m => m.modeName === modeName) || getDefaultAppMode();
    setCurrentMode(mode);
    setIsLoadingMode(false);
  }, [settings.selectedAppModeName, loadingSettings, authLoading]);

  const setMode = useCallback(async (modeName: string) => {
    setIsLoadingMode(true);
    const newMode = ALL_APP_MODES.find(m => m.modeName === modeName) || getDefaultAppMode();
    await updateSettings({ selectedAppModeName: newMode.modeName });
    // The useEffect above will handle setting the currentMode and isLoadingMode
  }, [updateSettings]);

  const memoizedValue = useMemo(() => ({
    currentMode,
    setMode,
    isLoadingMode,
    ALL_APP_MODES, // Provide the array in the context value
    getDefaultAppMode,
  }), [currentMode, setMode, isLoadingMode]);

  return (
    <ModeContext.Provider value={memoizedValue}>
      {children}
    </ModeContext.Provider>
  );
};

export const useAppContextMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useAppContextMode must be used within a ModeProvider');
  }
  return context;
};
