// src/components/dashboard/DashboardListView.tsx
'use client';

import React, { useMemo, useState, useCallback, useEffect, type MouseEvent, useRef } from 'react';
import type { Episode, AppMode, SharedSeasonData, EpisodeStatus, UserThemeSettings } from '@/types';
import {
  ListVideo,
  Archive,
  Trash2,
  Loader2,
  Library,
  Download,
  FileJson,
  ChevronDown,
  ChevronsUpDown,
  PanelTopClose,
  PanelBottomOpen,
  FileText as MarkdownIcon,
  Folder, FolderOpen, ArchiveRestore,
  Edit,
  Bot,
  Copy,
  Link as LinkIcon,
  Share2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EpisodeCard } from '@/components/dashboard/EpisodeCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deleteEpisodesByIdsDb, deleteAllArchivedEpisodesForUser, saveEpisodeDb } from '@/lib/episodeStore';
import { getCustomHost1Name } from '@/lib/episodeLayoutsStore';
import { pluralize, generateSeasonJson, generateSeasonMarkdown, calculateGenericEpisodeStatus, saveSharedSeason, getSharedSeason } from '@/lib/dataUtils';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import PublishedEpisodeModal from '@/components/episodes/PublishedEpisodeModal';
import { saveAs } from 'file-saver';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContextMode } from '@/contexts/ModeContext';


const SeasonSection = React.memo(function SeasonSection({
  seasonKey,
  displayName,
  episodes,
  sectionType = 'active',
  settings,
  ...props
}: {
  seasonKey: string;
  displayName: string;
  episodes: Episode[];
  sectionType?: 'active' | 'published';
  settings: UserThemeSettings;
  onRefresh: () => void;
  index: number;
  onLocalUpdate: (updatedEpisode: Episode) => void;
  expandedCardIds: string[];
  setExpandedCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentHost1Name: string;
}) {
    const { toast } = useToast();
    const { user } = useAuth();
    const { onRefresh, index } = props;
    const { ALL_APP_MODES, currentMode: globalDefaultMode } = useAppContextMode();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [showEditNameDialog, setShowEditNameDialog] = useState(false);
    const [newSeasonName, setNewSeasonName] = useState("");

    const [showLinkModeDialog, setShowLinkModeDialog] = useState(false);
    const [selectedMode, setSelectedMode] = useState(episodes[0]?.linkedAppMode || globalDefaultMode.modeName);
    
    const [isSharing, setIsSharing] = useState(false);

    const currentModeForSeason = useMemo(() => {
        return ALL_APP_MODES.find(m => m.modeName === (episodes[0]?.linkedAppMode)) || globalDefaultMode;
    }, [episodes, globalDefaultMode, ALL_APP_MODES]);

    const isAiGenerated = useMemo(() => episodes.some(ep => ep.isAiGenerated), [episodes]);

    const cleanDisplayName = displayName.replace(/\s*-\s*\[\d+\]$/, '').trim();
    const isNumberedSeason = seasonKey.startsWith('season-') && !episodes[0]?.seasonName;

    const firstEpisodePrompt = useMemo(() => {
        if (isAiGenerated) {
            return episodes.find(ep => ep.promptUsed)?.promptUsed || null;
        }
        return null;
    }, [isAiGenerated, episodes]);

    useEffect(() => {
        if(episodes[0]) {
            const initialName = episodes[0].seasonName || (isNumberedSeason ? `${currentModeForSeason.seasonLabel} ${episodes[0].seasonNumber}` : cleanDisplayName);
            setNewSeasonName(initialName);
            setSelectedMode(episodes[0].linkedAppMode || globalDefaultMode.modeName);
        }
    }, [episodes, isNumberedSeason, currentModeForSeason.seasonLabel, cleanDisplayName, globalDefaultMode.modeName]);
    
    const handleShareSeason = async () => {
      if (!user || !episodes || episodes.length === 0 || typeof window === 'undefined') {
        toast({ title: `Cannot Share ${currentModeForSeason.seasonLabel}`, description: `This ${currentModeForSeason.seasonLabel.toLowerCase()} is empty.`, variant: "destructive" });
        return;
      }
      setIsSharing(true);
      try {
        const ownerDisplayName = await getCustomHost1Name(user.uid) || user.displayName || 'A Collaborator';
        const seasonData: SharedSeasonData = {
          sharedAt: Date.now(),
          ownerId: user.uid,
          ownerDisplayName: ownerDisplayName,
          seasonNumber: episodes[0]?.seasonNumber ?? null,
          seasonName: episodes[0]?.seasonName ?? null,
          modeName: currentModeForSeason.modeName,
          episodes: episodes,
        };
        
        const shareId = await saveSharedSeason(seasonData);
        const shareUrl = `${window.location.origin}/dashboard?importSeasonId=${shareId}`;

        await navigator.clipboard.writeText(shareUrl);
        toast({ title: `${currentModeForSeason.seasonLabel} Link Copied!`, description: `A shareable link for this ${currentModeForSeason.seasonLabel.toLowerCase()} has been copied to your clipboard.` });
      } catch (error) {
        console.error("Error creating shareable link:", error);
        toast({ title: "Error", description: "Could not create shareable link. Please check your permissions and try again.", variant: "destructive" });
      } finally {
        setIsSharing(false);
      }
    };


    const handleSeasonExport = async (format: 'json' | 'md') => {
        if (!episodes || episodes.length === 0) {
          toast({ title: "Export Error", description: "There are no items in this season to export.", variant: "destructive" });
          return;
        }
        toast({ title: "Exporting Season...", description: `Preparing your ${currentModeForSeason.seasonLabel.toLowerCase()} for download.` });

        const firstEpisode = episodes[0];
        const seasonNumber = firstEpisode.seasonNumber;
        const seasonName = firstEpisode.seasonName;

        try {
            if (format === 'json') {
              generateSeasonJson(episodes, seasonNumber, seasonName, currentModeForSeason);
            } else {
              generateSeasonMarkdown(episodes, seasonNumber, seasonName, currentModeForSeason, props.currentHost1Name, null);
            }
        } catch (error: any) {
            toast({ title: "Export Failed", description: error.message || "Failed to generate export file.", variant: "destructive" });
        }
    };

    const handleSaveSeasonName = async () => {
        if (!user || !newSeasonName.trim()) {
            toast({ title: "Error", description: "Season name cannot be empty.", variant: "destructive"});
            return;
        }
        setIsEditingName(true);
        try {
            const updatePromises = episodes.map(ep => {
                const updatedEpisode = { ...ep, seasonName: newSeasonName.trim() };
                return saveEpisodeDb(updatedEpisode, user.uid);
            });
            await Promise.all(updatePromises);
            toast({ title: "Season Renamed", description: `Updated ${episodes.length} ${pluralize(currentModeForSeason.episodeLabel).toLowerCase()}.`});
            onRefresh();
        } catch(error) {
            toast({ title: "Error", description: "Could not rename season.", variant: "destructive"});
        } finally {
            setIsEditingName(false);
            setShowEditNameDialog(false);
        }
    };
    
    const handleLinkMode = async () => {
        if (!user) return;
        setIsEditingName(true); // Re-use saving state
        try {
            const updatePromises = episodes.map(ep => {
                const updatedEpisode = { ...ep, linkedAppMode: selectedMode };
                return saveEpisodeDb(updatedEpisode, user.uid);
            });
            await Promise.all(updatePromises);
            toast({ title: "Mode Linked", description: `Season "${cleanDisplayName}" is now linked to "${selectedMode}" mode.` });
            onRefresh();
        } catch (error) {
             toast({ title: "Error", description: "Could not link application mode.", variant: "destructive" });
        } finally {
            setIsEditingName(false);
            setShowLinkModeDialog(false);
        }
    };

    const handleDeleteSeason = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            const episodeIdsToDelete = episodes.map(ep => ep.id);
            await deleteEpisodesByIdsDb(episodeIdsToDelete, user.uid);
            toast({ title: "Season Deleted", description: `All episodes in "${cleanDisplayName}" have been deleted.` });
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Could not delete season.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Prompt Copied!", description: "The AI prompt has been copied to your clipboard." });
        }, (err) => {
            toast({ title: "Copy Failed", description: "Could not copy the prompt.", variant: "destructive" });
        });
    };

    return (
        <AccordionItem value={seasonKey} className={cn(
            "border-b-0 rounded-lg overflow-hidden transition-all",
            settings.highlightAiContent && isAiGenerated && "border-2 border-dashed animate-ai-glow"
        )}>
            <AccordionPrimitive.Header className="flex items-center w-full px-2 bg-card border border-border rounded-t-lg py-1">
                <AccordionPrimitive.Trigger
                    className="flex-1 p-0 group flex items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    data-tour-id={index === 0 ? "first-season-accordion-trigger" : undefined}
                >
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-foreground" />
                    <div className="flex items-center justify-center flex-1 text-foreground text-lg font-semibold">
                        <Library className="h-5 w-5 text-primary/80 shrink-0 mr-2" />
                        <span className="truncate">{displayName}</span>
                         {isAiGenerated && settings.highlightAiContent && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="ml-2"><Bot className="h-4 w-4 text-ai-glow"/></span>
                                </TooltipTrigger>
                                {firstEpisodePrompt && (
                                <TooltipContent className="max-w-md">
                                    <p className="font-semibold mb-1">AI Prompt Used:</p>
                                    <p className="text-xs mb-2 italic">"{firstEpisodePrompt}"</p>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {e.stopPropagation(); handleCopyToClipboard(firstEpisodePrompt)}}><Copy className="mr-1.5 h-3 w-3" /> Copy</Button>
                                </TooltipContent>
                                )}
                            </Tooltip>
                        )}
                    </div>
                </AccordionPrimitive.Trigger>

                <div className="flex items-center gap-1">
                    <Dialog open={showLinkModeDialog} onOpenChange={setShowLinkModeDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/80 hover:text-muted-foreground" aria-label="Link Application Mode">
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Link Application Mode to "{cleanDisplayName}"</DialogTitle>
                                <DialogDescription>
                                    Choose an Application Mode for this season. All items within it will adopt the terminology (e.g., "Episode" vs. "Chapter") of the selected mode.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Select value={selectedMode} onValueChange={setSelectedMode}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {ALL_APP_MODES.map(mode => <SelectItem key={mode.modeName} value={mode.modeName}>{mode.modeName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                                <Button onClick={handleLinkMode} disabled={isEditingName}>
                                    {isEditingName && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Link Mode
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/80 hover:text-muted-foreground" aria-label="Edit season name" disabled={seasonKey === 'no-season'}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Season Name</DialogTitle>
                                <DialogDescription>Enter a new name for this season. This will be applied to all {episodes.length} items within it.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="season-name-input">Season Name</Label>
                                <Input id="season-name-input" value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="button" onClick={handleSaveSeasonName} disabled={isEditingName || !newSeasonName.trim()}>
                                    {isEditingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/80 hover:text-muted-foreground" aria-label="Share or Export Season">
                            <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{cleanDisplayName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleShareSeason} disabled={isSharing}>
                          {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4" />}
                          Share via Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSeasonExport('json')}>
                          <FileJson className="mr-2 h-4 w-4" /> Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSeasonExport('md')}>
                          <MarkdownIcon className="mr-2 h-4 w-4" /> Export as Markdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" aria-label="Delete season">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Entire {currentModeForSeason.seasonLabel}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete the entire {currentModeForSeason.seasonLabel.toLowerCase()} "{cleanDisplayName}"? This will permanently delete all {episodes.length} {pluralize(currentModeForSeason.episodeLabel).toLowerCase()} within it. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSeason} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="animate-spin mr-2"/> : null} Delete {currentModeForSeason.seasonLabel}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </AccordionPrimitive.Header>
            <AccordionContent className="p-2 sm:p-4 border border-t-0 rounded-b-lg bg-background shadow-sm">
                <div className="space-y-4">
                    {episodes.map((episode, episodeIndex) => (
                        <EpisodeCard 
                            key={episode.id} 
                            episode={episode} 
                            settings={settings}
                            {...props} 
                            index={episodeIndex} 
                            isFirstEverEpisode={index === 0 && episodeIndex === 0} 
                            sectionType={sectionType}
                            currentMode={currentModeForSeason}
                        />
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
});
SeasonSection.displayName = "SeasonSection";

const getSeasonDisplayNameWithCount = (seasonKey: string, episodes: Episode[], seasonLabel: string): string => {
  const count = episodes.length;
  if (seasonKey === 'no-season') return `No ${seasonLabel} - [${count}]`;
  const customName = episodes[0]?.seasonName;
  if (customName) return `${customName} - [${count}]`;
  return `${seasonLabel} ${seasonKey.replace('season-', '')} - [${count}]`;
};

const EmptyState = ({ currentMode }: { currentMode: AppMode }) => (
  <div className="text-center py-16 px-4 bg-muted/30 rounded-lg">
    <ListVideo className="mx-auto h-20 w-20 text-muted-foreground/50" />
    <h3 className="mt-4 text-2xl font-semibold text-foreground">Your Dashboard is Empty</h3>
    <p className="mt-2 text-md text-muted-foreground">
      Create your first "{currentMode.episodeLabel}" to get started.
    </p>
  </div>
);

const ArchivedLibraryView = ({ episodes, onRefresh, settings }: { episodes: Episode[], onRefresh: () => void, settings: UserThemeSettings }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { ALL_APP_MODES, currentMode: globalDefaultMode } = useAppContextMode();
    const [openFolders, setOpenFolders] = useState<string[]>([]);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const getSeasonKey = (episode: Episode): string => {
        if (episode.seasonName && episode.seasonName.trim() !== '') return episode.seasonName;
        return episode.seasonNumber !== null && episode.seasonNumber !== undefined
            ? `season-${episode.seasonNumber}`
            : 'no-season';
    };

    const groupedEpisodes = useMemo(() => {
        return episodes.reduce((acc, ep) => {
            const key = getSeasonKey(ep);
            if (!acc[key]) acc[key] = [];
            acc[key].push(ep);
            return acc;
        }, {} as Record<string, Episode[]>);
    }, [episodes]);

    const sortedSeasonKeys = useMemo(() => {
        return Object.keys(groupedEpisodes).sort((a, b) => {
            const isANoSeason = a === 'no-season';
            const isBNoSeason = b === 'no-season';
            if (isANoSeason && isBNoSeason) return 0;
            if (isANoSeason) return 1;
            if (isBNoSeason) return -1;
            
            const aIsCustom = !a.startsWith('season-');
            const bIsCustom = !b.startsWith('season-');
        
            if (aIsCustom && bIsCustom) return a.localeCompare(b);
            if (aIsCustom) return -1;
            if (bIsCustom) return 1;
        
            const numA = parseInt(a.replace('season-', ''), 10);
            const numB = parseInt(b.replace('season-', ''), 10);
            return numA - numB;
          });
    }, [groupedEpisodes]);
    
    const handleToggleFolder = (e: React.MouseEvent, seasonKey: string) => {
        e.stopPropagation();
        setOpenFolders(prev => prev.includes(seasonKey) ? prev.filter(k => k !== seasonKey) : [...prev, seasonKey]);
    };

    const handleDeleteAll = async () => {
        if (!user) return;
        setIsDeletingAll(true);
        try {
            await deleteAllArchivedEpisodesForUser(user.uid);
            toast({ title: "Archived Cleared", description: "All archived items have been deleted." });
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Could not delete archived items.", variant: "destructive" });
        } finally {
            setIsDeletingAll(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2 px-2">
                <h2 className="text-lg font-semibold text-muted-foreground flex items-center"><Archive className="mr-2 h-5 w-5"/>Archived Library</h2>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">
                        {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>} 
                        Delete All Archived
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all {episodes.length} archived items. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedSeasonKeys.map(key => {
                        const seasonEpisodes = groupedEpisodes[key];
                        const isOpen = openFolders.includes(key);
                        const currentModeForSeason = ALL_APP_MODES.find(m => m.modeName === (seasonEpisodes[0]?.linkedAppMode)) || globalDefaultMode;
                        const cleanDisplayName = getSeasonDisplayNameWithCount(key, seasonEpisodes, currentModeForSeason.seasonLabel).replace(/\s*-\s*\[\d+\]$/, '');
                        return (
                            <div key={key} className={cn("rounded-lg p-3 transition-all duration-300", isOpen ? "bg-card shadow-md col-span-full" : "hover:bg-card/50 cursor-pointer bg-muted/20")} onClick={(e) => !isOpen && handleToggleFolder(e, key)}>
                                <div className="flex items-center gap-2 text-left" onClick={(e) => isOpen && handleToggleFolder(e, key)}>
                                    {isOpen ? <FolderOpen className="h-5 w-5 text-primary"/> : <Folder className="h-5 w-5 text-primary"/>}
                                    <span className="font-semibold truncate flex-1">{cleanDisplayName}</span>
                                    <Badge variant="secondary">{seasonEpisodes.length}</Badge>
                                </div>
                                {isOpen && (
                                    <div className="mt-2 pl-4 border-l-2 border-primary/20 ml-2 space-y-1 animate-in fade-in-50 duration-300">
                                        {seasonEpisodes.map(ep => (
                                          <PublishedEpisodeModal
                                            key={ep.id}
                                            episode={ep}
                                            currentMode={currentModeForSeason}
                                            onEpisodeUpdate={onRefresh}
                                            triggerButton={
                                                <button className="w-full text-left text-sm p-1.5 rounded hover:bg-muted flex items-center gap-2">
                                                    <Eye className="h-4 w-4 text-muted-foreground/70"/>
                                                    <span className="truncate">{ep.title}</span>
                                                </button>
                                            }
                                           />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

interface DashboardListViewProps {
    episodes: Episode[];
    isLoading: boolean;
    onRefresh: () => void;
    onLocalUpdate: (updatedEpisode: Episode) => void;
    searchTerm: string;
    sortOrder: 'created_asc' | 'created_desc' | 'updated_asc' | 'updated_desc';
    filters: any;
    currentMode: AppMode;
    focusOnEpisode: { episodeId: string; seasonKey: string; } | null;
    setFocusOnEpisode: React.Dispatch<React.SetStateAction<{ episodeId: string; seasonKey: string; } | null>>;
    activeAccordionItems: string[];
    setActiveAccordionItems: React.Dispatch<React.SetStateAction<string[]>>;
}

const NAVBAR_HEIGHT_OFFSET = 72;

export default function DashboardListView({
  episodes,
  isLoading,
  onRefresh,
  onLocalUpdate,
  searchTerm,
  sortOrder,
  focusOnEpisode,
  setFocusOnEpisode,
  activeAccordionItems,
  setActiveAccordionItems
}: DashboardListViewProps) {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { currentMode: globalDefaultMode, ALL_APP_MODES } = useAppContextMode();
  const [currentHost1Name, setCurrentHost1Name] = useState('Your Content');
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  
  const activeEpisodes = useMemo(() => episodes.filter(ep => !ep.isArchived), [episodes]);
  const archivedEpisodes = useMemo(() => episodes.filter(ep => ep.isArchived), [episodes]);
  
  const publishedEpisodes = useMemo(() => activeEpisodes.filter(ep => calculateGenericEpisodeStatus(ep, ALL_APP_MODES.find(m => m.modeName === ep.linkedAppMode) || globalDefaultMode) === 'published'), [activeEpisodes, globalDefaultMode, ALL_APP_MODES]);
  const nonPublishedActiveEpisodes = useMemo(() => activeEpisodes.filter(ep => calculateGenericEpisodeStatus(ep, ALL_APP_MODES.find(m => m.modeName === ep.linkedAppMode) || globalDefaultMode) !== 'published'), [activeEpisodes, globalDefaultMode, ALL_APP_MODES]);


  const getSeasonKey = (episode: Episode): string => {
    if (episode.seasonName && episode.seasonName.trim() !== '') return episode.seasonName;
    return episode.seasonNumber !== null && episode.seasonNumber !== undefined
      ? `season-${episode.seasonNumber}`
      : 'no-season';
  };
  
  const groupAndSortSeasons = useCallback((episodesToSort: Episode[]) => {
    const grouped = episodesToSort.reduce((acc, ep) => {
        const key = getSeasonKey(ep);
        if (!acc[key]) acc[key] = [];
        acc[key].push(ep);
        return acc;
    }, {} as Record<string, Episode[]>);

    for (const key in grouped) {
        grouped[key].sort((a, b) => (a.episodeNumber ?? Infinity) - (b.episodeNumber ?? Infinity));
    }

    const seasonSortValues: Record<string, number> = {};
    for (const key in grouped) {
        const episodesInSeason = grouped[key];
        if(sortOrder === 'updated_asc' || sortOrder === 'updated_desc') {
            seasonSortValues[key] = Math.max(...episodesInSeason.map(ep => ep.updatedAt || 0));
        } else { // created_asc or created_desc
            seasonSortValues[key] = Math.min(...episodesInSeason.map(ep => ep.createdAt || 0));
        }
    }

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const valA = seasonSortValues[a];
        const valB = seasonSortValues[b];

        if(sortOrder === 'updated_desc' || sortOrder === 'created_desc') {
            return valB - valA;
        }
        return valA - valB;
    });

    return { grouped, sortedKeys };
}, [sortOrder]);

  const { grouped: groupedActiveEpisodes, sortedKeys: sortedActiveSeasonKeys } = useMemo(() => groupAndSortSeasons(nonPublishedActiveEpisodes), [nonPublishedActiveEpisodes, groupAndSortSeasons]);
  const { grouped: groupedPublishedEpisodes, sortedKeys: sortedPublishedSeasonKeys } = useMemo(() => groupAndSortSeasons(publishedEpisodes), [publishedEpisodes, groupAndSortSeasons]);

  useEffect(() => {
    if (focusOnEpisode) {
      if (!activeAccordionItems.includes(focusOnEpisode.seasonKey)) {
        setActiveAccordionItems(prev => {
            const newSet = new Set(prev);
            newSet.add(focusOnEpisode.seasonKey);
            return Array.from(newSet);
        });
      }

      setTimeout(() => {
        const episodeCard = document.getElementById(`episode-card-${focusOnEpisode.episodeId}`);
        if (episodeCard) {
          const elementPosition = episodeCard.getBoundingClientRect().top;
          const offsetPosition = window.pageYOffset + elementPosition - NAVBAR_HEIGHT_OFFSET;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          episodeCard.classList.add('animate-pop-glow');
          setTimeout(() => {
            episodeCard.classList.remove('animate-pop-glow');
            setFocusOnEpisode(null);
          }, 1200);
        } else {
          setFocusOnEpisode(null);
        }
      }, 100); 
    }
  }, [focusOnEpisode, setFocusOnEpisode, activeAccordionItems, setActiveAccordionItems]);

  useEffect(() => {
    if (user?.uid) {
      getCustomHost1Name(user.uid).then(name => {
        setCurrentHost1Name(name || user.displayName || 'Your Content');
      });
    }
  }, [user]);

  const handleToggleAllSeasons = () => {
    const allSeasonsExpanded = activeAccordionItems.length === sortedActiveSeasonKeys.length && sortedActiveSeasonKeys.length > 0;
    if (allSeasonsExpanded) {
      setActiveAccordionItems([]);
    } else {
      setActiveAccordionItems(sortedActiveSeasonKeys);
    }
  };

  const handleExpandAllCards = () => {
    setExpandedCardIds(activeEpisodes.map(ep => ep.id));
  };
  
  const handleCollapseAllCards = () => {
    setExpandedCardIds([]);
  };

  useEffect(() => {
    if (sortedActiveSeasonKeys.length > 0 && activeAccordionItems.length === 0) {
      setActiveAccordionItems([sortedActiveSeasonKeys[0]]);
    } else if (sortedActiveSeasonKeys.length > 0) {
      setActiveAccordionItems(prev => prev.filter(item => sortedActiveSeasonKeys.includes(item)));
    } else {
      setActiveAccordionItems([]);
    }
  }, [sortedActiveSeasonKeys, setActiveAccordionItems]);

  const episodeCardProps = {
    onLocalUpdate,
    onRefresh,
    expandedCardIds,
    setExpandedCardIds,
    currentHost1Name,
    settings,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
          <div className="flex justify-between items-center"><Skeleton className="h-8 w-1/3" /> <Skeleton className="h-8 w-8" /></div>
          <div className="p-4 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        </div>
      </div>
    );
  }

  if (episodes.length === 0 && !searchTerm) {
    return <EmptyState currentMode={globalDefaultMode} />;
  }

  if (activeEpisodes.length === 0 && archivedEpisodes.length === 0 && searchTerm) {
      return <div className="text-center py-16 px-4 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold">No Results Found</h3>
        <p className="text-muted-foreground">Your search for "{searchTerm}" did not match any items.</p>
      </div>
  }

  const allSeasonsExpanded = activeAccordionItems.length === sortedActiveSeasonKeys.length && sortedActiveSeasonKeys.length > 0;
  
  return (
    <div className="space-y-8">
      {sortedActiveSeasonKeys.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2 px-2">
              <h2 className="text-lg font-semibold text-muted-foreground">Active {pluralize(globalDefaultMode.episodeLabel)}</h2>
              <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleToggleAllSeasons} className="text-xs">
                      <ChevronsUpDown className="mr-1.5 h-4 w-4"/>
                      {allSeasonsExpanded ? 'Collapse' : 'Expand'} {pluralize(globalDefaultMode.seasonLabel)}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCollapseAllCards} className="text-xs">
                      <PanelTopClose className="mr-1.5 h-4 w-4"/>
                      Collapse All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleExpandAllCards} className="text-xs">
                      <PanelBottomOpen className="mr-1.5 h-4 w-4"/>
                      Expand All
                  </Button>
              </div>
          </div>
          <Accordion type="multiple" value={activeAccordionItems} onValueChange={setActiveAccordionItems} className="w-full space-y-4">
            {sortedActiveSeasonKeys.map((key, idx) => {
              const seasonEpisodes = groupedActiveEpisodes[key];
              return (
                <SeasonSection 
                  key={key} 
                  seasonKey={key} 
                  displayName={getSeasonDisplayNameWithCount(key, seasonEpisodes, globalDefaultMode.seasonLabel)} 
                  episodes={seasonEpisodes} 
                  {...episodeCardProps} 
                  index={idx}
                />
              );
            })}
          </Accordion>
        </div>
      )}

      {sortedPublishedSeasonKeys.length > 0 && (
        <div>
           <div className="flex justify-between items-center mb-2 px-2">
              <h2 className="text-lg font-semibold text-muted-foreground">Published {pluralize(globalDefaultMode.episodeLabel)}</h2>
          </div>
          <Accordion type="multiple" defaultValue={sortedPublishedSeasonKeys} className="w-full space-y-4">
            {sortedPublishedSeasonKeys.map((key, idx) => {
              const seasonEpisodes = groupedPublishedEpisodes[key];
              return (
                <SeasonSection 
                  key={`published-${key}`} 
                  seasonKey={`published-${key}`}
                  displayName={getSeasonDisplayNameWithCount(key, seasonEpisodes, globalDefaultMode.seasonLabel)} 
                  episodes={seasonEpisodes} 
                  {...episodeCardProps}
                  sectionType="published"
                  index={sortedActiveSeasonKeys.length + idx}
                />
              );
            })}
          </Accordion>
        </div>
      )}

      {archivedEpisodes.length > 0 && (
        <ArchivedLibraryView episodes={archivedEpisodes} onRefresh={onRefresh} settings={settings} />
      )}
    </div>
  );
}
