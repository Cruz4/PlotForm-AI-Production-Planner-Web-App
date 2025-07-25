

'use client';

import type { Episode, Segment, EpisodeStatus, AppMode } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarClock, CheckCircle, DiscAlbum, Edit, Hourglass, Brain, Library, ClipboardCheck, ThumbsUp } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import CompactEpisodeCard from './CompactEpisodeCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { calculateGenericEpisodeStatus } from '@/lib/dataUtils';

interface DashboardBoardViewProps {
  episodes: Episode[];
  currentMode: AppMode;
}

type BoardColumnKey = 'planning' | 'scheduled' | 'editing' | 'published';


const BOARD_MAIN_COLUMNS_ORDER: Exclude<BoardColumnKey, 'published'>[] = ['planning', 'scheduled', 'editing'];

// Updated to use currentMode for labels
const getColumnVisuals = (statusKey: BoardColumnKey, currentMode: AppMode): { color: string; icon: React.ReactNode; title: string; textClass: string; textShadowClass?: string; } => {
  const workflow = currentMode.statusWorkflow;
  switch (statusKey) {
    case 'planning': return { color: 'bg-yellow-500', icon: <Brain className="mr-2 h-4 w-4" />, title: workflow.planning.label, textClass: 'text-black', textShadowClass: undefined };
    case 'scheduled': return { color: 'bg-blue-500', icon: <CalendarClock className="mr-2 h-4 w-4" />, title: workflow.scheduled.label, textClass: 'text-primary-foreground' };
    case 'editing': return { color: 'bg-orange-500', icon: <Edit className="mr-2 h-4 w-4" />, title: workflow.editing.label, textClass: 'text-primary-foreground' };
    case 'published': return { color: 'bg-green-600', icon: <CheckCircle className="mr-2 h-4 w-4" />, title: workflow.published.label, textClass: 'text-primary-foreground' };
    default: return { color: 'bg-gray-500', icon: <Hourglass className="mr-2 h-4 w-4" />, title: 'Unknown Stage', textClass: 'text-primary-foreground' };
  }
};

const getSeasonDisplayNameWithCount = (seasonKey: string, episodes: Episode[], seasonLabel: string): string => {
  const count = episodes.length;
  if (seasonKey === 'no-season') return `No ${seasonLabel} - [${count}]`;
  const customName = episodes[0]?.seasonName;
  if (customName) return `${customName} - [${count}]`;
  return `${seasonLabel} ${seasonKey.replace('season-', '')} - [${count}]`;
};

const sortSeasonKeys = (keys: string[]): string[] => {
  return keys.sort((a, b) => {
    const isANoSeason = a === 'no-season';
    const isBNoSeason = b === 'no-season';
    if (isANoSeason && isBNoSeason) return 0;
    if (isANoSeason) return 1; // "No Season" comes after numbered seasons
    if (isBNoSeason) return -1;

    const numA = parseInt(a.replace('season-', ''), 10);
    const numB = parseInt(b.replace('season-', ''), 10);
    return numA - numB;
  });
};


export default function DashboardBoardView({ episodes: initialEpisodes, currentMode }: DashboardBoardViewProps) {
  const [activePublishedAccordionItems, setActivePublishedAccordionItems] = useState<string[]>([]);
  const [activeMainBoardAccordionItems, setActiveMainBoardAccordionItems] = useState<string[]>([]);


  if (!initialEpisodes) {
    return <div className="py-10 text-center text-muted-foreground">Loading {currentMode.episodeLabel.toLowerCase()}s...</div>;
  }
  
  const getDerivedBoardColumnKey = (episode: Episode): BoardColumnKey => {
      const genericStatus = calculateGenericEpisodeStatus(episode, currentMode);
      if (genericStatus === 'archived') {
        return 'planning'; 
      }
      return genericStatus;
  };

  const publishedEpisodes = initialEpisodes.filter(ep => !ep.isArchived && getDerivedBoardColumnKey(ep) === 'published');
  const activeWorkflowEpisodes = initialEpisodes.filter(ep => !ep.isArchived && getDerivedBoardColumnKey(ep) !== 'published');

  if (activeWorkflowEpisodes.length === 0 && publishedEpisodes.length === 0) {
    return <div className="py-10 text-center text-muted-foreground">No active or published {currentMode.episodeLabel.toLowerCase()}s to display on the board.</div>;
  }

  const getSeasonKey = (episode: Episode) => {
    if (episode.seasonName) return episode.seasonName;
    return episode.seasonNumber === null || episode.seasonNumber === undefined ? 'no-season' : `season-${episode.seasonNumber}`;
  };

  const groupedActiveEpisodes = activeWorkflowEpisodes.reduce(
    (acc, episode) => {
      const derivedColumnKey = getDerivedBoardColumnKey(episode);
      if (derivedColumnKey !== 'published') {
        const seasonKey = getSeasonKey(episode);
        if (!acc[derivedColumnKey]) {
          acc[derivedColumnKey] = {};
        }
        if (!acc[derivedColumnKey][seasonKey]) {
          acc[derivedColumnKey][seasonKey] = [];
        }
        acc[derivedColumnKey][seasonKey].push(episode);
      }
      return acc;
    },
    { planning: {}, scheduled: {}, editing: {} } as Record<Exclude<BoardColumnKey, 'published'>, Record<string, Episode[]>>
  );

  const groupedPublishedEpisodes = publishedEpisodes.reduce((acc, ep) => {
    const seasonKey = getSeasonKey(ep);
    if (!acc[seasonKey]) acc[seasonKey] = [];
    acc[seasonKey].push(ep);
    return acc;
  }, {} as Record<string, Episode[]>);
  const sortedPublishedSeasonKeys = sortSeasonKeys(Object.keys(groupedPublishedEpisodes));


  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-center space-x-4 p-4 overflow-x-auto items-start">
        {BOARD_MAIN_COLUMNS_ORDER.map((columnKey) => {
          const seasonsInColumn = groupedActiveEpisodes[columnKey] || {};
          const sortedSeasonKeysForColumn = sortSeasonKeys(Object.keys(seasonsInColumn));
          const totalEpisodesInColumn = sortedSeasonKeysForColumn.reduce((sum, key) => sum + (seasonsInColumn[key]?.length || 0), 0);
          const columnVisuals = getColumnVisuals(columnKey, currentMode);
          const minHeightStyle = totalEpisodesInColumn === 0 ? { minHeight: '10rem' } : {};

          return (
            <div key={columnKey} className="flex-shrink-0 w-[320px]">
              <Card className="h-full flex flex-col bg-card" style={minHeightStyle}>
                <CardHeader className={cn("p-3 border-b rounded-t-md", columnVisuals.color)}>
                  <CardTitle className={cn("text-md font-semibold flex items-center", columnVisuals.textClass, columnVisuals.textShadowClass)}>
                    {columnVisuals.icon}
                    {columnVisuals.title} [{totalEpisodesInColumn}]
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("p-3 space-y-2 flex-grow", totalEpisodesInColumn === 0 && "flex items-center justify-center")}>
                    {totalEpisodesInColumn > 0 ? (
                       <Accordion
                        type="multiple"
                        value={activeMainBoardAccordionItems}
                        onValueChange={setActiveMainBoardAccordionItems}
                        className="w-full"
                      >
                        {sortedSeasonKeysForColumn.map(seasonKey => {
                          const seasonEpisodes = seasonsInColumn[seasonKey];
                          if (!seasonEpisodes || seasonEpisodes.length === 0) return null;
                          return (
                            <AccordionItem value={`${columnKey}-${seasonKey}`} key={`${columnKey}-${seasonKey}`} className="border-b-0 mb-2 last:mb-0">
                              <AccordionTrigger className="px-3 py-2 text-sm font-medium bg-muted/60 hover:bg-muted/80 hover:no-underline [&[data-state=open]>svg]:text-primary rounded-md data-[state=closed]:bg-card data-[state=open]:bg-muted">
                                <div className="flex items-center">
                                  <Library className="mr-2 h-4 w-4 text-primary/80" />
                                  {getSeasonDisplayNameWithCount(seasonKey, seasonEpisodes, currentMode.seasonLabel)}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 pb-1 px-0 space-y-2">
                                {seasonEpisodes.map((episode) => (
                                  <CompactEpisodeCard
                                    key={episode.id}
                                    episode={episode}
                                    currentMode={currentMode}
                                  />
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No {currentMode.episodeLabel.toLowerCase()}s in this stage.</p>
                    )}
                  </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {publishedEpisodes.length > 0 && (
        <div className="mt-6 p-4">
          <Card className="bg-card overflow-hidden">
            <CardHeader className={cn("p-3 border-b rounded-t-md", getColumnVisuals('published', currentMode).color)}>
              <CardTitle className={cn("text-md font-semibold flex items-center", getColumnVisuals('published', currentMode).textClass, getColumnVisuals('published', currentMode).textShadowClass)}>
                {getColumnVisuals('published', currentMode).icon}
                {currentMode.statusWorkflow.published.label} [{publishedEpisodes.length}]
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion
                type="multiple"
                value={activePublishedAccordionItems}
                onValueChange={setActivePublishedAccordionItems}
                className="w-full"
              >
                {sortedPublishedSeasonKeys.map(seasonKey => {
                   const seasonEpisodes = groupedPublishedEpisodes[seasonKey];
                   if (!seasonEpisodes || seasonEpisodes.length === 0) return null;
                  return (
                    <AccordionItem value={`published-${seasonKey}`} key={`published-${seasonKey}`} className="border-b border-border last:border-b-0">
                      <AccordionTrigger
                        className={cn(
                          "px-3 py-2 text-sm font-medium hover:no-underline rounded-none w-full",
                          "bg-slate-100 text-slate-700 hover:bg-slate-200", 
                          "dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                          "[&[data-state=open]>svg]:text-slate-700 dark:[&[data-state=open]>svg]:text-slate-200"
                        )}
                      >
                        <div className="flex items-center justify-center flex-1">
                          <Library className="mr-2 h-4 w-4 text-primary" />
                           {getSeasonDisplayNameWithCount(seasonKey, seasonEpisodes, currentMode.seasonLabel)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3 px-3 bg-background">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {seasonEpisodes.map((episode) => (
                            <CompactEpisodeCard
                              key={episode.id}
                              episode={episode}
                              currentMode={currentMode}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
