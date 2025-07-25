
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { ALL_THEMES, DEFAULT_THEME_NAME, createAppThemeFromCustomColors, PREDEFINED_THEME_CLASS_NAMES } from '@/lib/themes';
import type { AppTheme } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCustomThemes } from '@/lib/userCustomThemesStore';
import { useToast } from '@/hooks/use-toast'; 
import { useUserSettings } from './UserSettingsContext';


interface CustomThemeContextType {
  currentThemeName: string;
  currentThemeClassName: string;
  setCurrentTheme: (themeName: string, themeClassName?: string) => void;
  cycleTheme: () => void;
  availableThemes: AppTheme[];
  refreshCustomThemes: () => Promise<void>;
  loadingCustomThemes: boolean;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

const DYNAMIC_STYLE_ID = 'dynamic-user-theme-styles';

const generateCustomThemeCss = (theme: AppTheme): string => {
  const { className, light, dark } = theme;
  let css = '';

  const generatePaletteCss = (palette: typeof light | typeof dark) => {
    return Object.entries(palette)
      .map(([key, value]) => {
        const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        return `  ${cssVarName}: ${value};`;
      })
      .join('\n');
  };

  css += `
html.light.${className},
html.${className}:not(.dark) {
${generatePaletteCss(light)}
  --dashboard-card-episode-title-color: var(--accent); 
  --dashboard-card-segment-title-color: var(--primary); 
  --dashboard-card-last-updated-text-color: var(--muted-foreground); 
  --dashboard-card-progress-text-color: 0 0% 0%; /* Fixed Black for light */
}
`;
  css += `
html.dark.${className} {
${generatePaletteCss(dark)}
  --dashboard-card-episode-title-color: var(--accent); 
  --dashboard-card-segment-title-color: var(--primary); 
  --dashboard-card-last-updated-text-color: var(--muted-foreground); 
  --dashboard-card-progress-text-color: 0 0% 100%; /* Fixed White for dark */
}
`;
  return css;
};


export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme: nextResolvedTheme } = useNextTheme(); 
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const { settings, updateSettings, loadingSettings } = useUserSettings(); // Get settings context
  const { toast } = useToast(); 
  const [userCustomThemes, setUserCustomThemes] = useState<AppTheme[]>([]);
  const [loadingCustomThemes, setLoadingCustomThemes] = useState(true);

  const defaultThemeObject = useMemo(() => ALL_THEMES.find(t => t.name === DEFAULT_THEME_NAME) || ALL_THEMES[0], []);
  const [currentCustomThemeName, setCurrentCustomThemeNameState] = useState<string>(defaultThemeObject.name);
  const [currentCustomThemeClassName, setCurrentCustomThemeClassNameState] = useState<string>(defaultThemeObject.className);

  const combinedAvailableThemes = useMemo(() => {
    const baseThemes = ALL_THEMES.length > 0 ? ALL_THEMES : [defaultThemeObject];
    return [...baseThemes, ...userCustomThemes];
  }, [userCustomThemes, defaultThemeObject]);

  const fetchAndProcessUserThemes = useCallback(async () => {
    setLoadingCustomThemes(true);
    if (user?.uid) {
      try {
        const rawCustomThemes = await getUserCustomThemes(user.uid);
        const processedThemes = rawCustomThemes.map(ct => 
          createAppThemeFromCustomColors(ct.name, ct.id, ct.primaryHex, ct.secondaryHex, ct.accentHex)
        );
        setUserCustomThemes(processedThemes);
        return processedThemes;
      } catch (error: any) {
        console.error("Error fetching user custom themes in CustomThemeContext:", error);
        if (error.message && error.message.includes("requires an index")) {
            toast({ 
                title: "Firestore Index Required", 
                description: "A Firestore index is needed for custom themes. Please check the browser console for a link to create it.", 
                variant: "destructive",
                duration: 10000 
            });
        }
        setUserCustomThemes([]); 
        return [];
      } finally {
        setLoadingCustomThemes(false);
      }
    } else {
      setUserCustomThemes([]);
      setLoadingCustomThemes(false);
      return [];
    }
  }, [user, toast]); 

  useEffect(() => {
    fetchAndProcessUserThemes();
  }, [fetchAndProcessUserThemes]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !loadingSettings && !loadingCustomThemes) {
      const storedThemeName = settings.themeColor || defaultThemeObject.name;
      const foundTheme = combinedAvailableThemes.find(t => t.name === storedThemeName);

      const themeToApply = foundTheme || defaultThemeObject;

      setCurrentCustomThemeNameState(themeToApply.name);
      setCurrentCustomThemeClassNameState(themeToApply.className);
    }
  }, [isMounted, settings, combinedAvailableThemes, defaultThemeObject, loadingCustomThemes, loadingSettings]);


  useEffect(() => {
    if (isMounted && nextResolvedTheme && !loadingCustomThemes && currentCustomThemeClassName) {
      const htmlElement = document.documentElement;
      let currentClasses = htmlElement.className.split(' ').filter(cls => cls.trim() !== '' && !cls.startsWith('theme-'));

      currentClasses.push(currentCustomThemeClassName);
      
      if (nextResolvedTheme === 'dark') {
        if (!currentClasses.includes('dark')) currentClasses.push('dark');
        currentClasses = currentClasses.filter(cls => cls !== 'light');
      } else { 
        if (!currentClasses.includes('light')) currentClasses.push('light');
        currentClasses = currentClasses.filter(cls => cls !== 'dark');
      }
      
      htmlElement.className = currentClasses.join(' ');

      let dynamicStyleTag = document.getElementById(DYNAMIC_STYLE_ID) as HTMLStyleElement | null;
      const selectedThemeObject = combinedAvailableThemes.find(t => t.className === currentCustomThemeClassName);
      
      if (selectedThemeObject && !PREDEFINED_THEME_CLASS_NAMES.includes(currentCustomThemeClassName)) {
        if (!dynamicStyleTag) {
          dynamicStyleTag = document.createElement('style');
          dynamicStyleTag.id = DYNAMIC_STYLE_ID;
          document.head.appendChild(dynamicStyleTag);
        }
        dynamicStyleTag.innerHTML = generateCustomThemeCss(selectedThemeObject);
      } else {
        if (dynamicStyleTag) {
          dynamicStyleTag.innerHTML = '';
        }
      }
    }
  }, [isMounted, currentCustomThemeClassName, nextResolvedTheme, combinedAvailableThemes, loadingCustomThemes]);


  const setCurrentTheme = useCallback((themeName: string, themeClassNameParam?: string) => {
    const themeToSet = combinedAvailableThemes.find(t => t.name === themeName);
    
    if (themeToSet) {
      setCurrentCustomThemeNameState(themeToSet.name);
      setCurrentCustomThemeClassNameState(themeToSet.className);
    } else if (themeName && themeClassNameParam) { 
      setCurrentCustomThemeNameState(themeName);
      setCurrentCustomThemeClassNameState(themeClassNameParam);
    } else {
      setCurrentCustomThemeNameState(defaultThemeObject.name);
      setCurrentCustomThemeClassNameState(defaultThemeObject.className);
    }
  }, [combinedAvailableThemes, defaultThemeObject]);

  const cycleTheme = useCallback(async () => {
    if (combinedAvailableThemes.length === 0) return;
    const currentIndex = combinedAvailableThemes.findIndex(theme => theme.name === currentCustomThemeName);
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * combinedAvailableThemes.length);
    } while (combinedAvailableThemes.length > 1 && nextIndex === currentIndex); 
    
    const nextThemeObject = combinedAvailableThemes[nextIndex];
    if (nextThemeObject) {
      setCurrentTheme(nextThemeObject.name, nextThemeObject.className);
      await updateSettings({ themeColor: nextThemeObject.name }); // Persist change
      toast({ 
        title: "Theme Cycled!",
        description: `Switched to "${nextThemeObject.name}".`,
        isThemeToast: true, // Special flag for our new logic
      });
    }
  }, [currentCustomThemeName, combinedAvailableThemes, toast, setCurrentTheme, updateSettings]);

  const refreshCustomThemes = useCallback(async () => { 
    await fetchAndProcessUserThemes();
  }, [fetchAndProcessUserThemes]); 

  const memoizedValue = useMemo(() => ({
    currentThemeName: currentCustomThemeName,
    currentThemeClassName: currentCustomThemeClassName,
    setCurrentTheme,
    cycleTheme,
    availableThemes: combinedAvailableThemes,
    refreshCustomThemes,
    loadingCustomThemes,
  }), [currentCustomThemeName, currentCustomThemeClassName, setCurrentTheme, cycleTheme, combinedAvailableThemes, refreshCustomThemes, loadingCustomThemes]);

  return (
    <CustomThemeContext.Provider value={memoizedValue}>
      {children}
    </CustomThemeContext.Provider>
  );
};

export const useCustomTheme = () => {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
};
