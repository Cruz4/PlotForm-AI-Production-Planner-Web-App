
'use client';

import type { EpisodeVersion, Segment } from '@/types';
import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';


export const saveEpisodeVersion = async (
  episodeId: string,
  ownerUserId: string, // The original creator of the episode document
  title: string,
  segments: Segment[],
  episodeNotes?: string,
  savedByUserId?: string // The user currently performing the save action
): Promise<EpisodeVersion> => {
  if (!clientDb) {
    throw new Error('Firestore client not available.');
  }
  if (!episodeId || !ownerUserId) {
    throw new Error('Episode ID and owner User ID are required to save a version.');
  }
  
  const currentUserPerformingSave = savedByUserId || ownerUserId;

  const currentClientTimestamp = Date.now();

  const versionDataToSave = {
    episodeId,
    userId: ownerUserId, // The original owner of the episode document
    versionTimestamp: serverTimestamp(),
    savedByUserId: currentUserPerformingSave,
    title: title || 'Untitled',
    episodeNotes: episodeNotes || '',
    segments: segments.map(s => ({
        ...s,
        id: s.id || uuidv4(),
        host1Links: Array.isArray(s.host1Links) ? s.host1Links : [],
        host2Links: Array.isArray(s.host2Links) ? s.host2Links : [],
    })),
  };

  try {
    const docRef = await addDoc(collection(clientDb, 'episodeVersions'), versionDataToSave);
    return {
      id: docRef.id,
      episodeId,
      userId: ownerUserId,
      versionTimestamp: currentClientTimestamp,
      savedByUserId: versionDataToSave.savedByUserId,
      title: versionDataToSave.title,
      episodeNotes: versionDataToSave.episodeNotes,
      segments: versionDataToSave.segments,
    };
  } catch (error) {
    console.error("Error saving episode version to Firestore:", error);
    throw error;
  }
};


export const getEpisodeVersions = async (episodeId: string, userId: string): Promise<EpisodeVersion[]> => {
  if (!clientDb) {
    console.warn('[EpisodeVersionStore] Firestore clientDb not available. Returning empty array.');
    return [];
  }
  if (!userId) {
    console.warn('[EpisodeVersionStore] User ID is required to fetch versions. Returning empty array.');
    return [];
  }
  const versions: EpisodeVersion[] = [];
  try {
    const versionsCollectionRef = collection(clientDb, 'episodeVersions');
    // SECURED QUERY: This now checks that the user owns the versions they are trying to read.
    const q = query(
      versionsCollectionRef,
      where('episodeId', '==', episodeId),
      where('userId', '==', userId), // This is the critical addition.
      orderBy('versionTimestamp', 'desc') // Most recent first
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      const versionTimestamp = data.versionTimestamp instanceof Timestamp 
        ? data.versionTimestamp.toMillis() 
        : (typeof data.versionTimestamp === 'number' ? data.versionTimestamp : Date.now());
      
      versions.push({
        id: docSnap.id,
        episodeId: data.episodeId,
        userId: data.userId, // Standardized field
        versionTimestamp: versionTimestamp,
        savedByUserId: data.savedByUserId || undefined,
        title: data.title || 'Untitled Version',
        episodeNotes: data.episodeNotes || '',
        segments: (data.segments || []).map((s: any) => ({
            ...s,
            id: s.id || uuidv4(),
            host1Links: Array.isArray(s.host1Links) ? s.host1Links : [],
            host2Links: Array.isArray(s.host2Links) ? s.host2Links : [],
        })),
      });
    });
    return versions;
  } catch (error) {
    console.error("Error fetching episode versions from Firestore:", error);
    return [];
  }
};

export const getEpisodeVersionById = async (versionId: string): Promise<EpisodeVersion | null> => {
  if (!clientDb) {
    console.warn('[EpisodeVersionStore] Firestore clientDb not available for getEpisodeVersionById.');
    return null;
  }
  try {
    const docRef = doc(clientDb, 'episodeVersions', versionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // NOTE: For a single document get, Firestore rules on the server will enforce ownership.
      const versionTimestamp = data.versionTimestamp instanceof Timestamp 
        ? data.versionTimestamp.toMillis() 
        : (typeof data.versionTimestamp === 'number' ? data.versionTimestamp : Date.now());
      return {
        id: docSnap.id,
        episodeId: data.episodeId,
        userId: data.userId, // Standardized field
        versionTimestamp: versionTimestamp,
        savedByUserId: data.savedByUserId || undefined,
        title: data.title || 'Untitled Version',
        episodeNotes: data.episodeNotes || '',
        segments: (data.segments || []).map((s: any) => ({
            ...s,
            id: s.id || uuidv4(),
            host1Links: Array.isArray(s.host1Links) ? s.host1Links : [],
            host2Links: Array.isArray(s.host2Links) ? s.host2Links : [],
        })),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching episode version by ID ${versionId}:`, error);
    return null;
  }
};

export const deleteVersionsForEpisode = async (episodeId: string, userId: string): Promise<void> => {
  if (!clientDb || !userId) {
    console.error("Cannot delete versions: Firestore or user ID is not available.");
    return;
  }
  const versionsQuery = query(collection(clientDb, 'episodeVersions'), where('episodeId', '==', episodeId), where('userId', '==', userId));
  const versionsSnapshot = await getDocs(versionsQuery);
  if (versionsSnapshot.empty) {
    return;
  }

  const BATCH_SIZE = 400; // Keep it under the 500 limit to be safe
  const docRefs = versionsSnapshot.docs.map(d => d.ref);

  for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
    const batchSlice = docRefs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(clientDb);
    batchSlice.forEach(ref => batch.delete(ref));
    await batch.commit();
    console.log(`Deleted a batch of ${batchSlice.length} versions for episode ${episodeId}.`);
  }
  
  console.log(`Finished deleting all ${versionsSnapshot.size} versions for episode ${episodeId}.`);
};
