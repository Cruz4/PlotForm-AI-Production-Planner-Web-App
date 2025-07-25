
'use client';

import type { FormEvent, ChangeEvent as ReactChangeEvent } from 'react';
import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { Episode, Segment, ModeSpecificSegmentTemplate, EpisodeStatus } from '@/types';
import SegmentEditor from './SegmentEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    Save,
    PlusCircle,
    CalendarDays,
    Dot,
    GripVertical,
    Trash2,
    X as CancelIcon,
    ListChecks,
    RotateCcw,
} from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useAppContextMode } from '@/contexts/ModeContext';
import {
  Select, SelectContent, SelectTrigger, SelectValue, SelectItem
} from "@/components/ui/select";
import { MODE_SPECIFIC_DEFAULT_SEGMENTS, APP_NAME } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { getCustomHost1Name } from '@/lib/episodeLayoutsStore';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { calculateGenericEpisodeStatus, calculateOverallEpisodeProgress } from '@/lib/dataUtils';

interface EpisodeFormProps {
  episode: Episode;
  onEpisodeChange: (updatedEpisode: Partial<Episode>) => void;
  onSave: (updatedEpisode: Episode) => Promise<void | Episode>;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
  onScrollToSection: (elementId: string) => void;
}

export interface EpisodeFormHandle {
  submitForm: () => Promise<void>;
}

interface SortableSegmentEditorItemProps {
  segment: Segment;
  index: number;
  onSegmentChange: (index: number, updatedSegmentData: Partial<Segment>) => void;
  onRemoveSegment: (segmentId: string) => void;
  isSavingEpisode?: boolean;
  labelPrefixHost1: string;
  labelPrefixHost2: string;
  checklist?: Episode['productionChecklist'];
  onChecklistItemToggle: (itemId: string) => void;
  onScrollToChecklist: () => void;
}

function SortableSegmentEditorItem({
  segment,
  index,
  onSegmentChange,
  onRemoveSegment,
  isSavingEpisode,
  labelPrefixHost1,
  labelPrefixHost2,
  checklist,
  onChecklistItemToggle,
  onScrollToChecklist,
}: SortableSegmentEditorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  const navId = `segment-editor-${segment.id}`;

  return (
    <div id={navId} ref={setNodeRef} style={style} className={cn(isDragging && "opacity-75 shadow-xl")}>
      <div className="flex items-start gap-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab touch-none p-1 mt-8 shrink-0 group-hover:bg-muted"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder segment"
          disabled={isSavingEpisode}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </Button>
        <div className="flex-grow">
          <SegmentEditor
            segment={segment}
            onSegmentChange={(updatedSeg) => onSegmentChange(index, updatedSeg)}
            onRemoveSegment={onRemoveSegment}
            isSavingEpisode={isSavingEpisode}
            labelPrefixHost1={labelPrefixHost1}
            labelPrefixHost2={labelPrefixHost2}
            checklist={checklist}
            onChecklistItemToggle={onChecklistItemToggle}
            onScrollToChecklist={onScrollToChecklist}
          />
        </div>
      </div>
    </div>
  );
}

const EpisodeForm = forwardRef<EpisodeFormHandle, EpisodeFormProps>(({ episode: episodeFromProps, onEpisodeChange, onSave, onUnsavedChangesChange, onScrollToSection }, ref) => {
  const [localEpisode, setLocalEpisode] = useState(episodeFromProps);
  const { currentMode } = useAppContextMode();
  const [isNoSeasonChecked_UI, setIsNoSeasonChecked_UI] = useState(
    localEpisode.seasonNumber === null || localEpisode.seasonNumber === undefined
  );
  
  const [selectedTemplateIdToAdd, setSelectedTemplateIdToAdd] = useState<string>('');
  const [isAddingCustomSegment, setIsAddingCustomSegment] = useState(false);
  const [newCustomSegmentTitle, setNewCustomSegmentTitle] = useState('');
  const [newCustomSegmentSubtitle, setNewCustomSegmentSubtitle] = useState('');
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [showCustomLabels, setShowCustomLabels] = useState(!!localEpisode.customStatusLabels && Object.keys(localEpisode.customStatusLabels).length > 0);

  const { toast } = useToast();
  const { user } = useAuth();

  const [notScheduledYet_UI, setNotScheduledYet_UI] = useState(localEpisode.dateScheduledForRecording === null || localEpisode.dateScheduledForRecording === undefined);
  const [notRecordedYet_UI, setNotRecordedYet_UI] = useState(localEpisode.dateRecorded === null || localEpisode.dateRecorded === undefined);
  const [notUploadedYet_UI, setNotUploadedYet_UI] = useState(localEpisode.dateUploaded === null || localEpisode.dateUploaded === undefined);
  const [noGuestEquivalent_UI, setNoGuestEquivalent_UI] = useState(localEpisode.specialGuest === null || localEpisode.specialGuest === '' || localEpisode.specialGuest === undefined);
  const [noDetailEquivalent_UI, setNoDetailEquivalent_UI] = useState(localEpisode.lunchProvidedBy === null || localEpisode.lunchProvidedBy === '' || localEpisode.lunchProvidedBy === undefined);
  
  const [currentUsersUsername, setCurrentUsersUsername] = useState('Your Username'); 

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const overallProgress = useMemo(() => calculateOverallEpisodeProgress(localEpisode, currentMode), [localEpisode, currentMode]);


  useEffect(() => {
    setLocalEpisode(episodeFromProps);
    setShowCustomLabels(!!episodeFromProps.customStatusLabels && Object.keys(episodeFromProps.customStatusLabels).some(key => !!episodeFromProps.customStatusLabels?.[key as keyof typeof episodeFromProps.customStatusLabels]));
    setIsNoSeasonChecked_UI(episodeFromProps.seasonNumber === null || episodeFromProps.seasonNumber === undefined);
    setNotScheduledYet_UI(episodeFromProps.dateScheduledForRecording === null || episodeFromProps.dateScheduledForRecording === undefined);
    setNotRecordedYet_UI(episodeFromProps.dateRecorded === null || episodeFromProps.dateRecorded === undefined);
    setNotUploadedYet_UI(episodeFromProps.dateUploaded === null || episodeFromProps.dateUploaded === undefined);
    setNoGuestEquivalent_UI(episodeFromProps.specialGuest === null || episodeFromProps.specialGuest === '' || episodeFromProps.specialGuest === undefined);
    setNoDetailEquivalent_UI(episodeFromProps.lunchProvidedBy === null || episodeFromProps.lunchProvidedBy === '' || episodeFromProps.lunchProvidedBy === undefined);
  }, [episodeFromProps]);

  const handleLocalChange = (updates: Partial<Episode>) => {
    const newLocalState = { ...localEpisode, ...updates };
    setLocalEpisode(newLocalState);
    onEpisodeChange(newLocalState);
    onUnsavedChangesChange(true);
  };
  
  const handleManualStatusChange = (status: EpisodeStatus) => {
    const now = Date.now();
    let updates: Partial<Episode> = { status };

    // Clear higher-level dates when moving backwards
    if (status === 'planning') {
        updates.dateScheduledForRecording = null;
        updates.dateRecorded = null;
        updates.dateUploaded = null;
    } else if (status === 'scheduled') {
        updates.dateScheduledForRecording = localEpisode.dateScheduledForRecording || now;
        updates.dateRecorded = null;
        updates.dateUploaded = null;
    } else if (status === 'editing') {
        updates.dateRecorded = localEpisode.dateRecorded || now;
        updates.dateUploaded = null;
        // If they jumped straight to editing, stamp the scheduled date too
        if (!localEpisode.dateScheduledForRecording) {
            updates.dateScheduledForRecording = now;
        }
    }
    // "Published" is handled by the 100% progress rule and is disabled in the dropdown
    
    handleLocalChange(updates);
};
  
  useEffect(() => {
    const fetchUsersUsername = async () => { 
      if (user?.uid) {
        const name = await getCustomHost1Name(user.uid);
        setCurrentUsersUsername(name || user.displayName || 'Your Username'); 
      } else {
        setCurrentUsersUsername('Your Username'); 
      }
    };
    fetchUsersUsername();
  }, [user]);

  const handleNoSeasonCheckboxChange = (checked: boolean) => {
    setIsNoSeasonChecked_UI(checked);
    if (checked) {
      handleLocalChange({ seasonNumber: null, seasonName: null });
    }
  };

  const handleSeasonNumberInputChange = (e: ReactChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim() === '') {
      handleLocalChange({ seasonNumber: null });
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        handleLocalChange({ seasonNumber: num });
        setIsNoSeasonChecked_UI(false); 
      } else {
        toast({ title: "Invalid Input", description: `${currentMode.seasonLabel} # must be a non-negative number.`, variant: "destructive" });
      }
    }
  };

  const handleInputChange = (e: ReactChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'episodeNumber') {
        const numValue = value === '' ? null : parseInt(value, 10);
        if (numValue !== null && numValue < 0) {
            toast({ title: "Validation Error", description: `${currentMode.episodeLabel} number cannot be negative. Reverting to 0.`, variant: "destructive" });
            handleLocalChange({ episodeNumber: 0 });
        } else {
          handleLocalChange({ episodeNumber: (numValue === null || isNaN(numValue as any)) ? null : numValue });
        }
    } else if (name === 'seasonNumber') {
        handleSeasonNumberInputChange(e as ReactChangeEvent<HTMLInputElement>);
    } else if (name === 'seasonName') {
        handleLocalChange({ seasonName: value, seasonNumber: localEpisode.seasonNumber ?? 1 });
        if(value.trim() !== '') setIsNoSeasonChecked_UI(false);
    } else {
        handleLocalChange({ [name]: value });
    }

    if (name === 'specialGuest' && value.trim() !== '') setNoGuestEquivalent_UI(false);
    if (name === 'lunchProvidedBy' && value.trim() !== '') setNoDetailEquivalent_UI(false);
  };

  const handleEpisodeNotesChange = (e: ReactChangeEvent<HTMLTextAreaElement>) => {
    handleLocalChange({ episodeNotes: e.target.value });
  };


  const handleDateInputChange = (field: 'dateScheduledForRecording' | 'dateRecorded' | 'dateUploaded', value: string) => {
    const dateSetterMapUI = {
      dateScheduledForRecording: setNotScheduledYet_UI,
      dateRecorded: setNotRecordedYet_UI,
      dateUploaded: setNotUploadedYet_UI,
    };
    dateSetterMapUI[field](false); 
    handleLocalChange({ [field]: value ? new Date(value).getTime() : null });
  };
  
  const handleGenericCheckboxChange = (
    uiCheckboxSetter: React.Dispatch<React.SetStateAction<boolean>>,
    episodeFieldToNull?: keyof Episode
  ) => {
    let newCheckboxState = false;
    uiCheckboxSetter(prev => {
        newCheckboxState = !prev;
        return newCheckboxState;
    });

    if (newCheckboxState && episodeFieldToNull) {
        handleLocalChange({ [episodeFieldToNull]: null });
    }
  };

  const formatDateForInput = (timestamp: number | null | undefined): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleSegmentChange = (index: number, updatedSegmentData: Partial<Segment>) => {
    const newSegments = [...localEpisode.segments];
    newSegments[index] = { ...newSegments[index], ...updatedSegmentData };
    handleLocalChange({ segments: newSegments, updatedAt: Date.now() });
  };

  const handleAddSegmentFromTemplate = async () => {
    if (!selectedTemplateIdToAdd) return;
    const modeSpecificTemplates = MODE_SPECIFIC_DEFAULT_SEGMENTS[currentMode.modeName] || [];
    const template = modeSpecificTemplates.find(t => t.id === selectedTemplateIdToAdd);

    if (template) {
      const newSegment: Segment = {
        id: uuidv4(),
        title: template.title,
        subtitle: template.subtitle || '',
        host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
        host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
      };
      handleLocalChange({ segments: [...localEpisode.segments, newSegment], updatedAt: Date.now() });
      setSelectedTemplateIdToAdd('');
      toast({title: `${currentMode.segmentLabel} Added`, description: `"${template.title}" added to your ${currentMode.episodeLabel.toLowerCase()}.`});
    } else {
        toast({title: "Error", description: `Selected ${currentMode.segmentLabel.toLowerCase()} template not found for the current mode.`, variant: "destructive"});
    }
  };

  const handleSaveCustomSegment = () => {
    const newSegment: Segment = {
      id: uuidv4(),
      title: newCustomSegmentTitle.trim() || `Untitled ${currentMode.segmentLabel}`,
      subtitle: newCustomSegmentSubtitle.trim() || '',
      host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
      host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
    };
    handleLocalChange({ segments: [...localEpisode.segments, newSegment], updatedAt: Date.now() });
    toast({title: `${currentMode.segmentLabel} Added`, description: `Custom ${currentMode.segmentLabel.toLowerCase()} "${newSegment.title}" added.`});
    setNewCustomSegmentTitle('');
    setNewCustomSegmentSubtitle('');
    setIsAddingCustomSegment(false);
  };

  const handleRemoveSegment = (segmentId: string) => {
    const segmentToRemove = localEpisode.segments.find(s => s.id === segmentId);
    handleLocalChange({ segments: localEpisode.segments.filter(segment => segment.id !== segmentId), updatedAt: Date.now() });
    toast({title: `${currentMode.segmentLabel} Removed`, description: `"${segmentToRemove?.title || 'Segment'}" removed.`});
  };

  const handleChecklistItemToggle = (itemId: string) => {
    handleLocalChange({
      productionChecklist: localEpisode.productionChecklist?.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleAddChecklistItem = () => {
      if (!newChecklistItemText.trim()) return;
      const newItem = { id: uuidv4(), text: newChecklistItemText.trim(), completed: false, linkedSegmentId: null };
      handleLocalChange({
        productionChecklist: [...(localEpisode.productionChecklist || []), newItem],
      });
      setNewChecklistItemText('');
  };

  const handleRemoveChecklistItem = (itemId: string) => {
      handleLocalChange({
        productionChecklist: localEpisode.productionChecklist?.filter(item => item.id !== itemId),
      });
  };
  
  const handleChecklistLinkChange = (itemId: string, segmentId: string | null) => {
    const updatedChecklist = (localEpisode.productionChecklist || []).map(item =>
        item.id === itemId ? { ...item, linkedSegmentId: segmentId } : item
    );
    handleLocalChange({ productionChecklist: updatedChecklist });
  };

  const handleSubmit = useCallback(async () => {
    if (!localEpisode.title.trim()) {
      toast({ title: "Validation Error", description: `${currentMode.episodeLabel} title cannot be empty.`, variant: "destructive" });
      return;
    }

    let ownerDisplayNameForSave = localEpisode.ownerHostDisplayName;
    if (user && localEpisode.createdBy === user.uid && (!ownerDisplayNameForSave || ownerDisplayNameForSave === 'Host 1 (Your Input)' || ownerDisplayNameForSave === 'Host 1')) {
        ownerDisplayNameForSave = currentUsersUsername; 
    }
    
    const finalSeasonNumber = (typeof localEpisode.seasonNumber === 'number' && localEpisode.seasonNumber >= 0) ? localEpisode.seasonNumber : null;
    const finalEpisodeNumber = (typeof localEpisode.episodeNumber === 'number' && localEpisode.episodeNumber >= 0) ? localEpisode.episodeNumber : 0;

    const finalEpisodeData: Episode = {
      ...localEpisode,
      title: localEpisode.title.trim(),
      ownerHostDisplayName: ownerDisplayNameForSave,
      dateScheduledForRecording: notScheduledYet_UI || localEpisode.useManualStatus ? null : localEpisode.dateScheduledForRecording,
      dateRecorded: notRecordedYet_UI || localEpisode.useManualStatus ? null : localEpisode.dateRecorded,
      dateUploaded: notUploadedYet_UI || localEpisode.useManualStatus ? null : localEpisode.dateUploaded,
      specialGuest: noGuestEquivalent_UI ? null : (localEpisode.specialGuest || '').trim() === '' ? null : localEpisode.specialGuest,
      lunchProvidedBy: noDetailEquivalent_UI ? null : (localEpisode.lunchProvidedBy || '').trim() === '' ? null : localEpisode.lunchProvidedBy,
      customStatusLabels: showCustomLabels ? localEpisode.customStatusLabels : {},
    };

    await onSave(finalEpisodeData);
  }, [localEpisode, onSave, currentMode, currentUsersUsername, notScheduledYet_UI, notRecordedYet_UI, notUploadedYet_UI, noGuestEquivalent_UI, noDetailEquivalent_UI, toast, user, showCustomLabels]);


  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }));

  const handleDragEndSegments = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = localEpisode.segments.findIndex((s) => s.id === active.id);
      const newIndex = localEpisode.segments.findIndex((s) => s.id === over.id);
      const newOrderedSegments = arrayMove(localEpisode.segments, oldIndex, newIndex);
      handleLocalChange({ segments: newOrderedSegments, updatedAt: Date.now() });
    }
  };

  const seasonNumberLabelText = currentMode.seasonNumberLabel || `${currentMode.seasonLabel} #`;
  const episodeNumberLabelText = currentMode.episodeNumberLabel || `${currentMode.episodeLabel} #`;
  const noSeasonCheckboxLabelText = currentMode.noSeasonCheckboxLabel || `No ${currentMode.seasonLabel}`;
  const seasonPlaceholder = currentMode.seasonLabel ? `${currentMode.seasonLabel.split(' ')[0]} #` : 'S #';

  const currentModeSegmentTemplates = MODE_SPECIFIC_DEFAULT_SEGMENTS[currentMode.modeName] || [];

  const handleCustomLabelChange = (field: 'scheduled' | 'editing' | 'published', value: string) => {
    handleLocalChange({
        customStatusLabels: {
            ...localEpisode.customStatusLabels,
            [field]: value
        }
    });
  };

  const resetCustomLabels = () => {
      handleLocalChange({ customStatusLabels: {} });
      toast({ title: 'Labels Reset', description: 'Custom status labels have been reset to the mode defaults.' });
  };
  
  const handleToggleCustomLabels = (checked: boolean) => {
    setShowCustomLabels(checked);
    if (!checked) {
        resetCustomLabels();
    }
  };


  return (
    <div className="space-y-8">
      <div className="space-y-6 p-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h2 className="text-2xl font-bold">Edit {currentMode.episodeLabel} Plan</h2>
        <p className="text-sm text-muted-foreground">
            Fill out the details for this {currentMode.episodeLabel.toLowerCase()}. Changes are saved when you hit "Save All Changes".
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[130px_1fr_130px_auto] items-end gap-x-4 gap-y-3">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="seasonNumber">{seasonNumberLabelText}</Label>
              <Input
                id="seasonNumber"
                name="seasonNumber"
                type="number"
                value={isNoSeasonChecked_UI || localEpisode.seasonNumber === null || localEpisode.seasonNumber === undefined ? '' : String(localEpisode.seasonNumber)}
                onChange={handleSeasonNumberInputChange}
                placeholder={seasonPlaceholder}
                className="w-full bg-background"
                disabled={isNoSeasonChecked_UI}
                min="0"
              />
            </div>
            <div className="flex-grow min-w-[150px] flex flex-col space-y-1">
                <Label htmlFor="seasonName">{currentMode.seasonLabel} Name</Label>
                <Input
                    id="seasonName"
                    name="seasonName"
                    type="text"
                    value={localEpisode.seasonName || ''}
                    onChange={handleInputChange}
                    placeholder="E.g., The Empire Strikes Back"
                    className="bg-background"
                    disabled={isNoSeasonChecked_UI}
                />
            </div>
            <div className="flex flex-col space-y-1">
                <Label htmlFor="episodeNumber">{episodeNumberLabelText}</Label>
                <Input 
                  id="episodeNumber" 
                  name="episodeNumber" 
                  type="number" 
                  value={localEpisode.episodeNumber === null || localEpisode.episodeNumber === undefined ? '' : String(localEpisode.episodeNumber)} 
                  onChange={handleInputChange} 
                  className="w-full bg-background" 
                  placeholder="Ep #" 
                  min="0"
                />
            </div>
          <div className="flex items-center self-end pb-3">
            <Checkbox
              id="noSeason"
              checked={isNoSeasonChecked_UI}
              onCheckedChange={handleNoSeasonCheckboxChange}
            />
            <Label htmlFor="noSeason" className="ml-2 text-xs font-normal text-muted-foreground whitespace-nowrap">{noSeasonCheckboxLabelText}</Label>
          </div>
        </div>
        
        <div>
           <Label htmlFor="title">{currentMode.episodeLabel} Title</Label>
              <Input 
                id="title" 
                name="title" 
                type="text" 
                value={localEpisode.title} 
                onChange={handleInputChange} 
                className="bg-background font-semibold text-accent placeholder:text-accent/50" 
                placeholder={`Enter ${currentMode.episodeLabel.toLowerCase()} title`} 
                required 
              />
        </div>

        <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <Switch id="toggle-custom-labels" checked={showCustomLabels} onCheckedChange={handleToggleCustomLabels} />
                    <Label htmlFor="toggle-custom-labels" className="text-sm font-medium">Custom Status Labels (Optional)</Label>
                </div>
                {showCustomLabels && (
                    <Button variant="ghost" size="sm" onClick={resetCustomLabels} className="text-xs">
                        <RotateCcw className="mr-1.5 h-3 w-3" /> Reset to Defaults
                    </Button>
                )}
            </div>
            {showCustomLabels && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in-50 duration-300">
                    <div>
                        <Label htmlFor="custom-scheduled" className="text-xs text-muted-foreground">{currentMode.statusWorkflow.scheduled.label}</Label>
                        <Input id="custom-scheduled" value={localEpisode.customStatusLabels?.scheduled || ''} onChange={(e) => handleCustomLabelChange('scheduled', e.target.value)} placeholder={currentMode.statusWorkflow.scheduled.label} className="bg-background h-9" />
                    </div>
                    <div>
                        <Label htmlFor="custom-editing" className="text-xs text-muted-foreground">{currentMode.statusWorkflow.editing.label}</Label>
                        <Input id="custom-editing" value={localEpisode.customStatusLabels?.editing || ''} onChange={(e) => handleCustomLabelChange('editing', e.target.value)} placeholder={currentMode.statusWorkflow.editing.label} className="bg-background h-9" />
                    </div>
                    <div>
                        <Label htmlFor="custom-published" className="text-xs text-muted-foreground">{currentMode.statusWorkflow.published.label}</Label>
                        <Input id="custom-published" value={localEpisode.customStatusLabels?.published || ''} onChange={(e) => handleCustomLabelChange('published', e.target.value)} placeholder={currentMode.statusWorkflow.published.label} className="bg-background h-9" />
                    </div>
                </div>
            )}
        </div>
        
        <div className="space-y-4 pt-4 border-t">
             <div className="flex items-center space-x-2">
                <Switch id="toggle-manual-status" checked={localEpisode.useManualStatus ?? false} onCheckedChange={(checked) => handleLocalChange({ useManualStatus: checked })} />
                <Label htmlFor="toggle-manual-status" className="text-sm font-medium">Manual Status Progression</Label>
            </div>
            {localEpisode.useManualStatus ? (
                 <div className="animate-in fade-in-50 duration-300">
                    <Label htmlFor="manual-status-select">Status</Label>
                    <Select value={localEpisode.status || 'planning'} onValueChange={(value) => handleManualStatusChange(value as EpisodeStatus)}>
                        <SelectTrigger id="manual-status-select" className="w-[180px] bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="planning">{localEpisode.customStatusLabels?.planning || currentMode.statusWorkflow.planning.label}</SelectItem>
                            <SelectItem value="scheduled">{localEpisode.customStatusLabels?.scheduled || currentMode.statusWorkflow.scheduled.label}</SelectItem>
                            <SelectItem value="editing">{localEpisode.customStatusLabels?.editing || currentMode.statusWorkflow.editing.label}</SelectItem>
                            <SelectItem value="published" disabled={overallProgress < 100}>
                                {localEpisode.customStatusLabels?.published || currentMode.statusWorkflow.published.label} {overallProgress < 100 && `(${overallProgress}%)`}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 animate-in fade-in-50 duration-300">
                    <div className="space-y-1">
                        <Label htmlFor="dateScheduledForRecording" className="flex items-center text-sm"><Dot className="mr-1 h-5 w-5 text-yellow-500 flex-shrink-0" /> {localEpisode.customStatusLabels?.scheduled || currentMode.statusWorkflow.scheduled.label}</Label>
                        <Input id="dateScheduledForRecording" type="date" value={notScheduledYet_UI ? '' : formatDateForInput(localEpisode.dateScheduledForRecording)} onChange={(e) => handleDateInputChange('dateScheduledForRecording', e.target.value)} className="mt-1 bg-background w-full max-w-[180px] sm:max-w-none md:w-48" disabled={notScheduledYet_UI} />
                        <div className="flex items-center pt-1"><Checkbox id="notScheduledYet" checked={notScheduledYet_UI} onCheckedChange={() => handleGenericCheckboxChange(setNotScheduledYet_UI, 'dateScheduledForRecording')} /><Label htmlFor="notScheduledYet" className="ml-2 text-xs font-normal text-muted-foreground">Not Yet {localEpisode.customStatusLabels?.scheduled || currentMode.statusWorkflow.scheduled.label}</Label></div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="dateRecorded" className="flex items-center text-sm"><Dot className="mr-1 h-5 w-5 text-orange-500 flex-shrink-0" /> {localEpisode.customStatusLabels?.editing || currentMode.statusWorkflow.editing.label}</Label>
                        <Input id="dateRecorded" type="date" value={notRecordedYet_UI ? '' : formatDateForInput(localEpisode.dateRecorded)} onChange={(e) => handleDateInputChange('dateRecorded', e.target.value)} className="mt-1 bg-background w-full max-w-[180px] sm:max-w-none md:w-48" disabled={notRecordedYet_UI} />
                        <div className="flex items-center pt-1"><Checkbox id="notRecordedYet" checked={notRecordedYet_UI} onCheckedChange={() => handleGenericCheckboxChange(setNotRecordedYet_UI, 'dateRecorded')} /><Label htmlFor="notRecordedYet" className="ml-2 text-xs font-normal text-muted-foreground">Not Yet {localEpisode.customStatusLabels?.editing || currentMode.statusWorkflow.editing.label}</Label></div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="dateUploaded" className="flex items-center text-sm"><Dot className="mr-1 h-5 w-5 text-green-500 flex-shrink-0" /> {localEpisode.customStatusLabels?.published || currentMode.statusWorkflow.published.label}</Label>
                        <Input id="dateUploaded" type="date" value={notUploadedYet_UI ? '' : formatDateForInput(localEpisode.dateUploaded)} onChange={(e) => handleDateInputChange('dateUploaded', e.target.value)} className="mt-1 bg-background w-full max-w-[180px] sm:max-w-none md:w-48" disabled={notUploadedYet_UI} />
                        <div className="flex items-center pt-1"><Checkbox id="notUploadedYet" checked={notUploadedYet_UI} onCheckedChange={() => handleGenericCheckboxChange(setNotUploadedYet_UI, 'dateUploaded')} /><Label htmlFor="notUploadedYet" className="ml-2 text-xs font-normal text-muted-foreground">Not Yet {localEpisode.customStatusLabels?.published || currentMode.statusWorkflow.published.label}</Label></div>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t">
          <div className="space-y-1">
            <Label htmlFor="specialGuest">{currentMode.guestLabel}</Label>
            <Input id="specialGuest" name="specialGuest" type="text" value={noGuestEquivalent_UI ? '' : (localEpisode.specialGuest || '')} onChange={handleInputChange} placeholder={currentMode.guestPlaceholder} className="mt-1 bg-background" disabled={noGuestEquivalent_UI} />
            <div className="flex items-center pt-1"><Checkbox id="noGuestEquivalent" checked={noGuestEquivalent_UI} onCheckedChange={() => handleGenericCheckboxChange(setNoGuestEquivalent_UI, 'specialGuest')} /><Label htmlFor="noGuestEquivalent" className="ml-2 text-xs font-normal text-muted-foreground">No {currentMode.guestLabel}</Label></div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lunchProvidedBy">{currentMode.detailLabel}</Label>
            <Input id="lunchProvidedBy" name="lunchProvidedBy" type="text" value={noDetailEquivalent_UI ? '' : (localEpisode.lunchProvidedBy || '')} onChange={handleInputChange} placeholder={currentMode.detailPlaceholder} className="mt-1 bg-background" disabled={noDetailEquivalent_UI} />
            <div className="flex items-center pt-1"><Checkbox id="noDetailEquivalent" checked={noDetailEquivalent_UI} onCheckedChange={() => handleGenericCheckboxChange(setNoDetailEquivalent_UI, 'lunchProvidedBy')} /><Label htmlFor="noDetailEquivalent" className="ml-2 text-xs font-normal text-muted-foreground">No {currentMode.detailLabel}</Label></div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Label htmlFor="episodeNotes" className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> General {currentMode.episodeLabel} Notes
          </Label>
          <div className="mt-1">
             <Textarea
                id="episodeNotes"
                name="episodeNotes"
                value={localEpisode.episodeNotes || ''}
                onChange={handleEpisodeNotesChange}
                placeholder={`Add any overall notes for this ${currentMode.episodeLabel.toLowerCase()} here...`}
                className="min-h-[120px] bg-background"
              />
          </div>
        </div>
      </div>
      
      <div id="checklist-scroll-full" className="space-y-6 p-6 bg-card rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-foreground flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Production Checklist</h3>
        <div className="space-y-2 mb-3">
            {(localEpisode.productionChecklist || []).map(item => {
                const linkedSegmentTitle = item.linkedSegmentId ? localEpisode.segments.find(s => s.id === item.linkedSegmentId)?.title : null;
                return (
                  <div key={item.id} className="flex items-center gap-2 group">
                      <Checkbox id={`check-${item.id}`} checked={item.completed} onCheckedChange={() => handleChecklistItemToggle(item.id)} />
                      <div className='flex-grow'>
                        <Label htmlFor={`check-${item.id}`} className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</Label>
                        {linkedSegmentTitle && (
                           <button onClick={() => onScrollToSection(`segment-editor-${item.linkedSegmentId}`)} className="text-xs text-accent hover:underline ml-2">({linkedSegmentTitle})</button>
                        )}
                      </div>
                      <Select onValueChange={(segmentId) => handleChecklistLinkChange(item.id, segmentId === 'none' ? null : segmentId)} value={item.linkedSegmentId || 'none'}>
                          <SelectTrigger className="h-6 w-24 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><SelectValue placeholder="Link..." /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">No Link</SelectItem>
                              {localEpisode.segments.map(seg => <SelectItem key={seg.id} value={seg.id}>{seg.title}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveChecklistItem(item.id)} className="h-6 w-6 text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )
            })}
        </div>
        <div className="flex items-center gap-2">
          <Input value={newChecklistItemText} onChange={(e) => setNewChecklistItemText(e.target.value)} placeholder="Add a new checklist item..." className="bg-background"/>
          <Button onClick={handleAddChecklistItem} disabled={!newChecklistItemText.trim()}>Add Task</Button>
        </div>
      </div>

      <div className="space-y-4 p-6 bg-card rounded-lg shadow">
        <h3 className="text-lg font-semibold text-foreground">{currentMode.episodeLabel} {currentMode.segmentLabel}s</h3>
        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
          <Label className="text-sm font-medium">Add {currentMode.segmentLabel} from Template:</Label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Select value={selectedTemplateIdToAdd} onValueChange={setSelectedTemplateIdToAdd}>
              <SelectTrigger className="flex-grow bg-background">
                <SelectValue placeholder={`Select ${currentMode.segmentLabel.toLowerCase()} template...`} />
              </SelectTrigger>
              <SelectContent>
                {currentModeSegmentTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={handleAddSegmentFromTemplate} disabled={!selectedTemplateIdToAdd} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add from Template
            </Button>
          </div>
        </div>

        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
            {!isAddingCustomSegment && (
                <Button type="button" onClick={() => setIsAddingCustomSegment(true)} className="w-full sm:w-auto" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Custom {currentMode.segmentLabel}
                </Button>
            )}
            {isAddingCustomSegment && (
                <>
                    <Label className="text-sm font-medium block mb-2">Define New Custom {currentMode.segmentLabel}:</Label>
                    <div className="space-y-2">
                        <Input
                            type="text"
                            value={newCustomSegmentTitle}
                            onChange={(e) => setNewCustomSegmentTitle(e.target.value)}
                            placeholder={`New ${currentMode.segmentLabel} Title (Required)`}
                            className="bg-background"
                            autoFocus
                        />
                        <Input
                            type="text"
                            value={newCustomSegmentSubtitle}
                            onChange={(e) => setNewCustomSegmentSubtitle(e.target.value)}
                            placeholder={`New ${currentMode.segmentLabel} Subtitle (Optional)`}
                            className="bg-background"
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Button type="button" onClick={handleSaveCustomSegment} className="w-full sm:w-auto">
                            <Save className="mr-2 h-4 w-4" /> Save Custom {currentMode.segmentLabel}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => { setIsAddingCustomSegment(false); setNewCustomSegmentTitle(''); setNewCustomSegmentSubtitle(''); }} className="w-full sm:w-auto">
                            <CancelIcon className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    </div>
                </>
            )}
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSegments}>
        <SortableContext items={localEpisode.segments.filter(s=>s.id).map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {localEpisode.segments.filter(s=>s.id).map((segment, index) => (
              <SortableSegmentEditorItem
                key={segment.id}
                segment={segment}
                index={index}
                onSegmentChange={handleSegmentChange}
                onRemoveSegment={handleRemoveSegment}
                labelPrefixHost1={localEpisode.ownerHostDisplayName || currentUsersUsername}
                labelPrefixHost2={localEpisode.importedHostDisplayName || "Collaborator"}
                checklist={localEpisode.productionChecklist}
                onChecklistItemToggle={handleChecklistItemToggle}
                onScrollToChecklist={() => onScrollToSection('checklist-scroll-full')}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});

EpisodeForm.displayName = "EpisodeForm";
export default EpisodeForm;
