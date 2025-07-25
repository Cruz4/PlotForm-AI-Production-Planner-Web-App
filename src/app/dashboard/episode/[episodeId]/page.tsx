
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEpisodeById, saveEpisodeDb, deleteEpisodeDb } from '@/lib/episodeStore';
import type { Episode, Segment, EpisodeVersion } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEpisodeContext } from '@/contexts/EpisodeContext';
import EpisodeForm, { type EpisodeFormHandle } from '@/components/episodes/EpisodeForm';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, ArrowLeft, BrainCircuit, Share2, FileJson, Link as LinkIcon, FileOutput, History, GripVertical, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { generateEpisodePdf } from '@/lib/pdfUtils';
import { useAppContextMode } from '@/contexts/ModeContext';
import { getCustomHost1Name } from '@/lib/episodeLayoutsStore';
import { AIPolishDialog } from '@/components/episodes/AIPolishDialog';
import {
  getEpisodeVersions,
  getEpisodeVersionById,
} from '@/lib/episodeVersionStore';
import { format } from 'date-fns';
import { calculateGenericEpisodeStatus } from '@/lib/dataUtils';
import { getStatusVisualsForCard } from '@/components/dashboard/card-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

function SortableNavItem({ segment, index, onScrollToSection }: { segment: Segment, index: number, onScrollToSection: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: segment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };
    return (
        <li ref={setNodeRef} style={style} className={cn("flex items-center", isDragging && "opacity-50")}>
             <button
                onClick={() => onScrollToSection(`segment-editor-${segment.id}`)}
                className="w-full text-left text-sm p-2 rounded-md hover:bg-muted/80 transition-colors focus:bg-muted focus:outline-none flex items-start gap-2 flex-1"
            >
                <span className="text-muted-foreground pt-0.5">{index + 1}.</span>
                <span className="truncate flex-1">{segment.title}</span>
            </button>
            <button {...attributes} {...listeners} className="p-2 cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
            </button>
        </li>
    );
}

export default function EpisodePage() {
  const { episode, setEpisode } = useEpisodeContext();
  const [initialEpisodeState, setInitialEpisodeState] = useState<Episode | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharingLink, setIsSharingLink] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isAIPolishOpen, setIsAIPolishOpen] = useState(false);
  
  const [versions, setVersions] = useState<EpisodeVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState<EpisodeVersion | null>(null);

  const { user } = useAuth();
  const { currentMode } = useAppContextMode();
  const [currentHost1Name, setCurrentHost1Name] = useState('Your Content');
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const episodeFormRef = useRef<EpisodeFormHandle>(null);
  
  const episodeId = Array.isArray(params.episodeId) ? params.episodeId[0] : params.episodeId;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleScrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
  };

  const fetchData = useCallback(async () => {
    if (user?.uid && episodeId && episodeId !== 'new') {
      setIsLoading(true);
      try {
        const fetchedEpisode = await getEpisodeById(episodeId, user.uid);
        if (fetchedEpisode) {
          setEpisode(fetchedEpisode);
          setInitialEpisodeState(JSON.parse(JSON.stringify(fetchedEpisode)));
          const fetchedVersions = await getEpisodeVersions(episodeId, user.uid);
          setVersions(fetchedVersions);
        } else {
          toast({ title: 'Error', description: 'Episode not found or you do not have permission to view it.', variant: 'destructive' });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Failed to fetch episode:", error);
        toast({ title: 'Error', description: 'Failed to load episode data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } else if (episodeId === 'new') {
      setIsLoading(false);
    }
  }, [user, episodeId, setEpisode, toast, router]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    if (user?.uid) {
      getCustomHost1Name(user.uid).then(name => {
        setCurrentHost1Name(name || user.displayName || 'Your Content');
      });
    }
  }, [user]);

  const handleEpisodeChange = useCallback((updatedEpisodeData: Partial<Episode>) => {
    setEpisode(prev => {
        if (!prev) return null;
        const newState = { ...prev, ...updatedEpisodeData };
        setHasUnsavedChanges(JSON.stringify(newState) !== JSON.stringify(initialEpisodeState));
        return newState;
    });
  }, [initialEpisodeState, setEpisode]);

  const handleAddNewSegment = () => {
    if (!episode) return;
    const newSegment: Segment = {
      id: uuidv4(),
      title: `Untitled ${currentMode.segmentLabel}`,
      subtitle: '',
      host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
      host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
    };
    const newSegments = [...episode.segments, newSegment];
    handleEpisodeChange({ segments: newSegments });
    toast({ title: `${currentMode.segmentLabel} Added`, description: `A new untitled ${currentMode.segmentLabel.toLowerCase()} has been added to the end.` });
    
    // Scroll to the new segment after a short delay to allow the DOM to update
    setTimeout(() => {
      handleScrollToSection(`segment-editor-${newSegment.id}`);
    }, 100);
  };

  const handleSave = useCallback(async () => {
    if (!episode) return;
    setIsSaving(true);
    try {
      const saved = await saveEpisodeDb(episode, user!.uid);
      setEpisode(saved);
      setInitialEpisodeState(JSON.parse(JSON.stringify(saved)));
      setHasUnsavedChanges(false);
      const fetchedVersions = await getEpisodeVersions(saved.id, user!.uid);
      setVersions(fetchedVersions);
      toast({ title: 'Success!', description: `${currentMode.episodeLabel} saved successfully.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: `Failed to save ${currentMode.episodeLabel.toLowerCase()}.`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [episode, user, toast, setEpisode, currentMode.episodeLabel]);

  const handleDelete = async () => {
    if (!episode) return;
    setIsDeleting(true);
    try {
      await deleteEpisodeDb(episode.id, user!.uid);
      toast({ title: 'Success', description: `${currentMode.episodeLabel} deleted.` });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: `Failed to delete ${currentMode.episodeLabel.toLowerCase()}.`, variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  const handleRevertVersion = async () => {
    if (!showRevertConfirm || !user?.uid) return;
    setIsSaving(true);
    try {
      const versionToRevertTo = await getEpisodeVersionById(showRevertConfirm.id);
      if (versionToRevertTo && episode) {
        const updatedEpisode = {
          ...episode,
          title: versionToRevertTo.title,
          segments: versionToRevertTo.segments,
          episodeNotes: versionToRevertTo.episodeNotes,
        };
        const saved = await saveEpisodeDb(updatedEpisode, user.uid);
        setEpisode(saved);
        setInitialEpisodeState(JSON.parse(JSON.stringify(saved)));
        setHasUnsavedChanges(false);
        const fetchedVersions = await getEpisodeVersions(saved.id, user.uid);
        setVersions(fetchedVersions);
        toast({ title: 'Success', description: `Reverted to version from ${format(showRevertConfirm.versionTimestamp, 'PPP p')}.` });
      } else {
        throw new Error("Version data not found.");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to revert to this version.", variant: "destructive" });
    } finally {
      setIsSaving(false);
      setShowRevertConfirm(null);
      setIsHistoryOpen(false);
    }
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
  
  const handleExportJsonData = async () => {
    if (!user || !episode) return;
    setIsExportingJSON(true);
    try {
      let ownerDisplayNameForExport = episode.ownerHostDisplayName || await getCustomHost1Name(user.uid) || "Host 1";
      const episodeToExport: Partial<Episode> = { ...episode, collaborators: Array.from(new Set([...(episode.collaborators || []), user.uid])), ownerHostDisplayName: ownerDisplayNameForExport };
      delete (episodeToExport as any).importedHostDisplayName;

      const jsonDataString = JSON.stringify(episodeToExport, null, 2);
      const blob = new Blob([jsonDataString], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(episode.title || 'episode').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_full_data.json`;
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast({ title: 'Data Exported', description: 'Downloaded as JSON.' });
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

  const StatusDisplay = () => {
    if (!episode) return null;
    const derivedStatus = calculateGenericEpisodeStatus(episode, currentMode);
    const { text, icon, colorClasses } = getStatusVisualsForCard(derivedStatus, currentMode, episode.customStatusLabels);
    return <Badge variant="outline" className={colorClasses}>{icon}{text}</Badge>;
  };
  
  const handleDragEndSegments = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over && episode) {
      const oldIndex = episode.segments.findIndex((s) => s.id === active.id);
      const newIndex = episode.segments.findIndex((s) => s.id === over.id);
      const newOrderedSegments = arrayMove(episode.segments, oldIndex, newIndex);
      handleEpisodeChange({ segments: newOrderedSegments });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!episode) {
    return <div className="text-center py-10">Creating new {currentMode.episodeLabel.toLowerCase()}...</div>;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
      <aside className="hidden lg:block sticky top-[80px] h-[calc(100vh-100px)]">
        <div className="p-4 bg-card rounded-lg shadow-sm flex-grow flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-3 text-primary">{currentMode.segmentLabel} Navigation</h2>
            <ScrollArea className="flex-1 -mr-4 pr-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSegments}>
                    <SortableContext items={(episode.segments || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <ul className="space-y-1">
                            {(episode.segments || []).map((segment, index) => (
                                <SortableNavItem key={segment.id} segment={segment} index={index} onScrollToSection={handleScrollToSection} />
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t space-y-2">
                <Button onClick={handleAddNewSegment} variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New {currentMode.segmentLabel}
                </Button>
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>
        </div>
      </aside>

      <main className="py-4">
        <EpisodeForm 
            ref={episodeFormRef}
            episode={episode} 
            onEpisodeChange={handleEpisodeChange}
            onSave={handleSave} 
            onUnsavedChangesChange={setHasUnsavedChanges}
            onScrollToSection={handleScrollToSection}
        />
      </main>

      <aside className="hidden lg:block sticky top-[80px] h-[calc(100vh-100px)]">
        <div className="p-4 bg-card rounded-lg shadow-sm space-y-3">
          <h2 className="text-lg font-semibold truncate text-accent" title={episode.title}>{episode.title || `Untitled ${currentMode.episodeLabel}`}</h2>
          <div className="text-sm text-muted-foreground">#{episode.episodeNumber || 'N/A'}</div>
          <div><StatusDisplay /></div>
          <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} 
            Save All Changes
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setIsHistoryOpen(p => !p)}>
            <History className="mr-2 h-4 w-4"/> Version History
          </Button>
          <Button onClick={() => setIsAIPolishOpen(true)} variant="outline" className="w-full">
            <BrainCircuit className="mr-2 h-4 w-4"/> AI Content Polish...
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4"/> Share / Export...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuItem onSelect={handleShareEpisodeViaLink}>
                    {isSharingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4"/>} Share with Collaborator
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onSelect={handleExportJsonData}>
                    {isExportingJSON ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileJson className="mr-2 h-4 w-4"/>} Export Full Data (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleInitiatePdfExport}>
                    {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileOutput className="mr-2 h-4 w-4"/>} Export Printable Plan (PDF)
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4"/> Delete {currentMode.episodeLabel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this {currentMode.episodeLabel.toLowerCase()}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
      
      {isAIPolishOpen && episode && (
        <AIPolishDialog
            isOpen={isAIPolishOpen}
            onClose={() => setIsAIPolishOpen(false)}
            episode={episode}
            onApply={(polishedSegments) => {
              const updatedSegments = episode.segments.map(originalSegment => {
                const polished = polishedSegments.find(p => p.id === originalSegment.id);
                return polished ? { ...originalSegment, title: polished.polishedTitle, host1Notes: polished.polishedNotes } : originalSegment;
              });
              handleEpisodeChange({ segments: updatedSegments });
              setIsAIPolishOpen(false);
              toast({ title: "AI Suggestions Applied", description: "Your plan has been updated." });
            }}
          />
      )}

      {isHistoryOpen && (
          <AlertDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Version History</AlertDialogTitle>
                <AlertDialogDescription>Select a version to revert to. This will replace the current title, notes, and segments.</AlertDialogDescription>
              </AlertDialogHeader>
              <ScrollArea className="h-64 border rounded-md my-4">
                  <ul className="p-2 space-y-1">
                    {versions.length > 0 ? versions.map(v => (
                      <li key={v.id}>
                        <button 
                          onClick={() => setShowRevertConfirm(v)}
                          className="w-full text-left p-2 rounded-md hover:bg-muted"
                        >
                          <p className="font-medium text-sm">{format(v.versionTimestamp, 'PPP p')}</p>
                          <p className="text-xs text-muted-foreground truncate">{v.title}</p>
                        </button>
                      </li>
                    )) : <p className="text-sm text-center text-muted-foreground p-4">No versions saved yet.</p>}
                  </ul>
              </ScrollArea>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      )}

      {showRevertConfirm && (
        <AlertDialog open={!!showRevertConfirm} onOpenChange={(open) => !open && setShowRevertConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revert to a Previous Version?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace the current content with the version from <span className="font-semibold">{format(showRevertConfirm.versionTimestamp, 'PPP p')}</span>. A new version will be created. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevertVersion}>Yes, Revert</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
