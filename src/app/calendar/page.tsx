
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { saveAs } from 'file-saver';
import { createEvents, type EventAttributes } from 'ics';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContextMode } from '@/contexts/ModeContext';
import { getAllEpisodesForUserFromDb } from '@/lib/episodeStore';
import { getTasksForUser, updateTask, deleteTask } from '@/lib/taskStore';
import type { Episode, CustomTask, CalendarEvent } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIconLucide, Loader2, PlusCircle, ListTodo, Calendar as CalendarIcon, FileDown, Eye, GripVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddTaskDialog } from '@/components/calendar/AddTaskDialog';
import PublishedEpisodeModal from '@/components/episodes/PublishedEpisodeModal';

export default function CalendarPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { user, loading: authLoading } = useAuth();
  const { currentMode, isLoadingMode } = useAppContextMode();
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!authLoading && user?.uid) {
      setIsLoading(true);
      try {
        const [episodesData, tasksData] = await Promise.all([
          getAllEpisodesForUserFromDb(user.uid),
          getTasksForUser(user.uid)
        ]);
        setEpisodes(episodesData);
        setTasks(tasksData);
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
        toast({ title: "Error", description: "Could not load calendar data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const episodeEvents: CalendarEvent[] = [];
    episodes.forEach(ep => {
      if (ep.dateScheduledForRecording) episodeEvents.push({ id: `${ep.id}-sch`, title: ep.title, date: new Date(ep.dateScheduledForRecording), type: 'episode-scheduled', episodeId: ep.id, color: 'bg-yellow-500' });
      if (ep.dateRecorded) episodeEvents.push({ id: `${ep.id}-rec`, title: ep.title, date: new Date(ep.dateRecorded), type: 'episode-recorded', episodeId: ep.id, color: 'bg-blue-500' });
      if (ep.dateUploaded) episodeEvents.push({ id: `${ep.id}-up`, title: ep.title, date: new Date(ep.dateUploaded), type: 'episode-uploaded', episodeId: ep.id, color: 'bg-green-500' });
    });
    const taskEvents: CalendarEvent[] = tasks.map(task => ({ id: task.id, title: task.title, date: new Date(task.dueDate), type: 'custom-task', isCompleted: task.isCompleted, color: 'bg-purple-500', episodeId: task.id }));

    return [...episodeEvents, ...taskEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [episodes, tasks]);
  
  const eventsByDay = useMemo(() => {
    return allEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const day = format(event.date, 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {});
  }, [allEvents]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDay[dayKey] || [];
  }, [selectedDate, eventsByDay]);

  const handleExportToICal = () => {
    const calEvents: EventAttributes[] = allEvents.map(event => {
      const startOfDay = new Date(event.date);
      startOfDay.setHours(9, 0, 0, 0);
      
      return {
        title: event.title,
        start: [startOfDay.getFullYear(), startOfDay.getMonth() + 1, startOfDay.getDate(), startOfDay.getHours(), startOfDay.getMinutes()],
        duration: { hours: 1 },
        description: `Event type: ${event.type}`,
        uid: event.id
      };
    });

    createEvents(calEvents, (error, value) => {
      if (error) {
        console.error(error);
        toast({ title: "Export Failed", description: "Could not generate calendar file.", variant: "destructive"});
        return;
      }
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, 'plotform-calendar.ics');
    });
  };

  if (authLoading || isLoading || isLoadingMode) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <CalendarIconLucide className="mr-3 h-8 w-8 text-primary" />
          Production Calendar
        </h1>
        <div className="flex items-center gap-2">
           <AddTaskDialog onTaskAdded={fetchData} />
           <Button variant="outline" onClick={handleExportToICal}><FileDown className="mr-2 h-4 w-4" /> Export to Calendar</Button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="flex-1 w-full">
          <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'agenda')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="month"><CalendarIcon className="mr-2 h-4 w-4"/>Month View</TabsTrigger>
              <TabsTrigger value="agenda"><ListTodo className="mr-2 h-4 w-4"/>Agenda View</TabsTrigger>
            </TabsList>
            <TabsContent value="month" className="mt-0">
              <MonthView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                eventsByDay={eventsByDay}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </TabsContent>
            <TabsContent value="agenda" className="mt-0">
               <AgendaView
                events={allEvents}
                currentMode={currentMode}
                onRefreshData={fetchData}
                episodes={episodes}
                tasks={tasks}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <DayDetailsPanel
            selectedDate={selectedDate}
            events={selectedDayEvents}
            currentMode={currentMode}
            onRefresh={fetchData}
            episodes={episodes}
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
}

const DayContentComponent = ({ date, displayMonth, eventsForDay = [] }: { date: Date; displayMonth: Date; eventsForDay?: CalendarEvent[] }) => {
  const intensity = Math.min(eventsForDay.length, 5);
  return (
    <div className={cn(
      "h-full w-full flex flex-col items-start justify-start p-1 text-sm relative transition-colors",
      date.getMonth() !== displayMonth.getMonth() && "text-muted-foreground opacity-50",
      intensity > 0 && `heatmap-${intensity}`
    )}>
      <span className="font-semibold">{format(date, "d")}</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {eventsForDay.slice(0, 9).map(event => (
          <div key={event.id} title={event.title} className={cn("h-1.5 w-1.5 rounded-full", event.color)}></div>
        ))}
      </div>
    </div>
  );
};

const MonthView = ({ currentMonth, setCurrentMonth, eventsByDay, selectedDate, setSelectedDate }: { currentMonth: Date; setCurrentMonth: (d: Date) => void; eventsByDay: Record<string, CalendarEvent[]>; selectedDate?: Date, setSelectedDate: (d?: Date) => void }) => {
  return (
    <div className="p-4 bg-card rounded-md border shadow-lg">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="w-full p-0 [&_.rdp-day]:h-44"
        components={{ DayContent: (props) => <DayContentComponent {...props} eventsForDay={eventsByDay[format(props.date, 'yyyy-MM-dd')] || []} /> }}
      />
    </div>
  );
};

const AgendaView = ({ events, currentMode, onRefreshData, episodes, tasks }: { events: CalendarEvent[], currentMode: any, onRefreshData: () => void, episodes: Episode[], tasks: CustomTask[] }) => {
  const groupedByDay = events.reduce((acc: any, event: any) => {
    const day = format(event.date, 'PPPP');
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  return (
     <Card className="shadow-lg">
      <CardContent className="p-2 md:p-4">
        <ScrollArea className="h-[calc(100vh-350px)]">
          {Object.keys(groupedByDay).length > 0 ? Object.entries(groupedByDay).map(([day, dayEvents]: [string, any]) => (
            <div key={day} className="mb-6">
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">{day}</h3>
              <div className="space-y-2">
                {(dayEvents as CalendarEvent[]).map(event => {
                  const fullItem = event.type.startsWith('episode') ? episodes.find(e => e.id === event.episodeId) : tasks.find(t => t.id === event.id);
                  if (!fullItem) return null;
                  return (
                    <AgendaItem
                      key={event.id}
                      event={event}
                      item={fullItem}
                      currentMode={currentMode}
                      onRefresh={onRefreshData}
                    />
                  );
                })}
              </div>
            </div>
          )) : <p className="text-center text-muted-foreground py-10">No events to show.</p>}
        </ScrollArea>
       </CardContent>
    </Card>
  );
};

const AgendaItem = ({ event, item, currentMode, onRefresh }: {event: CalendarEvent, item: Episode | CustomTask, currentMode: any, onRefresh: () => void}) => {
  const { toast } = useToast();
  
  const handleTaskToggle = async (task: CustomTask, isCompleted: boolean) => {
    try {
      await updateTask(task.id, { isCompleted });
      toast({ title: `Task ${isCompleted ? 'Completed' : 'Reopened'}`, description: `"${task.title}" updated.` });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
    }
  };

  const eventTypeLabel = useMemo(() => {
    if (event.type === 'custom-task') return 'Task/Deadline';
    if (event.type === 'episode-scheduled') return currentMode.statusWorkflow.scheduled.label;
    if (event.type === 'episode-recorded') return currentMode.statusWorkflow.editing.label;
    if (event.type === 'episode-uploaded') return currentMode.statusWorkflow.published.label;
    return 'Event';
  }, [event.type, currentMode]);

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border", event.isCompleted && "bg-muted/50 opacity-60")}>
      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", event.color)}></div>
      <div className="flex-grow">
        <p className={cn("font-medium", event.isCompleted && "line-through")}>{event.title}</p>
        <p className="text-xs text-muted-foreground">{eventTypeLabel}</p>
      </div>
      <div className="flex items-center gap-1">
        {event.type === 'custom-task' ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleTaskToggle(item as CustomTask, !event.isCompleted)}>
            {event.isCompleted ? 'Reopen' : 'Complete'}
          </Button>
        ) : (
          <PublishedEpisodeModal
            episode={item as Episode}
            triggerButton={<Button variant="ghost" size="sm" className="h-7 text-xs"><Eye className="mr-1.5 h-4 w-4" /> View</Button>}
            currentMode={currentMode}
            onEpisodeUpdate={onRefresh}
          />
        )}
      </div>
    </div>
  );
};

const DayDetailsPanel = ({ selectedDate, events, currentMode, onRefresh, episodes, tasks }: {
  selectedDate?: Date;
  events: CalendarEvent[];
  currentMode: any;
  onRefresh: () => void;
  episodes: Episode[];
  tasks: CustomTask[];
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{selectedDate ? format(selectedDate, 'PPPP') : 'Select a Date'}</CardTitle>
        <CardDescription>
          {selectedDate ? `${events.length} event(s) for this day.` : "Click a day on the calendar to see details."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto max-h-[70vh] pr-3">
          {selectedDate ? (
            events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => {
                  const fullItem = event.type.startsWith('episode') ? episodes.find(e => e.id === event.episodeId) : tasks.find(t => t.id === event.id);
                  if (!fullItem) return null;
                  return (
                    <AgendaItem
                      key={event.id}
                      event={event}
                      item={fullItem}
                      currentMode={currentMode}
                      onRefresh={onRefresh}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No events scheduled for this day.</p>
            )
          ) : (
            <p className="text-center text-sm text-muted-foreground py-10">Select a day to view its events.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
