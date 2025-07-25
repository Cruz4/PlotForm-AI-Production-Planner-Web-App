
'use client';
import React from 'react';
import DashboardBoardView from '@/components/dashboard/DashboardBoardView';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContextMode } from '@/contexts/ModeContext';
import { getAllEpisodesForUserFromDb } from '@/lib/episodeStore';
import { Loader2 } from 'lucide-react';
import type { Episode } from '@/types';

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentMode, isLoadingMode } = useAppContextMode();
  const [episodes, setEpisodes] = React.useState<Episode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (user?.uid && currentMode) {
      setIsLoading(true);
      getAllEpisodesForUserFromDb(user.uid)
        .then(setEpisodes)
        .finally(() => setIsLoading(false));
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, currentMode]);

  if (authLoading || isLoadingMode || isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentMode) {
    return <div className="p-4 text-center">Loading application mode...</div>;
  }
  
  return <DashboardBoardView episodes={episodes} currentMode={currentMode} />;
}
