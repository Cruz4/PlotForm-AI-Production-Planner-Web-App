
// src/lib/mockData.ts
import type { Episode, Segment, AppMode, EpisodeStatus, StatusWorkflowDefinition } from '@/types';
import { addEpisodeDb } from '@/lib/episodeStore';
import type { Firestore } from 'firebase/firestore';
import { MODE_SPECIFIC_DEFAULT_SEGMENTS } from '@/lib/constants'; 
import { getDefaultAppMode } from '@/lib/modes';
import { v4 as uuidv4 } from 'uuid';

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

const createMockSegments = (
  mode: AppMode,
  itemTitlePrefix: string,
  fillLevel: 'full' | 'partial' | 'empty'
): Segment[] => {
  const modeSpecificTemplates = MODE_SPECIFIC_DEFAULT_SEGMENTS[mode.modeName] || MODE_SPECIFIC_DEFAULT_SEGMENTS["Podcast"];
  if (!modeSpecificTemplates || modeSpecificTemplates.length === 0) {
    return [{
      id: `fallback-segment-${itemTitlePrefix.toLowerCase().replace(/\s+/g, '-')}-0`,
      title: `Default ${mode.segmentLabel} 1`,
      subtitle: `Content for this ${mode.segmentLabel.toLowerCase()}`,
      host1Notes: fillLevel !== 'empty' ? `Notes for default ${mode.segmentLabel.toLowerCase()} 1` : '',
      host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
      host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
    }];
  }

  return modeSpecificTemplates.map((template, index) => {
    const isQuoteSegment = template.title.toLowerCase().includes('quote') || template.id.includes('outro'); 
    let host1Notes = '';
    let host1Quote = '';
    let host1Author = '';

    if (fillLevel === 'full') {
      if (isQuoteSegment) {
        host1Quote = `An inspiring quote for ${itemTitlePrefix}, ${mode.segmentLabel.toLowerCase()} "${template.title}".`;
        host1Author = `Author ${index + 1}`;
      } else {
        host1Notes = `Detailed script/content for ${itemTitlePrefix}, ${mode.segmentLabel.toLowerCase()} "${template.title}". This ${mode.segmentLabel.toLowerCase()} is fully planned out.`;
      }
    } else if (fillLevel === 'partial') {
      if (isQuoteSegment) {
        host1Quote = `A partially thought-out quote for ${template.title}.`;
      } else {
        host1Notes = index % 2 === 0 ? `Some notes for ${itemTitlePrefix}, ${mode.segmentLabel.toLowerCase()} "${template.title}".` : '';
      }
    }

    return {
      id: `${template.id}-${itemTitlePrefix.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      title: template.title,
      subtitle: template.subtitle || `Details for ${template.title}`,
      host1Notes,
      host1Links: fillLevel === 'full' ? [`https://example.com/${itemTitlePrefix.toLowerCase().replace(/\s+/g, '-')}/${template.id}`] : [],
      host1AudienceSuggestions: fillLevel !== 'empty' ? `Audience suggestion for ${template.title}` : '',
      host1Quote,
      host1Author,
      host2Notes: '',
      host2Links: [],
      host2AudienceSuggestions: '',
      host2Quote: '',
      host2Author: '',
    };
  });
};

const createMockItemDefinition = (
  mode: AppMode,
  title: string,
  seasonNumber: number | null,
  itemNumber: number,
  segmentFillLevel: 'full' | 'partial' | 'empty',
  statusKey: 'published' | 'editing' | 'scheduled' | 'planning' | 'archived',
  isFavorite: boolean = false,
  isAiGenerated: boolean = false,
  customNotes?: string,
  linkedPrequelId?: string | null,
  seasonName?: string | null
): Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators'> => {

  let dateScheduled: number | null = null;
  let dateRecorded: number | null = null;
  let dateUploaded: number | null = null;
  let isArchived = false;

  const workflow = mode.statusWorkflow;
  switch (statusKey) {
    case 'published':
      if (workflow.published.dateTriggerField) dateUploaded = now - (5 * oneDay);
      if (workflow.editing.dateTriggerField) dateRecorded = now - (10 * oneDay);
      if (workflow.scheduled.dateTriggerField) dateScheduled = now - (15 * oneDay);
      break;
    case 'editing':
      if (workflow.editing.dateTriggerField) dateRecorded = now - (3 * oneDay);
      if (workflow.scheduled.dateTriggerField) dateScheduled = now - (7 * oneDay);
      break;
    case 'scheduled':
      if (workflow.scheduled.dateTriggerField) dateScheduled = now + (5 * oneDay);
      break;
    case 'archived':
      if (workflow.published.dateTriggerField) dateUploaded = now - (15 * oneDay);
      if (workflow.editing.dateTriggerField) dateRecorded = now - (18 * oneDay);
      if (workflow.scheduled.dateTriggerField) dateScheduled = now - (20 * oneDay);
      isArchived = true;
      break;
    case 'planning':
    default:
      break;
  }
  
  let derivedStatus: Episode['status'] = 'planning';
  if (isArchived) derivedStatus = 'archived';
  else if (dateUploaded && workflow.published.dateTriggerField) derivedStatus = 'published';
  else if (dateRecorded && workflow.editing.dateTriggerField) derivedStatus = 'editing';
  else if (dateScheduled && workflow.scheduled.dateTriggerField && segmentFillLevel === 'full') derivedStatus = 'scheduled';


  let statusLabelForNotes: string;
  if (derivedStatus === 'planning') statusLabelForNotes = workflow.planning.label;
  else if (derivedStatus === 'scheduled') statusLabelForNotes = workflow.scheduled.label;
  else if (derivedStatus === 'editing') statusLabelForNotes = workflow.editing.label;
  else if (derivedStatus === 'published') statusLabelForNotes = workflow.published.label;
  else if (derivedStatus === 'archived') statusLabelForNotes = 'Archived';
  else statusLabelForNotes = workflow.planning.label;
  
  const checklist = (mode.defaultChecklist || []).map((text, index) => ({
    id: uuidv4(),
    text,
    completed: statusKey === 'published' || (statusKey === 'editing' && index < 2),
    linkedSegmentId: null
  }));

  return {
    title: title,
    seasonNumber: seasonNumber,
    seasonName: seasonName || null,
    episodeNumber: itemNumber,
    segments: createMockSegments(mode, `${seasonNumber !== null ? mode.seasonLabel[0]+seasonNumber : ''}${mode.episodeLabel[0]}${itemNumber}`, segmentFillLevel),
    productionChecklist: checklist,
    linkedPrequelId: linkedPrequelId || null,
    isArchived: isArchived,
    isFavorite: isFavorite,
    isAiGenerated: isAiGenerated,
    promptUsed: isAiGenerated ? `A mock prompt for an AI-generated ${mode.episodeLabel.toLowerCase()}` : null,
    dateScheduledForRecording: dateScheduled,
    dateRecorded: dateRecorded,
    dateUploaded: dateUploaded,
    specialGuest: statusKey !== 'planning' ? `${mode.guestPlaceholder.replace('E.g., ', '')} Example` : "To be decided",
    lunchProvidedBy: statusKey !== 'planning' ? `${mode.detailPlaceholder.replace('E.g., ', '')} Services` : "",
    episodeNotes: customNotes || `This is a mock ${mode.episodeLabel.toLowerCase()} titled "${title}" for the ${mode.modeName} mode. It's currently in the "${statusLabelForNotes}" stage.`,
    status: derivedStatus,
    isMock: true,
    importedHostDisplayName: null,
    linkedFollowUpId: null,
    coverImageUrl: null,
    ownerHostDisplayName: null,
  };
};

export const provisionMockEpisodes = async (userId: string, _db: any, mode: AppMode): Promise<void> => {
  if (!userId) {
    console.error("Cannot provision mock episodes without userId");
    return;
  }

  const currentMode = mode || getDefaultAppMode();

  try {
    const itemDefinitions = [
      createMockItemDefinition(currentMode, `${currentMode.episodeLabel} One - ${currentMode.statusWorkflow.published.label} Example`, 1, 1, "full", "published", true, false, undefined, undefined, "The First Adventure"),
      createMockItemDefinition(currentMode, `${currentMode.episodeLabel} Two - ${currentMode.statusWorkflow.editing.label} Stage`, 1, 2, "full", "editing", false, false, undefined, undefined, "The First Adventure"),
      createMockItemDefinition(currentMode, `${currentMode.episodeLabel} Three - Archived Item`, 1, 3, "full", "archived", false, false, undefined, undefined, "The First Adventure"),
      createMockItemDefinition(currentMode, `AI Generated: ${currentMode.episodeLabel} One`, 2, 1, "full", "scheduled", true, true, undefined, undefined, "Sequel Saga (AI)"),
      createMockItemDefinition(currentMode, `AI Generated: ${currentMode.episodeLabel} Two`, 2, 2, "partial", "planning", false, true, undefined, undefined, "Sequel Saga (AI)"),
      createMockItemDefinition(currentMode, `${currentMode.episodeLabel} One - Needs Content`, 3, 1, "empty", "planning", false, false),
    ];

    for (const itemDef of itemDefinitions) {
      await addEpisodeDb(itemDef, userId, currentMode);
    }
    
    console.log(`Provisioned ${itemDefinitions.length} mock ${currentMode.episodeLabel.toLowerCase()}s for user ${userId} in ${currentMode.modeName} mode.`);
  } catch (error) {
    console.error(`Error provisioning mock ${currentMode.episodeLabel.toLowerCase()}s:`, error);
    throw error;
  }
};
