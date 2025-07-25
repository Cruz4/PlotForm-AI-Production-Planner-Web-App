
'use client'; 

import type { Episode, Segment, AppMode } from '@/types';
import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { getDefaultSegments } from '@/lib/segmentUtils'; 
import { getCustomHost1Name } from '@/lib/episodeLayoutsStore';
import { getDefaultAppMode } from '@/lib/modes'; 
import { v4 as uuidv4 } from 'uuid';
import { saveEpisodeVersion, deleteVersionsForEpisode } from '@/lib/episodeVersionStore'; 

export const getEpisodeById = async (id: string, currentUserId: string): Promise<Episode | null> => {
  console.log(`[episodeStore] getEpisodeById called for user: ${currentUserId}, episode: ${id}.`);
  if (!clientDb) {
    console.error("[episodeStore] Firestore clientDb not available. Cannot fetch.");
    return null;
  }
  try {
    const docRef = doc(clientDb, 'episodes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.collaborators || !data.collaborators.includes(currentUserId)) {
        console.warn(`[episodeStore] User ${currentUserId} does not have permission to view episode ${id}.`);
        return null;
      }

      const toMillis = (timestampInput: any): number | null => {
        if (timestampInput === null || timestampInput === undefined) return null;
        if (typeof timestampInput === 'number') return timestampInput;
        if (timestampInput instanceof Timestamp) return timestampInput.toMillis();
        if (typeof timestampInput === 'object' && timestampInput !== null && typeof timestampInput.seconds === 'number') {
          return new Timestamp(timestampInput.seconds, timestampInput.nanoseconds || 0).toMillis();
        }
        if (typeof timestampInput === 'string') {
            const date = new Date(timestampInput);
            return !isNaN(date.getTime()) ? date.getTime() : null;
        }
        return null;
      };
      
      const seasonNumberFromDb = (typeof data.seasonNumber === 'number' && data.seasonNumber >= 0) ? data.seasonNumber : null;
      const episodeNumberFromDb = (typeof data.episodeNumber === 'number' && data.episodeNumber >= 0) ? data.episodeNumber : null;

      return {
        id: docSnap.id,
        title: data.title || 'Untitled Episode',
        episodeNumber: episodeNumberFromDb,
        seasonNumber: seasonNumberFromDb,
        seasonName: data.seasonName || null,
        segments: (data.segments || []).map((seg: any) => ({ ...seg, id: seg.id || uuidv4() })),
        createdBy: data.createdBy || '',
        collaborators: Array.isArray(data.collaborators) ? data.collaborators : [data.createdBy || currentUserId],
        isArchived: data.isArchived || false,
        isFavorite: data.isFavorite || false,
        isMock: data.isMock || false,
        specialGuest: data.specialGuest || null,
        lunchProvidedBy: data.lunchProvidedBy || null,
        episodeNotes: data.episodeNotes || '',
        createdAt: toMillis(data.createdAt) || Date.now(),
        updatedAt: toMillis(data.updatedAt) || Date.now(),
        ownerHostDisplayName: data.ownerHostDisplayName || null,
        importedHostDisplayName: data.importedHostDisplayName || null,
        status: data.status || 'planning',
        productionChecklist: (data.productionChecklist || []).map((item: any) => ({...item, linkedSegmentId: item.linkedSegmentId ?? null})),
        linkedFollowUpId: data.linkedFollowUpId || null,
        linkedPrequelId: data.linkedPrequelId || null,
        coverImageUrl: data.coverImageUrl || null,
        dateScheduledForRecording: toMillis(data.dateScheduledForRecording),
        dateRecorded: toMillis(data.dateRecorded),
        dateUploaded: toMillis(data.dateUploaded),
        isAiGenerated: data.isAiGenerated || false,
        promptUsed: data.promptUsed || null,
        customStatusLabels: data.customStatusLabels || {},
        useManualStatus: data.useManualStatus || false, 
      } as Episode;
    } else {
      console.warn(`[episodeStore] Episode ${id} not found in Firestore. Returning null.`);
      return null;
    }
  } catch (error) {
    console.error(`[episodeStore] Error fetching episode ${id} from Firestore:`, error);
    return null;
  }
};

export const saveEpisodeDb = async (episodeData: Episode, userId: string): Promise<Episode> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  if (!episodeData.id) {
    throw new Error('Episode ID is required to save.');
  }

  const episodeRef = doc(firestoreInstance, 'episodes', episodeData.id);
  
  let ownerDisplayName = episodeData.ownerHostDisplayName;
  if (episodeData.createdBy === userId && (!ownerDisplayName || ownerDisplayName === 'Host 1 (Your Input)' || ownerDisplayName === 'Host 1')) {
    ownerDisplayName = await getCustomHost1Name(userId) || null;
  }

  const finalSeasonNumber = (typeof episodeData.seasonNumber === 'number' && episodeData.seasonNumber >= 0) ? episodeData.seasonNumber : null;
  const finalEpisodeNumber = (typeof episodeData.episodeNumber === 'number' && episodeData.episodeNumber >= 0) ? episodeData.episodeNumber : 0;

  const episodeToUpdateState: Partial<Episode> = {
    ...episodeData,
    updatedAt: Date.now(), 
    collaborators: Array.isArray(episodeData.collaborators) && episodeData.collaborators.includes(userId)
      ? episodeData.collaborators
      : Array.from(new Set([...(episodeData.collaborators || []), userId])),
    ownerHostDisplayName: ownerDisplayName,
    seasonNumber: finalSeasonNumber,
    episodeNumber: finalEpisodeNumber,
  };

  episodeToUpdateState.segments = (episodeToUpdateState.segments || []).map(seg => ({
    id: seg.id || uuidv4(),
    title: seg.title || 'Untitled Segment',
    subtitle: seg.subtitle || '',
    host1Notes: seg.host1Notes || '',
    host1Links: Array.isArray(seg.host1Links) ? seg.host1Links.filter((l: any): l is string => typeof l === 'string') : [],
    host1AudienceSuggestions: seg.host1AudienceSuggestions || '',
    host1Quote: seg.host1Quote || '',
    host1Author: seg.host1Author || '',
    host2Notes: seg.host2Notes || '',
    host2Links: Array.isArray(seg.host2Links) ? seg.host2Links.filter((l: any): l is string => typeof l === 'string') : [],
    host2AudienceSuggestions: seg.host2AudienceSuggestions || '',
    host2Quote: seg.host2Quote || '',
    host2Author: seg.host2Author || '',
  }));
  
  const dataToSaveForFirestore: any = {
    ...episodeData, 
    updatedAt: serverTimestamp(), 
    collaborators: episodeToUpdateState.collaborators,
    ownerHostDisplayName: episodeToUpdateState.ownerHostDisplayName,
    seasonNumber: episodeToUpdateState.seasonNumber,
    episodeNumber: episodeToUpdateState.episodeNumber,
    segments: episodeToUpdateState.segments,
    productionChecklist: (episodeData.productionChecklist || []).map(item => ({ ...item, linkedSegmentId: item.linkedSegmentId ?? null })),
    linkedFollowUpId: episodeData.linkedFollowUpId || null,
    linkedPrequelId: episodeData.linkedPrequelId || null,
    dateScheduledForRecording: episodeData.dateScheduledForRecording ? Timestamp.fromMillis(Number(episodeData.dateScheduledForRecording)) : null,
    dateRecorded: episodeData.dateRecorded ? Timestamp.fromMillis(Number(episodeData.dateRecorded)) : null,
    dateUploaded: episodeData.dateUploaded ? Timestamp.fromMillis(Number(episodeData.dateUploaded)) : null,
    customStatusLabels: episodeData.customStatusLabels || {},
    isAiGenerated: episodeData.isAiGenerated || false,
    promptUsed: episodeData.promptUsed || null,
    useManualStatus: episodeData.useManualStatus || false,
  };
  
  delete dataToSaveForFirestore.id; 
  if (episodeData.createdAt) {
    dataToSaveForFirestore.createdAt = Timestamp.fromMillis(Number(episodeData.createdAt));
  } else {
    dataToSaveForFirestore.createdAt = serverTimestamp();
  }

  await updateDoc(episodeRef, dataToSaveForFirestore);

  try {
    await saveEpisodeVersion(
      episodeData.id,
      episodeData.createdBy,
      episodeToUpdateState.title || 'Untitled Episode',
      episodeToUpdateState.segments || [],
      episodeToUpdateState.episodeNotes,
      userId
    );
  } catch (versionError) {
    console.error("Failed to save episode version:", versionError);
  }

  return { 
    ...episodeData, 
    ...episodeToUpdateState, 
    seasonNumber: finalSeasonNumber, 
    episodeNumber: finalEpisodeNumber,
    dateScheduledForRecording: episodeData.dateScheduledForRecording ? Number(episodeData.dateScheduledForRecording) : null,
    dateRecorded: episodeData.dateRecorded ? Number(episodeData.dateRecorded) : null,
    dateUploaded: episodeData.dateUploaded ? Number(episodeData.dateUploaded) : null,
  } as Episode; 
};

export const addEpisodeDb = async (
  episodeData: Omit<Episode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'collaborators'>,
  userId: string,
  mode?: AppMode
): Promise<Episode> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }

  const appModeForDefaults = mode || getDefaultAppMode();

  let segmentsToUse = episodeData.segments;
  if (!segmentsToUse || segmentsToUse.length === 0) {
    segmentsToUse = await getDefaultSegments(userId, appModeForDefaults);
  }
  
  segmentsToUse = segmentsToUse.map(seg => ({
    id: seg.id || uuidv4(),
    title: seg.title || 'Untitled Segment',
    subtitle: seg.subtitle || '',
    host1Notes: seg.host1Notes || '',
    host1Links: Array.isArray(seg.host1Links) ? seg.host1Links.filter((l: any): l is string => typeof l === 'string') : [],
    host1AudienceSuggestions: seg.host1AudienceSuggestions || '',
    host1Quote: seg.host1Quote || '',
    host1Author: seg.host1Author || '',
    host2Notes: seg.host2Notes || '',
    host2Links: Array.isArray(seg.host2Links) ? seg.host2Links.filter((l: any): l is string => typeof l === 'string') : [],
    host2AudienceSuggestions: seg.host2AudienceSuggestions || '',
    host2Quote: seg.host2Quote || '',
    host2Author: seg.host2Author || '',
  }));

  const ownerDisplayName = await getCustomHost1Name(userId) || null;
  const currentClientTimestamp = Date.now();
  const finalSeasonNumber = (typeof episodeData.seasonNumber === 'number' && episodeData.seasonNumber >= 0) ? episodeData.seasonNumber : null;
  const finalEpisodeNumber = (typeof episodeData.episodeNumber === 'number' && episodeData.episodeNumber >= 0) ? episodeData.episodeNumber : 0;

  const productionChecklist = ((episodeData.productionChecklist && episodeData.productionChecklist.length > 0)
    ? episodeData.productionChecklist
    : (appModeForDefaults.defaultChecklist || [])
  ).map(item => ({
    id: typeof item === 'string' ? uuidv4() : item.id || uuidv4(),
    text: typeof item === 'string' ? item : item.text,
    completed: typeof item === 'string' ? false : item.completed || false,
    linkedSegmentId: typeof item === 'string' ? null : (item.linkedSegmentId ?? null),
  }));

  const newEpisodeForAppState: Omit<Episode, 'id'> = {
    ...episodeData,
    segments: segmentsToUse,
    productionChecklist: productionChecklist,
    createdBy: userId,
    collaborators: [userId],
    createdAt: currentClientTimestamp, 
    updatedAt: currentClientTimestamp, 
    isArchived: episodeData.isArchived || false,
    isFavorite: episodeData.isFavorite || false,
    isMock: episodeData.isMock || false,
    isAiGenerated: episodeData.isAiGenerated || false,
    promptUsed: episodeData.promptUsed || null,
    ownerHostDisplayName: ownerDisplayName,
    importedHostDisplayName: null,
    linkedFollowUpId: null,
    linkedPrequelId: null,
    seasonNumber: finalSeasonNumber,
    episodeNumber: finalEpisodeNumber,
    seasonName: episodeData.seasonName || null,
    dateScheduledForRecording: episodeData.dateScheduledForRecording ? Number(episodeData.dateScheduledForRecording) : null,
    dateRecorded: episodeData.dateRecorded ? Number(episodeData.dateRecorded) : null,
    dateUploaded: episodeData.dateUploaded ? Number(episodeData.dateUploaded) : null,
    coverImageUrl: episodeData.coverImageUrl || null,
    customStatusLabels: {},
    useManualStatus: false,
  };
  
  const dataToSaveToFirestore = {
    ...newEpisodeForAppState, 
    productionChecklist: newEpisodeForAppState.productionChecklist,
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp(), 
    dateScheduledForRecording: newEpisodeForAppState.dateScheduledForRecording ? Timestamp.fromMillis(newEpisodeForAppState.dateScheduledForRecording) : null,
    dateRecorded: newEpisodeForAppState.dateRecorded ? Timestamp.fromMillis(newEpisodeForAppState.dateRecorded) : null,
    dateUploaded: newEpisodeForAppState.dateUploaded ? Timestamp.fromMillis(newEpisodeForAppState.dateUploaded) : null,
  };

  const docRef = await addDoc(collection(firestoreInstance, 'episodes'), dataToSaveToFirestore);
  
  const createdEpisodeWithId = {
    id: docRef.id,
    ...newEpisodeForAppState,
  } as Episode;

  try {
    await saveEpisodeVersion(
      createdEpisodeWithId.id,
      userId,
      createdEpisodeWithId.title,
      createdEpisodeWithId.segments,
      createdEpisodeWithId.episodeNotes,
      userId
    );
  } catch (versionError) {
    console.error("Failed to save initial episode version:", versionError);
  }

  return createdEpisodeWithId;
};

export const getAllEpisodesForUserFromDb = async (userId: string): Promise<Episode[]> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    console.warn('[EpisodeStore] Firestore clientDb or userId not available for fetching episodes.');
    return [];
  }
  const episodesCollectionRef = collection(firestoreInstance, 'episodes');
  const q = query(episodesCollectionRef, where('collaborators', 'array-contains', userId));
  const fetchedEpisodes: Episode[] = [];

  try {
    const querySnapshot = await getDocs(q);
    const toMillis = (timestampInput: any): number | null => {
        if (timestampInput === null || timestampInput === undefined) return null;
        if (typeof timestampInput === 'number') return timestampInput; 
        if (timestampInput instanceof Timestamp) { 
            return timestampInput.toMillis();
        }
        if (typeof timestampInput === 'object' && timestampInput !== null && 
            typeof timestampInput.seconds === 'number' && typeof timestampInput.nanoseconds === 'number') {
          return timestampInput.seconds * 1000 + timestampInput.nanoseconds / 1000000;
        }
        if (typeof timestampInput === 'string') {
            const date = new Date(timestampInput);
            return !isNaN(date.getTime()) ? date.getTime() : null;
        }
        return null;
    };

    querySnapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        fetchedEpisodes.push({
          id: docSnap.id,
          title: data.title || 'Untitled Episode',
          episodeNumber: (typeof data.episodeNumber === 'number' && data.episodeNumber >= 0) ? data.episodeNumber : 0,
          seasonNumber: (typeof data.seasonNumber === 'number' && data.seasonNumber >= 0) ? data.seasonNumber : null,
          seasonName: data.seasonName || null,
          segments: (data.segments || []).map((seg: any) => ({ 
            id: seg.id || uuidv4(),
            title: seg.title || 'Untitled Segment',
            subtitle: seg.subtitle || '',
            host1Notes: seg.host1Notes || '',
            host1Links: Array.isArray(seg.host1Links) ? seg.host1Links.filter((l: any): l is string => typeof l === 'string') : [],
            host1AudienceSuggestions: seg.host1AudienceSuggestions || '',
            host1Quote: seg.host1Quote || '',
            host1Author: seg.host1Author || '',
            host2Notes: seg.host2Notes || '',
            host2Links: Array.isArray(seg.host2Links) ? seg.host2Links.filter((l: any): l is string => typeof l === 'string') : [],
            host2AudienceSuggestions: seg.host2AudienceSuggestions || '',
            host2Quote: seg.host2Quote || '',
            host2Author: seg.host2Author || '',
          })),
          productionChecklist: (data.productionChecklist || []).map((item: any) => ({...item, linkedSegmentId: item.linkedSegmentId ?? null})),
          createdBy: data.createdBy || '',
          collaborators: data.collaborators || [userId],
          isArchived: data.isArchived || false,
          isFavorite: data.isFavorite || false,
          isMock: data.isMock || false,
          isAiGenerated: data.isAiGenerated || false,
          promptUsed: data.promptUsed || null,
          specialGuest: data.specialGuest || null,
          lunchProvidedBy: data.lunchProvidedBy || null,
          episodeNotes: data.episodeNotes || '',
          createdAt: toMillis(data.createdAt) || Date.now(),
          updatedAt: toMillis(data.updatedAt) || Date.now(),
          ownerHostDisplayName: data.ownerHostDisplayName || null,
          importedHostDisplayName: data.importedHostDisplayName || null,
          linkedFollowUpId: data.linkedFollowUpId || null,
          linkedPrequelId: data.linkedPrequelId || null,
          dateScheduledForRecording: toMillis(data.dateScheduledForRecording),
          dateRecorded: toMillis(data.dateRecorded),
          dateUploaded: toMillis(data.dateUploaded),
          status: data.status || 'planning',
          coverImageUrl: data.coverImageUrl || null,
          customStatusLabels: data.customStatusLabels || {},
          useManualStatus: data.useManualStatus || false,
        } as Episode);
    });
    return fetchedEpisodes;
  } catch (error) {
    console.error("Error fetching episodes from Firestore:", error);
    return [];
  }
};

export const deleteEpisodeDb = async (episodeId: string, userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  
  await deleteVersionsForEpisode(episodeId, userId);

  const episodeRef = doc(firestoreInstance, 'episodes', episodeId);
  await deleteDoc(episodeRef);
};

export const deleteEpisodesByIdsDb = async (episodeIds: string[], userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  if (!episodeIds || episodeIds.length === 0) {
    return; // Nothing to delete
  }

  for (const episodeId of episodeIds) {
    await deleteVersionsForEpisode(episodeId, userId);
  }

  const deleteEpisodesBatch = writeBatch(firestoreInstance);
  for (const episodeId of episodeIds) {
    const episodeRef = doc(firestoreInstance, 'episodes', episodeId);
    deleteEpisodesBatch.delete(episodeRef);
  }
  await deleteEpisodesBatch.commit();
  console.log(`Permanently deleted ${episodeIds.length} episodes for user ${userId}.`);
};


export const replaceAllEpisodesInDb = async (episodes: Episode[], userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available for replacing episodes.');
  }
  
  await deleteAllEpisodesForUserDb(userId); 

  const addBatch = writeBatch(firestoreInstance);
  for (const episode of episodes) {
    const finalSeasonNumber = (typeof episode.seasonNumber === 'number' && episode.seasonNumber >= 0) ? episode.seasonNumber : null;
    const finalEpisodeNumber = (typeof episode.episodeNumber === 'number' && episode.episodeNumber >= 0) ? episode.episodeNumber : 0;

    const dataToSaveToFirestore: any = {
      ...episode, 
      createdBy: userId,
      collaborators: Array.from(new Set([...(episode.collaborators || []), userId])),
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp(), 
      seasonNumber: finalSeasonNumber,
      episodeNumber: finalEpisodeNumber,
      dateScheduledForRecording: episode.dateScheduledForRecording ? Timestamp.fromMillis(Number(episode.dateScheduledForRecording)) : null,
      dateRecorded: episode.dateRecorded ? Timestamp.fromMillis(Number(episode.dateRecorded)) : null,
      dateUploaded: episode.dateUploaded ? Timestamp.fromMillis(Number(episode.dateUploaded)) : null,
    };

    const episodeId = episode.id;
    if (episodeId) {
      delete dataToSaveToFirestore.id; 
    }

    const newEpisodeRef = episodeId ? doc(firestoreInstance, 'episodes', episodeId) : doc(collection(firestoreInstance, 'episodes'));
    addBatch.set(newEpisodeRef, dataToSaveToFirestore);

    try {
        await saveEpisodeVersion(
            newEpisodeRef.id,
            userId,
            episode.title,
            episode.segments,
            episode.episodeNotes,
            userId
        );
    } catch (versionError) {
        console.error(`Failed to save initial version for imported episode ${episode.title}:`, versionError);
    }
  }
  await addBatch.commit();
};

export const deleteAllEpisodesForUserDb = async (userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available for deleting user episodes.');
  }
  
  const episodesCollectionRef = collection(firestoreInstance, 'episodes');
  const accessibleEpisodesQuery = query(
    episodesCollectionRef,
    where('collaborators', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(accessibleEpisodesQuery);
  
  const episodeIdsToDelete: string[] = [];
  querySnapshot.forEach((docSnap: any) => {
    if (docSnap.data().createdBy === userId) {
      episodeIdsToDelete.push(docSnap.id);
    }
  });

  if (episodeIdsToDelete.length === 0) {
    console.log(`No episodes owned by user ${userId} to delete.`);
    return;
  }

  for (const episodeId of episodeIdsToDelete) {
    await deleteVersionsForEpisode(episodeId, userId);
  }
  
  const BATCH_SIZE = 400;
  for (let i = 0; i < episodeIdsToDelete.length; i += BATCH_SIZE) {
    const batchSlice = episodeIdsToDelete.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(firestoreInstance);
    batchSlice.forEach(id => {
      const docRef = doc(firestoreInstance, 'episodes', id);
      batch.delete(docRef);
    });
    await batch.commit();
    console.log(`Deleted a batch of ${batchSlice.length} episodes for user ${userId}.`);
  }

  console.log(`Finished deleting all ${episodeIdsToDelete.length} episodes owned by user ${userId}.`);
};


export const deleteAllArchivedEpisodesForUser = async (userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available for deleting archived episodes.');
  }

  const episodesCollectionRef = collection(firestoreInstance, 'episodes');
  const q = query(
    episodesCollectionRef,
    where('collaborators', 'array-contains', userId),
    where('isArchived', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const episodeIdsToDelete: string[] = [];

  querySnapshot.forEach((docSnap: any) => {
    // Corrected Logic: A user can delete any archived episode they are a collaborator on.
    episodeIdsToDelete.push(docSnap.id);
  });

  if (episodeIdsToDelete.length === 0) {
    console.log(`No archived episodes found for ${userId} to delete.`);
    return;
  }

  for (const episodeId of episodeIdsToDelete) {
    await deleteVersionsForEpisode(episodeId, userId);
  }
  
  const BATCH_SIZE = 400;
  for (let i = 0; i < episodeIdsToDelete.length; i += BATCH_SIZE) {
    const batchSlice = episodeIdsToDelete.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(firestoreInstance);
    batchSlice.forEach(id => {
      batch.delete(doc(firestoreInstance, 'episodes', id));
    });
    await batch.commit();
    console.log(`Permanently deleted a batch of ${batchSlice.length} archived episodes for user ${userId}.`);
  }
  console.log(`Finished deleting all ${episodeIdsToDelete.length} archived episodes for user ${userId}.`);
};

export const deleteMockEpisodesForUserDb = async (userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  
  const episodesCollectionRef = collection(firestoreInstance, 'episodes');
  const q = query(
    episodesCollectionRef,
    where('createdBy', '==', userId),
    where('isMock', '==', true)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log(`No mock episodes found for user ${userId} to delete.`);
    return;
  }
  
  const episodeIdsToDelete = querySnapshot.docs.map(doc => doc.id);

  for (const episodeId of episodeIdsToDelete) {
    await deleteVersionsForEpisode(episodeId, userId);
  }
  
  const batch = writeBatch(firestoreInstance);
  querySnapshot.forEach(docSnap => {
    batch.delete(docSnap.ref);
  });
  
  await batch.commit();
  console.log(`Deleted ${querySnapshot.size} mock episodes for user ${userId}.`);
};
