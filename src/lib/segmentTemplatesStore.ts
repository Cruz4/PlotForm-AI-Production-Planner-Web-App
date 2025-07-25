
'use client'; 

import type { SegmentTemplate } from '@/types';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db as clientDb } from '@/lib/firebase';
// DEFAULT_MASTER_SEGMENT_TEMPLATES is now removed from here, it will be dynamic per mode in constants.ts
// For now, this store will primarily interact with a Firestore collection if one exists,
// but the concept of "global master templates" might be superseded by mode-specific defaults.

export const getMasterSegmentTemplates = async (): Promise<SegmentTemplate[]> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance) {
    console.warn('[SegmentTemplatesStore] Firestore clientDb not available. Returning empty array as master templates are now mode-specific primarily.');
    return []; // Return empty or a very generic fallback if truly needed outside of mode context
  }
  
  console.log('[SegmentTemplatesStore] getMasterSegmentTemplates: Fetching from Firestore (if any global templates exist)...');
  const templates: SegmentTemplate[] = [];
  try {
    const querySnapshot = await getDocs(collection(firestoreInstance, 'segmentTemplates')); // Legacy collection
    if (querySnapshot.empty) {
      console.log('[SegmentTemplatesStore] No global templates found in Firestore. This is expected as defaults are mode-specific.');
      return [];
    }
    querySnapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      templates.push({
        id: docSnap.id,
        title: data.title || 'Untitled Template',
        subtitle: data.subtitle || '',
        isDeletable: data.isDeletable === undefined ? true : data.isDeletable, 
      });
    });
    console.log('[SegmentTemplatesStore] Fetched legacy global templates from Firestore:', templates.length);
    return templates;
  } catch (error) {
    console.error("Error fetching master segment templates from Firestore:", error);
    return [];
  }
};

// The following functions (add, update, delete, replaceAll) would operate on the 'segmentTemplates'
// Firestore collection if you still intend to have globally editable master templates.
// However, their utility is reduced now that default segments are mode-specific.
// They are kept for potential future use or if there's a specific need for global template management.

export const addMasterSegmentTemplate = async (newTemplateData: { title: string; subtitle?: string }): Promise<SegmentTemplate> => {
   const firestoreInstance = clientDb;
   if (!firestoreInstance) {
    console.error('[SegmentTemplatesStore] Firestore clientDb not available. Cannot add template.');
    throw new Error("Firestore not initialized for adding segment template.");
  }
  const newTemplate: Omit<SegmentTemplate, 'id'> = { 
    ...newTemplateData,
    subtitle: newTemplateData.subtitle || '',
    isDeletable: true, 
  };
  console.log('[SegmentTemplatesStore] addMasterSegmentTemplate: Adding to Firestore (global)...', newTemplate);
  try {
    const docRef = await addDoc(collection(firestoreInstance, 'segmentTemplates'), newTemplate);
    return { ...newTemplate, id: docRef.id };
  } catch (error) {
    console.error("Error adding master segment template to Firestore:", error);
    throw error;
  }
};

export const updateMasterSegmentTemplate = async (templateId: string, updatedData: { title: string; subtitle?: string }): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance) {
    console.error('[SegmentTemplatesStore] Firestore clientDb not available. Cannot update template.');
    throw new Error("Firestore not initialized for updating segment template.");
  }
  console.log('[SegmentTemplatesStore] updateMasterSegmentTemplate: Updating in Firestore (global) - ID:', templateId, updatedData);
  try {
    await updateDoc(doc(firestoreInstance, 'segmentTemplates', templateId), {
        title: updatedData.title,
        subtitle: updatedData.subtitle || '', 
    });
  } catch (error) {
    console.error("Error updating master segment template in Firestore:", error);
    throw error;
  }
};

export const deleteMasterSegmentTemplate = async (templateId: string): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance) {
    console.error('[SegmentTemplatesStore] Firestore clientDb not available. Cannot delete template.');
    throw new Error("Firestore not initialized for deleting segment template.");
  }
  
  console.log('[SegmentTemplatesStore] deleteMasterSegmentTemplate: Deleting from Firestore (global) - ID:', templateId);
  try {
    await deleteDoc(doc(firestoreInstance, 'segmentTemplates', templateId));
  } catch (error) {
    console.error("Error deleting master segment template from Firestore:", error);
    throw error;
  }
};

export const replaceAllMasterSegmentTemplates = async (templatesToImport: SegmentTemplate[]): Promise<void> => {
  const firestoreInstance = clientDb;
  if (!firestoreInstance) {
    console.error('[SegmentTemplatesStore] Firestore clientDb not available. Cannot replace templates.');
    throw new Error("Firestore not initialized for replacing segment templates.");
  }
  
  console.log('[SegmentTemplatesStore] replaceAllMasterSegmentTemplates: Replacing all in Firestore (global)...');
  try {
    const existingTemplatesQuery = await getDocs(collection(firestoreInstance, 'segmentTemplates'));
    const deleteBatch = writeBatch(firestoreInstance); 
    
    existingTemplatesQuery.forEach((templateDoc: any) => {
        deleteBatch.delete(doc(firestoreInstance, 'segmentTemplates', templateDoc.id));
    });
    await deleteBatch.commit();

    const addBatch = writeBatch(firestoreInstance);
    templatesToImport.forEach(template => {
      const { id, ...data } = template; 
      const newTemplateRef = id ? doc(firestoreInstance, 'segmentTemplates', id) : doc(collection(firestoreInstance, 'segmentTemplates'));
      addBatch.set(newTemplateRef, {
          ...data,
          isDeletable: data.isDeletable === undefined ? true : data.isDeletable,
      });
    });
    await addBatch.commit();
    console.log('[SegmentTemplatesStore] All master templates replaced in Firestore (global).');
  } catch (error) {
    console.error("Error replacing all master segment templates in Firestore:", error);
    throw error;
  }
};
