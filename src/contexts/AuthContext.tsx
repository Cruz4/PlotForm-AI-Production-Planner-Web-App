
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
  deleteUser,
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteAllEpisodesForUserDb } from '@/lib/episodeStore';
import { deleteAllLayoutsForUserDb } from '@/lib/episodeLayoutsStore';
import { deleteAllUserCustomThemesForUser } from '@/lib/userCustomThemesStore';
import { deleteAllUserWorkspacesForUser } from '@/lib/userWorkspacesStore';
import { deleteAllTasksForUser } from '@/lib/taskStore';
import { upsertUser } from '@/lib/userStore';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser | null>;
  signup: (email: string, password: string) => Promise<FirebaseUser | null>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  deleteUserAccountAndData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      const publicRoutes = ['/', '/login', '/signup'];
      const isPublicRoute = publicRoutes.includes(pathname);
      const isTutorialRoute = pathname.startsWith('/tutorial');

      if (firebaseUser) {
        // DEFINITIVE FIX: Ensure user profile exists for EVERY authenticated user on load.
        // This retroactively fixes profiles for existing users who were created before the fix.
        await upsertUser(firebaseUser);

        const settingsRef = doc(db, 'usersettings', firebaseUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        
        const hasCompletedTutorial = settingsSnap.exists() && settingsSnap.data().tutorialViewedAt;

        if (!hasCompletedTutorial && !isTutorialRoute) {
          router.replace('/tutorial');
        } else if (hasCompletedTutorial && (isPublicRoute || isTutorialRoute)) {
          router.replace('/dashboard');
        }
        
      } else {
        if (!isPublicRoute) {
            router.replace('/');
        }
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); 

  const login = useCallback(async (email: string, password: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await upsertUser(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      if (error instanceof Error) throw error;
      throw new Error(error?.message || 'Login failed');
    }
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await upsertUser(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      if (error instanceof Error) throw error;
      throw new Error(error?.message || 'Signup failed');
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser | null> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      await upsertUser(result.user);
      return result.user;
    } catch (error: any) {
       if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/unauthorized-domain') {
        console.error('Google sign-in popup error:', error);
        toast({
          title: 'Google Sign-In Configuration Error',
          description: "This app's domain is not authorized for Google Sign-In. Please open the HOW_TO_FIX_PERMISSIONS.md file and follow the instructions to add this domain to your Firebase project's authorized list.",
          variant: 'destructive',
          duration: 15000,
        });
        return null;
      }
      toast({ title: 'Google Sign-In Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      if (error instanceof Error) throw error;
      throw new Error(error?.message || 'Google Sign-in failed');
    }
  }, [toast]);

  const logoutAction = useCallback(async () => {
    try {
      await signOut(auth);
      window.location.assign('/');
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || 'An unknown error occurred.',
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteUserAccountAndData = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      throw new Error("User not authenticated.");
    }
    const userId = currentUser.uid;

    try {
      await deleteAllEpisodesForUserDb(userId);
      await deleteAllLayoutsForUserDb(userId);
      await deleteAllUserCustomThemesForUser(userId);
      await deleteAllUserWorkspacesForUser(userId);
      await deleteAllTasksForUser(userId); 
      
      const batch = writeBatch(db);
      batch.delete(doc(db, "usersettings", userId));
      batch.delete(doc(db, "userPreferences", userId));
      batch.delete(doc(db, "users", userId));
      await batch.commit();

      toast({ title: "User Data Deleted", description: "All your personal data has been removed from the database." });
      
      await deleteUser(currentUser);
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });

      setUser(null);
      window.location.assign('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({
          title: "Re-authentication Required",
          description: "Please log out, log back in, and then try deleting your account again.",
          variant: "destructive",
          duration: 7000,
        });
        await logoutAction();
      } else {
        console.error("Error during account deletion process:", error);
        toast({ title: "Deletion Failed", description: error.message || "An unexpected error occurred while deleting your account and data.", variant: "destructive" });
      }
      throw error;
    }
  }, [toast, logoutAction]);

  const memoizedValue = useMemo(() => ({
    user,
    loading: authLoading,
    login,
    signup,
    signInWithGoogle,
    logout: logoutAction,
    deleteUserAccountAndData
  }), [user, authLoading, login, signup, signInWithGoogle, logoutAction, deleteUserAccountAndData]);

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
