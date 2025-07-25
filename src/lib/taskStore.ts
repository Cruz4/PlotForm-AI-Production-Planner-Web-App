
'use client';

import type { CustomTask } from '@/types';
import { db as clientDb } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch // NEW
} from 'firebase/firestore';

export const TASKS_COLLECTION = 'tasks';

export const getTasksForUser = async (userId: string): Promise<CustomTask[]> => {
  if (!clientDb || !userId) {
    console.warn('[taskStore] Firestore clientDb or userId not available.');
    return [];
  }
  const tasks: CustomTask[] = [];
  try {
    const q = query(collection(clientDb, TASKS_COLLECTION), where('userId', '==', userId), orderBy('dueDate', 'asc'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      tasks.push({
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        notes: data.notes,
        dueDate: data.dueDate.toMillis(),
        isCompleted: data.isCompleted,
        createdAt: data.createdAt.toMillis(),
      } as CustomTask);
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const addTask = async (
  userId: string,
  taskData: Omit<CustomTask, 'id' | 'userId' | 'createdAt' | 'isCompleted'>
): Promise<CustomTask> => {
  if (!clientDb || !userId) throw new Error("Authentication/DB error.");

  const dataToSave = {
    ...taskData,
    userId,
    isCompleted: false,
    createdAt: serverTimestamp(),
    dueDate: Timestamp.fromMillis(taskData.dueDate),
  };

  const docRef = await addDoc(collection(clientDb, TASKS_COLLECTION), dataToSave);
  return {
    ...taskData,
    id: docRef.id,
    userId,
    isCompleted: false,
    createdAt: Date.now(),
  };
};

export const updateTask = async (taskId: string, updates: Partial<CustomTask>): Promise<void> => {
  if (!clientDb) throw new Error("DB error.");
  const taskRef = doc(clientDb, TASKS_COLLECTION, taskId);
  const dataToUpdate: { [key: string]: any } = { ...updates };
  if (updates.dueDate) {
    dataToUpdate.dueDate = Timestamp.fromMillis(updates.dueDate);
  }
  await updateDoc(taskRef, dataToUpdate);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  if (!clientDb) throw new Error("DB error.");
  await deleteDoc(doc(clientDb, TASKS_COLLECTION, taskId));
};

// NEW: Function to delete all tasks for a user
export const deleteAllTasksForUser = async (userId: string): Promise<void> => {
  if (!clientDb || !userId) {
    throw new Error('Firestore client or user ID not available.');
  }
  const tasksQuery = query(collection(clientDb, TASKS_COLLECTION), where('userId', '==', userId));
  const querySnapshot = await getDocs(tasksQuery);
  const batch = writeBatch(clientDb);
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted ${querySnapshot.size} tasks for user ${userId}.`);
};
