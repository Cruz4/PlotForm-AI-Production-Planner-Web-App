// src/components/inbox/Inbox.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getInboxShares, updateShareStatus } from '@/lib/shareStore';
import { getEpisodeById, addEpisodeDb } from '@/lib/episodeStore';
import type { Share, Episode } from '@/types';
import { Loader2, Inbox as InboxIcon, Check, X, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAppContextMode } from '@/contexts/ModeContext';
import { v4 as uuidv4 } from 'uuid';


interface InboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Inbox({ isOpen, onClose }: InboxProps) {
  const { user } = useAuth();
  const { ALL_APP_MODES } = useAppContextMode();
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchShares = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const inboxShares = await getInboxShares(user.uid);
        setShares(inboxShares);
      } catch (error) {
        console.error("Failed to fetch inbox shares:", error);
        toast({ title: "Error", description: "Could not fetch your inbox.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, fetchShares]);

  const handleAcceptShare = async (share: Share) => {
    if (!user) return;
    setIsProcessing(share.id);
    try {
      const episodeToImport = await getEpisodeById(share.episodeId, share.fromUserId);
      if (!episodeToImport) {
        throw new Error("The original plan could not be found. It may have been deleted by the sender.");
      }

      // Prepare a new episode object for the recipient
      const newEpisodeForRecipient: Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators'> = {
        ...episodeToImport,
        // Reset fields that should not be copied
        isFavorite: false,
        isArchived: false,
        dateScheduledForRecording: null,
        dateRecorded: null,
        dateUploaded: null,
        // Set collaboration fields
        ownerHostDisplayName: share.fromUserName,
        importedHostDisplayName: null, // The recipient is now the primary user of this copy
        // Ensure segments get new unique IDs if necessary to avoid any future collisions, though it's unlikely
        segments: episodeToImport.segments.map(seg => ({...seg, id: uuidv4()})),
        comments: [], // Start with a fresh comment history
      };

      const modeForEpisode = ALL_APP_MODES.find(m => m.modeName === episodeToImport.linkedAppMode) || ALL_APP_MODES[0];
      
      // Add the new episode to the current user's database
      await addEpisodeDb(newEpisodeForRecipient, user.uid, modeForEpisode);
      
      // Mark the share as accepted
      await updateShareStatus(share.id, 'accepted');
      toast({ title: "Plan Accepted!", description: `A copy of "${share.episodeTitle}" has been added to your dashboard.` });
      fetchShares(); // Refresh inbox
    } catch (error: any) {
      toast({ title: "Error Accepting Plan", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };


  const handleRejectShare = async (share: Share) => {
    setIsProcessing(share.id);
    try {
      await updateShareStatus(share.id, 'rejected');
      toast({ title: "Plan Rejected", description: `You have rejected the plan "${share.episodeTitle}".` });
      fetchShares(); // Refresh inbox
    } catch (error) {
      toast({ title: "Error", description: "Could not reject the plan.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your Inbox</DialogTitle>
          <DialogDescription>Plans shared with you by other creators.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 -mx-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center text-muted-foreground p-10">
              <InboxIcon className="mx-auto h-12 w-12 mb-4" />
              <p>Your inbox is empty.</p>
              <p className="text-sm">When someone shares a plan with you, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map(share => (
                <div key={share.id} className="p-3 border rounded-lg flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={share.fromUserPhotoUrl} />
                    <AvatarFallback>
                      <UserIcon/>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold">{share.fromUserName}</p>
                    <p className="text-sm">Shared "{share.episodeTitle}" with you.</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}</p>
                  </div>
                  {share.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptShare(share)} disabled={!!isProcessing}>
                        {isProcessing === share.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectShare(share)} disabled={!!isProcessing}>
                        <X className="h-4 w-4"/>
                      </Button>
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${share.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                      {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
