
import type { AppMode, StatusWorkflowDefinition, Episode } from '@/types';

const defaultStatusWorkflow: StatusWorkflowDefinition = {
  planning: { label: "Planning" },
  scheduled: { label: "Scheduled", dateTriggerField: 'dateScheduledForRecording', contentTriggerField: 'host1SegmentsFilled' },
  editing: { label: "Editing", dateTriggerField: 'dateRecorded' },
  published: { label: "Published", dateTriggerField: 'dateUploaded' },
};

const getWorkflow = (overrides: Partial<{ [K in keyof StatusWorkflowDefinition]: Partial<StatusWorkflowDefinition[K]> }>): StatusWorkflowDefinition => ({
  planning: { ...defaultStatusWorkflow.planning, ...overrides.planning },
  scheduled: { ...defaultStatusWorkflow.scheduled, ...overrides.scheduled },
  editing: { ...defaultStatusWorkflow.editing, ...overrides.editing },
  published: { ...defaultStatusWorkflow.published, ...overrides.published },
});

export const ALL_APP_MODES: AppMode[] = [
  {
    modeName: "Podcast",
    seasonLabel: "Season", episodeLabel: "Episode", segmentLabel: "Segment", segmentContentLabel: "Script",
    newEpisodeButtonLabel: "New Episode",
    statusWorkflow: getWorkflow({
        editing: { label: "Recorded / Editing" }
    }),
    guestLabel: "Special Guest", guestPlaceholder: "E.g., Dr. Jane Doe",
    detailLabel: "Sponsor / Support", detailPlaceholder: "E.g., AwesomeBrand Inc.",
    defaultChecklist: ['Finalize audio edit', 'Write show notes', 'Schedule social media posts', 'Upload to hosting platform'],
  },
  {
    modeName: "Movie / Film Project",
    seasonLabel: "Film Project", episodeLabel: "Scene", segmentLabel: "Shot", segmentContentLabel: "Script / Action",
    newEpisodeButtonLabel: "New Scene",
    statusWorkflow: getWorkflow({
        planning: { label: "Scripting" },
        scheduled: { label: "Scheduled for Shoot", dateTriggerField: 'dateScheduledForRecording' },
        editing: { label: "Post-Production", dateTriggerField: 'dateRecorded' },
        published: { label: "Released", dateTriggerField: 'dateUploaded' }
    }),
    guestLabel: "Key Cast/Crew", guestPlaceholder: "E.g., Lead Actor, Cinematographer",
    detailLabel: "Location / Set", detailPlaceholder: "E.g., Studio A, On-location at Park",
    defaultChecklist: ['Final color grade', 'Complete sound mix', 'Render final master', 'Create trailer', 'Submit to festivals'],
  },
  {
    modeName: "Book / Novel",
    seasonLabel: "Series / Volume", episodeLabel: "Chapter", segmentLabel: "Section", segmentContentLabel: "Prose",
    newEpisodeButtonLabel: "New Chapter",
    statusWorkflow: getWorkflow({
        planning: { label: "Outlining" },
        scheduled: { label: "Drafting", dateTriggerField: 'dateScheduledForRecording' },
        editing: { label: "Revising", dateTriggerField: 'dateRecorded' },
        published: { label: "Published", dateTriggerField: 'dateUploaded' }
    }),
    guestLabel: "Character Spotlight", guestPlaceholder: "E.g., Protagonist, Antagonist",
    detailLabel: "Editor / Publisher", detailPlaceholder: "E.g., Penguin Random House",
    defaultChecklist: ['Final proofread', 'Format for eBook', 'Finalize cover art', 'Submit to agent/publisher'],
  },
  {
    modeName: "Stage Play",
    seasonLabel: "Production", episodeLabel: "Act", segmentLabel: "Scene", segmentContentLabel: "Script / Stage Directions",
    newEpisodeButtonLabel: "New Act",
    statusWorkflow: getWorkflow({ planning: { label: "Writing" }, scheduled: { label: "Rehearsal", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Tech Week", dateTriggerField: 'dateRecorded' }, published: { label: "Opening Night", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Lead Actor", guestPlaceholder: "E.g., John Doe as Hamlet",
    detailLabel: "Theatre / Venue", detailPlaceholder: "E.g., The Globe Theatre",
    defaultChecklist: ['Finalize set design', 'Complete lighting plan', 'Print playbills', 'Final dress rehearsal'],
  },
  {
    modeName: "Vlog Series",
    seasonLabel: "Series", episodeLabel: "Vlog", segmentLabel: "Segment", segmentContentLabel: "Content Outline",
    newEpisodeButtonLabel: "New Vlog",
    statusWorkflow: getWorkflow({ planning: { label: "Planning" }, scheduled: { label: "Filming", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Editing", dateTriggerField: 'dateRecorded' }, published: { label: "Published", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Collaboration With", guestPlaceholder: "E.g., Fellow Vlogger",
    detailLabel: "Main Location", detailPlaceholder: "E.g., Tokyo, Japan",
    defaultChecklist: ['Gather B-roll footage', 'Create thumbnail', 'Write description & tags', 'Schedule upload to YouTube'],
  },
  {
    modeName: "Game Narrative",
    seasonLabel: "Game Project", episodeLabel: "Questline", segmentLabel: "Objective", segmentContentLabel: "Narrative Content",
    newEpisodeButtonLabel: "New Questline",
    statusWorkflow: getWorkflow({ planning: { label: "Concept" }, scheduled: { label: "In Development", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "QA / Testing", dateTriggerField: 'dateRecorded' }, published: { label: "Shipped", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Key Character Arc", guestPlaceholder: "E.g., Main Hero's Journey",
    detailLabel: "Game Engine", detailPlaceholder: "E.g., Unreal Engine 5",
    defaultChecklist: ['Integrate voice-over', 'Final script localization', 'Write patch notes', 'Launch on store'],
  },
  {
    modeName: "Course / Curriculum",
    seasonLabel: "Course", episodeLabel: "Module", segmentLabel: "Lesson", segmentContentLabel: "Lesson Content",
    newEpisodeButtonLabel: "New Module",
    statusWorkflow: getWorkflow({ planning: { label: "Planning" }, scheduled: { label: "In Production", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Review", dateTriggerField: 'dateRecorded' }, published: { label: "Launched", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Expert Interviewee", guestPlaceholder: "E.g., Industry Professional",
    detailLabel: "Learning Platform", detailPlaceholder: "E.g., Coursera, Udemy",
    defaultChecklist: ['Record video lessons', 'Create downloadable resources', 'Build final quiz', 'Publish to platform'],
  },
  {
    modeName: "YouTube Series",
    seasonLabel: "Season", episodeLabel: "Video", segmentLabel: "Segment", segmentContentLabel: "Script",
    newEpisodeButtonLabel: "New Video",
    statusWorkflow: getWorkflow({ planning: { label: "Scripting" }, scheduled: { label: "Filming Scheduled", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Editing", dateTriggerField: 'dateRecorded' }, published: { label: "Published", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Collaboration With", guestPlaceholder: "E.g., MrBeast",
    detailLabel: "Sponsor", detailPlaceholder: "E.g., Skillshare",
    defaultChecklist: ['Finalize video edit', 'Create thumbnail', 'Write description and tags', 'Schedule upload'],
  },
  {
    modeName: "Live Stream Series",
    seasonLabel: "Series", episodeLabel: "Stream", segmentLabel: "Segment", segmentContentLabel: "Talking Points / Script",
    newEpisodeButtonLabel: "New Stream",
    statusWorkflow: getWorkflow({ planning: { label: "Planning" }, scheduled: { label: "Scheduled", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Stream Ended / VOD Prep", dateTriggerField: 'dateRecorded' }, published: { label: "VOD Published", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Guest Star", guestPlaceholder: "E.g., Another Streamer",
    detailLabel: "Platform", detailPlaceholder: "E.g., Twitch, YouTube Live",
    defaultChecklist: ['Prepare on-screen assets', 'Promote on social media', 'Check A/V setup', 'Upload VOD with chapters'],
  },
  {
    modeName: "Magazine / Newsletter",
    seasonLabel: "Volume", episodeLabel: "Issue", segmentLabel: "Article", segmentContentLabel: "Article Content",
    newEpisodeButtonLabel: "New Issue",
    statusWorkflow: getWorkflow({ planning: { label: "Drafting" }, scheduled: { label: "Layout & Design", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Final Review", dateTriggerField: 'dateRecorded' }, published: { label: "Sent / Published", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Featured Story", guestPlaceholder: "E.g., Cover Story Title",
    detailLabel: "Advertiser", detailPlaceholder: "E.g., Major Brand",
    defaultChecklist: ['Final copyedit', 'Source images', 'Schedule email send', 'Post to archive'],
  },
  {
    modeName: "Music Album",
    seasonLabel: "Album", episodeLabel: "Track", segmentLabel: "Verse/Chorus", segmentContentLabel: "Lyrics / Composition Notes",
    newEpisodeButtonLabel: "New Track",
    statusWorkflow: getWorkflow({ planning: { label: "Writing" }, scheduled: { label: "Recording Session", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Mixing & Mastering", dateTriggerField: 'dateRecorded' }, published: { label: "Released", dateTriggerField: 'dateUploaded' } }),
    noSeasonCheckboxLabel: "Single/EP Release",
    guestLabel: "Featured Artist", guestPlaceholder: "E.g., Dua Lipa",
    detailLabel: "Producer / Studio", detailPlaceholder: "E.g., Abbey Road Studios",
    defaultChecklist: ['Finalize master track', 'Register with PRO', 'Create album art', 'Distribute to streaming'],
  },
  {
    modeName: "Event Planning",
    seasonLabel: "Event", episodeLabel: "Phase", segmentLabel: "Task", segmentContentLabel: "Task Details",
    newEpisodeButtonLabel: "New Phase",
    statusWorkflow: getWorkflow({
      planning: { label: "Planning" },
      scheduled: { label: "Confirmed", dateTriggerField: 'dateScheduledForRecording' },
      editing: { label: "Executing", dateTriggerField: 'dateRecorded' },
      published: { label: "Post-Event", dateTriggerField: 'dateUploaded' }
    }),
    guestLabel: "Keynote Speaker", guestPlaceholder: "E.g., Industry Expert",
    detailLabel: "Venue", detailPlaceholder: "E.g., Convention Center Hall A",
    defaultChecklist: ['Confirm vendor bookings', 'Send invitations', 'Finalize schedule', 'Post-event survey'],
  },
  {
    modeName: "App Development",
    seasonLabel: "Project", episodeLabel: "Feature", segmentLabel: "Task", segmentContentLabel: "Task Description",
    newEpisodeButtonLabel: "New Feature",
    statusWorkflow: getWorkflow({ planning: { label: "Backlog" }, scheduled: { label: "In Sprint", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Code Review", dateTriggerField: 'dateRecorded' }, published: { label: "Deployed", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Lead Developer", guestPlaceholder: "E.g., Jane Doe",
    detailLabel: "Tech Stack", detailPlaceholder: "E.g., React, Node.js",
    defaultChecklist: ['Pass all unit tests', 'Run regression tests', 'Merge to main branch', 'Deploy to production'],
  },
  {
    modeName: "Interactive Fiction",
    seasonLabel: "Story", episodeLabel: "Branch", segmentLabel: "Choice Point", segmentContentLabel: "Branch Content",
    newEpisodeButtonLabel: "New Branch",
    statusWorkflow: getWorkflow({ planning: { label: "Flowcharting" }, scheduled: { label: "Writing", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Path Testing", dateTriggerField: 'dateRecorded' }, published: { label: "Live", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Main Character", guestPlaceholder: "E.g., Alex the Adventurer",
    detailLabel: "Platform", detailPlaceholder: "E.g., Twine, Ink",
    defaultChecklist: ['Test all story branches', 'Proofread all text', 'Export for web', 'Publish online'],
  },
  {
    modeName: "Wellness Program",
    seasonLabel: "Program", episodeLabel: "Week", segmentLabel: "Daily Focus", segmentContentLabel: "Activity Details",
    newEpisodeButtonLabel: "New Week",
    statusWorkflow: getWorkflow({ planning: { label: "Design" }, scheduled: { label: "Active Week", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Participant Feedback", dateTriggerField: 'dateRecorded' }, published: { label: "Completed", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Focus Area", guestPlaceholder: "E.g., Mindfulness, Nutrition",
    detailLabel: "Target Audience", detailPlaceholder: "E.g., Beginners, Advanced",
    defaultChecklist: ['Prepare weekly materials', 'Schedule check-in emails', 'Review participant feedback', 'Plan next program'],
  },
  {
    modeName: "Personal Journal",
    seasonLabel: "Volume", episodeLabel: "Entry", segmentLabel: "Section", segmentContentLabel: "Content",
    newEpisodeButtonLabel: "New Entry",
    statusWorkflow: getWorkflow({ planning: { label: "Idea" }, scheduled: { label: "Drafting", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Reviewing", dateTriggerField: 'dateRecorded' }, published: { label: "Finalized", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Key Theme", guestPlaceholder: "E.g., Gratitude, Work-Life Balance",
    detailLabel: "Location", detailPlaceholder: "E.g., Home, Vacation",
    defaultChecklist: ['Review and tag entry', 'Add relevant photos', 'Cross-reference other entries'],
  },
  {
    modeName: "Marketing Campaign",
    seasonLabel: "Campaign", episodeLabel: "Phase", segmentLabel: "Asset", segmentContentLabel: "Asset Content",
    newEpisodeButtonLabel: "New Phase",
    statusWorkflow: getWorkflow({ planning: { label: "Strategy" }, scheduled: { label: "In-Flight", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Analytics Review", dateTriggerField: 'dateRecorded' }, published: { label: "Concluded", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Target Persona", guestPlaceholder: "E.g., Small Business Owners",
    detailLabel: "Key Channels", detailPlaceholder: "E.g., Social Media, Email, SEO",
    defaultChecklist: ['Launch all assets', 'Monitor campaign KPIs', 'Compile performance report', 'Plan post-campaign actions'],
  },
  {
    modeName: "Recipe Builder",
    seasonLabel: "Cookbook", episodeLabel: "Recipe", segmentLabel: "Step", segmentContentLabel: "Instructions",
    newEpisodeButtonLabel: "New Recipe",
    statusWorkflow: getWorkflow({ planning: { label: "Ideation" }, scheduled: { label: "Testing", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Finishing", dateTriggerField: 'dateRecorded' }, published: { label: "Finalized", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Cuisine Style", guestPlaceholder: "E.g., Italian, Vegan",
    detailLabel: "Key Ingredient", detailPlaceholder: "E.g., Sourdough Starter",
    defaultChecklist: ['Finalize recipe measurements', 'Take final photos', 'Write introduction', 'Publish to blog/book'],
  },
  {
    modeName: "Academic Paper",
    seasonLabel: "Field", episodeLabel: "Paper", segmentLabel: "Section", segmentContentLabel: "Content",
    newEpisodeButtonLabel: "New Paper",
    statusWorkflow: getWorkflow({ planning: { label: "Research" }, scheduled: { label: "Writing", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Peer Review", dateTriggerField: 'dateRecorded' }, published: { label: "Published", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Primary Author", guestPlaceholder: "E.g., Dr. A. Turing",
    detailLabel: "Target Journal", detailPlaceholder: "E.g., Nature, The Lancet",
    defaultChecklist: ['Format citations', 'Address reviewer comments', 'Final proofread', 'Submit to journal'],
  },
  {
    modeName: "Pitch Deck",
    seasonLabel: "Company", episodeLabel: "Pitch Deck", segmentLabel: "Slide", segmentContentLabel: "Slide Content",
    newEpisodeButtonLabel: "New Pitch",
    statusWorkflow: getWorkflow({ planning: { label: "Drafting" }, scheduled: { label: "Rehearsing", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Feedback Round", dateTriggerField: 'dateRecorded' }, published: { label: "Presented", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Target Investor", guestPlaceholder: "E.g., Sequoia Capital",
    detailLabel: "Funding Round", detailPlaceholder: "E.g., Seed, Series A",
    defaultChecklist: ['Finalize slide design', 'Practice pitch timing', 'Prepare for Q&A', 'Send follow-up emails'],
  },
  {
    modeName: "Challenge Tracker",
    seasonLabel: "Program", episodeLabel: "Week", segmentLabel: "Day", segmentContentLabel: "Daily Log / Task",
    newEpisodeButtonLabel: "New Week",
    statusWorkflow: getWorkflow({ planning: { label: "Setup" }, scheduled: { label: "In Progress", dateTriggerField: 'dateScheduledForRecording' }, editing: { label: "Reviewing", dateTriggerField: 'dateRecorded' }, published: { label: "Completed", dateTriggerField: 'dateUploaded' } }),
    guestLabel: "Focus Area", guestPlaceholder: "E.g., Fitness, Learning",
    detailLabel: "Accountability Partner", detailPlaceholder: "E.g., Friend's Name",
    defaultChecklist: ['Set weekly goal', 'Log daily progress', 'Complete weekly review', 'Share results'],
  }
];


export const DEFAULT_APP_MODE_NAME = "Podcast";

export const getDefaultAppMode = (): AppMode => {
  return ALL_APP_MODES.find(m => m.modeName === DEFAULT_APP_MODE_NAME) || ALL_APP_MODES[0];
};
