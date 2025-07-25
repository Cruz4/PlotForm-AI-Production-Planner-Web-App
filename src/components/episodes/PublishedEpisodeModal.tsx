
'use client';

import type { Episode, Segment, AppMode } from '@/types'; 
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { Edit, Eye, ArchiveRestore, Trash2, Loader2, CheckCircle, ListTree, Archive } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveEpisodeDb, deleteEpisodeDb } from '@/lib/episodeStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatEpisodeIdentifier } from '@/lib/dataUtils';

interface PublishedEpisodeModalProps {
  episode: Episode;
  triggerButton?: React.ReactNode;
  onEpisodeUpdate?: () => void; 
  currentMode: AppMode; 
}

const formatDateDisplay = (timestamp: number | null | undefined): string => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp), 'PPP p');
};

const SegmentDetailDialog = ({ segment, isOpen, onClose, currentMode, episode }: { segment: Segment | null; isOpen: boolean; onClose: () => void; currentMode: AppMode; episode: Episode; }) => {
  if (!segment) return null;

  const renderContent = (notes: string, links: string[], suggestions: string, quote: string, author: string, isQuote: boolean) => {
    if (isQuote) {
      return (
        <div className="space-y-2">
          {quote ? <blockquote>&quot;{quote}&quot; - {author || 'Unknown'}</blockquote> : <p className="text-muted-foreground italic">No quote provided.</p>}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-1">{currentMode.segmentContentLabel}:</h4>
          <p className="text-sm whitespace-pre-wrap p-2 bg-muted/50 rounded-md">{notes || <span className="text-muted-foreground italic">No content.</span>}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Links:</h4>
          {links && links.length > 0 ? (
            <ul className="list-disc list-inside text-sm space-y-1">
              {links.map((link, i) => <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{link}</a></li>)}
            </ul>
          ) : <p className="text-muted-foreground italic text-sm">No links.</p>}
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">Segment Notes:</h4>
          <p className="text-sm whitespace-pre-wrap p-2 bg-muted/50 rounded-md">{suggestions || <span className="text-muted-foreground italic">No notes.</span>}</p>
        </div>
      </div>
    );
  };

  const isQuoteSegment = segment.title.toLowerCase().includes('quote') || segment.id.includes('outro');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{segment.title}</DialogTitle>
          <DialogDescription>{segment.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-4 space-y-4">
          <div className="p-3 border rounded-md bg-background">
            <h3 className="font-bold text-md text-primary mb-2">{episode.ownerHostDisplayName || 'Primary Content'}</h3>
            {renderContent(segment.host1Notes, segment.host1Links, segment.host1AudienceSuggestions, segment.host1Quote || '', segment.host1Author || '', isQuoteSegment)}
          </div>
          {episode.importedHostDisplayName && (
            <div className="p-3 border rounded-md bg-background">
              <h3 className="font-bold text-md text-secondary mb-2">{episode.importedHostDisplayName}</h3>
              {renderContent(segment.host2Notes, segment.host2Links, segment.host2AudienceSuggestions, segment.host2Quote || '', segment.host2Author || '', isQuoteSegment)}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function PublishedEpisodeModal({ episode, triggerButton, onEpisodeUpdate, currentMode }: PublishedEpisodeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false); 
  const [viewingSegment, setViewingSegment] = useState<Segment | null>(null);

  const handleRestoreEpisode = async () => {
    if (!user) return;
    setIsRestoring(true);
    try {
      await saveEpisodeDb({ ...episode, isArchived: false }, user.uid);
      toast({ title: "Item Restored", description: `"${episode.title}" has been unarchived.` });
      setShowModal(false); 
      onEpisodeUpdate?.();
    } catch (error) {
      toast({ title: "Error", description: "Could not restore item.", variant: "destructive" });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeletePermanently = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteEpisodeDb(episode.id, user.uid);
      toast({ title: "Item Deleted", description: `"${episode.title}" has been permanently deleted.` });
      setShowModal(false); 
      onEpisodeUpdate?.();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const { short: shortIdentifier } = formatEpisodeIdentifier(episode, currentMode);

  const getStatusLine = () => {
    const status = episode.isArchived ? "Archived" : `${currentMode.statusWorkflow.published.label}`;
    const deployedDate = episode.dateUploaded ? ` | ${currentMode.statusWorkflow.published.label}: ${formatDateDisplay(episode.dateUploaded)}` : '';
    const codeReviewDate = episode.dateRecorded ? ` | ${currentMode.statusWorkflow.editing.label}: ${formatDateDisplay(episode.dateRecorded)}` : '';
    return `Status: ${status}${deployedDate}${codeReviewDate}`;
  };

  return (
    <>
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
        {triggerButton || <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" /> View Details</Button>}
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px]",
        "max-h-[90vh] flex flex-col overflow-hidden", 
        "bg-card text-card-foreground rounded-lg shadow-2xl"
      )}>
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-primary text-xl font-bold flex items-center">
            {episode.isArchived ? <Archive className="inline h-5 w-5 mr-2" /> : <CheckCircle className="inline h-5 w-5 mr-2 text-green-500" />}
            {shortIdentifier} - {episode.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {getStatusLine()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto"> 
          <div className="space-y-4 p-4 bg-background"> 
            
            <div className="p-3 bg-muted/50 rounded-md border">
              <h3 className="text-md font-semibold text-foreground mb-2">{episode.isArchived ? `Archived ${currentMode.segmentLabel}s` : `Final ${currentMode.segmentLabel}s`}:</h3>
              {episode.segments.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  {episode.segments.map(s => (
                      <li key={s.id}>
                        <button onClick={() => setViewingSegment(s)} className="w-full text-left flex items-center gap-2 border-b pb-1.5 last:border-b-0 hover:bg-muted/50 p-1 rounded-md transition-colors">
                            <ListTree className="h-4 w-4 text-primary/70 shrink-0"/>
                            <span className="truncate font-medium">{s.title}</span>
                            {s.subtitle && <span className="text-xs text-muted-foreground truncate italic">- {s.subtitle}</span>}
                        </button>
                      </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">No {currentMode.segmentLabel.toLowerCase()}s defined for this {currentMode.episodeLabel.toLowerCase()}.</p>
              )}
            </div>

          </div>
        </div>

        <DialogFooter className="mt-auto p-4 border-t bg-muted/30 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-2">
            {episode.isArchived && (
              <>
                <Button variant="outline" size="sm" onClick={handleRestoreEpisode} disabled={isRestoring || isDeleting}>
                  {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
                  Restore
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isRestoring || isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete the archived {currentMode.episodeLabel.toLowerCase()} "{episode.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeletePermanently} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button asChild size="sm" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={`/dashboard/episode/${episode.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Full Plan
              </Link>
            </Button>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <SegmentDetailDialog 
        segment={viewingSegment}
        isOpen={!!viewingSegment}
        onClose={() => setViewingSegment(null)}
        currentMode={currentMode}
        episode={episode}
    />
    </>
  );
}
