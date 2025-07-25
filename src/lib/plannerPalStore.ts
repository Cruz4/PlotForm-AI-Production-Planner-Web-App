
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
  deleteDoc,
  limit,
  or,
  Timestamp,
} from 'firebase/firestore';
import type { PlannerPal, User } from '@/types';
import { getAuth } from 'firebase/auth';
import { findUserByEmail as findUserInDb } from './userStore'; // Import from the new central userStore

export const findUserByEmail = async (email: string): Promise<(User & {id: string}) | null> => {
    // This function now delegates to the central userStore function.
    return findUserInDb(email);
};

export const sendPalRequest = async (fromUser: User, toUser: User & { id: string }): Promise<void> => {
    if (!clientDb || !fromUser.uid) {
        throw new Error('You must be logged in to send a request.');
    }
    
    const existingRequestQuery = query(
        collection(clientDb, 'plannerPals'),
        where('userIds', 'in', [[fromUser.uid, toUser.uid], [toUser.uid, fromUser.uid]])
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);
    if (!existingRequestSnapshot.empty) {
        throw new Error("A connection or pending request already exists with this user.");
    }

    const requestData = {
        userIds: [fromUser.uid, toUser.uid],
        fromUserId: fromUser.uid,
        fromUserName: fromUser.displayName,
        fromUserPhotoUrl: fromUser.photoURL,
        toUserId: toUser.uid,
        toUserName: toUser.displayName,
        toUserPhotoUrl: toUser.photoURL,
        status: 'pending',
        requestedBy: fromUser.uid,
        createdAt: serverTimestamp(),
    };

    await addDoc(collection(clientDb, 'plannerPals'), requestData);
};

export const getPlannerPals = async (userId: string): Promise<PlannerPal[]> => {
    if (!clientDb) return [];
    const pals: PlannerPal[] = [];
    const q = query(
        collection(clientDb, 'plannerPals'),
        where('userIds', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        const data = doc.data();
        pals.push({
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toMillis(),
        } as PlannerPal);
    });
    return pals;
};

export const updatePalRequest = async (palId: string, status: 'accepted' | 'rejected'): Promise<void> => {
    if (!clientDb) throw new Error("Firestore client not available.");
    const palRef = doc(clientDb, 'plannerPals', palId);
    if (status === 'rejected') {
        await deleteDoc(palRef);
    } else {
        await updateDoc(palRef, { status });
    }
};

export const removePal = async (palId: string): Promise<void> => {
    if (!clientDb) throw new Error("Firestore client not available.");
    await deleteDoc(doc(clientDb, 'plannerPals', palId));
};
