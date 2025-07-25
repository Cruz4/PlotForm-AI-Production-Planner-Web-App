
'use client';

import type { UserWorkspace, UserPreferences, UserThemeSettings } from '@/types';
import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { 
  replaceAllEpisodesInDb, 
  deleteAllEpisodesForUserDb,
  getAllEpisodesForUserFromDb, 
} from '@/lib/episodeStore';
import { 
  getEpisodeLayouts, 
  replaceAllEpisodeLayouts, 
  getUserPreferences,
  setUserPreferences,
  deleteAllLayoutsForUserDb
} from '@/lib/episodeLayoutsStore';
import { 
  getUserCustomThemes, 
  importUserCustomThemesBatch, 
  deleteAllUserCustomThemesForUser,
} from '@/lib/userCustomThemesStore';
import { getDefaultAppMode } from '@/lib/modes';
import { DEFAULT_THEME_NAME } from '@/lib/themes';

export const USER_WORKSPACES_COLLECTION = 'userWorkspaces';
const CURRENT_WORKSPACE_EXPORT_VERSION = "1.0.0"; 

export const saveUserWorkspace = async (
  userId: string,
  workspaceName: string
): Promise<UserWorkspace> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  if (!workspaceName.trim()) {
    throw new Error('Workspace name cannot be empty.');
  }

  const episodes = await getAllEpisodesForUserFromDb(userId);
  const episodeLayouts = await getEpisodeLayouts(userId);
  const userPreferences = await getUserPreferences(userId);
  
  const userSettingsDocRef = doc(clientDb, 'usersettings', userId);
  const userSettingsSnap = await getDoc(userSettingsDocRef);
  const userSettings = userSettingsSnap.exists() ? userSettingsSnap.data() as UserThemeSettings : null;
  
  const userCustomThemes = await getUserCustomThemes(userId);

  const workspaceDataPayload: Omit<UserWorkspace, 'id' | 'userId' | 'workspaceName' | 'savedAt'> = {
    exportVersion: CURRENT_WORKSPACE_EXPORT_VERSION,
    episodes,
    episodeLayouts,
    userPreferences,
    userSettings,
    userCustomThemes,
  };

  const dataToSave = {
    userId,
    workspaceName: workspaceName.trim(),
    savedAt: serverTimestamp(),
    ...workspaceDataPayload,
  };

  const docRef = await addDoc(collection(clientDb, USER_WORKSPACES_COLLECTION), dataToSave);
  
  return {
    id: docRef.id,
    userId,
    workspaceName: dataToSave.workspaceName,
    savedAt: Date.now(),
    ...workspaceDataPayload,
  };
};

export const getUserWorkspaces = async (userId: string): Promise<UserWorkspace[]> => {
  if (!clientDb || !userId) {
    console.warn('[UserWorkspacesStore] Firestore clientDb or userId not available. Returning empty array.');
    return [];
  }
  const workspaces: UserWorkspace[] = [];
  try {
    const workspacesCollectionRef = collection(clientDb, USER_WORKSPACES_COLLECTION);
    const q = query(workspacesCollectionRef, where('userId', '==', userId), orderBy('savedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      const savedAtTimestamp = data.savedAt instanceof Timestamp 
        ? data.savedAt.toMillis() 
        : (typeof data.savedAt === 'number' ? data.savedAt : Date.now());
      
      workspaces.push({
        id: docSnap.id,
        userId: data.userId,
        workspaceName: data.workspaceName,
        savedAt: savedAtTimestamp,
        exportVersion: data.exportVersion || "0.1.0",
        episodes: data.episodes || [],
        episodeLayouts: data.episodeLayouts || [],
        userPreferences: data.userPreferences || null,
        userSettings: data.userSettings || null,
        userCustomThemes: data.userCustomThemes || [],
      } as UserWorkspace);
    });
    return workspaces;
  } catch (error) {
    console.error("Error fetching user workspaces from Firestore:", error);
    return []; 
  }
};

export const deleteUserWorkspace = async (workspaceId: string, userId: string): Promise<void> => {
  if (!clientDb || !userId || !workspaceId) {
    throw new Error('Firestore client, user ID, or workspace ID not available.');
  }
  const workspaceRef = doc(clientDb, USER_WORKSPACES_COLLECTION, workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);
  if (workspaceSnap.exists() && workspaceSnap.data().userId === userId) {
    await deleteDoc(workspaceRef);
  } else {
    console.warn(`[UserWorkspacesStore] User ${userId} attempted to delete workspace ${workspaceId} they do not own or does not exist.`);
    throw new Error("Workspace not found or permission denied.");
  }
};

export const deleteAllUserWorkspacesForUser = async (userId: string): Promise<void> => {
    if (!clientDb || !userId) {
        throw new Error("Firestore client or user ID not available for deleting workspaces.");
    }
    const workspacesCollectionRef = collection(clientDb, USER_WORKSPACES_COLLECTION);
    const q = query(workspacesCollectionRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const docRefs = querySnapshot.docs.map(doc => doc.ref);
    const BATCH_SIZE = 400;
  
    for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
        const batchSlice = docRefs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(clientDb);
        batchSlice.forEach(ref => batch.delete(ref));
        await batch.commit();
        console.log(`Deleted a batch of ${batchSlice.length} workspaces for user ${userId}.`);
    }

    console.log(`Finished deleting all ${querySnapshot.size} workspaces for user ${userId}.`);
};

export const applyUserWorkspace = async (
  userId: string,
  workspaceData: UserWorkspace
): Promise<void> => {
  if (!clientDb || !userId || !workspaceData) {
    throw new Error('Firestore client, user ID, or workspace data missing.');
  }
  
  // Clear existing user data
  await deleteAllEpisodesForUserDb(userId);
  await deleteAllLayoutsForUserDb(userId);
  await deleteAllUserCustomThemesForUser(userId);

  // Apply settings from the workspace
  const settingsToApply = workspaceData.userSettings || {
    themeColor: DEFAULT_THEME_NAME, fontFamily: 'sans', textShadow: 'subtle-outline',
    selectedAppModeName: getDefaultAppMode().modeName, hasSeenNewEpisodeDefaultsInfo: false,
    hasProvisionedInitialContent: true, userClearedMockEpisodesOnce: true,
    tutorialViewedAt: Date.now(), showProTips: true,
  };
  settingsToApply.fontFamily = 'sans';
  settingsToApply.textShadow = 'subtle-outline';
  const userSettingsDocRef = doc(clientDb, 'usersettings', userId);
  await setDoc(userSettingsDocRef, settingsToApply);
  
  // Apply preferences
  const prefsToApply = workspaceData.userPreferences || {
    activeDefaultLayoutId: `SYSTEM_DEFAULT_FOR_${(settingsToApply.selectedAppModeName || getDefaultAppMode().modeName).replace(/\s+/g, '_').toUpperCase()}`,
    host1DisplayName: "My Username",
    showPlannerName: `${settingsToApply.selectedAppModeName || getDefaultAppMode().modeName} Planner`,
  };
  await setUserPreferences(userId, prefsToApply);

  // Re-add data from the workspace
  await replaceAllEpisodesInDb(workspaceData.episodes.map(ep => ({ ...ep, createdBy: userId, collaborators: [userId] })), userId);
  await replaceAllEpisodeLayouts(workspaceData.episodeLayouts.map(layout => ({ ...layout, userId: userId })), userId);
  await importUserCustomThemesBatch(userId, workspaceData.userCustomThemes);

  // Force a full page reload to ensure all contexts and states are cleanly re-initialized
  window.location.assign('/dashboard?refresh=' + Date.now());
};

