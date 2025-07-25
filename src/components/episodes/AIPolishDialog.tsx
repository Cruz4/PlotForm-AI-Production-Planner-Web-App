// src/components/episodes/AIPolishDialog.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Lock, Unlock, RefreshCcw, AlertTriangle } from 'lucide-react';
import type { Episode, Segment, AIPolishedSegment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AIPolishResponseSchema } from '@/types';
import { useAppContextMode } from '@/contexts/ModeContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

const getGenAIClient = (): GoogleGenerativeAI => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log("Gemini API Key (length):", apiKey?.length || 'undefined');

    if (!apiKey || apiKey.includes('PASTE_YOUR')) {
        throw new Error("Gemini API key not found or is a placeholder. Please check your apphosting.yaml file.");
    }
    if (!genAI || genAI.apiKey !== apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

interface AIPolishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode;
  onApply: (polishedSegments: AIPolishedSegment[]) => void;
}

const parseJsonFromAiResponse = (text: string): any | null => {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error("Failed to parse extracted JSON from AI response:", e);
        }
    }
    try {
        return JSON.parse(text);
    } catch(e) {
        console.error("Failed to parse entire AI response as JSON:", e);
    }
    return null;
};

export function AIPolishDialog({ isOpen, onClose, episode, onApply }: AIPolishDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polishedSegments, setPolishedSegments] = useState<AIPolishedSegment[]>([]);
  const [lockedSegmentIds, setLockedSegmentIds] = useState<Set<string>>(new Set());
  const { currentMode } = useAppContextMode();
  const { toast } = useToast();

  const isApiKeyMissing = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    return !key || key.includes('PASTE_YOUR_GEMINI_API_KEY_HERE') || key.length < 10;
  }, []);

  const generateSuggestions = useCallback(async () => {
    if (isApiKeyMissing) {
      setError("Gemini API key not found or is a placeholder. Please add it to your apphosting.yaml file and redeploy.");
      setIsLoading(false);
      return;
    }
    
    let aiClient;
    try {
        aiClient = getGenAIClient();
    } catch (e: any) {
        setError(e.message);
        setIsLoading(false);
        return;
    }

    const model = aiClient.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        generationConfig: {
          responseMimeType: "application/json",
        },
    });

    setIsLoading(true);
    setError(null);

    const segmentsToPolish = episode.segments.filter(s => !lockedSegmentIds.has(s.id));
    const lockedSegmentsForContext = episode.segments.filter(s => lockedSegmentIds.has(s.id)).map(s => {
        const polishedVersion = polishedSegments.find(ps => ps.id === s.id);
        return {
            id: s.id,
            title: polishedVersion?.polishedTitle || s.title,
            notes: polishedVersion?.polishedNotes || s.host1Notes,
        };
    });

    try {
      const prompt = `You are a creative co-writer and editor for a "${currentMode.modeName}" project.
      
      **YOUR TASK:**
      For each segment in "SEGMENTS_TO_POLISH", rewrite and enhance the title and notes to be more engaging and well-structured. Keep the core idea. Expand on brief notes. Do not change segment IDs.
      
      **CONTEXT FROM LOCKED SEGMENTS (already good):**
      ${lockedSegmentsForContext.length > 0 ? JSON.stringify(lockedSegmentsForContext, null, 2) : "None."}
      
      **SEGMENTS TO POLISH:**
      ${JSON.stringify(segmentsToPolish.map(s => ({ id: s.id, title: s.title, notes: s.host1Notes })), null, 2)}
      
      **CRITICAL RESPONSE FORMAT:** Respond ONLY with a single, valid JSON object that has a single key "segments". The value must be an array of objects, each with "id", "polishedTitle", and "polishedNotes".
      {
        "segments": [
          { "id": "segment-id-1", "polishedTitle": "New Engaging Title", "polishedNotes": "Expanded and improved notes..." }
        ]
      }`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonResponse = JSON.parse(responseText); // Direct parse
      const validation = AIPolishResponseSchema.safeParse(jsonResponse);

      if (!validation.success) {
        console.error("AI polish response validation failed:", validation.error.flatten());
        throw new Error("AI returned data in an unexpected format.");
      }
      
      const newPolishedData = validation.data.segments;

      setPolishedSegments(prev => {
          const updated = [...prev];
          newPolishedData.forEach(newItem => {
              const index = updated.findIndex(item => item.id === newItem.id);
              if (index !== -1) {
                  updated[index] = newItem;
              } else {
                  updated.push(newItem);
              }
          });
          return updated;
      });

    } catch (e: any) {
      console.error("AI Polish Error:", e);
      let userFacingError = e.message || "An unknown error occurred while generating suggestions.";
      if (e.message && e.message.includes('API key not valid')) {
        userFacingError = "The provided API key is not valid. Please check your apphosting.yaml file and redeploy.";
      }
      setError(userFacingError);
    } finally {
      setIsLoading(false);
    }
  }, [episode.segments, lockedSegmentIds, polishedSegments, currentMode.modeName, isApiKeyMissing]);
  
  useEffect(() => {
    if (isOpen) {
      setPolishedSegments([]);
      setLockedSegmentIds(new Set());
      generateSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleLock = (segmentId: string) => {
    setLockedSegmentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentId)) {
        newSet.delete(segmentId);
      } else {
        newSet.add(segmentId);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    onApply(polishedSegments);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Content Polish</DialogTitle>
          <DialogDescription>
            Review the AI's suggestions side-by-side with your original content. Lock the suggestions you like and regenerate the rest.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Polishing your content...</p>
            </div>
        )}

        {error && (
             <div className="flex-1 flex flex-col items-center justify-center p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={generateSuggestions} className="mt-4">Try Again</Button>
            </div>
        )}

        {!isLoading && !error && (
            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {episode.segments.map(segment => {
                        const polished = polishedSegments.find(p => p.id === segment.id);
                        const isLocked = lockedSegmentIds.has(segment.id);
                        return (
                            <div key={segment.id} className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-lg bg-background">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Original</h4>
                                    <p className="font-bold text-md">{segment.title}</p>
                                    <p className="text-sm whitespace-pre-wrap">{segment.host1Notes || <span className="italic text-muted-foreground">No notes.</span>}</p>
                                </div>
                                <div className="space-y-2 relative">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm text-primary">AI Suggestion</h4>
                                        <Button variant={isLocked ? "secondary" : "outline"} size="sm" onClick={() => toggleLock(segment.id)} className="h-7 text-xs">
                                            {isLocked ? <Lock className="h-3 w-3 mr-1.5"/> : <Unlock className="h-3 w-3 mr-1.5"/>}
                                            {isLocked ? 'Locked' : 'Lock'}
                                        </Button>
                                    </div>
                                    <p className="font-bold text-md text-primary">{polished?.polishedTitle}</p>
                                    <p className="text-sm whitespace-pre-wrap">{polished?.polishedNotes}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        )}
        
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <div className="flex-1 flex justify-end gap-2">
            <Button variant="outline" onClick={generateSuggestions} disabled={isLoading || isApiKeyMissing}>
                <RefreshCcw className="h-4 w-4 mr-2"/>
                Regenerate for Unlocked
            </Button>
            <Button onClick={handleApply} disabled={isLoading || polishedSegments.length === 0 || isApiKeyMissing}>
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Suggestions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
