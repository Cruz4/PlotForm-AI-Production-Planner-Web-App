
'use client';

import { EpisodeProvider } from '@/contexts/EpisodeContext';
import type { ReactNode } from 'react';

/**
 * This layout is now a simple, stable wrapper.
 * Its only job is to provide the EpisodeContext to the page below it.
 * All data fetching and logic has been moved into the page.tsx component
 * to resolve the infinite re-render loop.
 */
export default function EpisodePageLayout({ children }: { children: ReactNode }) {
  return <EpisodeProvider>{children}</EpisodeProvider>;
}
