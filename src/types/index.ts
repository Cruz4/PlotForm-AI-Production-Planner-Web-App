
import type { ReactNode } from 'react';
import { z } from 'zod';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface Segment {
  id: string;
  title: string;
  subtitle?: string;

  // User's primary content fields
  host1Notes: string; 
  host1Links: string[];
  host1AudienceSuggestions: string;
  host1Quote?: string;
  host1Author?: string;

  // Imported collaborator's content fields
  host2Notes: string; 
  host2Links: string[];
  host2AudienceSuggestions: string;
  host2Quote?: string;
  host2Author?: string;
}

// NEW: Comment type for segment-level comments
export interface SegmentComment {
  id: string;
  segmentId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  text: string;
  createdAt: number;
  replies?: SegmentComment[];
}

export interface Episode {
  id:string;
  title: string;
  episodeNumber: number | null;
  seasonNumber?: number | null;
  seasonName?: string | null; 
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  collaborators: string[];
  segments: Segment[];
  productionChecklist: { id: string; text: string; completed: boolean; linkedSegmentId?: string | null; }[];
  isArchived?: boolean;
  dateScheduledForRecording?: number | null;
  dateRecorded?: number | null;
  dateUploaded?: number | null;
  specialGuest?: string | null;
  lunchProvidedBy?: string | null;
  episodeNotes?: string;
  isFavorite?: boolean;
  status?: EpisodeStatus;
  ownerHostDisplayName?: string | null;
  importedHostDisplayName?: string | null;
  isMock?: boolean;
  isAiGenerated?: boolean;
  promptUsed?: string | null;
  linkedFollowUpId?: string | null;
  linkedPrequelId?: string | null;
  coverImageUrl?: string | null;
  customStatusLabels?: {
    planning?: string;
    scheduled?: string;
    editing?: string;
    published?: string;
  },
  linkedAppMode?: string;
  useManualStatus?: boolean;
  teamId?: string | null;
  isPublic?: boolean;
  comments?: SegmentComment[];
}

export type EpisodeStatus = 'planning' | 'scheduled' | 'editing' | 'published' | 'archived';

export interface SegmentTemplate {
  id: string;
  title: string;
  subtitle?: string;
  isDeletable?: boolean;
}

export interface ModeSpecificSegmentTemplate extends SegmentTemplate {}

export interface EpisodeLayout {
  id: string;
  name: string;
  segments: Array<Segment>;
  userId: string;
  createdAt?: number;
}

export interface UserPreferences {
  activeDefaultLayoutId?: string | null;
  host1DisplayName?: string;
  showPlannerName?: string;
}

export interface EditorSegmentData {
  id: string;
  title: string;
  subtitle: string;
  host1Content: string;
  host2Content: string;
}

export interface EditorExportData {
  exportFormatVersion: string;
  exportedAt: number;
  episodeTitle: string;
  episodeNumber: number | null;
  segments: EditorSegmentData[];
}

export interface StatusWorkflowDefinition {
  planning: { label: string };
  scheduled: { label: string; dateTriggerField: keyof Episode, contentTriggerField: 'host1SegmentsFilled' };
  editing: { label: string; dateTriggerField: keyof Episode };
  published: { label: string; dateTriggerField: keyof Episode };
}

export interface AppMode {
  modeName: string;
  seasonLabel: string;
  episodeLabel: string;
  segmentLabel: string;
  segmentContentLabel: string; 
  newEpisodeButtonLabel: string;
  statusWorkflow: StatusWorkflowDefinition;
  guestLabel: string;
  guestPlaceholder: string;
  detailLabel: string;
  detailPlaceholder: string;
  defaultChecklist: string[];
  noSeasonCheckboxLabel?: string;
  episodeNumberLabel?: string;
  seasonNumberLabel?: string;
}

export interface UserThemeSettings {
  themeColor: string;
  fontFamily: string;
  textShadow: string;
  hasSeenNewEpisodeDefaultsInfo?: boolean;
  hasProvisionedInitialContent: boolean; 
  tutorialViewedAt: number | null; 
  showProTips?: boolean;
  highlightAiContent?: boolean;
  guidedTourDashboardCompleted?: boolean;
  guidedTourSettingsCompleted?: boolean;
  selectedAppModeName?: string;
  userClearedMockEpisodesOnce?: boolean;
}

export interface UserCustomTheme {
  id: string;
  userId: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  createdAt: number;
}

export interface ThemeColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface AppTheme {
  name: string;
  className: string;
  light: ThemeColorPalette;
  dark: ThemeColorPalette;
  originalHex?: string[];
}

export interface EpisodeVersion {
  id: string;
  episodeId: string;
  userId: string;
  versionTimestamp: number;
  savedByUserId?: string;
  title: string;
  episodeNotes?: string;
  segments: Segment[];
}

export interface AllAppData {
  episodes: Episode[];
  episodeLayouts: EpisodeLayout[];
  userPreferences: UserPreferences | null;
  userSettings: UserThemeSettings | null;
  userCustomThemes: UserCustomTheme[];
  segmentTemplates: SegmentTemplate[];
  activeDefaultLayoutId: string | null;
  exportVersion?: string;
  exportedAt?: number;
}

export interface UserWorkspace {
  id: string;
  userId: string;
  workspaceName: string;
  savedAt: number;
  exportVersion: string;
  episodes: Episode[];
  episodeLayouts: EpisodeLayout[];
  userPreferences: UserPreferences | null;
  userSettings: UserThemeSettings | null;
  userCustomThemes: UserCustomTheme[];
}

export interface CustomTask {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'episode-scheduled' | 'episode-recorded' | 'episode-uploaded' | 'custom-task';
  isCompleted?: boolean;
  episodeId?: string; // only for episode events
  color: string;
}

export interface TourStepDefinition {
  selector?: string;
  title: string;
  content?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  verticalOffset?: number;
  isModal?: boolean;
  action?: () => Promise<void>;
}

export interface GuidedTourProps {
  steps: TourStepDefinition[];
  isOpen: boolean;
  onClose: () => void;
  tourKey: string;
}

export interface TutorialAction {
  command: 'click' | 'type' | 'wait' | 'focus' | 'scroll';
  selector?: string;
  value?: string;
  duration?: number;
}

export interface TutorialStep {
  title: string;
  narration: string;
  actions: TutorialAction[];
}

export interface TutorialGeneratorOutput {
  title: string;
  steps: TutorialStep[];
  fullNarrationScript: string;
  narrationAudioDataUri: string;
}

export interface AIPolishedSegment {
  id: string;
  polishedTitle: string;
  polishedNotes: string;
}

// Types for AI-generated plans
export interface AIGeneratedSegment {
  title: string;
  content: string;
  productionNotes?: string;
}

export interface AIGeneratedEpisode {
  episodeTitle?: string;
  seasonName?: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeNotes?: string;
  segments: AIGeneratedSegment[];
  productionChecklist?: string[];
  prompt?: string;
}

export interface AIGenerationPlan {
  isMultiPart: boolean;
  totalParts?: number;
  partDescriptions?: string[];
  plan?: AIGeneratedEpisode[];
  suggestedMode?: string;
  seasonName?: string | null;
  seasonNumber?: number | null;
}

export interface CommandItem {
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface SharedSeasonData {
    sharedAt: number;
    ownerId: string;
    ownerDisplayName: string;
    seasonNumber: number | null;
    seasonName: string | null;
    modeName: string;
    episodes: Episode[];
}

// Zod Schemas for API validation
export const PlanRequestSchema = z.object({
  idea: z.string().describe("The user's core idea or prompt for the project."),
  currentMode: z.string().describe("The user's currently selected Application Mode (e.g., 'Podcast', 'Book / Novel')."),
});

const GeneratedSegmentSchema = z.object({
  title: z.string().describe("The title for this segment/chapter/part."),
  content: z.string().describe("The detailed notes, script, or content for this segment."),
  productionNotes: z.string().optional().describe("Optional production notes or suggestions."),
});

const GeneratedEpisodeSchema = z.object({
    episodeTitle: z.string().optional().describe("A creative and fitting title for this specific episode."),
    seasonName: z.string().nullable().describe("A custom name for the season (e.g., 'The Dragon's Gambit'). Use null if the project is a standalone item."),
    seasonNumber: z.number().nullable().describe("The season number for this episode. Use '1' if not specified otherwise. Use null for a single-item project like a movie or one-off special."),
    episodeNumber: z.number().nullable().describe("The episode number within the season. Can be null if not applicable."),
    episodeNotes: z.string().optional().describe("Overall notes or a summary for this specific episode."),
    productionChecklist: z.array(z.string()).optional().describe("A list of 3-5 relevant production checklist tasks for this specific episode, based on its content."),
    segments: z.array(GeneratedSegmentSchema).describe("An array of segments that make up this episode's plan."),
});

export const GeneratedPlanResponseSchema = z.object({
  suggestedMode: z.string().describe("The single best Application Mode for this project."),
  plan: z.array(GeneratedEpisodeSchema).describe("The array of generated episodes."),
});
export type GeneratedPlanResponse = z.infer<typeof GeneratedPlanResponseSchema>;

export const AIPolishResponseSchema = z.object({
  segments: z.array(z.object({
    id: z.string(),
    polishedTitle: z.string(),
    polishedNotes: z.string(),
  }))
});

// NEW TYPES FOR SOCIAL & TEAM FEATURES

export type TeamMemberRole = 'owner' | 'editor' | 'viewer';

export interface TeamMember {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: TeamMemberRole;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: number;
}


export interface Share {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoUrl?: string;
  toUserId: string;
  episodeId: string;
  episodeTitle: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface PlannerPal {
  id: string;
  userIds: [string, string];
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoUrl?: string;
  toUserId: string;
  toUserName: string;
  toUserPhotoUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedBy: string;
  createdAt: number;
}

export interface PublicActivity {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string | null;
  activityType: 'published_episode';
  itemId: string;
  itemName: string;
  createdAt: number;
}
