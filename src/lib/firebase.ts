
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from "firebase/firestore";

// This configuration is now CORRECT and matches your Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyAueqAq-2Zj4EU7MgmQP3-4V43d2DG_SKw",
  authDomain: "plotform-ai-planner.firebaseapp.com",
  projectId: "plotform-ai-planner",
  storageBucket: "plotform-ai-planner.firebasestorage.app",
  messagingSenderId: "305507057537",
  appId: "1:305507057537:web:d0a815742131d8a4b1b280"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    ignoreUndefinedProperties: true,
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // This is a fallback, but the above should be robust enough.
  // In case of a very strange hot-reload state, this might help.
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}


export { app, auth, db };
