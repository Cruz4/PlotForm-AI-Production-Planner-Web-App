
'use client';

import type { UserCustomTheme } from '@/types';
import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';

export const USER_CUSTOM_THEMES_COLLECTION = 'userCustomThemes';

export const saveUserCustomTheme = async (
  userId: string,
  themeData: Omit<UserCustomTheme, 'id' | 'userId' | 'createdAt'>
): Promise<UserCustomTheme> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  const db = clientDb;

  const dataToSave: { [key: string]: any } = {
    userId: userId,
    createdAt: Timestamp.now(),
    name: themeData.name,
    primaryHex: themeData.primaryHex,
    secondaryHex: themeData.secondaryHex,
    accentHex: themeData.accentHex,
  };

  if (!dataToSave.name || !dataToSave.primaryHex) {
    throw new Error("Theme name and primary color are required.");
  }

  const docRef = await addDoc(collection(db, USER_CUSTOM_THEMES_COLLECTION), dataToSave);
  
  return {
    id: docRef.id,
    userId,
    createdAt: dataToSave.createdAt.toMillis(),
    name: dataToSave.name,
    primaryHex: themeData.primaryHex,
    secondaryHex: themeData.secondaryHex,
    accentHex: themeData.accentHex,
  };
};

export const getUserCustomThemes = async (userId: string): Promise<UserCustomTheme[]> => {
  if (!clientDb || !userId) {
    console.warn('[UserCustomThemesStore] Firestore clientDb or userId not available. Returning empty array.');
    return [];
  }
  const db = clientDb;

  const themes: UserCustomTheme[] = [];
  try {
    const themesCollectionRef = collection(db, USER_CUSTOM_THEMES_COLLECTION);
    const q = query(themesCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    
    console.log(`[UserCustomThemesStore] Attempting to fetch custom themes for user: ${userId}`);
    const querySnapshot = await getDocs(q);
    console.log(`[UserCustomThemesStore] Successfully fetched ${querySnapshot.size} custom themes for user: ${userId}`);
    
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      themes.push({
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        primaryHex: data.primaryHex,
        secondaryHex: data.secondaryHex,
        accentHex: data.accentHex,
        createdAt: (data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now()),
      });
    });
    return themes;
  } catch (error: any) {
    console.error("[UserCustomThemesStore] CRITICAL ERROR fetching user custom themes from Firestore:", error);
    if (error.code === 'failed-precondition' && error.message.includes("requires an index")) {
        console.error("**********************************************************************************");
        console.error("[UserCustomThemesStore] FATAL: The Firestore query for user custom themes requires an index.");
        console.error("[UserCustomThemesStore] Please create this index in your Firebase console. The link may be in the browser's console error logs.");
        console.error("**********************************************************************************");
    }
    // Re-throw the error so the calling function can handle it, e.g., by showing a toast.
    throw error;
  }
};

export const deleteUserCustomTheme = async (themeId: string, userId: string): Promise<void> => {
  if (!clientDb || !userId || !themeId) {
    throw new Error('Firestore client, user ID, or theme ID not available.');
  }
  const db = clientDb; 

  const themeRef = doc(db, USER_CUSTOM_THEMES_COLLECTION, themeId);
  const themeSnap = await getDoc(themeRef);
  if (themeSnap.exists() && themeSnap.data().userId === userId) {
    await deleteDoc(themeRef);
  } else {
    console.warn(`[UserCustomThemesStore] User ${userId} attempted to delete theme ${themeId} they do not own or does not exist.`);
  }
};

export const updateUserCustomTheme = async (
  themeId: string,
  userId: string,
  updates: Partial<Omit<UserCustomTheme, 'id' | 'userId' | 'createdAt'>>
): Promise<UserCustomTheme> => {
  if (!clientDb || !userId || !themeId) {
    throw new Error('Firestore client, user ID, or theme ID not available.');
  }
  const db = clientDb;

  const themeRef = doc(db, USER_CUSTOM_THEMES_COLLECTION, themeId);
  const themeSnap = await getDoc(themeRef);
  if (!themeSnap.exists() || themeSnap.data().userId !== userId) {
    throw new Error("Theme not found or user does not have permission to update.");
  }

  // Ensure updates object is clean before sending to Firestore
  const cleanUpdates: { [key: string]: any } = {};
  if (updates.name) cleanUpdates.name = updates.name;
  if (updates.primaryHex) cleanUpdates.primaryHex = updates.primaryHex;
  if (updates.secondaryHex) cleanUpdates.secondaryHex = updates.secondaryHex;
  if (updates.accentHex) cleanUpdates.accentHex = updates.accentHex;

  await updateDoc(themeRef, cleanUpdates);
  
  const updatedDocSnap = await getDoc(themeRef);
  if (!updatedDocSnap.exists()) { 
    throw new Error("Failed to retrieve updated theme.");
  }
  const data = updatedDocSnap.data();
  return {
    id: themeId,
    userId: data.userId,
    name: data.name,
    primaryHex: data.primaryHex,
    secondaryHex: data.secondaryHex,
    accentHex: data.accentHex,
    createdAt: (data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now()),
  } as UserCustomTheme;
};

export const deleteAllUserCustomThemesForUser = async (userId: string): Promise<void> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  const db = clientDb;

  const themesCollectionRef = collection(db, USER_CUSTOM_THEMES_COLLECTION);
  const q = query(themesCollectionRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const docRefs = querySnapshot.docs.map(doc => doc.ref);
  const BATCH_SIZE = 400;

  for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
      const batchSlice = docRefs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      batchSlice.forEach(ref => batch.delete(ref));
      await batch.commit();
      console.log(`Deleted a batch of ${batchSlice.length} custom themes for user ${userId}.`);
  }
  
  console.log(`Finished deleting all ${querySnapshot.size} custom themes for user ${userId}.`);
};

export const importUserCustomThemesBatch = async (userId: string, themesToImport: UserCustomTheme[]): Promise<void> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  const db = clientDb;

  if (!themesToImport || themesToImport.length === 0) {
    console.log("No custom themes to import.");
    return;
  }

  const batch = writeBatch(db);
  themesToImport.forEach(theme => {
    const newThemeRef = doc(collection(db, USER_CUSTOM_THEMES_COLLECTION)); 
    const themeDataForFirestore = {
      ...theme,
      userId: userId, 
      createdAt: theme.createdAt ? Timestamp.fromMillis(theme.createdAt) : serverTimestamp(), 
    };
    delete (themeDataForFirestore as any).id; 

    batch.set(newThemeRef, themeDataForFirestore);
  });
  await batch.commit();
  console.log(`Imported ${themesToImport.length} custom themes for user ${userId}.`);
};
