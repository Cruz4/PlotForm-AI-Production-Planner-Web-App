// src/components/dashboard/EpisodeCard.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, type MouseEvent, useRef } from 'react';
import type { Episode, Segment, AppMode, EpisodeStatus, UserThemeSettings } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIconUI } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Star, Edit, Share2, FileJson, FileOutput, Link as LinkIconLucide, CalendarDays,
  Archive, ArchiveRestore, Trash2, StickyNote, User, Users, ChevronDown,
  ListChecks, FileText as MarkdownIcon, Ellipsis, PlusCircle, ListTree, Save, X as CancelIcon,
  PanelTopClose, PanelBottomOpen, Link2, Download, DiscAlbum, CheckCircle, CalendarClock, Bot
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveEpisodeDb, deleteEpisodeDb } from '@/lib/episodeStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { generateEpisodePdf } from '@/lib/pdfUtils';
import { generateEpisodeMarkdown } from '@/lib/markdownUtils';
import { formatEpisodeIdentifier, areAllHost1SegmentsFilledForCard, calculateGenericEpisodeStatus, pluralize, calculateOverallEpisodeProgress, generateSeasonJson, generateSeasonMarkdown, generateEpisodeZip } from '@/lib/dataUtils';
import { Separator } from '@/components/ui/separator';
import { getStatusVisualsForCard } from './card-utils';
import { Label } from '@/components/ui/label';
import { Input } from '../ui/input';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProgressPopup, type ProgressPopupInfo } from './ProgressPopup';


const getStatusTooltipContent = (episode: Episode, currentMode: AppMode): string => {
    if (episode.useManualStatus) return 'Status is being set manually. Click badge to change.';
    const status = calculateGenericEpisodeStatus(episode, currentMode);
    switch (status) {
        case 'planning':
            return `Next Step: Fill all your content sections and set a "${episode.customStatusLabels?.scheduled || currentMode.statusWorkflow.scheduled.label}" date to move to the next stage.`;
        case 'scheduled':
            return `Next Step: Once recorded, set the "${episode.customStatusLabels?.editing || currentMode.statusWorkflow.editing.label}" date to move to the editing stage.`;
        case 'editing':
            return `Next Step: Complete all checklist items and set the "${episode.customStatusLabels?.published || currentMode.statusWorkflow.published.label}" date to publish.`;
        case 'published':
            return 'This item is published!';
        case 'archived':
            return 'This item is archived and hidden from the main board.';
        default:
            return 'Current status of this item.';
    }
};

const StatusBadge = React.memo(React.forwardRef<HTMLDivElement, { episode: Episode, currentMode: AppMode, isFirstEver: boolean, onStatusChange: (status: EpisodeStatus) => void }>(({ episode, currentMode, isFirstEver, onStatusChange }, ref) => {
    const derivedStatus = calculateGenericEpisodeStatus(episode, currentMode);
    const statusVisuals = getStatusVisualsForCard(derivedStatus, currentMode, episode.customStatusLabels);
    const tooltipContent = getStatusTooltipContent(episode, currentMode);

    const statusOptions: EpisodeStatus[] = ['planning', 'scheduled', 'editing', 'published'];

    if (episode.useManualStatus) {
        return (
             <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button ref={ref as React.Ref<HTMLButtonElement>} variant="outline" className={cn("h-auto px-2 py-0.5 text-xs", statusVisuals.colorClasses)} data-tour-id={isFirstEver ? "first-episode-status-badge" : undefined}>
                                {statusVisuals.icon} {statusVisuals.text} <ChevronDown className="h-3 w-3 ml-1"/>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>{tooltipContent}</p></TooltipContent>
                </Tooltip>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={derivedStatus} onValueChange={(value) => onStatusChange(value as EpisodeStatus)}>
                        {statusOptions.map(statusKey => {
                            const visuals = getStatusVisualsForCard(statusKey, currentMode, episode.customStatusLabels);
                            return (
                                <DropdownMenuRadioItem key={statusKey} value={statusKey}>
                                    {visuals.icon} {visuals.text}
                                </DropdownMenuRadioItem>
                            );
                        })}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                 <Badge ref={ref} variant="outline" className={cn("text-xs", statusVisuals.colorClasses)} data-tour-id={isFirstEver ? "first-episode-status-badge" : undefined}>
                    {statusVisuals.icon} {statusVisuals.text}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipContent}</p>
            </TooltipContent>
        </Tooltip>
    );
}));
StatusBadge.displayName = "StatusBadge";

const getWordCount = (text: string | null | undefined): number => {
  if (!text || typeof text !== 'string' || text.trim() === '') return 0;
  const strippedText = text.replace(/<[^>]*>?/gm, ' ');
  return strippedText.trim().split(/\s+/).filter(Boolean).length;
};

const SegmentEditorInline = ({
  segment,
  index,
  onSegmentChange,
  currentMode,
  checklist,
  onScrollToChecklist,
  onChecklistItemToggle,
  onRemoveSegment,
}: {
  segment: Segment;
  index: number;
  onSegmentChange: (index: number, updates: Partial<Segment>) => void;
  currentMode: AppMode;
  checklist?: Episode['productionChecklist'];
  onScrollToChecklist: () => void;
  onChecklistItemToggle: (itemId: string) => void;
  onRemoveSegment: (segmentId: string) => void;
}) => {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const newLinkInputRef = useRef<HTMLInputElement>(null);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(true);
  const [wordCount, setWordCount] = useState(() => getWordCount(segment.host1Notes));

  const linkedChecklistItem = useMemo(() => {
    return (checklist || []).find(item => item.linkedSegmentId === segment.id);
  }, [checklist, segment.id]);
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onSegmentChange(index, { host1Notes: newText });
    setWordCount(getWordCount(newText));
  };
  
  const handleSaveNewLink = () => {
    const newLink = newLinkInputRef.current?.value.trim();
    if (newLink) {
      onSegmentChange(index, { host1Links: [...(segment.host1Links || []), newLink] });
    }
    setIsAddingLink(false);
  };
  
  const handleRemoveLink = (linkIndex: number) => {
    const newLinks = (segment.host1Links || []).filter((_, i) => i !== linkIndex);
    onSegmentChange(index, { host1Links: newLinks });
  };

  return (
    <div id={`segment-card-${segment.id}`} className="space-y-3">
        {linkedChecklistItem && (
            <button
                onClick={onScrollToChecklist}
                className="w-full text-left p-1.5 -mt-1 border border-dashed rounded-md flex items-center gap-2 hover:bg-background transition-colors"
            >
                <Checkbox checked={linkedChecklistItem.completed} onCheckedChange={() => onChecklistItemToggle(linkedChecklistItem.id)} />
                <span className="text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3 mr-1.5 inline-block text-accent"/>
                    <span className="font-semibold">Linked Task:</span> {linkedChecklistItem.text}
                </span>
            </button>
        )}
      <div>
        <Label className="text-sm font-medium">{currentMode.segmentContentLabel}</Label>
        <Textarea
          defaultValue={segment.host1Notes}
          onBlur={(e) => onSegmentChange(index, { host1Notes: e.target.value })}
          onChange={handleNotesChange}
          className="min-h-[100px] bg-background mt-1"
          placeholder={`Add your ${currentMode.segmentContentLabel.toLowerCase()} here...`}
        />
        <p className="text-xs text-muted-foreground text-right mt-1">Word Count: {wordCount}</p>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label>Links / Media</Label>
          {!isAddingLink && <Button variant="outline" size="sm" onClick={() => setIsAddingLink(true)}><PlusCircle className="h-4 w-4 mr-1.5"/>Add Link</Button>}
        </div>
        {isAddingLink && (
          <div className="flex gap-2">
            <Input ref={newLinkInputRef} placeholder="https://example.com" autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveNewLink()}/>
            <Button size="icon" onClick={handleSaveNewLink}><Save className="h-4 w-4"/></Button>
            <Button size="icon" variant="ghost" onClick={() => setIsAddingLink(false)}><CancelIcon className="h-4 w-4"/></Button>
          </div>
        )}
        {(segment.host1Links || []).length > 0 && (
          <div className="space-y-1 mt-2">
            {(segment.host1Links || []).map((link, i) => (
              <div key={i} className="flex items-center gap-1 text-sm">
                <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-500 hover:underline truncate">{link}</a>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveLink(i)} className="h-6 w-6"><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <button onClick={() => setIsNotesCollapsed(!isNotesCollapsed)} className="w-full text-left flex items-center justify-between py-1">
          <Label className="cursor-pointer flex items-center">
            <StickyNote className={cn("h-4 w-4 mr-2", (segment.host1AudienceSuggestions || '').trim() ? 'text-primary' : 'text-muted-foreground')}/>
            Segment Notes
          </Label>
          <span className="text-xs text-muted-foreground flex items-center">
            {isNotesCollapsed ? 'Expand' : 'Collapse'} <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", !isNotesCollapsed && "rotate-180")} />
          </span>
        </button>
        {!isNotesCollapsed && (
          <Textarea
            defaultValue={segment.host1AudienceSuggestions}
            onBlur={(e) => onSegmentChange(index, { host1AudienceSuggestions: e.target.value })}
            className="min-h-[80px] bg-background mt-1"
            placeholder={`Add any specific notes for this ${currentMode.segmentLabel.toLowerCase()}...`}
          />
        )}
      </div>
    </div>
  );
};

// Use React.forwardRef to correctly pass the ref to the underlying TooltipTrigger -> Popover -> Button
const DateButton: React.FC<{ date: number | null | undefined, onDateChange: (d: Date | undefined) => void, statusKey: 'scheduled' | 'editing' | 'published', episode: Episode, currentMode: AppMode }> = React.forwardRef<HTMLButtonElement, { date: number | null | undefined, onDateChange: (d: Date | undefined) => void, statusKey: 'scheduled' | 'editing' | 'published', episode: Episode, currentMode: AppMode }>(({ date, onDateChange, statusKey, episode, currentMode }, ref) => {
    const isSet = !!date;
    const visuals = {
        scheduled: { icon: CalendarClock, color: 'text-yellow-500', label: episode.customStatusLabels?.scheduled || currentMode.statusWorkflow.scheduled.label },
        editing: { icon: DiscAlbum, color: 'text-orange-500', label: episode.customStatusLabels?.editing || currentMode.statusWorkflow.editing.label },
        published: { icon: CheckCircle, color: 'text-green-500', label: episode.customStatusLabels?.published || currentMode.statusWorkflow.published.label },
    };
    const { icon: Icon, color, label } = visuals[statusKey];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            ref={ref}
                            variant={isSet ? "secondary" : "outline"}
                            className={cn(
                                "h-8 text-xs justify-start text-left font-normal flex-1 px-2",
                                !isSet && "text-muted-foreground bg-muted/50 border-dashed"
                            )}
                        >
                            <Icon className={cn("mr-1.5 h-4 w-4 shrink-0", isSet ? color : "text-muted-foreground")} />
                            <span className="truncate">{label}: {isSet ? format(new Date(date!), "MMM d") : 'Not Set'}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <CalendarIconUI mode="single" selected={date ? new Date(date) : undefined} onSelect={onDateChange} />
                    </PopoverContent>
                </Popover>
            </TooltipTrigger>
            <TooltipContent>
                <p>Set the "{label}" date.</p>
            </TooltipContent>
        </Tooltip>
    );
});
DateButton.displayName = 'DateButton';

export const EpisodeCard = ({
  episode: initialEpisode,
  currentMode,
  onLocalUpdate,
  onRefresh,
  expandedCardIds,
  setExpandedCardIds,
  currentHost1Name,
  index,
  isFirstEverEpisode,
  sectionType,
  settings
}: {
  episode: Episode;
  currentMode: AppMode;
  onLocalUpdate: (updatedEpisode: Episode) => void;
  onRefresh: () => void;
  expandedCardIds: string[];
  setExpandedCardIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentHost1Name: string;
  index: number;
  isFirstEverEpisode: boolean;
  sectionType?: 'active' | 'published';
  settings: UserThemeSettings;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [episode, setEpisode] = useState(initialEpisode);
  const isCardExpanded = expandedCardIds.includes(episode.id);

  const [isSegmentsVisible, setIsSegmentsVisible] = useState(false);
  const [openSegmentAccordion, setOpenSegmentAccordion] = useState<string[]>([]);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegmentTitle, setNewSegmentTitle] = useState("");
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [editingChecklistItem, setEditingChecklistItem] = useState<{ id: string; text: string } | null>(null);
  
  const [isSharingLink, setIsSharingLink] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const prevProgressRef = useRef<number>(0);
  const [progressPopupInfo, setProgressPopupInfo] = useState<ProgressPopupInfo | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    prevProgressRef.current = calculateOverallEpisodeProgress(initialEpisode, currentMode);
  }, [initialEpisode, currentMode]);

  useEffect(() => {
    setEpisode(initialEpisode);
  }, [initialEpisode]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  };

  const showProgressPopup = (newProgress: number, type: 'change' | 'recalculation' = 'change') => {
    const change = newProgress - prevProgressRef.current;
    setProgressPopupInfo({
      x: mousePos.current.x,
      y: mousePos.current.y,
      change: type === 'change' ? change : 0,
      newTotal: newProgress,
      type
    });
    prevProgressRef.current = newProgress;
  };

  const handleToggleCardExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCardIds(prev =>
      isCardExpanded ? prev.filter(id => id !== episode.id) : [...prev, episode.id]
    );
    if (isCardExpanded) {
        setIsSegmentsVisible(false);
        setIsChecklistVisible(false);
    }
  };

  const handleUpdate = useCallback(async (updates: Partial<Episode>) => {
    if (!user) return;

    const oldProgress = calculateOverallEpisodeProgress(episode, currentMode);
    const optimisticUpdate = { ...episode, ...updates, updatedAt: Date.now() };
    setEpisode(optimisticUpdate);
    onLocalUpdate(optimisticUpdate);

    const newProgress = calculateOverallEpisodeProgress(optimisticUpdate, currentMode);
    if (newProgress !== oldProgress) {
        showProgressPopup(newProgress, 'change');
    }

    try {
      await saveEpisodeDb(optimisticUpdate, user.uid);
    } catch (e) {
      toast({ title: "Sync Error", description: "Could not save changes to the database.", variant: "destructive" });
      setEpisode(episode);
      onLocalUpdate(episode);
    }
  }, [user, episode, onLocalUpdate, toast, currentMode]);
  
  const handleSegmentChange = useCallback((segmentIndex: number, updates: Partial<Segment>) => {
    const newSegments = [...episode.segments];
    newSegments[segmentIndex] = { ...newSegments[segmentIndex], ...updates };
    handleUpdate({ segments: newSegments });
  }, [episode.segments, handleUpdate]);

  const handleRemoveSegment = (segmentId: string) => {
      const oldProgress = calculateOverallEpisodeProgress(episode, currentMode);
      const newSegments = episode.segments.filter(s => s.id !== segmentId);
      const updatedEpisode = { ...episode, segments: newSegments };
      handleUpdate({ segments: newSegments });
      const newProgress = calculateOverallEpisodeProgress(updatedEpisode, currentMode);
      showProgressPopup(newProgress, 'recalculation');
  };
  
  const handleAddSegment = () => {
      if (!newSegmentTitle.trim()) return;
      const oldProgress = calculateOverallEpisodeProgress(episode, currentMode);
      const newSegment: Segment = {
      id: uuidv4(),
      title: newSegmentTitle.trim(),
      host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
      host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
      subtitle: '',
      };
      const updatedEpisode = { ...episode, segments: [...episode.segments, newSegment] };
      handleUpdate({ segments: [...episode.segments, newSegment] });
      setNewSegmentTitle("");
      setIsAddingSegment(false);
      const newProgress = calculateOverallEpisodeProgress(updatedEpisode, currentMode);
      showProgressPopup(newProgress, 'recalculation');
  };

  const handleChecklistItemToggle = (itemId: string) => {
      handleUpdate({
          productionChecklist: episode.productionChecklist?.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
      });
  };

  const handleAddChecklistItem = () => {
      if (!newChecklistItemText.trim()) return;
      const oldProgress = calculateOverallEpisodeProgress(episode, currentMode);
      const newItem = { id: uuidv4(), text: newChecklistItemText.trim(), completed: false, linkedSegmentId: null };
      const updatedEpisode = { ...episode, productionChecklist: [...(episode.productionChecklist || []), newItem] };
      handleUpdate({
          productionChecklist: [...(episode.productionChecklist || []), newItem],
      });
      setNewChecklistItemText('');
      const newProgress = calculateOverallEpisodeProgress(updatedEpisode, currentMode);
      showProgressPopup(newProgress, 'recalculation');
  };

  const handleRemoveChecklistItem = (itemId: string) => {
      const oldProgress = calculateOverallEpisodeProgress(episode, currentMode);
      const newChecklist = episode.productionChecklist?.filter(item => item.id !== itemId);
      const updatedEpisode = { ...episode, productionChecklist: newChecklist };
      handleUpdate({
          productionChecklist: newChecklist,
      });
      const newProgress = calculateOverallEpisodeProgress(updatedEpisode, currentMode);
      showProgressPopup(newProgress, 'recalculation');
  };

  const handleUpdateChecklistItemText = (itemId: string, newText: string) => {
      handleUpdate({
          productionChecklist: episode.productionChecklist?.map(item =>
              item.id === itemId ? { ...item, text: newText } : item
          ),
      });
      setEditingChecklistItem(null);
  };

  const handleChecklistLinkChange = (itemId: string, segmentId: string | null) => {
      const updatedChecklist = (episode.productionChecklist || []).map(item =>
          item.id === itemId ? { ...item, linkedSegmentId: segmentId } : item
      );
      handleUpdate({ productionChecklist: updatedChecklist });
  };
    
  const handleShareEpisodeViaLink = async () => {
    if (!episode || !episode.id || typeof window === 'undefined') {
      toast({ title: "Cannot Share", description: "The item must be saved first to create a shareable link.", variant: "destructive" });
      return;
    }
    setIsSharingLink(true);
    const shareUrl = `${window.location.origin}/dashboard?importEpisodeId=${episode.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!", description: "Shareable link copied to clipboard." });
    } catch (err) {
      toast({ title: "Error", description: "Could not copy share link.", variant: "destructive" });
    } finally {
      setIsSharingLink(false);
    }
  };
  
  const handleExportJsonData = async (type: 'episode' | 'editor') => {
    if (!user || !episode) return;
    setIsExportingJSON(true);
    try {
      let ownerDisplayNameForExport = episode.ownerHostDisplayName || currentHost1Name;
      let jsonDataString: string;
      let fileNameSuffix: string;

      if (type === 'episode') {
        const episodeToExport: Partial<Episode> = { ...episode, collaborators: Array.from(new Set([...(episode.collaborators || []), user.uid])), ownerHostDisplayName: ownerDisplayNameForExport };
        delete (episodeToExport as any).importedHostDisplayName;
        jsonDataString = JSON.stringify(episodeToExport, null, 2);
        fileNameSuffix = `${currentMode.episodeLabel.toLowerCase()}_data_${Date.now()}`;
      } else {
        const editorData = { exportFormatVersion: "1.0.0", exportedAt: Date.now(), episodeTitle: episode.title, episodeNumber: episode.episodeNumber, segments: episode.segments.map((s: Segment) => ({ id: s.id, title: s.title, subtitle: s.subtitle || "", host1Content: s.host1Notes || "", host2Content: s.host2Notes || "" })) };
        jsonDataString = JSON.stringify(editorData, null, 2);
        fileNameSuffix = `editor_export_${Date.now()}`;
      }
      const blob = new Blob([jsonDataString], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(episode.title || currentMode.episodeLabel.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '_')}_${fileNameSuffix}.json`;
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Data Exported', description: `"${a.download}" downloaded as JSON.` });
    } catch (err) {
      toast({ title: 'Error exporting JSON', description: err instanceof Error ? err.message : 'An unknown error occurred.', variant: "destructive" });
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleInitiatePdfExport = async () => {
    if (!episode) return;
    setIsExportingPDF(true);
    toast({ title: "Exporting PDF...", description: "Preparing PDF." });
    try {
      await generateEpisodePdf(episode, 'both', currentHost1Name, episode.importedHostDisplayName);
    } catch (err: any) {
      toast({ title: "PDF Export Failed", description: err.message || "Error generating PDF.", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };
  
  const handleExportMarkdown = () => {
    if (!episode) return;
    const collaboratorDisplayName = episode.importedHostDisplayName || "Collaborator";
    const markdownContent = generateEpisodeMarkdown(episode, currentHost1Name, collaboratorDisplayName, currentMode.segmentContentLabel);
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(episode.title || currentMode.episodeLabel.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '_')}_plan.md`;
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast({ title: 'Markdown Exported', description: `${currentMode.episodeLabel} plan downloaded as Markdown.` });
  };
  
  const { short: shortIdentifier, long: longIdentifier } = useMemo(() => formatEpisodeIdentifier(episode, currentMode), [episode, currentMode]);
  
  const NAVBAR_HEIGHT_OFFSET = 72;
  const handleScrollToSection = (elementId: string) => {
      const element = document.getElementById(elementId);
      if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = window.pageYOffset + elementPosition - NAVBAR_HEIGHT_OFFSET;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
  };

  const handleSegmentShortcutClick = (segmentId: string) => {
    setIsSegmentsVisible(true);
    setOpenSegmentAccordion(prev => {
        const newSet = new Set(prev);
        newSet.add(segmentId);
        return Array.from(newSet);
    });

    setTimeout(() => handleScrollToSection(`segment-accordion-trigger-${segmentId}`), 50);
  };
  
  const handleLinkedChecklistItemClick = (segmentId: string) => {
    setIsSegmentsVisible(true);
    setOpenSegmentAccordion(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(segmentId)) {
        newSet.add(segmentId);
      }
      return Array.from(newSet);
    });

    // Use a timeout to allow the DOM to update with the opened accordion
    setTimeout(() => {
      handleScrollToSection(`segment-accordion-trigger-${segmentId}`);
    }, 100);
  };
  
  const handleDownloadZip = async () => {
    if (!episode) return;
    setIsDownloadingZip(true);
    toast({ title: "Preparing Download...", description: "Generating ZIP file." });
    try {
        const zip = new JSZip();
        await generateEpisodeZip(episode, zip, currentHost1Name, episode.importedHostDisplayName || null, currentMode.segmentContentLabel);
        const content = await zip.generateAsync({ type: "blob" });
        const fileName = `${(episode.title || 'episode').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
        saveAs(content, fileName);
    } catch (error) {
        toast({ title: "Error", description: "Could not create ZIP file.", variant: "destructive" });
    } finally {
        setIsDownloadingZip(false);
    }
  };

  const overallProgress = useMemo(() => calculateOverallEpisodeProgress(episode, currentMode), [episode, currentMode]);
  const checklistItems = episode.productionChecklist || [];
  const completedChecklistItems = checklistItems.filter(item => item.completed).length;

  return (
    <TooltipProvider>
      {progressPopupInfo && <ProgressPopup popupInfo={progressPopupInfo} onAnimationEnd={() => setProgressPopupInfo(null)} />}
      <Card
        id={`episode-card-${episode.id}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        data-tour-id={isFirstEverEpisode ? "first-episode-card" : undefined}
        className={cn(
          "transition-all duration-300",
          index % 2 !== 0 && "bg-muted/40"
      )}>
        <CardHeader className="p-3">
          <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-grow min-w-0">
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -ml-1 text-muted-foreground" onClick={handleToggleCardExpand} data-tour-id={isFirstEverEpisode ? "first-episode-expand-button" : undefined}>
                      <ChevronDown className={cn("h-5 w-5 transition-transform", isCardExpanded ? "rotate-180" : "")} />
                  </Button></TooltipTrigger><TooltipContent><p>{isCardExpanded ? "Collapse card" : "Expand for inline editing"}</p></TooltipContent></Tooltip>
                  
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); handleUpdate({ isFavorite: !episode.isFavorite }); }}>
                  <Star className={cn("h-5 w-5", episode.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                  </Button></TooltipTrigger><TooltipContent><p>{episode.isFavorite ? "Remove from favorites" : "Add to favorites"}</p></TooltipContent></Tooltip>
                  
                  <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/dashboard/episode/${episode.id}`}>
                          <Badge variant="secondary">{shortIdentifier}</Badge>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{longIdentifier}</p>
                      </TooltipContent>
                  </Tooltip>
                   <h3 className="font-semibold tracking-tight text-lg truncate text-accent hover:underline cursor-pointer flex items-center" title={episode.title}>
                      <Link href={`/dashboard/episode/${episode.id}`}>{episode.title}</Link>
                      {settings.highlightAiContent && episode.isAiGenerated && (
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <span className="ml-1.5"><Bot className="h-4 w-4 text-ai-glow"/></span>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p className="max-w-xs">
                                      <span className="font-semibold">AI Generated from prompt:</span><br/>
                                      <span className="italic">"{episode.promptUsed || 'No prompt recorded.'}"</span>
                                  </p>
                              </TooltipContent>
                          </Tooltip>
                      )}
                  </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge episode={episode} currentMode={currentMode} isFirstEver={isFirstEverEpisode} onStatusChange={(status) => handleUpdate({ status, useManualStatus: true })}/>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Ellipsis className="h-5 w-5"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {sectionType === 'published' && (
                            <>
                                <DropdownMenuItem onSelect={handleDownloadZip}>
                                    {isDownloadingZip ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} Download as ZIP
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleUpdate({ isArchived: true })}>
                                    <Archive className="mr-2 h-4 w-4" /> Archive Item
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {sectionType !== 'published' && (
                            <DropdownMenuItem onSelect={() => handleUpdate({ isArchived: !episode.isArchived })}>{episode.isArchived ? <><ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive</> : <><Archive className="mr-2 h-4 w-4" /> Archive</>}</DropdownMenuItem>
                        )}
                        <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{episode.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => user && deleteEpisodeDb(episode.id, user.uid).then(onRefresh)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          </div>
          <div className="mt-2 pl-8" data-tour-id={isFirstEverEpisode ? "first-episode-progress-bar" : undefined}>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Overall Progress: {overallProgress}%</span>
                  <span>Created: {format(new Date(episode.createdAt), "MMM d, yyyy")}</span>
              </div>
              <Progress value={overallProgress} />
               <div className="flex justify-end items-center text-xs text-muted-foreground/80 mt-1">
                  <span>Last updated: {formatDistanceToNowStrict(new Date(episode.updatedAt), { addSuffix: true })}</span>
               </div>
          </div>
        </CardHeader>
        
        {isCardExpanded && (
          <CardContent className="p-4 pt-2 animate-in fade-in-50 duration-300">
              <div className="space-y-4">
                  {!episode.useManualStatus && (
                      <div className="flex justify-center items-center" data-tour-id={isFirstEverEpisode ? "first-episode-date-buttons" : undefined}>
                          <div className="flex justify-center items-center gap-x-2 w-full max-w-lg mx-auto">
                              <DateButton episode={episode} currentMode={currentMode} date={episode.dateScheduledForRecording} onDateChange={(date) => handleUpdate({ dateScheduledForRecording: date?.getTime() })} statusKey="scheduled" />
                              <DateButton episode={episode} currentMode={currentMode} date={episode.dateRecorded} onDateChange={(date) => handleUpdate({ dateRecorded: date?.getTime() })} statusKey="editing" />
                              <DateButton episode={episode} currentMode={currentMode} date={episode.dateUploaded} onDateChange={(date) => handleUpdate({ dateUploaded: date?.getTime() })} statusKey="published" />
                          </div>
                      </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                      <div><span className="font-semibold text-muted-foreground">{currentMode.guestLabel}:</span> <span className="text-foreground">{episode.specialGuest || <span className="italic text-muted-foreground">N/A</span>}</span></div>
                      <div><span className="font-semibold text-muted-foreground">{currentMode.detailLabel}:</span> <span className="text-foreground">{episode.lunchProvidedBy || <span className="italic text-muted-foreground">N/A</span>}</span></div>
                  </div>
                  <div>
                    <Textarea
                      defaultValue={episode.episodeNotes}
                      onBlur={(e) => handleUpdate({ episodeNotes: e.target.value })}
                      placeholder="Add general notes for this item..."
                      className="text-xs text-muted-foreground bg-background/50 min-h-[40px] resize-y"
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2" data-tour-id={isFirstEverEpisode ? "first-episode-segment-shortcuts" : undefined}>
                      {episode.segments.map((seg, idx) => (
                          <Button
                              key={seg.id}
                              variant="outline"
                              className="text-xs h-auto py-0.5 px-2 justify-start text-left bg-background/70 hover:bg-accent hover:text-accent-foreground w-fit"
                              onClick={() => handleSegmentShortcutClick(seg.id)}
                          >
                              <span className="truncate">{idx + 1}. {seg.title}</span>
                          </Button>
                      ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto flex-1">
                        <Button size="sm" variant="outline" onClick={() => setIsSegmentsVisible(prev => !prev)} data-tour-id="segments-button">
                            <ListTree className="mr-2 h-4 w-4"/> {pluralize(currentMode.segmentLabel)}: {episode.segments.length}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsChecklistVisible(prev => !prev)} data-tour-id="checklist-button">
                            <ListChecks className="mr-2 h-4 w-4"/> Checklist: {completedChecklistItems}/{checklistItems.length}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full sm:w-auto flex-1">
                          <Button asChild size="sm" variant="secondary" className="flex-1" data-tour-id={isFirstEverEpisode ? "first-episode-edit-button" : undefined}>
                              <Link href={`/dashboard/episode/${episode.id}`}><Edit className="mr-2 h-4 w-4"/> Edit Full {currentMode.episodeLabel}</Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="accent" className="flex-1" data-tour-id={isFirstEverEpisode ? "first-episode-share-button" : undefined}>
                                    <Share2 className="mr-2 h-4 w-4"/> Share / Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onSelect={handleShareEpisodeViaLink}>
                                    {isSharingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIconLucide className="mr-2 h-4 w-4"/>} Share with Collaborator
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onSelect={() => handleExportJsonData('episode')}>
                                    {isExportingJSON ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileJson className="mr-2 h-4 w-4"/>} Export Full Data (JSON)
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExportJsonData('editor')}>
                                    {isExportingJSON ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileOutput className="mr-2 h-4 w-4"/>} Export for Timeline (JSON)
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleInitiatePdfExport}>
                                    {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileOutput className="mr-2 h-4 w-4"/>} Export Printable Plan (PDF)
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleExportMarkdown}>
                                    <MarkdownIcon className="mr-2 h-4 w-4"/> Export to Markdown (.md)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </div>
              </div>

              {(isSegmentsVisible || isChecklistVisible) && <Separator className="my-4"/>}

              <div data-tour-id={isFirstEverEpisode ? "first-episode-checklist-section" : undefined}>
                {isChecklistVisible && (
                    <div id={`checklist-scroll-${episode.id}`} className="animate-in fade-in-50 duration-300">
                        <h4 className="text-md font-semibold text-primary mb-3">Production Checklist</h4>
                        <div className="space-y-2">
                            {checklistItems.map(item => {
                                const linkedSegmentTitle = item.linkedSegmentId ? episode.segments.find(s => s.id === item.linkedSegmentId)?.title : null;
                                return (
                                  <div key={item.id} className="flex items-center gap-2 group">
                                      <Checkbox id={`check-${item.id}`} checked={item.completed} onCheckedChange={() => handleChecklistItemToggle(item.id)} />
                                      <div className='flex-grow flex items-center'>
                                          <Label htmlFor={`check-${item.id}`} className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</Label>
                                          {linkedSegmentTitle && item.linkedSegmentId && (
                                              <button onClick={() => handleLinkedChecklistItemClick(item.linkedSegmentId!)} className="text-xs text-accent hover:underline ml-2 truncate">
                                                  ({linkedSegmentTitle})
                                              </button>
                                          )}
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => setEditingChecklistItem({ id: item.id, text: item.text })} className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="h-3.5 w-3.5"/></Button>
                                      <Select onValueChange={(segmentId) => handleChecklistLinkChange(item.id, segmentId === 'none' ? null : segmentId)} value={item.linkedSegmentId || 'none'}>
                                          <SelectTrigger className="h-6 w-24 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><SelectValue placeholder="Link..." /></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="none">No Link</SelectItem>
                                              {episode.segments.map(seg => <SelectItem key={seg.id} value={seg.id} className="max-w-[10rem] truncate">{seg.title}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      <Button variant="ghost" size="icon" onClick={() => handleRemoveChecklistItem(item.id)} className="h-6 w-6 text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                );
                            })}
                            <div className="flex items-center gap-2">
                            <Input value={newChecklistItemText} onChange={(e) => setNewChecklistItemText(e.target.value)} placeholder="Add a new checklist item..." className="h-8 bg-background"/>
                            <Button size="sm" className="h-8" onClick={handleAddChecklistItem} disabled={!newChecklistItemText.trim()}>Add</Button>
                            </div>
                        </div>
                    </div>
                )}
              </div>

              {isSegmentsVisible && (
              <div className="pt-4 mt-4 space-y-4 animate-in fade-in-50 duration-300">
                   {isAddingSegment ? (
                      <div className="flex items-center gap-2 p-2 border border-dashed rounded-md">
                      <Input value={newSegmentTitle} onChange={(e) => setNewSegmentTitle(e.target.value)} placeholder={`New ${currentMode.segmentLabel} Title...`} className="h-9" autoFocus />
                      <Button size="sm" onClick={handleAddSegment}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingSegment(false)}>Cancel</Button>
                      </div>
                  ) : (
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddingSegment(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add {currentMode.segmentLabel}
                      </Button>
                  )}
                  <div className="space-y-3">
                    <Accordion type="multiple" value={openSegmentAccordion} onValueChange={setOpenSegmentAccordion} className="w-full">
                        {episode.segments.map((segment, idx) => (
                            <AccordionItem value={segment.id} key={segment.id} className="border-b-0">
                                <AccordionTrigger id={`segment-accordion-trigger-${segment.id}`} className="text-primary hover:no-underline p-3 bg-muted/50 rounded-md data-[state=open]:rounded-b-none group">
                                    <div className="flex-1 text-left flex items-center">
                                        <h4 className="font-semibold text-md text-primary">{segment.title}</h4>
                                        <p className="text-xs text-muted-foreground ml-2 truncate">{segment.subtitle}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                                                onClick={(e) => e.stopPropagation()} // Prevents accordion from toggling
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the segment "{segment.title}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveSegment(segment.id)} className="bg-destructive hover:bg-destructive/90">Delete Segment</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </AccordionTrigger>
                                <AccordionContent className="border border-t-0 rounded-b-md p-3">
                                    <SegmentEditorInline
                                        key={segment.id}
                                        segment={segment}
                                        index={idx}
                                        onSegmentChange={handleSegmentChange}
                                        currentMode={currentMode}
                                        checklist={episode.productionChecklist}
                                        onChecklistItemToggle={handleChecklistItemToggle}
                                        onScrollToChecklist={() => handleScrollToSection(`checklist-scroll-${episode.id}`)}
                                        onRemoveSegment={handleRemoveSegment}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                  </div>
              </div>
              )}
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}
