
'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { Episode } from '@/types';

interface EpisodeContextType {
  episode: Episode | null;
  setEpisode: React.Dispatch<React.SetStateAction<Episode | null>>;
}

const EpisodeContext = createContext<EpisodeContextType | undefined>(undefined);

export const EpisodeProvider = ({ children }: { children: ReactNode }) => {
  const [episode, setEpisode] = useState<Episode | null>(null);

  // By using useMemo, we ensure that the context value object itself
  // is stable as long as `episode` and `setEpisode` don't change.
  // `setEpisode` from useState is guaranteed to be stable.
  const memoizedValue = useMemo(() => ({
    episode,
    setEpisode,
  }), [episode]);

  return (
    <EpisodeContext.Provider value={memoizedValue}>
      {children}
    </EpisodeContext.Provider>
  );
};

export const useEpisodeContext = () => {
  const context = useContext(EpisodeContext);
  if (context === undefined) {
    throw new Error('useEpisodeContext must be used within an EpisodeProvider');
  }
  return context;
};
