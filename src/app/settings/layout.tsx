
'use client';

import Navbar from '@/components/layout/Navbar';
import { APP_NAME } from '@/lib/constants';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, Users, BarChart3, Palette, Library, Briefcase, Construction } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const settingsNavItems = [
  { href: '/settings', label: 'General', icon: Settings },
  { href: '/settings/teams', label: 'Teams', icon: Briefcase, comingSoon: true },
  { href: '/settings/community', label: 'Community', icon: Users, comingSoon: true },
  { href: '/settings/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-1/4 lg:w-1/5">
            <TooltipProvider>
              <nav className="flex flex-row md:flex-col gap-2 sticky top-20">
                {settingsNavItems.map(item => {
                  const isActive = pathname === item.href;
                  if (item.comingSoon) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all cursor-not-allowed opacity-50'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="hidden md:inline">{item.label}</span>
                            <Construction className="h-4 w-4 ml-auto text-yellow-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Coming Soon!</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        isActive && 'bg-muted text-primary font-semibold'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </TooltipProvider>
          </aside>
          <div className="w-full md:w-3/4 lg:w-4/5">
            {children}
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © 2026 JORDIE CRUZ LLC. All rights reserved.
      </footer>
    </div>
  );
}
