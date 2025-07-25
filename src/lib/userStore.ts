
'use client';

import { db as clientDb } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/types';

export const upsertUser = async (firebaseUser: FirebaseUser): Promise<void> => {
  if (!clientDb) {
    console.error("[upsertUser] Firestore client not available. Cannot save user profile.");
    return;
  }
  if (!firebaseUser.email) {
    console.warn("[upsertUser] Attempted to upsert user without an email address. Aborting.", firebaseUser);
    return;
  }

  const userRef = doc(clientDb, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  const userData = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    email_lowercase: firebaseUser.email.toLowerCase(),
    displayName: firebaseUser.displayName, // CORRECTED: was user.displayName
    photoURL: firebaseUser.photoURL, // CORRECTED: was user.photoURL
    lastLoginAt: serverTimestamp(),
  };

  try {
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      console.log(`[upsertUser] Created new user profile for ${firebaseUser.email}`);
    } else {
      await setDoc(userRef, userData, { merge: true });
      console.log(`[upsertUser] Updated existing user profile for ${firebaseUser.email}`);
    }
  } catch (error) {
    console.error(`[upsertUser] Failed to save user profile for ${firebaseUser.email}:`, error);
  }
};

export const findUserByEmail = async (email: string): Promise<(User & {id: string}) | null> => {
    if (!clientDb) {
        console.error("[findUserByEmail] Firestore client not available.");
        throw new Error("Firestore client not available.");
    }
    const usersRef = collection(clientDb, 'users');
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[findUserByEmail] Querying for normalized email: "${normalizedEmail}"`);

    const q = query(usersRef, where('email_lowercase', '==', normalizedEmail), limit(1));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`[findUserByEmail] No user found for email: "${normalizedEmail}"`);
            return null;
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log(`[findUserByEmail] Found user:`, { id: userDoc.id, ...userData });

        return {
            id: userDoc.id,
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
        };
    } catch (error) {
        console.error(`[findUserByEmail] Error executing Firestore query for email "${normalizedEmail}":`, error);
        throw error;
    }
};
