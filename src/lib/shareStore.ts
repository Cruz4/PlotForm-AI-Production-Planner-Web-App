
// src/lib/shareStore.ts
'use client';

import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type { Share, Episode, User, SharedSeasonData } from '@/types';
import { getAuth } from 'firebase/auth';

// New function to find a user by their email
export const findUserByEmail = async (email: string): Promise<(User & {id: string}) | null> => {
    if (!clientDb) {
        console.error("Firestore client not available.");
        return null;
    }
    const usersRef = collection(clientDb, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    return {
        id: userDoc.id,
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
    };
};


export const sendShare = async (toUserId: string, episode: Episode, seasonContext?: SharedSeasonData): Promise<void> => {
  const auth = getAuth();
  const fromUser = auth.currentUser;

  if (!clientDb || !fromUser) {
    throw new Error('You must be logged in to share a plan.');
  }

  if (toUserId === fromUser.uid) {
    // This case is for link-based imports where the user is importing to their own account.
    // It's a valid action.
  }

  const fromUserName = seasonContext ? seasonContext.ownerDisplayName : (fromUser.displayName || fromUser.email || 'An anonymous user');
  const fromUserPhotoUrl = seasonContext ? undefined : fromUser.photoURL || undefined; // Don't assume photo URL for link shares
  const fromUserId = seasonContext ? seasonContext.ownerId : fromUser.uid;


  const shareData: Omit<Share, 'id' | 'createdAt'> = {
    fromUserId: fromUserId,
    fromUserName: fromUserName,
    fromUserPhotoUrl: fromUserPhotoUrl,
    toUserId: toUserId,
    episodeId: episode.id,
    episodeTitle: episode.title,
    status: 'pending',
  };

  await addDoc(collection(clientDb, 'shares'), {
    ...shareData,
    createdAt: serverTimestamp(),
  });
};

export const getInboxShares = async (userId: string): Promise<Share[]> => {
  if (!clientDb) {
    console.warn('Firestore client not available.');
    return [];
  }
  const sharesRef = collection(clientDb, 'shares');
  const q = query(sharesRef, where('toUserId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toMillis(),
    } as Share;
  });
};

export const updateShareStatus = async (shareId: string, status: 'accepted' | 'rejected'): Promise<void> => {
  if (!clientDb) {
    throw new Error('Firestore client not available.');
  }
  const shareRef = doc(clientDb, 'shares', shareId);
  await updateDoc(shareRef, { status });
};
