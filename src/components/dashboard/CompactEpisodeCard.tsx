
'use client';

import type { Episode, AppMode } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle, Archive, Eye, Brain, Edit, CalendarClock } from 'lucide-react';
import PublishedEpisodeModal from '@/components/episodes/PublishedEpisodeModal';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CompactEpisodeCardProps {
  episode: Episode;
  currentMode: AppMode;
  onEpisodeUpdate?: () => void;
}

export default function CompactEpisodeCard({ episode, currentMode, onEpisodeUpdate }: CompactEpisodeCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const getStatusText = () => {
    if (!isMounted) {
      return '...';
    }

    if (episode.isArchived) {
      return episode.dateUploaded
      ? `archived (${currentMode.statusWorkflow.published.label}: ${format(new Date(episode.dateUploaded), 'MMM d, yy')})`
      : `archived (recorded: ${episode.dateRecorded ? format(new Date(episode.dateRecorded), 'MMM d, yy') : 'N/A'})`;
    }
    if (episode.dateUploaded) {
      return `${currentMode.statusWorkflow.published.label}: ${format(new Date(episode.dateUploaded), 'MMM d, yy')}`;
    }
    // Fallback for other statuses
    if (episode.dateRecorded) return `${currentMode.statusWorkflow.editing.label}`;
    if (episode.dateScheduledForRecording) return `${currentMode.statusWorkflow.scheduled.label}`;
    return `${currentMode.statusWorkflow.planning.label}`;
  };

  const cardClasses = cn(
    "h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden",
    episode.isArchived
      ? "bg-muted/50 border-muted-foreground/30 hover:border-muted-foreground/50"
      : episode.dateUploaded
        ? "bg-card border-green-500/50 hover:border-green-600/70"
        : "bg-card border-transparent"
  );

  const getBadgeVisuals = (): {icon: React.ReactNode, colorClasses: string} => {
    if (episode.isArchived) {
      return { icon: <Archive className="mr-1.5 h-3 w-3" />, colorClasses: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'};
    }
    if (episode.dateUploaded) {
      return { icon: <CheckCircle className="mr-1.5 h-3 w-3" />, colorClasses: 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700 text-green-700 dark:text-green-200'};
    }
    if (episode.dateRecorded) return { icon: <Edit className="mr-1.5 h-3 w-3" />, colorClasses: 'bg-orange-100 dark:bg-orange-800 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-200'};
    if (episode.dateScheduledForRecording) return { icon: <CalendarClock className="mr-1.5 h-3 w-3" />, colorClasses: 'bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200'};
    return { icon: <Brain className="mr-1.5 h-3 w-3" />, colorClasses: 'bg-yellow-100 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200'};
  };

  const badgeVisuals = getBadgeVisuals();
  
  const modalTriggerButton = (
    <Card className={cn(cardClasses, "group/card cursor-pointer")}>
      <CardContent className="p-3 space-y-1.5 flex flex-col justify-between h-full">
        <div>
          <p
            className="text-sm font-semibold truncate text-accent"
            title={episode.title}
          >
            #{episode.episodeNumber} - {episode.title}
          </p>
          <Badge variant="outline" className={cn("text-xs mt-1", badgeVisuals.colorClasses)}>
            {badgeVisuals.icon}
            {getStatusText()}
          </Badge>
        </div>
        <div className="flex justify-end items-center mt-auto pt-1">
          <div className="h-7 w-7 p-1 flex items-center justify-center text-muted-foreground group-hover/card:text-primary" aria-label="View episode details">
            <Eye className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <PublishedEpisodeModal
      episode={episode}
      triggerButton={modalTriggerButton}
      currentMode={currentMode}
      onEpisodeUpdate={onEpisodeUpdate}
    />
  );
}
