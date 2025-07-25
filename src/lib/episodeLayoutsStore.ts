
'use client'; 

import type { EpisodeLayout, Segment, UserPreferences, AppMode } from '@/types'; // Added AppMode
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, query, where, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db as clientDb } from '@/lib/firebase';
import { SYSTEM_DEFAULT_LAYOUT_NAME_BASE, APP_NAME } from '@/lib/constants'; 
import { getAuth } from 'firebase/auth'; // To get current user if needed

export const getEpisodeLayouts = async (userId?: string): Promise<EpisodeLayout[]> => {
  if (!clientDb) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb not available. Returning empty array.');
    return [];
  }
  
  const layouts: EpisodeLayout[] = [];
  try {
    const layoutsCollectionRef = collection(clientDb, 'episodeLayouts');
    const q = userId ? query(layoutsCollectionRef, where('userId', '==', userId)) : layoutsCollectionRef;
    
    const querySnapshot = await getDocs(q); 
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      layouts.push({
        id: docSnap.id,
        name: data.name || 'Untitled Layout',
        segments: (data.segments || []).map((s: any) => ({ 
            id: s.id,
            title: s.title,
            subtitle: s.subtitle || '',
            host1Notes: s.host1Notes || '',
            host1Links: s.host1Links || [],
            host1AudienceSuggestions: s.host1AudienceSuggestions || '',
            host1Quote: s.host1Quote || '',
            host1Author: s.host1Author || '',
            host2Notes: s.host2Notes || '',
            host2Links: s.host2Links || [],
            host2AudienceSuggestions: s.host2AudienceSuggestions || '',
            host2Quote: s.host2Quote || '',
            host2Author: s.host2Author || '',
        })),
        userId: data.userId || '', 
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
      });
    });
    return layouts;
  } catch (error) {
    console.error("Error fetching episode layouts from Firestore:", error);
    return [];
  }
};

export const addEpisodeLayout = async (name: string, segmentsData: Segment[], userId: string): Promise<EpisodeLayout> => {
  if (!clientDb || !userId) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available. Cannot add layout.');
    throw new Error("Firestore or userId not available for adding episode layout.");
  }

  const segmentsForLayout = segmentsData.map(s => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle || '',
    host1Notes: s.host1Notes || '',
    host1Links: s.host1Links || [],
    host1AudienceSuggestions: s.host1AudienceSuggestions || '',
    host1Quote: s.host1Quote || '',
    host1Author: s.host1Author || '',
    host2Notes: s.host2Notes || '',
    host2Links: s.host2Links || [],
    host2AudienceSuggestions: s.host2AudienceSuggestions || '',
    host2Quote: s.host2Quote || '',
    host2Author: s.host2Author || '',
  }));

  const newLayoutData = {
    name,
    segments: segmentsForLayout,
    userId, 
    createdAt: serverTimestamp(), 
  };
  try {
    const docRef = await addDoc(collection(clientDb, 'episodeLayouts'), newLayoutData);
    return {
      id: docRef.id,
      name: newLayoutData.name,
      segments: newLayoutData.segments,
      userId: newLayoutData.userId,
      createdAt: Date.now(), 
    };
  } catch (error) {
    console.error("Error adding episode layout to Firestore:", error);
    throw error;
  }
};

export const deleteEpisodeLayout = async (layoutId: string): Promise<void> => {
  if (!clientDb) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb not available. Cannot delete layout.');
    throw new Error("Firestore not initialized for deleting episode layout.");
  }
  try {
    await deleteDoc(doc(clientDb, 'episodeLayouts', layoutId));
  } catch (error) {
    console.error("Error deleting episode layout from Firestore:", error);
    throw error;
  }
};


export const setActiveDefaultLayoutId = async (layoutId: string | null, userId: string): Promise<void> => {
  if (!clientDb || !userId) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available for setting active default layout.');
    return;
  }
  try {
    const userPrefRef = doc(clientDb, 'userPreferences', userId);
    await setDoc(userPrefRef, { activeDefaultLayoutId: layoutId }, { merge: true }); 
  } catch (error) {
    console.error("Error setting active default layout ID in Firestore:", error);
    throw error;
  }
};

export const getActiveDefaultLayoutId = async (userId: string): Promise<string | null> => {
  if (!clientDb || !userId) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb or userId not available. Returning null for activeDefaultLayoutId.');
    return null;
  }
  try {
    const docRef = doc(clientDb, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().activeDefaultLayoutId || null;
    }
    return null; 
  } catch (error) {
    console.error("Error fetching active default layout ID from Firestore:", error);
    return null;
  }
};

export const getLayoutById = async (layoutId: string): Promise<EpisodeLayout | null> => {
  if (!clientDb) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb not available. Returning null for getLayoutById.');
    return null;
  }
  try {
    const docRef = doc(clientDb, 'episodeLayouts', layoutId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || 'Untitled Layout',
        segments: (data.segments || []).map((s: any) => ({ 
            id: s.id,
            title: s.title,
            subtitle: s.subtitle || '',
            host1Notes: s.host1Notes || '',
            host1Links: s.host1Links || [],
            host1AudienceSuggestions: s.host1AudienceSuggestions || '',
            host1Quote: s.host1Quote || '',
            host1Author: s.host1Author || '',
            host2Notes: s.host2Notes || '',
            host2Links: s.host2Links || [],
            host2AudienceSuggestions: s.host2AudienceSuggestions || '',
            host2Quote: s.host2Quote || '',
            host2Author: s.host2Author || '',
        })),
        userId: data.userId || '',
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching layout by ID ${layoutId} from Firestore:`, error);
    return null;
  }
};

export const replaceAllEpisodeLayouts = async (layoutsToImport: EpisodeLayout[], userId: string): Promise<void> => {
  const firestoreInstance = clientDb; 
  if (!firestoreInstance || !userId) { 
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available for replaceAllEpisodeLayouts.');
    throw new Error("Firestore or userId not available.");
  }

  const existingLayoutsQuery = query(collection(firestoreInstance, 'episodeLayouts'), where('userId', '==', userId));
  const existingLayoutsSnapshot = await getDocs(existingLayoutsQuery);
  
  const deleteBatch = writeBatch(firestoreInstance);
  existingLayoutsSnapshot.forEach((layoutDoc: any) => {
    deleteBatch.delete(doc(firestoreInstance, 'episodeLayouts', layoutDoc.id));
  });
  await deleteBatch.commit();

  const addBatch = writeBatch(firestoreInstance);
  layoutsToImport.forEach(layout => {
    const newLayoutRef = layout.id ? doc(firestoreInstance, 'episodeLayouts', layout.id) : doc(collection(firestoreInstance, 'episodeLayouts'));
    
    const firestoreLayoutData = {
      ...layout,
      userId: userId, // Ensure new layouts are associated with the importing user
      createdAt: layout.createdAt ? Timestamp.fromMillis(layout.createdAt) : serverTimestamp(),
    };
    // If layout.id was provided, we don't want to write it directly if using auto-generated IDs from addDoc
    // but since we are using layout.id to create the newLayoutRef, it's fine.
    // However, if layout.id is undefined, it means doc() generated a new ref, and the layout obj shouldn't have its own id field.
    if (!layout.id) {
        delete (firestoreLayoutData as any).id; 
    }
    addBatch.set(newLayoutRef, firestoreLayoutData);
  });
  await addBatch.commit();
};

export async function setCustomHost1Name(userId: string, name: string): Promise<void> {
  if (!clientDb || !userId) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available for setting custom username.');
    throw new Error("Firestore or userId not available.");
  }
  try {
    const userPrefRef = doc(clientDb, 'userPreferences', userId);
    await setDoc(userPrefRef, { host1DisplayName: name }, { merge: true });
  } catch (error) {
    console.error("Error setting custom username in Firestore:", error);
    throw error;
  }
}

export async function getCustomHost1Name(userId: string): Promise<string | null> {
  if (!clientDb || !userId) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb or userId not available. Returning null for custom username.');
    return "My Username";
  }
  try {
    const docRef = doc(clientDb, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().host1DisplayName || null;
    }
    const auth = getAuth();
    return auth.currentUser?.displayName || "My Username"; // Fallback to "My Username"
  } catch (error) {
    console.error("Error fetching custom username from Firestore:", error);
    // On failure (like client offline), return a safe default instead of null
    return "My Username";
  }
}

export const deleteAllLayoutsForUserDb = async (userId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance || !userId) {
    throw new Error('Firestore client or user ID not available for deleting user layouts.');
  }
  const layoutsCollectionRef = collection(firestoreInstance, 'episodeLayouts');
  const q = query(layoutsCollectionRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(firestoreInstance);
  querySnapshot.forEach((docSnap: any) => {
    batch.delete(doc(firestoreInstance, 'episodeLayouts', docSnap.id));
  });
  await batch.commit();
  console.log(`Deleted ${querySnapshot.size} layouts for user ${userId}.`);
};

export const resetUserPreferencesDb = async (userId: string, currentMode: AppMode): Promise<void> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available for resetting preferences.');
  }
  const auth = getAuth();
  const user = auth.currentUser;
  const defaultHostName = user?.displayName || "My Username";
  const defaultPlannerName = `${currentMode.modeName} Planner`;

  const userPrefRef = doc(clientDb, 'userPreferences', userId);
  const defaultPreferences: UserPreferences = {
    activeDefaultLayoutId: `SYSTEM_DEFAULT_FOR_${currentMode.modeName.replace(/\s+/g, '_').toUpperCase()}`,
    host1DisplayName: defaultHostName,
    showPlannerName: defaultPlannerName 
  };
  await setDoc(userPrefRef, defaultPreferences, { merge: false }); // Overwrite with defaults
  console.log(`Reset preferences for user ${userId}. Username: ${defaultHostName}, Planner Name: ${defaultPlannerName}, Default Layout: ${defaultPreferences.activeDefaultLayoutId}`);
};


export async function setShowPlannerName(userId: string, name: string): Promise<void> {
  if (!clientDb || !userId) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available for setting planner name.');
    throw new Error("Firestore or userId not available.");
  }
  try {
    const userPrefRef = doc(clientDb, 'userPreferences', userId);
    await setDoc(userPrefRef, { showPlannerName: name }, { merge: true });
  } catch (error) {
    console.error("Error setting planner name in Firestore:", error);
    throw error;
  }
}

export async function getShowPlannerName(userId: string): Promise<string | null> {
  if (!clientDb || !userId) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb or userId not available. Returning null for planner name.');
    return null;
  }
  try {
    const docRef = doc(clientDb, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().showPlannerName || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching planner name from Firestore:", error);
    return null;
  }
}

// New function to get the full UserPreferences object
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!clientDb || !userId) {
    console.warn('[EpisodeLayoutsStore] Firestore clientDb or userId not available. Returning null for user preferences.');
    return null;
  }
  try {
    const docRef = doc(clientDb, 'userPreferences', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    return null; // Or return default UserPreferences if that's desired
  } catch (error) {
    console.error("Error fetching user preferences from Firestore:", error);
    return null;
  }
}

// New function to set the full UserPreferences object
export async function setUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  if (!clientDb || !userId) {
    console.error('[EpisodeLayoutsStore] Firestore clientDb or userId not available for setting user preferences.');
    throw new Error("Firestore or userId not available.");
  }
  try {
    const userPrefRef = doc(clientDb, 'userPreferences', userId);
    await setDoc(userPrefRef, preferences); // Overwrite with new preferences
  } catch (error) {
    console.error("Error setting user preferences in Firestore:", error);
    throw error;
  }
}
