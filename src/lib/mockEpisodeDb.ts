
'use client';

// src/lib/mockEpisodeDb.ts

import type { Episode, Segment } from '@/types';
import { getDefaultSegments } from '@/lib/segmentUtils'; // Updated import

// Helper function to get a default set of segments for mock data
const getInitialMockSegmentsForDb = (): Segment[] => {
  // This function should return a static structure or a synchronous version
  // For consistency with how getDefaultSegments is now async and takes userId,
  // we'll define a static structure here for mock initialization.
  return [
    { id: 'cold-open', title: 'Cold Open + Hook', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'viral-video', title: 'Viral Video Reaction', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'music-review', title: 'Music Review (Indie + Industry)', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'gems-tutorial', title: 'Gems / Tutorial / Money Move', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'audience-challenge', title: 'Audience Challenge + AI Creations', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'host-showcase', title: 'Host Content Showcase', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'contest-prize', title: 'Creation Contest + Prize Segment', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
    { id: 'inspirational-quote', title: 'Inspirational Quote + Outro', host1Notes: '', host1Links: [], host1AudienceSuggestions: '', host1Quote: '', host1Author: '', host2Notes: '', host2Links: [], host2AudienceSuggestions: '', host2Quote: '', host2Author: '' },
  ];
};

let mockEpisodes: Episode[] = [
  {
    id: 'ep-mock-1',
    title: 'Mock Episode 1: The Beginning',
    episodeNumber: 1,
    createdAt: new Date('2023-10-01T10:00:00Z').getTime(),
    updatedAt: new Date('2023-10-02T12:00:00Z').getTime(),
    createdBy: 'user1-uid',
    collaborators: ['user1-uid', 'user2-uid'],
    segments: getInitialMockSegmentsForDb().map(seg => ({
      ...seg,
      host1Notes: `Host 1 notes for ${seg.title} in Ep 1`,
      host2Notes: `Host 2 notes for ${seg.title} in Ep 1`,
    })),
    productionChecklist: [
        { id: 'task1', text: 'Finalize intro music', completed: true },
        { id: 'task2', text: 'Edit guest audio', completed: false },
    ],
    isArchived: false,
    isFavorite: true,
    dateRecorded: new Date('2023-10-01T14:00:00Z').getTime(),
    dateUploaded: new Date('2023-10-03T09:00:00Z').getTime(),
    specialGuest: 'Dr. Guest Expert',
    lunchProvidedBy: 'Studio Catering',
    episodeNotes: 'This is the first mock episode to test the system.',
  },
  {
    id: 'ep-mock-2',
    title: 'Mock Episode 2: Deep Dive',
    episodeNumber: 2,
    createdAt: new Date('2023-10-05T10:00:00Z').getTime(),
    updatedAt: new Date('2023-10-06T12:00:00Z').getTime(),
    createdBy: 'user1-uid',
    collaborators: ['user1-uid', 'user2-uid'],
    segments: getInitialMockSegmentsForDb().map(seg => ({
      ...seg,
      host1Notes: `Host 1 notes for ${seg.title} in Ep 2`,
      host2Notes: `Host 2 notes for ${seg.title} in Ep 2`,
    })),
    productionChecklist: [],
    isArchived: false,
    isFavorite: false,
    dateRecorded: null,
    dateUploaded: null,
    specialGuest: null,
    lunchProvidedBy: null,
    episodeNotes: 'This is the second mock episode, with some fields left blank.',
  },
];

export const getAllEpisodesMock = async (userId: string): Promise<Episode[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  console.log('[MockDB] getAllEpisodesMock called for user:', userId);
  // In a real app, filter by userId in collaborators or createdBy
  return JSON.parse(JSON.stringify(mockEpisodes)); // Return a deep copy
};

export const getEpisodeByIdMock = async (episodeId: string, userId: string): Promise<Episode | null> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  console.log('[MockDB] getEpisodeByIdMock called for id:', episodeId, 'user:', userId);
  const episode = mockEpisodes.find(ep => ep.id === episodeId);

  if (episode && (episode.createdBy === userId || (episode.collaborators && episode.collaborators.includes(userId)))) {
    return JSON.parse(JSON.stringify(episode)); // Return a deep copy
  } else if (!episode && userId) { // If episode not found, create a default structure
    console.warn(`[MockDB] Episode ${episodeId} not found. Creating default structure for user ${userId}.`);
    const defaultSegs = await getDefaultSegments(userId); // Pass userId
    return {
      id: episodeId,
      title: 'New Episode (Not Found in Mock)',
      episodeNumber: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
      collaborators: [userId],
      segments: defaultSegs,
      productionChecklist: [],
      isArchived: false,
      isFavorite: false,
      dateRecorded: null,
      dateUploaded: null,
      specialGuest: null,
      lunchProvidedBy: null,
      episodeNotes: '',
    };
  }
  return null;
};

export const addEpisodeMock = async (newEpisodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Episode> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async

  // If segments are not provided, fetch default ones
  let segmentsToUse = newEpisodeData.segments;
  if (!segmentsToUse || segmentsToUse.length === 0) {
    segmentsToUse = await getDefaultSegments(userId);
  }

  const newEpisode: Episode = {
    id: `ep-mock-${Date.now()}`,
    ...newEpisodeData,
    segments: segmentsToUse, // Use potentially fetched segments
    productionChecklist: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: userId, // Assuming the current user is the creator
    isFavorite: false, // Default new episodes to not favorite
  };
  mockEpisodes.unshift(newEpisode); // Add to the beginning
  console.log('[MockDB] addEpisodeMock, new episode added:', newEpisode.id);
  return JSON.parse(JSON.stringify(newEpisode));
};

export const updateEpisodeMock = async (updatedEpisode: Episode, userId: string): Promise<Episode> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  const index = mockEpisodes.findIndex(ep => ep.id === updatedEpisode.id);
  if (index !== -1) {
    // In a real app, check if userId has permission to update
    mockEpisodes[index] = { ...updatedEpisode, updatedAt: Date.now() };
    console.log('[MockDB] updateEpisodeMock, episode updated:', updatedEpisode.id);
    return JSON.parse(JSON.stringify(mockEpisodes[index]));
  }
  throw new Error("Episode not found for update in mock DB");
};

export const deleteEpisodeMockDb = async (episodeId: string, userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  const initialLength = mockEpisodes.length;
  mockEpisodes = mockEpisodes.filter(ep => ep.id !== episodeId);
  if (mockEpisodes.length < initialLength) {
    console.log('[MockDB] deleteEpisodeMockDb, episode deleted:', episodeId);
  } else {
    console.warn('[MockDB] deleteEpisodeMockDb, episode not found for deletion:', episodeId);
  }
  // In a real app, check if userId has permission
};

export const archiveEpisodeMockDb = async (episodeId: string, newArchivedStatus: boolean, userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  const index = mockEpisodes.findIndex(ep => ep.id === episodeId);
  if (index !== -1) {
    mockEpisodes[index].isArchived = newArchivedStatus;
    mockEpisodes[index].updatedAt = Date.now();
    console.log('[MockDB] archiveEpisodeMockDb, episode archive status updated:', episodeId, newArchivedStatus);
  } else {
    console.warn('[MockDB] archiveEpisodeMockDb, episode not found for archiving:', episodeId);
  }
   // In a real app, check if userId has permission
};
