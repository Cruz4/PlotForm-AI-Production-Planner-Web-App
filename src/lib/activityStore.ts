
'use client';

import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { PublicActivity, Episode } from '@/types';
import { getAuth } from 'firebase/auth';

export const createPublicActivity = async (
  item: Episode, // Only accepts Episode now
  activityType: 'published_episode'
): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!clientDb || !user) {
    throw new Error('You must be logged in to create a public activity.');
  }

  const activityData: Omit<PublicActivity, 'id' | 'createdAt'> = {
    userId: user.uid,
    userName: user.displayName || 'A Creator',
    userPhotoURL: user.photoURL,
    activityType,
    itemId: item.id,
    itemName: item.title,
  };

  await addDoc(collection(clientDb, 'publicActivities'), {
    ...activityData,
    createdAt: serverTimestamp(),
  });
};

export const getActivityForPals = async (palUserIds: string[]): Promise<PublicActivity[]> => {
  if (!clientDb || palUserIds.length === 0) {
    return [];
  }

  const activities: PublicActivity[] = [];
  try {
    // This query now uses an 'in' filter and requires a specific composite index.
    const q = query(
      collection(clientDb, 'publicActivities'),
      where('userId', 'in', palUserIds),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out any stray layout activities that might be in the DB
      if (data.activityType === 'published_episode') {
        activities.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toMillis(),
        } as PublicActivity);
      }
    });

    return activities;
  } catch (error) {
    console.error("Error fetching activity for pals:", error);
    // Re-throwing the error so the UI can be aware of the failure (e.g., missing index)
    throw error;
  }
};
