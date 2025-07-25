
'use client';

import React, { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { CustomThemeProvider } from '@/contexts/CustomThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// This component's redirection logic has been moved to AuthContext for reliability.
// Its main job now is to show a loading state and render children.
function AppContent({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add('font-sans');
  }, []);

  // Show a global loader only while authentication is being resolved,
  // but not on the public-facing landing page.
  if (loading && pathname !== '/') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      id="main-app-div" 
      className={cn("bg-background text-foreground", "flex flex-col min-h-screen")}
    >
      {children}
    </div>
  );
}

// This is the main boundary component that provides all the contexts.
export function AppClientBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <ModeProvider>
          <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="next-theme-mode">
            <CustomThemeProvider>
              <AppContent>
                {children}
              </AppContent>
              <Toaster />
            </CustomThemeProvider>
          </NextThemesProvider>
        </ModeProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}
