
'use client';

import type { AllAppData, Episode, EpisodeLayout, UserPreferences, UserThemeSettings, UserCustomTheme, AppMode, Segment, AIGeneratedEpisode, SharedSeasonData } from '@/types';
import {
  replaceAllEpisodesInDb,
  deleteAllEpisodesForUserDb,
  addEpisodeDb,
  getAllEpisodesForUserFromDb
} from '@/lib/episodeStore';
import {
  getEpisodeLayouts,
  getActiveDefaultLayoutId,
  replaceAllEpisodeLayouts,
  setActiveDefaultLayoutId,
  getUserPreferences,
  setUserPreferences,
  deleteAllLayoutsForUserDb,
  resetUserPreferencesDb,
  setShowPlannerName
} from '@/lib/episodeLayoutsStore';
import {
  getUserCustomThemes,
  deleteAllUserCustomThemesForUser,
  importUserCustomThemesBatch
} from '@/lib/userCustomThemesStore';
import { db as clientDb, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getDefaultAppMode, ALL_APP_MODES } from '@/lib/modes';
import { DEFAULT_THEME_NAME } from '@/lib/themes';
import { v4 as uuidv4 } from 'uuid';
import type { EpisodeStatus } from '@/types';
import { generateEpisodeMarkdown } from './markdownUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


const USER_DATA_EXPORT_VERSION = "2.0.0";
const SEASON_EXPORT_VERSION = "1.0.0";

export const pluralize = (label: string): string => {
    if (!label) return '';
    if (label.includes('/')) {
        return label.split('/').map(part => pluralize(part.trim())).join(' / ');
    }
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.endsWith('series')) {
        return label;
    }
    if (lowerLabel.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lowerLabel.charAt(lowerLabel.length - 2))) {
        return label.slice(0, -1) + 'ies';
    }
    if (lowerLabel.endsWith('s') || lowerLabel.endsWith('sh') || lowerLabel.endsWith('ch') || lowerLabel.endsWith('x') || lowerLabel.endsWith('z')) {
        return label + 'es';
    }
    return label + 's';
};

const parseAdvancedMarkdown = (markdown: string): { episodes: Partial<Episode>[], plannerName: string | null } => {
    let plannerName: string | null = null;
    const episodes: (Partial<Episode> & { segments: Segment[] })[] = [];
    let currentEpisode: (Partial<Episode> & { segments: Segment[] }) | null = null;
    let currentSegment: Segment | null = null;
    
    const lines = markdown.split('\n');

    const commitSegment = () => {
        if (currentSegment) {
            currentSegment.host1Notes = currentSegment.host1Notes.trim();
        }
    };

    const commitEpisode = () => {
        commitSegment();
        if (currentEpisode) {
            episodes.push(currentEpisode);
        }
        currentEpisode = null;
        currentSegment = null;
    };

    for (const line of lines) {
        const plannerMatch = line.match(/^##\s+(.*?)(?:\s+\[Planner Name\])?$/i);
        const episodeMatch = line.match(/^(?:##|###|📶|📀|🎙️|💡|🎭|📊|🪙|📡|✅)\s+(?:Season \d+ · )?Episode \d+:?\s*(.*)/i);
        const segmentMatch = line.match(/^(?:###|####|⚙️|🔌|🛠️|🔋|🚫|🧪|✅|💡|⚙️|🎙️|🔉|🔈|📟|🔧|📲|🎨|🔀|🔄|🎭|👤|📊|🪙|🔑|⏳|🤖|♻️)\s+(?:Segment \d+\.\d+)\s*–?\s*(.*)/i);

        if (plannerMatch && !episodeMatch) {
            const potentialPlannerName = plannerMatch[1].trim();
            if (!/episode|season/i.test(potentialPlannerName)) {
                 plannerName = potentialPlannerName;
                 continue;
            }
        }
        
        if (episodeMatch) {
            commitEpisode();
            currentEpisode = {
                title: episodeMatch[1].trim(),
                segments: [],
                episodeNotes: '',
                isMock: false,
            };
            continue;
        }

        if (segmentMatch) {
            commitSegment();
            if (!currentEpisode) {
                currentEpisode = { title: 'Imported Episode', segments: [], episodeNotes: '', isMock: false };
            }
            currentSegment = {
                id: uuidv4(),
                title: segmentMatch[1].trim(),
                subtitle: '',
                host1Notes: '',
                host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
                host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
            };
            currentEpisode.segments.push(currentSegment);
            continue;
        }

        if (currentSegment) {
            currentSegment.host1Notes += line + '\n';
        } else if (currentEpisode) {
            currentEpisode.episodeNotes += line + '\n';
        }
    }
    commitEpisode();
    
    episodes.forEach(ep => {
        ep.episodeNotes = ep.episodeNotes?.trim();
    });

    return { episodes, plannerName };
};

const parseJsonToEpisodes = (json: any): { episodes: Partial<Episode>[], plannerName: string | null } => {
  if (json.plan && Array.isArray(json.plan) && json.plan.length > 0 && (json.plan[0].episodeTitle || json.plan[0].title)) {
    const episodes: Partial<Episode>[] = json.plan.map((planItem: any) => ({
      title: planItem.episodeTitle || planItem.title || 'Untitled AI Item',
      episodeNotes: planItem.episodeNotes || '',
      seasonName: planItem.seasonName,
      seasonNumber: planItem.seasonNumber ?? 1,
      episodeNumber: planItem.episodeNumber ?? null,
      productionChecklist: (planItem.productionChecklist || []).map((taskText: string) => ({ id: uuidv4(), text: taskText, completed: false })),
      segments: (planItem.segments || []).map((seg: any) => ({
        id: uuidv4(),
        title: seg.title || 'Untitled Segment',
        subtitle: seg.productionNotes || '',
        host1Notes: seg.content || '',
        host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
        host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
      })),
      isMock: false,
    }));
    return { episodes, plannerName: null };
  }

  if (Array.isArray(json) && json.length > 0 && (json[0].episodeTitle || json[0].title) && Array.isArray(json[0].segments)) {
    const episodes: Partial<Episode>[] = json.map((plan: any) => ({
      title: plan.episodeTitle || plan.title || 'Untitled AI Item',
      episodeNotes: plan.episodeNotes || '',
      seasonNumber: plan.seasonNumber ?? 1,
      episodeNumber: plan.episodeNumber ?? null,
      segments: (plan.segments || []).map((seg: any) => ({
        id: uuidv4(),
        title: seg.title || 'Untitled Segment',
        subtitle: seg.productionNotes || '',
        host1Notes: seg.content || '',
        host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
        host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
      })),
      isMock: false,
    }));
    return { episodes, plannerName: null };
  }

  if (json.id && json.title && Array.isArray(json.segments)) {
    const episode: Partial<Episode> = { ...json, id: undefined, isMock: false };
    return { episodes: [episode], plannerName: null };
  }
  
  if (json.plotformSeasonExportVersion === SEASON_EXPORT_VERSION && Array.isArray(json.episodes)) {
      return { episodes: json.episodes.map((ep: any) => ({...ep, id: undefined, isMock: false })), plannerName: null };
  }

  return { episodes: [], plannerName: null };
};


export const parseFileToEpisodeList = (fileContent: string): { episodes: Partial<Episode>[], plannerName: string | null } => {
  try {
    const jsonData = JSON.parse(fileContent);
    const result = parseJsonToEpisodes(jsonData);
    if (result.episodes.length > 0) {
      return result;
    }
  } catch (e: any) {
    // Not valid JSON or doesn't match an expected JSON structure, fall through to markdown parsing
  }

  return parseAdvancedMarkdown(fileContent);
};

export const exportCurrentUserData = async (userId: string): Promise<void> => {
  if (!userId || !clientDb) {
    console.error("Export failed: User ID or Firestore clientDb is required.");
    throw new Error("User ID or Firestore clientDb is required for export.");
  }
  try {
    const episodes = await getAllEpisodesForUserFromDb(userId);
    const episodeLayouts = await getEpisodeLayouts(userId);
    const userPreferences = await getUserPreferences(userId);

    const userSettingsDocRef = doc(clientDb, 'usersettings', userId);
    const userSettingsSnap = await getDoc(userSettingsDocRef);
    const userSettings = userSettingsSnap.exists() ? userSettingsSnap.data() as UserThemeSettings : null;

    const userCustomThemes = await getUserCustomThemes(userId);

    const appData: AllAppData = {
      episodes,
      episodeLayouts,
      userPreferences,
      userSettings,
      userCustomThemes,
      segmentTemplates: [],
      activeDefaultLayoutId: userPreferences?.activeDefaultLayoutId || null,
      exportVersion: USER_DATA_EXPORT_VERSION,
      exportedAt: Date.now(),
    };

    const jsonString = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    
    const safeModeName = userSettings?.selectedAppModeName?.toLowerCase().replace(/\s+/g, '_') || 'general';
    const fileName = `plotform_my_data_${safeModeName}_${new Date().toISOString().split('T')[0]}.json`;
    
    saveAs(blob, fileName);

    console.log("User-specific application data exported successfully.");
  } catch (error: any) {
    console.error("Error exporting user-specific application data:", error);
    throw new Error("Failed to prepare data for export. See console for details.");
  }
};

export const importCurrentUserData = async (
  jsonString: string,
  userId: string
): Promise<void> => {
  if (!userId || !clientDb) {
    console.error("Import failed: User ID or Firestore clientDb is required.");
    throw new Error("User ID or Firestore clientDb is required for import.");
  }
  try {
    let appData: Partial<AllAppData> | any = JSON.parse(jsonString);

    if (appData.plotformAiImportVersion === "1.0") {
      throw new Error("AI-generated plans should be added, not used for full replacement. Use the 'Import Plan' button.");
    }

    if (!appData || typeof appData !== 'object' || !Array.isArray(appData.episodes)) {
      throw new Error("Invalid import file format. Essential 'episodes' array is missing or malformed.");
    }

    const normalizedAppData: Partial<AllAppData> = {
      episodes: Array.isArray(appData.episodes) ? appData.episodes : [],
      episodeLayouts: Array.isArray(appData.episodeLayouts) ? appData.episodeLayouts : [],
      userCustomThemes: Array.isArray(appData.userCustomThemes) ? appData.userCustomThemes : [],
      userPreferences: appData.userPreferences && typeof appData.userPreferences === 'object' ? appData.userPreferences : null,
      userSettings: appData.userSettings && typeof appData.userSettings === 'object' ? appData.userSettings : null,
      activeDefaultLayoutId: appData.activeDefaultLayoutId || null,
      segmentTemplates: [],
      exportVersion: appData.exportVersion,
      exportedAt: appData.exportedAt,
    };

    if (appData.exportVersion !== USER_DATA_EXPORT_VERSION && appData.exportVersion && appData.exportVersion !== "1.0.0") {
        console.warn(`Importing data from a different version (File: ${appData.exportVersion}, App expects: ${USER_DATA_EXPORT_VERSION}). Compatibility issues may occur.`);
    }

    await deleteAllEpisodesForUserDb(userId);
    await deleteAllLayoutsForUserDb(userId);
    await deleteAllUserCustomThemesForUser(userId);

    let settingsToImport: UserThemeSettings;
    if (normalizedAppData.userSettings) {
        settingsToImport = normalizedAppData.userSettings;
    } else {
        settingsToImport = {
            themeColor: DEFAULT_THEME_NAME, fontFamily: 'sans', textShadow: 'subtle-outline',
            selectedAppModeName: getDefaultAppMode().modeName, hasSeenNewEpisodeDefaultsInfo: true,
            hasProvisionedInitialContent: true, userClearedMockEpisodesOnce: true,
            tutorialViewedAt: Date.now(), showProTips: true,
            guidedTourDashboardCompleted: false,
            guidedTourSettingsCompleted: false,
        };
    }
    settingsToImport.tutorialViewedAt = Date.now();
    settingsToImport.guidedTourDashboardCompleted = false;
    settingsToImport.fontFamily = 'sans';
    settingsToImport.textShadow = 'subtle-outline';

    const userSettingsDocRef = doc(clientDb, 'usersettings', userId);
    await setDoc(userSettingsDocRef, settingsToImport);

    const modeForPrefs = ALL_APP_MODES.find(m => m.modeName === settingsToImport.selectedAppModeName) || getDefaultAppMode();
    const prefsToApply = normalizedAppData.userPreferences || {
        activeDefaultLayoutId: `SYSTEM_DEFAULT_FOR_${modeForPrefs.modeName.replace(/\s+/g, '_').toUpperCase()}`,
        host1DisplayName: "My Username",
        showPlannerName: `${modeForPrefs.modeName} Planner`,
    };
    await setUserPreferences(userId, prefsToApply);

    const episodesToImport = normalizedAppData.episodes!.map(ep => ({
        ...ep,
        createdBy: userId,
        collaborators: [userId]
    }));
    await replaceAllEpisodesInDb(episodesToImport, userId);

    const layoutsToImport = normalizedAppData.episodeLayouts!.map(layout => ({
        ...layout,
        userId: userId
    }));
    await replaceAllEpisodeLayouts(layoutsToImport, userId);

    await importUserCustomThemesBatch(userId, normalizedAppData.userCustomThemes!);

    console.log("User-specific application data imported successfully.");
    
    window.location.assign('/dashboard?imported=true');

  } catch (error: any) {
    console.error("Error importing user-specific application data:", error);
    throw error;
  }
};

export const switchWorkspaceAndProvisionPlan = async (
  userId: string,
  newModeName: string,
  plan: AIGeneratedEpisode[]
): Promise<void> => {
  if (!clientDb || !userId) {
    throw new Error("Firestore client or User ID not available.");
  }

  const newMode = ALL_APP_MODES.find(m => m.modeName === newModeName) || getDefaultAppMode();

  await deleteAllEpisodesForUserDb(userId);
  await deleteAllLayoutsForUserDb(userId);

  await resetUserPreferencesDb(userId, newMode);
  
  const userSettingsDocRef = doc(clientDb, 'usersettings', userId);
  const userSettingsSnap = await getDoc(userSettingsDocRef);
  const currentUserSettings = userSettingsSnap.exists() ? userSettingsSnap.data() as UserThemeSettings : {};
  
  await setDoc(userSettingsDocRef, {
    ...currentUserSettings,
    selectedAppModeName: newMode.modeName,
    hasProvisionedInitialContent: true,
  }, { merge: true });

  let nextEpisodeNumber = 1;
  const existingEpisodes = await getAllEpisodesForUserFromDb(userId); 
  if (existingEpisodes.length > 0) {
      const maxEpisodeNum = Math.max(...existingEpisodes.filter(e => e.seasonNumber === 1).map(e => e.episodeNumber ?? 0), 0);
      nextEpisodeNumber = maxEpisodeNum + 1;
  }

  for (let i = 0; i < plan.length; i++) {
      const planItem = plan[i];
      const newEpisodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators' | 'ownerHostDisplayName' | 'importedHostDisplayName'> = {
          title: planItem.episodeTitle || `Untitled Item ${i + 1}`,
          seasonName: planItem.seasonName,
          seasonNumber: planItem.seasonNumber,
          episodeNumber: planItem.episodeNumber ?? (nextEpisodeNumber + i),
          episodeNotes: planItem.episodeNotes || '',
          productionChecklist: (planItem.productionChecklist || []).map(taskText => ({ id: uuidv4(), text: taskText, completed: false, linkedSegmentId: null })),
          segments: (planItem.segments || []).map(seg => ({
              id: uuidv4(),
              title: seg.title || 'Untitled Segment',
              subtitle: seg.productionNotes || '',
              host1Notes: seg.content || '',
              host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '',
              host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '',
          })),
          isAiGenerated: true,
          promptUsed: planItem.prompt,
      };
      await addEpisodeDb(newEpisodeData, userId, newMode);
  }

  window.location.assign('/dashboard?refresh=true&modeSwitched=true');
};

export const formatEpisodeIdentifier = (episode: Episode | null, currentMode: AppMode | null): { short: string; long: string } => {
  const mode = currentMode || getDefaultAppMode();
  if (!episode) return { short: 'N/A', long: 'Not Available' };

  const getAbbreviation = (label: string = ''): string => {
    if (!label) return '';
    const words = label.replace(/[^a-zA-Z\s]/g, '').split(' ').filter(w => w);
    if (words.length > 1) {
        return words.map(w => w[0]).join('').toUpperCase();
    }
    return label.substring(0, 2).toUpperCase();
  };
  
  const episodeNumStr = episode.episodeNumber !== null && episode.episodeNumber !== undefined
    ? String(episode.episodeNumber).padStart(2, '0')
    : 'NA';

  const episodeAbbr = getAbbreviation(mode.episodeLabel);

  let seasonIdentifier: string;
  let longSeasonIdentifier: string;

  if (episode.seasonName && episode.seasonName.trim() !== '') {
    seasonIdentifier = getAbbreviation(episode.seasonName);
    longSeasonIdentifier = episode.seasonName;
  } else if (episode.seasonNumber !== null && episode.seasonNumber !== undefined) {
    seasonIdentifier = `${getAbbreviation(mode.seasonLabel)}${episode.seasonNumber}`;
    longSeasonIdentifier = `${mode.seasonLabel} ${episode.seasonNumber}`;
  } else {
    seasonIdentifier = 'Item';
    longSeasonIdentifier = 'Standalone Item';
  }

  const shortIdentifier = `${seasonIdentifier}-${episodeAbbr}${episodeNumStr}`;
  const longIdentifier = `${longSeasonIdentifier} - ${mode.episodeLabel} ${episode.episodeNumber ?? 'N/A'}`;
  
  return { short: shortIdentifier, long: longIdentifier };
};

export const areAllHost1SegmentsFilledForCard = (segments: Segment[]): boolean => {
  if (!segments || segments.length === 0) {
    return false;
  }
  for (const segment of segments) {
    const isQuoteSegment = segment && typeof segment.title === 'string' 
      ? segment.title.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro' 
      : false;

    if (isQuoteSegment) {
      if (!(segment.host1Quote && segment.host1Quote.trim()) || !(segment.host1Author && segment.host1Author.trim())) {
        return false;
      }
    } else {
      if (!(segment.host1Notes && segment.host1Notes.trim() && segment.host1Notes !== '{"type":"doc","content":[{"type":"paragraph"}]}' && segment.host1Notes !== '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}')) {
        return false;
      }
    }
  }
  return true;
};

export const calculateOverallEpisodeProgress = (episode: Episode, currentMode: AppMode): number => {
  const segments = episode.segments || [];
  const checklist = episode.productionChecklist || [];

  const baseSegmentWeight = 0.5;
  const baseChecklistWeight = 0.3;
  const baseDateWeight = 0.2;

  const hasSegments = segments.length > 0;
  const hasChecklist = checklist.length > 0;

  let totalWeight = 0;
  let finalSegmentWeight = 0;
  let finalChecklistWeight = 0;
  const finalDateWeight = baseDateWeight; // Dates are always a potential factor

  if (hasSegments) finalSegmentWeight = baseSegmentWeight;
  if (hasChecklist) finalChecklistWeight = baseChecklistWeight;
  
  totalWeight = finalSegmentWeight + finalChecklistWeight + finalDateWeight;
  
  // Rebalance weights if a section is not used
  const scaleFactor = 1 / totalWeight;
  finalSegmentWeight *= scaleFactor;
  finalChecklistWeight *= scaleFactor;
  const finalScaledDateWeight = finalDateWeight * scaleFactor;

  const completedSegments = segments.filter(segment => {
    const isQuoteSegment = segment.title?.toLowerCase().includes('quote') || segment.id === 'inspirational-quote-outro';
    if (isQuoteSegment) {
      return !!(segment.host1Quote?.trim()) && !!(segment.host1Author?.trim());
    } else {
      return !!(segment.host1Notes && segment.host1Notes.trim() && segment.host1Notes !== '{"type":"doc","content":[{"type":"paragraph"}]}' && segment.host1Notes !== '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}');
    }
  }).length;
  const segmentProgress = hasSegments ? (completedSegments / segments.length) : 0;

  const completedChecklistItems = checklist.filter(item => item.completed).length;
  const checklistProgress = hasChecklist ? (completedChecklistItems / checklist.length) : 0;
  
  const totalDates = 3;
  let completedDates = 0;
  if (episode.dateScheduledForRecording) completedDates++;
  if (episode.dateRecorded) completedDates++;
  if (episode.dateUploaded) completedDates++;
  const dateProgress = (completedDates / totalDates);

  const weightedSegmentProgress = segmentProgress * finalSegmentWeight;
  const weightedChecklistProgress = checklistProgress * finalChecklistWeight;
  const weightedDateProgress = dateProgress * finalScaledDateWeight;

  const totalProgress = (weightedSegmentProgress + weightedChecklistProgress + weightedDateProgress) * 100;

  return Math.floor(Math.min(totalProgress, 100));
};


export const calculateGenericEpisodeStatus = (episode: Episode, currentModeParam?: AppMode | null): EpisodeStatus => {
  const currentMode = currentModeParam || getDefaultAppMode();
  if (!episode) return 'planning';
  if (episode.isArchived) return 'archived';

  if (episode.useManualStatus) {
      return episode.status || 'planning';
  }

  // New primary trigger for "Published": Progress must be 100%.
  if (calculateOverallEpisodeProgress(episode, currentMode) >= 100) {
    return 'published';
  }

  const workflow = currentMode.statusWorkflow;
  
  const hasRecordDate = workflow.editing.dateTriggerField && episode[workflow.editing.dateTriggerField];
  if (hasRecordDate) return 'editing';

  const allFilled = areAllHost1SegmentsFilledForCard(episode.segments || []);
  const hasScheduleDate = workflow.scheduled.dateTriggerField && episode[workflow.scheduled.dateTriggerField];
  if (hasScheduleDate && allFilled) return 'scheduled';

  return 'planning';
};


export const generateSeasonJson = (episodes: Episode[], seasonNumber: number | null | undefined, seasonName: string | null | undefined, currentMode: AppMode) => {
    const seasonData = {
        plotformSeasonExportVersion: SEASON_EXPORT_VERSION,
        exportedAt: Date.now(),
        seasonNumber: seasonNumber ?? null,
        seasonName: seasonName ?? null,
        modeName: currentMode.modeName,
        episodes: episodes
    };
    const jsonString = JSON.stringify(seasonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const fileNameSafeSeason = (seasonName || `season_${seasonNumber ?? 'na'}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `plotform_${currentMode.modeName.toLowerCase().replace(/\s/g, '_')}_${fileNameSafeSeason}.json`);
};

export const generateSeasonMarkdown = (episodes: Episode[], seasonNumber: number | null | undefined, seasonName: string | null | undefined, currentMode: AppMode, primaryUserName: string, importedUserName: string | null) => {
    try {
        const titleSeasonName = seasonName || `${currentMode.seasonLabel} ${seasonNumber ?? ''}`.trim();
        let markdownContent = `# ${currentMode.modeName} - ${titleSeasonName}\n\n---\n\n`;

        episodes.forEach(episode => {
            markdownContent += generateEpisodeMarkdown(episode, primaryUserName, importedUserName, currentMode.segmentContentLabel) + '\n\n---\n\n';
        });
        
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const fileNameSafeSeason = (seasonName || `season_${seasonNumber ?? 'na'}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        saveAs(blob, `plotform_${currentMode.modeName.toLowerCase().replace(/\s/g, '_')}_${fileNameSafeSeason}.md`);
    } catch (error) {
        console.error("Error during Markdown generation or download:", error);
        throw new Error("Failed to generate Markdown file.");
    }
};

export const generateEpisodeZip = async (episode: Episode, zipInstance: JSZip, primaryUserName: string, importedUserName: string | null, contentLabel: string) => {
    const jsonString = JSON.stringify(episode, null, 2);
    zipInstance.file("episode_data.json", jsonString);

    const markdownString = generateEpisodeMarkdown(episode, primaryUserName, importedUserName, contentLabel);
    zipInstance.file("plan.md", markdownString);
};

export const saveSharedSeason = async (seasonData: SharedSeasonData): Promise<string> => {
  if (!clientDb) {
    throw new Error('Firestore client not available.');
  }
  const sharedSeasonsRef = collection(clientDb, 'sharedSeasons');
  const docRef = await addDoc(sharedSeasonsRef, seasonData);
  return docRef.id;
};

export const getSharedSeason = async (shareId: string): Promise<SharedSeasonData | null> => {
  if (!clientDb) {
    throw new Error('Firestore client not available.');
  }
  const docRef = doc(clientDb, 'sharedSeasons', shareId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    // We can add a TTL cleanup later using a Cloud Function if needed
    return docSnap.data() as SharedSeasonData;
  }
  return null;
};
