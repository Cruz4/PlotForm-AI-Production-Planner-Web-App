
'use client';

import type { Episode, AppMode } from '@/types';
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, GanttChartSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEpisodeIdentifier } from '@/lib/dataUtils';

interface DashboardTimelineViewProps {
  episodes: Episode[];
  currentMode: AppMode;
  isLoading: boolean;
}

interface TimelineItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
}

const getStatusColor = (episode: Episode): string => {
  if (episode.dateUploaded) return 'bg-green-500';
  if (episode.dateRecorded) return 'bg-orange-500';
  if (episode.dateScheduledForRecording) return 'bg-blue-500';
  return 'bg-gray-400';
};

export default function DashboardTimelineView({ episodes, currentMode, isLoading }: DashboardTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const timelineItems = useMemo(() => {
    return episodes
      .filter(ep => ep.dateScheduledForRecording)
      .map(ep => ({
        id: ep.id,
        title: ep.title,
        start: new Date(ep.dateScheduledForRecording!),
        end: new Date(ep.dateUploaded || ep.dateRecorded || ep.dateScheduledForRecording!),
        color: getStatusColor(ep)
      }));
  }, [episodes]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  const getPosition = (date: Date) => {
    if (!isSameMonth(date, monthStart) && date < monthStart) return { left: 0, width: 0 };
    if (!isSameMonth(date, monthStart) && date > monthEnd) return { left: 0, width: 0 };
    const dayIndex = date.getDate() - 1;
    return { left: (dayIndex / totalDays) * 100, width: 0 };
  };

  const getBarStyles = (item: TimelineItem) => {
    const startPos = getPosition(item.start);
    
    let end = item.end;
    if (end < item.start) end = item.start; // Ensure end is not before start
    if (!isSameMonth(end, monthStart)) end = monthEnd;

    const endPos = getPosition(end);
    const width = (end.getDate() / totalDays) * 100 - startPos.left;

    return {
      left: `${startPos.left}%`,
      width: `${Math.max(width, 100 / totalDays)}%`, // Minimum width of one day
    };
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <GanttChartSquare className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg">No items with scheduled dates to display on the timeline.</p>
        <p>Schedule an item to see it here.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative border-t pt-2">
          {/* Day Headers */}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }}>
            {daysInMonth.map(day => (
              <div key={day.toString()} className="text-center text-xs text-muted-foreground border-r last:border-r-0 py-1">
                {format(day, 'd')}
              </div>
            ))}
          </div>

          <ScrollArea className="h-96 mt-2">
            <div className="space-y-1 pr-2">
              {timelineItems.map((item, index) => {
                const isVisibleInMonth = isWithinInterval(item.start, { start: monthStart, end: monthEnd }) ||
                                       isWithinInterval(item.end, { start: monthStart, end: monthEnd }) ||
                                       (item.start < monthStart && item.end > monthEnd);
                if (!isVisibleInMonth) return null;

                const barStyles = getBarStyles(item);

                return (
                  <div key={item.id} className="relative h-8 flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/dashboard/episode/${item.id}`} className="w-full h-full">
                          <div
                            className={cn("absolute rounded h-6 top-1 flex items-center px-2 cursor-pointer hover:opacity-80 transition-opacity", item.color)}
                            style={{ left: barStyles.left, width: barStyles.width }}
                          >
                            <p className="text-xs font-medium text-white truncate">{item.title}</p>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm">Start: {format(item.start, 'PPP')}</p>
                        <p className="text-sm">End: {format(item.end, 'PPP')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  );
}
