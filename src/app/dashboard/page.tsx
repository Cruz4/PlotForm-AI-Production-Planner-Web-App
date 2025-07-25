
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { FilterX, HelpCircle, LayoutGrid, List, Loader2, PlusCircle, Search, SlidersHorizontal, Upload, X, View, GanttChartSquare, RectangleHorizontal, Share2, PanelTopClose, PanelBottomOpen, ChevronsUpDown, Check, Sparkles, Trash2, Users, Inbox } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import type { Episode, TourStepDefinition, SharedSeasonData } from '@/types';
import { getAllEpisodesForUserFromDb, deleteMockEpisodesForUserDb } from '@/lib/episodeStore';
import { getShowPlannerName } from '@/lib/episodeLayoutsStore';
import DashboardListView from '@/components/dashboard/DashboardListView';
import DashboardBoardView from '@/components/dashboard/DashboardBoardView';
import DashboardTimelineView from '@/components/dashboard/DashboardTimelineView';
import ProTipCard from '@/components/dashboard/ProTipCard';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import { useAppContextMode } from '@/contexts/ModeContext';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';
import { parseFileToEpisodeList, pluralize, getSharedSeason } from '@/lib/dataUtils';
import { getModeIcon, type IconComponent } from '@/lib/modeIcons';
import { AIPlanGenerator } from '@/components/dashboard/AIPlanGenerator';
import GuidedTour from '@/components/tour/GuidedTour';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { setShowPlannerName } from '@/lib/episodeLayoutsStore';
import { addEpisodeDb } from '@/lib/episodeStore';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { sendShare } from '@/lib/shareStore';

const dashboardTourSteps: TourStepDefinition[] = [
    {
      selector: '[data-tour-id="dashboard-title"]',
      title: 'Welcome to Your Dashboard!',
      content: 'This is the central hub for all your projects. Click here to change your default Application Mode at any time.',
      placement: 'bottom',
      verticalOffset: -18,
    },
    {
      selector: '[data-tour-id="ai-plan-generator-card"]',
      title: 'AI Plan Generator',
      content: 'Don\'t know where to start? Type an idea here (e.g., "a 4-episode podcast on ancient Rome") and our AI will generate a complete, structured plan for you to add instantly.',
      placement: 'bottom',
      verticalOffset: -24,
    },
    {
      selector: '[data-tour-id="create-new-button"]',
      title: 'Create New Items',
      content: 'Click here to manually create a new item from scratch, using your default layout for the current Application Mode.',
      placement: 'bottom',
      verticalOffset: -25,
    },
    {
      selector: '[data-tour-id="import-json-button"]',
      title: 'Import Files',
      content: 'Use this to add new projects by importing structured JSON or Markdown files. This is great for adding plans from external AI tools or sent by collaborators.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="view-toggle-tabs"]',
      title: 'Choose Your View',
      content: 'Switch between the detailed "List View", the workflow "Board View", and the schedule-focused "Timeline".',
      placement: 'bottom',
      verticalOffset: -24,
    },
    {
      selector: '[data-tour-id="search-sort-filter-controls"]',
      title: 'Find Anything Instantly',
      content: 'You can search, sort, and apply detailed filters to quickly find any project.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="first-season-accordion-trigger"]',
      title: 'Organized by Season',
      content: 'Your projects are automatically grouped into collapsible seasons (or your mode\'s equivalent) to keep things tidy.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
      action: async () => {
        const trigger = document.querySelector('[data-tour-id="first-season-accordion-trigger"]') as HTMLElement | null;
        if (trigger && trigger.getAttribute('data-state') === 'closed') {
          trigger.click();
        }
      },
    },
    {
      selector: '[data-tour-id="first-episode-card"]',
      title: 'The Project Card',
      content: 'Each project gets its own card with all key information at a glance. Let\'s look at the details.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="first-episode-status-badge"]',
      title: 'Automated Status',
      content: 'This badge shows the current status. It updates automatically as you fill in content and set dates!',
      placement: 'bottom',
      verticalOffset: -25,
    },
    {
      selector: '[data-tour-id="first-episode-progress-bar"]',
      title: 'Overall Progress',
      content: 'This bar tracks your overall progress, from initial content creation to completing the production checklist.',
      placement: 'top',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="first-episode-expand-button"]',
      title: 'Expand for Inline Editing',
      content: 'Click here to expand the card and edit all of your content directly on the dashboard. No need to open the full editor for quick changes!',
      placement: 'top',
      verticalOffset: -18 - 6,
      action: async () => {
        const trigger = document.querySelector('[data-tour-id="first-episode-expand-button"]') as HTMLElement | null;
        if (trigger) {
          trigger.click();
        }
      },
    },
     {
      selector: '[data-tour-id="first-episode-segment-shortcuts"]',
      title: 'Segment Shortcuts',
      content: 'These buttons let you instantly jump to a specific segment for editing within this expanded view.',
      placement: 'top',
      verticalOffset: -18 - 6,
      action: async () => {
        const expandButton = document.querySelector('[data-tour-id="first-episode-expand-button"]') as HTMLElement | null;
        if (expandButton && !expandButton.closest('[data-state="open"]')) {
          expandButton.click();
        }
      },
    },
    {
      selector: '[data-tour-id="first-episode-date-buttons"]',
      title: 'Set Key Dates',
      content: 'Click these buttons to set dates for scheduling, recording, and publishing. These dates also drive the automated status changes.',
      placement: 'top',
      verticalOffset: -18 - 6,
      action: async () => {
        const expandButton = document.querySelector('[data-tour-id="first-episode-expand-button"]') as HTMLElement | null;
        if (expandButton && !expandButton.closest('[data-state="open"]')) {
          expandButton.click();
        }
      },
    },
    {
      selector: '[data-tour-id="checklist-button"]',
      title: 'Reveal Checklist',
      content: 'Now, let\'s reveal the production checklist inside the expanded card.',
      placement: 'top',
      verticalOffset: -18 - 6,
      action: async () => {
          const checklistButton = document.querySelector('[data-tour-id="checklist-button"]') as HTMLElement | null;
          if (checklistButton) {
              checklistButton.click();
          }
      }
    },
    {
      selector: '[data-tour-id="first-episode-checklist-section"]',
      title: 'Production Checklist',
      content: 'A production checklist appears in the expanded view. Complete these tasks to move it to the "Published" status.',
      placement: 'top',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="first-episode-edit-button"]',
      title: 'Full Editor',
      content: 'For more detailed work, like managing collaborators or viewing version history, use the "Edit Full" button.',
      placement: 'top',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="first-episode-share-button"]',
      title: 'Share & Export',
      content: 'From here, you can generate a shareable link for collaborators, or export your plan as a PDF or JSON data file.',
      placement: 'top',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="navbar-user-menu"]',
      title: 'Your User Menu',
      content: 'Access your settings, saved layouts, the "How to Use" guide, and more from here.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
];

const dashboardTourStepsNoSamples: TourStepDefinition[] = [
    {
      selector: '[data-tour-id="dashboard-title"]',
      title: 'Welcome to Your Dashboard!',
      content: 'This is the central hub for all your projects. Click here to change your default Application Mode at any time.',
      placement: 'bottom',
      verticalOffset: -18,
    },
    {
      selector: '[data-tour-id="ai-plan-generator-card"]',
      title: 'AI Plan Generator',
      content: 'Don\'t know where to start? Type an idea here (e.g., "a 4-episode podcast on ancient Rome") and our AI will generate a complete, structured plan for you to add instantly.',
      placement: 'bottom',
      verticalOffset: -24,
    },
    {
      selector: '[data-tour-id="create-new-button"]',
      title: 'Create New Items',
      content: 'Click here to manually create a new item from scratch, using your default layout for the current Application Mode.',
      placement: 'bottom',
      verticalOffset: -25,
    },
    {
      selector: '[data-tour-id="import-json-button"]',
      title: 'Import Files',
      content: 'Use this to add new projects by importing structured JSON or Markdown files. This is great for adding plans from external AI tools or sent by collaborators.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="view-toggle-tabs"]',
      title: 'Choose Your View',
      content: 'Switch between the detailed "List View", the workflow "Board View", and the schedule-focused "Timeline".',
      placement: 'bottom',
      verticalOffset: -24,
    },
    {
      selector: '[data-tour-id="search-sort-filter-controls"]',
      title: 'Find Anything Instantly',
      content: 'You can search, sort, and apply detailed filters to quickly find any project.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
    {
      selector: '[data-tour-id="navbar-user-menu"]',
      title: 'Your User Menu',
      content: 'Access your settings, saved layouts, the "How to Use" guide, and more from here.',
      placement: 'bottom',
      verticalOffset: -18 - 6,
    },
];

const initialFilters = {
  recorded: false,
  notRecorded: false,
  uploaded: false,
  notUploaded: false,
  hasGuest: false,
  noGuest: false,
  isFavorite: false,
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings, updateSettings, loadingSettings } = useUserSettings();
  const { loadingCustomThemes } = useCustomTheme();
  const { currentMode, isLoadingMode, setMode, ALL_APP_MODES } = useAppContextMode();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [plannerName, setPlannerName] = useState<string | null>(null);
  const [ModeIcon, setModeIcon] = useState<IconComponent | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourSteps, setTourSteps] = useState(dashboardTourStepsNoSamples);
  
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'timeline'>(() => (searchParams.get('view') as 'list' | 'board' | 'timeline') || 'list');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [sortOrder, setSortOrder] = useState<'created_asc' | 'created_desc' | 'updated_asc' | 'updated_desc'>(() => (searchParams.get('sort') as 'created_asc' | 'created_desc' | 'updated_asc' | 'updated_desc') || 'created_asc');
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(searchParams.toString());
    const initial = { ...initialFilters };
    for (const key in initial) {
      if (params.get(key) === 'true') {
        initial[key as keyof typeof initialFilters] = true;
      }
    }
    return initial;
  });
  
  const [focusOnEpisode, setFocusOnEpisode] = useState<{ episodeId: string; seasonKey: string; } | null>(null);
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);

  const [isClearingSamples, setIsClearingSamples] = useState(false);
  const hasMockEpisodes = useMemo(() => episodes.some(ep => ep.isMock), [episodes]);

  const pageIsLoading = authLoading || loadingSettings || isLoadingMode || isLoadingEpisodes;

  const onRefresh = useCallback(async () => {
    if (user?.uid && currentMode) {
      setIsLoadingEpisodes(true);
      try {
        const [fetchedEpisodes, name] = await Promise.all([
          getAllEpisodesForUserFromDb(user.uid),
          getShowPlannerName(user.uid)
        ]);
        setEpisodes(fetchedEpisodes);
        setPlannerName(name || `${currentMode.modeName} Planner`);
      } catch (error) {
        console.error("Failed to fetch episodes or planner name:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
        if (currentMode) {
            setPlannerName(`${currentMode.modeName} Planner`);
        }
      } finally {
        setIsLoadingEpisodes(false);
      }
    } else if (!user && !authLoading) {
      setIsLoadingEpisodes(false);
      if (currentMode) {
        setPlannerName(`${currentMode.modeName} Planner`);
      }
    }
  }, [user, authLoading, currentMode, toast]);

  // This is the primary data loading effect for the page.
  useEffect(() => {
    if (!authLoading && !loadingSettings && !isLoadingMode && currentMode) {
      onRefresh();
    }
  }, [onRefresh, authLoading, loadingSettings, isLoadingMode, currentMode]);

  // Effect to handle importing from a shared link
  useEffect(() => {
    const handleImportFromLink = async () => {
        if (user && searchParams.has('importSeasonId')) {
            const seasonId = searchParams.get('importSeasonId');
            if (seasonId) {
                toast({ title: "Importing Plan...", description: "A shared plan is being added to your inbox." });
                try {
                    const sharedSeasonData: SharedSeasonData | null = await getSharedSeason(seasonId);
                    if (sharedSeasonData && sharedSeasonData.episodes.length > 0) {
                        // Create a "share" document for each episode in the season
                        for (const episode of sharedSeasonData.episodes) {
                            await sendShare(user.uid, { ...episode, id: episode.id || 'unknown_id' } as Episode, sharedSeasonData);
                        }
                        toast({ title: "Plan Received!", description: `"${sharedSeasonData.seasonName || 'A shared plan'}" has been added to your inbox.`, duration: 7000 });
                        // Optionally open the inbox here or just let the user see the notification
                    } else {
                        throw new Error("Shared plan not found or is empty.");
                    }
                } catch (error: any) {
                    toast({ title: "Import Failed", description: error.message, variant: "destructive" });
                } finally {
                    // Clean the URL
                    router.replace(pathname, { scroll: false });
                }
            }
        }
    };
    handleImportFromLink();
  }, [user, searchParams, router, pathname, toast]);

  // This is the primary tour triggering effect.
  useEffect(() => {
    if (!pageIsLoading) {
      const startTourParam = searchParams.get('startTour');
      if (startTourParam === 'true' && settings && !settings.guidedTourDashboardCompleted) {
        setTourSteps(hasMockEpisodes ? dashboardTourSteps : dashboardTourStepsNoSamples);
        setIsTourOpen(true);
        const newPath = pathname;
        router.replace(newPath, { scroll: false });
      }
    }
  }, [pageIsLoading, settings, searchParams, pathname, router, hasMockEpisodes]);


  const handleClearSamples = async () => {
    if (!user) return;
    setIsClearingSamples(true);
    try {
      await deleteMockEpisodesForUserDb(user.uid);
      await updateSettings({ userClearedMockEpisodesOnce: true });
      toast({ title: "Sample Data Cleared", description: "Your workspace is now ready for your own projects." });
      onRefresh(); // Refresh the episode list
    } catch (error) {
      console.error("Failed to clear sample data:", error);
      toast({ title: "Error", description: "Could not clear sample data.", variant: "destructive" });
    } finally {
      setIsClearingSamples(false);
    }
  };

  const handleTourClose = () => {
    setIsTourOpen(false);
    if (settings && !settings.guidedTourDashboardCompleted) {
      updateSettings({ guidedTourDashboardCompleted: true });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'list') params.set('view', activeTab);
    if (searchTerm) params.set('q', searchTerm);
    if (sortOrder !== 'created_asc') params.set('sort', sortOrder);
    for (const key in filters) {
        if (filters[key as keyof typeof filters]) {
            params.set(key, 'true');
        }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, searchTerm, sortOrder, filters, pathname, router]);

  useEffect(() => {
    const importedFlag = searchParams.get('imported');
    const refreshFlag = searchParams.get('refresh');
    if (importedFlag === 'true' || refreshFlag) {
      toast({ title: "Data Loaded", description: "Your workspace has been updated." });
      const newPath = pathname; // No params
      router.replace(newPath, { scroll: false }); 
      onRefresh();
    }
  }, [searchParams, pathname, router, toast, onRefresh]);


  useEffect(() => {
    if (currentMode && currentMode.modeName) {
      setModeIcon(() => getModeIcon(currentMode.modeName));
    }
  }, [currentMode]);

  const handleCreateNewEpisode = async () => {
    if (!user || !currentMode) {
      toast({ title: "Login Required", description: "Please log in to create an item.", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const newEpisodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators'> = {
        title: `Untitled ${currentMode.episodeLabel}`,
        episodeNumber: (episodes.filter(e => e.seasonNumber === 1).length || 0) + 1,
        seasonNumber: 1,
        segments: [],
        productionChecklist: [],
      };
      const newEpisode = await addEpisodeDb(newEpisodeData, user.uid, currentMode);
      toast({ title: "Success", description: `New ${currentMode.episodeLabel.toLowerCase()} created.`});
      router.push(`/dashboard/episode/${newEpisode.id}`);
    } catch (error) {
      console.error("Failed to create new episode:", error);
      toast({ title: "Error", description: `Could not create new ${currentMode.episodeLabel.toLowerCase()}.`, variant: "destructive"});
      setIsCreating(false);
    }
  };

  const handleLocalUpdate = useCallback((updatedEpisode: Episode) => {
    setEpisodes(prevEpisodes => 
        prevEpisodes.map(ep => ep.id === updatedEpisode.id ? updatedEpisode : ep)
    );
  }, []);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.uid && currentMode) {
      setIsLoadingEpisodes(true);
      const reader = new FileReader();
      const currentUserId = user.uid;
      const currentAppMode = currentMode;

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const { episodes: importedEpisodes, plannerName: importedPlannerName } = parseFileToEpisodeList(content);

          if (importedEpisodes.length === 0) {
            throw new Error("Could not find any valid items to import in the file.");
          }
          
          if (importedPlannerName) {
            await setShowPlannerName(currentUserId, importedPlannerName);
            setPlannerName(importedPlannerName);
          }

          for (const partialEpisode of importedEpisodes) {
              const episodeToAdd: Omit<Episode, "id" | "createdAt" | "updatedAt" | "createdBy" | "collaborators" | "ownerHostDisplayName" | "importedHostDisplayName"> = {
                  title: partialEpisode.title || 'Untitled Imported Item',
                  episodeNumber: partialEpisode.episodeNumber ?? null,
                  seasonNumber: partialEpisode.seasonNumber ?? null,
                  seasonName: partialEpisode.seasonName ?? null,
                  episodeNotes: partialEpisode.episodeNotes || '',
                  segments: partialEpisode.segments || [],
                  productionChecklist: partialEpisode.productionChecklist || [],
                  isArchived: partialEpisode.isArchived || false,
                  dateScheduledForRecording: partialEpisode.dateScheduledForRecording || null,
                  dateRecorded: partialEpisode.dateRecorded || null,
                  dateUploaded: partialEpisode.dateUploaded || null,
                  specialGuest: partialEpisode.specialGuest || null,
                  lunchProvidedBy: partialEpisode.lunchProvidedBy || null,
                  isFavorite: partialEpisode.isFavorite || false,
                  status: partialEpisode.status || 'planning',
                  isMock: partialEpisode.isMock || false,
                  linkedFollowUpId: partialEpisode.linkedFollowUpId || null,
                  linkedPrequelId: partialEpisode.linkedPrequelId || null,
              };
              await addEpisodeDb(episodeToAdd, currentUserId, currentAppMode);
          }
          
          toast({ title: "Import Successful", description: `${importedEpisodes.length} item(s) have been added to your planner.` });
          onRefresh(); // Refresh the list now

        } catch (error: any) {
          toast({ title: "Import Error", description: `Failed to import file: ${error.message}`, variant: "destructive" });
        } finally {
          setIsLoadingEpisodes(false);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  const handleFilterChange = (filterKey: keyof typeof filters, value: boolean) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };
  const resetFilters = () => setFilters(initialFilters);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredAndSortedEpisodes = useMemo(() => {
    let processed = [...episodes];
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        processed = processed.filter(ep =>
            ep.title.toLowerCase().includes(lowerSearchTerm) ||
            (ep.seasonNumber?.toString() + (ep.episodeNumber?.toString() || '')).includes(lowerSearchTerm) ||
            (ep.episodeNumber?.toString() || '').includes(lowerSearchTerm) ||
            (ep.specialGuest || '').toLowerCase().includes(lowerSearchTerm) ||
            (ep.episodeNotes || '').toLowerCase().includes(lowerSearchTerm) ||
            (ep.segments || []).some(seg =>
                (seg.host1Notes && seg.host1Notes.toLowerCase().includes(lowerSearchTerm)) ||
                (seg.host2Notes && seg.host2Notes.toLowerCase().includes(lowerSearchTerm))
            )
        );
    }
    if (filters.recorded) processed = processed.filter(ep => !!ep.dateRecorded);
    if (filters.notRecorded) processed = processed.filter(ep => !ep.dateRecorded);
    if (filters.uploaded) processed = processed.filter(ep => !!ep.dateUploaded);
    if (filters.notUploaded) processed = processed.filter(ep => !ep.dateUploaded);
    if (filters.hasGuest) processed = processed.filter(ep => !!ep.specialGuest && ep.specialGuest.trim() !== '');
    if (filters.noGuest) processed = processed.filter(ep => !ep.specialGuest || ep.specialGuest.trim() === '');
    if (filters.isFavorite) processed = processed.filter(ep => !!ep.isFavorite);

    return processed.sort((a, b) => {
      switch (sortOrder) {
        case 'created_desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'updated_asc':
          return (a.updatedAt || 0) - (b.updatedAt || 0);
        case 'updated_desc':
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        case 'created_asc':
        default:
          return (a.createdAt || 0) - (b.createdAt || 0);
      }
    });
  }, [episodes, searchTerm, sortOrder, filters]);

  const handleModeChange = async (modeName: string) => {
    if (modeName !== currentMode.modeName) {
      await setMode(modeName);
      toast({ title: "Default Mode Updated", description: `New projects will now default to "${modeName}". This does not affect existing projects.` });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight text-foreground self-start sm:self-center flex items-center p-2 -ml-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer" data-tour-id="dashboard-title">
                    {ModeIcon ? <ModeIcon className="mr-3 h-8 w-8 text-primary" /> : <div className="mr-3 h-8 w-8"></div>}
                    <span data-tour-id="dashboard-title-text">{plannerName || (currentMode ? `${currentMode.modeName} Planner` : `${APP_NAME} Planner`)}</span>
                  </div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change your default Application Mode</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Set Default Application Mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_APP_MODES.map(mode => {
                const Icon = getModeIcon(mode.modeName);
                return (
                  <DropdownMenuItem key={mode.modeName} onSelect={() => handleModeChange(mode.modeName)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{mode.modeName}</span>
                    {currentMode.modeName === mode.modeName && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
               <Button onClick={handleCreateNewEpisode} disabled={isCreating || pageIsLoading} data-tour-id="create-new-button">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                {currentMode ? currentMode.newEpisodeButtonLabel : `New Item`}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" data-tour-id="import-json-button">
                    <label htmlFor="import-json-input" className="cursor-pointer inline-flex items-center justify-center">
                        <Upload className="mr-2 h-5 w-5" /> Import File
                    </label>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Adds new items from a structured JSON or Markdown file. Good for importing plans from collaborators or AI tools without deleting your existing data.</p>
                </TooltipContent>
              </Tooltip>
              <input type="file" id="import-json-input" accept=".json,.md" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
        
        {isTourOpen && <GuidedTour steps={tourSteps} isOpen={isTourOpen} onClose={handleTourClose} tourKey={`dashboard-tour-${tourSteps.length}`}/>}

        <div data-tour-id="ai-plan-generator-card">
          <AIPlanGenerator user={user} onPlanAdded={onRefresh} />
        </div>

        {hasMockEpisodes && !settings.userClearedMockEpisodesOnce && (
          <Card className="border-primary/50 bg-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center text-primary"><Sparkles className="mr-2 h-5 w-5"/>Ready to Start Fresh?</CardTitle>
              <CardDescription>You're currently viewing sample data. Clear it away to begin creating your own projects.</CardDescription>
            </CardHeader>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="animate-button-glow">
                    <Trash2 className="mr-2 h-4 w-4"/> Clear Samples & Start Fresh
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Sample Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all the sample items from your dashboard. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearSamples} disabled={isClearingSamples}>
                      {isClearingSamples && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Yes, Clear Samples
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        )}
        
        {settings && settings.showProTips && <ProTipCard episodes={episodes} setFocusOnEpisode={setFocusOnEpisode} />}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-3" data-tour-id="view-toggle-tabs">
              <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List</TabsTrigger>
              <TabsTrigger value="board"><LayoutGrid className="mr-2 h-4 w-4" />Board</TabsTrigger>
              <TabsTrigger value="timeline"><GanttChartSquare className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
            </TabsList>

            {currentMode && (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto" data-tour-id="search-sort-filter-controls">
                <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={`Search ${pluralize(currentMode.episodeLabel)}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full bg-background" disabled={pageIsLoading} data-tour-id="search-input"/>
                  {searchTerm && (<Button variant="ghost" size="icon" onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"><X className="h-4 w-4 text-muted-foreground"/></Button>)}
                </div>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)} disabled={pageIsLoading}>
                  <SelectTrigger className="w-full sm:w-[190px] bg-background" data-tour-id="sort-select"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_asc">Creation Date (Oldest)</SelectItem>
                    <SelectItem value="created_desc">Creation Date (Newest)</SelectItem>
                    <SelectItem value="updated_desc">Last Updated (Newest)</SelectItem>
                    <SelectItem value="updated_asc">Last Updated (Oldest)</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto bg-background" disabled={pageIsLoading} data-tour-id="filter-button"><SlidersHorizontal className="mr-2 h-4 w-4" />Filter{activeFilterCount > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{activeFilterCount}</span>}</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px]">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel><DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.recorded} onCheckedChange={(checked) => handleFilterChange('recorded', !!checked)}>{currentMode.statusWorkflow.editing.label}</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.notRecorded} onCheckedChange={(checked) => handleFilterChange('notRecorded', !!checked)}>Not {currentMode.statusWorkflow.editing.label}</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.uploaded} onCheckedChange={(checked) => handleFilterChange('uploaded', !!checked)}>{currentMode.statusWorkflow.published.label}</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.notUploaded} onCheckedChange={(checked) => handleFilterChange('notUploaded', !!checked)}>Not {currentMode.statusWorkflow.published.label}</DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator /><DropdownMenuLabel>Other Filters</DropdownMenuLabel><DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.hasGuest} onCheckedChange={(checked) => handleFilterChange('hasGuest', !!checked)}>Has {currentMode.guestLabel}</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.noGuest} onCheckedChange={(checked) => handleFilterChange('noGuest', !!checked)}>No {currentMode.guestLabel}</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.isFavorite} onCheckedChange={(checked) => handleFilterChange('isFavorite', !!checked)}>Favorites</DropdownMenuCheckboxItem>
                     <DropdownMenuSeparator />
                    <Button variant="ghost" onClick={resetFilters} className="w-full justify-start text-sm" disabled={activeFilterCount === 0}><FilterX className="mr-2 h-4 w-4" /> Reset Filters</Button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {currentMode ? (
            <>
              <TabsContent value="list">
                <DashboardListView
                  episodes={filteredAndSortedEpisodes}
                  isLoading={pageIsLoading}
                  onRefresh={onRefresh}
                  onLocalUpdate={handleLocalUpdate}
                  searchTerm={searchTerm}
                  sortOrder={sortOrder}
                  filters={filters}
                  currentMode={currentMode}
                  focusOnEpisode={focusOnEpisode}
                  setFocusOnEpisode={setFocusOnEpisode}
                  activeAccordionItems={activeAccordionItems}
                  setActiveAccordionItems={setActiveAccordionItems}
                />
              </TabsContent>
              <TabsContent value="board"><DashboardBoardView episodes={filteredAndSortedEpisodes} currentMode={currentMode}/></TabsContent>
              <TabsContent value="timeline"><DashboardTimelineView episodes={filteredAndSortedEpisodes} currentMode={currentMode} isLoading={pageIsLoading}/></TabsContent>
            </>
          ) : (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
