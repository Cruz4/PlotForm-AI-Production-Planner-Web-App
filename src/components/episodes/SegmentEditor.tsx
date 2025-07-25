
'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Segment, Episode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, PlusCircle, User, Users, Trash2, ChevronDown, StickyNote, Save, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
import { useAppContextMode } from '@/contexts/ModeContext';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


interface SegmentEditorProps {
  segment: Segment;
  onSegmentChange: (updates: Partial<Segment>) => void;
  onRemoveSegment: (segmentId: string) => void;
  isSavingEpisode?: boolean;
  labelPrefixHost1: string; 
  labelPrefixHost2: string; 
  checklist?: Episode['productionChecklist'];
  onChecklistItemToggle: (itemId: string) => void;
  onScrollToChecklist?: () => void;
}

const getWordCount = (text: string | null | undefined): number => {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};


export default function SegmentEditor({
  segment,
  onSegmentChange,
  onRemoveSegment,
  isSavingEpisode,
  labelPrefixHost1,
  labelPrefixHost2,
  checklist,
  onChecklistItemToggle,
  onScrollToChecklist,
}: SegmentEditorProps) {
  const { toast } = useToast();
  const { currentMode } = useAppContextMode();
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const newLinkInputRef = useRef<HTMLInputElement>(null);

  const [isNotesCollapsed, setIsNotesCollapsed] = useState(true);
  
  const handleFieldChange = (updates: Partial<Segment>) => {
    onSegmentChange(updates);
  };
  
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditingTitle(false);
    const newTitle = e.target.value.trim();
    if (!newTitle) {
      toast({title: "Title cannot be empty", variant: "destructive"});
      e.target.value = segment.title; // revert visually
    } else {
      handleFieldChange({ title: newTitle });
    }
  };

  const handleSubtitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setEditingSubtitle(false);
    handleFieldChange({ subtitle: e.target.value });
  };
  
  const handleSaveNewLink = () => {
    const inputEl = newLinkInputRef.current;
    if (!inputEl || !inputEl.value.trim()) {
      setIsAddingLink(false);
      return;
    }
    const newLinks = [...(segment.host1Links || []), inputEl.value.trim()];
    handleFieldChange({ host1Links: newLinks });
    inputEl.value = '';
    setIsAddingLink(false);
  };
  
  const handleLinkInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNewLink();
    } else if (e.key === 'Escape') {
      setIsAddingLink(false);
    }
  };

  const removeLinkField = (index: number) => {
    const newLinks = (segment.host1Links || []).filter((_, i) => i !== index);
    handleFieldChange({ host1Links: newLinks });
  };
  
  const hasHost2Data = (currentSegment: Segment): boolean => {
    return !!(
      (currentSegment.host2Notes && currentSegment.host2Notes.trim()) ||
      (Array.isArray(currentSegment.host2Links) && currentSegment.host2Links.filter(l => l && l.trim()).length > 0) ||
      (currentSegment.host2AudienceSuggestions && currentSegment.host2AudienceSuggestions.trim() !== '') ||
      (currentSegment.host2Quote && currentSegment.host2Quote.trim() !== '') ||
      (currentSegment.host2Author && currentSegment.host2Author.trim() !== '')
    );
  };

  const linkedChecklistItem = useMemo(() => {
    return (checklist || []).find(item => item.linkedSegmentId === segment.id);
  }, [checklist, segment.id]);

  const renderHostInputs = useCallback((host: 'host1' | 'host2') => {
    const isHost1 = host === 'host1';
    const notesKey = isHost1 ? 'host1Notes' : 'host2Notes';
    const linksKey = isHost1 ? 'host1Links' : 'host2Links';
    const audienceSuggestionsKey = isHost1 ? 'host1AudienceSuggestions' : 'host2AudienceSuggestions';
    const quoteKey = isHost1 ? 'host1Quote' : 'host2Quote';
    const authorKey = isHost1 ? 'host1Author' : 'host2Author';

    const links = segment[linksKey] || [];
    const userLabel = isHost1 ? labelPrefixHost1 : labelPrefixHost2;

    const nameSuffix = `-${host}-${segment.id}`;
    const isQuoteSegment = typeof segment.title === 'string' && (segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro');

    const contentLabelText = currentMode.segmentContentLabel || "Content";
    const scriptPlaceholder = `Add your ${currentMode.segmentLabel.toLowerCase()} ${contentLabelText.toLowerCase()} for "${segment.title}" here...`;
    
    return (
      <div className={cn("space-y-4", !isHost1 && 'opacity-70 border-t border-dashed pt-4 mt-4')}>
         <h4 className={cn("text-md font-semibold flex items-center pt-1")}>
          {isHost1 ? <User className="mr-2 h-5 w-5 text-primary" /> : <Users className="mr-2 h-5 w-5 text-secondary" />}
          {userLabel}'s Content
        </h4>
        {isQuoteSegment ? (
          <>
             <div className="space-y-2">
              <Label htmlFor={`quote${nameSuffix}`}>Quote</Label>
              <Input
                id={`quote${nameSuffix}`}
                name="quote" 
                defaultValue={segment[quoteKey] || ''}
                onBlur={(e) => isHost1 && handleFieldChange({ host1Quote: e.target.value })}
                placeholder={isHost1 ? "Enter an inspirational quote..." : "Collaborator's quote..."}
                className="bg-input/50"
                readOnly={!isHost1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`author${nameSuffix}`}>Author</Label>
              <Input
                id={`author${nameSuffix}`}
                name="author" 
                type="text"
                defaultValue={segment[authorKey] || ''}
                onBlur={(e) => isHost1 && handleFieldChange({ host1Author: e.target.value })}
                placeholder={isHost1 ? "Author's name" : "Collaborator's author..."}
                className="bg-input/50"
                readOnly={!isHost1}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`notes${nameSuffix}`}>{contentLabelText}</Label>
              <Textarea
                id={`notes${nameSuffix}`}
                defaultValue={segment[notesKey] || ''}
                onBlur={(e) => isHost1 && handleFieldChange({ [notesKey]: e.target.value })}
                placeholder={scriptPlaceholder}
                readOnly={!isHost1}
                className="min-h-[150px] bg-input/50"
              />
              {isHost1 && (
                <p className="text-xs text-muted-foreground text-right">
                  Word Count: {getWordCount(segment.host1Notes)}
                </p>
              )}
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-4">
                  <Label>Links / Media References</Label>
                 {isHost1 && !isAddingLink && (
                    <Button variant="outline" size="sm" onClick={() => setIsAddingLink(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                    </Button>
                 )}
               </div>
              {isHost1 && isAddingLink && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      ref={newLinkInputRef}
                      type="url"
                      placeholder="https://example.com"
                      className="flex-grow bg-input/80 h-9"
                      onKeyDown={(e) => handleLinkInputKeyDown(e)}
                      autoFocus
                    />
                    <Button size="icon" onClick={handleSaveNewLink} className="h-9 w-9 shrink-0"><Save className="h-4 w-4"/></Button>
                  </div>
              )}
              
              {(links || []).filter(link => link && link.trim()).length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {(links || []).filter(link => link && link.trim()).map((link, index) => (
                    <div key={index} className="flex items-center space-x-1.5">
                      <a href={link.startsWith('http') ? link : `http://${link}`} target="_blank" rel="noopener noreferrer"
                        className="flex-grow text-sm text-blue-600 dark:text-blue-400 hover:underline truncate bg-input/50 h-9 px-3 flex items-center rounded-md">
                        {link}
                      </a>
                      {isHost1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeLinkField(index)} aria-label="Remove link" className="h-9 w-9 p-1 shrink-0">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
                <button
                    onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <Label className="flex items-center cursor-pointer">
                        Segment Notes
                        {segment[audienceSuggestionsKey] && segment[audienceSuggestionsKey].trim() && (
                            <StickyNote className="ml-2 h-4 w-4 text-primary" />
                        )}
                    </Label>
                    <span className="text-xs text-muted-foreground flex items-center">
                        {isNotesCollapsed ? 'Expand' : 'Collapse'}
                        <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", !isNotesCollapsed && "rotate-180")} />
                    </span>
                </button>
                 {!isNotesCollapsed && (
                    <Textarea
                        id={`audienceSuggestions${nameSuffix}`}
                        defaultValue={segment[audienceSuggestionsKey] || ''}
                        onBlur={(e) => isHost1 && handleFieldChange({ [audienceSuggestionsKey]: e.target.value })}
                        placeholder={isHost1 ? `Notes for this ${currentMode.segmentLabel.toLowerCase()}...` : `Collaborator's ${currentMode.segmentLabel.toLowerCase()} notes...`}
                        readOnly={!isHost1}
                        className="min-h-[100px] bg-input/50 mt-1"
                    />
                 )}
            </div>
          </>
        )}
      </div>
    );
  }, [segment, isAddingLink, labelPrefixHost1, labelPrefixHost2, currentMode, onSegmentChange, isNotesCollapsed]);

  return (
    <div className="bg-card rounded-lg shadow-md border-t-4 border-primary/20 pt-2">
      <CardHeader className="pb-4 pt-2 shadow-sm border-b">
        <div className="flex justify-between items-start">
          <div className="flex-grow min-w-0 pr-2">
             {editingTitle ? (
              <Input
                ref={titleInputRef}
                defaultValue={segment.title}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="text-xl font-semibold p-1 -ml-1 h-auto bg-input/50 text-primary"
              />
            ) : (
              <CardTitle
                className="text-xl text-primary cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded break-words"
                onClick={() => setEditingTitle(true)}
                title={`Click to edit: ${segment.title}`}
              >
                {segment.title}
              </CardTitle>
            )}
            {editingSubtitle ? (
               <Input
                ref={subtitleInputRef}
                defaultValue={segment.subtitle || ''}
                onBlur={handleSubtitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="Add a subtitle..."
                className="text-sm font-normal p-1 -ml-1 h-auto bg-input/50 mt-1"
              />
            ) : (
                <CardDescription 
                    className="text-sm text-foreground/80 mt-1 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded break-words"
                    onClick={() => setEditingSubtitle(true)}
                    title={`Click to edit: ${segment.subtitle}`}
                >
                    {segment.subtitle || "Click to add subtitle..."}
                </CardDescription>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80 shrink-0"
                disabled={isSavingEpisode}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the {currentMode.segmentLabel.toLowerCase()} "{segment.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemoveSegment(segment.id)}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {linkedChecklistItem && (
            <div className="mt-2">
                <button
                    onClick={onScrollToChecklist}
                    className="w-full text-left p-2 border border-dashed rounded-md flex items-center gap-2 hover:bg-muted transition-colors bg-background"
                >
                    <Checkbox checked={linkedChecklistItem.completed} onCheckedChange={() => onChecklistItemToggle(linkedChecklistItem.id)} />
                    <span className="text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3 mr-1.5 inline-block text-accent"/>
                        <span className="font-semibold">Linked Task:</span> {linkedChecklistItem.text}
                    </span>
                </button>
            </div>
        )}
      </CardHeader>
      <CardContent className="pt-2 px-4 pb-4 space-y-3">
        {renderHostInputs('host1')}
        {hasHost2Data(segment) && (
            <div className="bg-muted/40 rounded-md p-4 mt-4">
              {renderHostInputs('host2')}
            </div>
        )}
      </CardContent>
    </div>
  );
}
