
'use client';

import Navbar from '@/components/layout/Navbar';
import { APP_NAME } from '@/lib/constants';
import type { ReactNode } from 'react';

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © 2026 JORDIE CRUZ LLC. All rights reserved.
      </footer>
    </div>
  );
}
