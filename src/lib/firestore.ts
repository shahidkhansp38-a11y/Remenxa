/**
 * Remnexa Firestore Service
 * All database operations for documents, renewal events, and checklists.
 * Every query is scoped to the authenticated user's ID.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  RemnexaDocument,
  RenewalEvent,
  ChecklistItem,
  DocumentFormData,
  RenewalFormData,
} from './types';
import { DEFAULT_CHECKLIST_ITEMS } from './types';
import { getTodayString } from './dates';

// ==================== DOCUMENTS ====================

function serializeTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docFromFirestore(id: string, data: Record<string, unknown>): RemnexaDocument {
  return {
    id,
    userId: data.userId as string,
    name: data.name as string,
    category: data.category as RemnexaDocument['category'],
    issuer: (data.issuer as string) || undefined,
    referenceNumber: (data.referenceNumber as string) || undefined,
    issueDate: (data.issueDate as string) || undefined,
    expiryDate: data.expiryDate as string,
    renewalUrl: (data.renewalUrl as string) || undefined,
    notes: (data.notes as string) || undefined,
    storagePath: (data.storagePath as string) || undefined,
    archivedAt: (data.archivedAt as string) || null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export async function createDocument(
  userId: string,
  formData: DocumentFormData
): Promise<RemnexaDocument> {
  const now = new Date().toISOString();
  const docData = {
    userId,
    name: formData.name.trim(),
    category: formData.category,
    issuer: formData.issuer.trim() || null,
    referenceNumber: formData.referenceNumber.trim() || null,
    issueDate: formData.issueDate || null,
    expiryDate: formData.expiryDate,
    renewalUrl: formData.renewalUrl.trim() || null,
    notes: formData.notes.trim() || null,
    storagePath: null,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'documents'), docData);

  // Create default checklist items for this document
  const defaults = DEFAULT_CHECKLIST_ITEMS[formData.category] || DEFAULT_CHECKLIST_ITEMS['other'];
  const batch = writeBatch(db);
  defaults.forEach((title, index) => {
    const checkRef = doc(collection(db, 'checklist_items'));
    batch.set(checkRef, {
      userId,
      documentId: docRef.id,
      title,
      description: null,
      sortOrder: index,
      isComplete: false,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();

  return {
    id: docRef.id,
    userId,
    name: formData.name.trim(),
    category: formData.category,
    issuer: formData.issuer.trim() || undefined,
    referenceNumber: formData.referenceNumber.trim() || undefined,
    issueDate: formData.issueDate || undefined,
    expiryDate: formData.expiryDate,
    renewalUrl: formData.renewalUrl.trim() || undefined,
    notes: formData.notes.trim() || undefined,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getUserDocuments(userId: string): Promise<RemnexaDocument[]> {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    where('archivedAt', '==', null),
    orderBy('expiryDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docFromFirestore(d.id, d.data() as Record<string, unknown>));
}

export async function getDocumentById(
  userId: string,
  documentId: string
): Promise<RemnexaDocument | null> {
  const docRef = doc(db, 'documents', documentId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Record<string, unknown>;
  // Enforce ownership
  if (data.userId !== userId) return null;
  return docFromFirestore(snapshot.id, data);
}

export async function updateDocument(
  userId: string,
  documentId: string,
  formData: Partial<DocumentFormData>
): Promise<void> {
  // Verify ownership first
  const existing = await getDocumentById(userId, documentId);
  if (!existing) throw new Error('Document not found or access denied.');

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (formData.name !== undefined) updates.name = formData.name.trim();
  if (formData.category !== undefined) updates.category = formData.category;
  if (formData.issuer !== undefined) updates.issuer = formData.issuer.trim() || null;
  if (formData.referenceNumber !== undefined) updates.referenceNumber = formData.referenceNumber.trim() || null;
  if (formData.issueDate !== undefined) updates.issueDate = formData.issueDate || null;
  if (formData.expiryDate !== undefined) updates.expiryDate = formData.expiryDate;
  if (formData.renewalUrl !== undefined) updates.renewalUrl = formData.renewalUrl.trim() || null;
  if (formData.notes !== undefined) updates.notes = formData.notes.trim() || null;

  await updateDoc(doc(db, 'documents', documentId), updates);
}

export async function archiveDocument(userId: string, documentId: string): Promise<void> {
  const existing = await getDocumentById(userId, documentId);
  if (!existing) throw new Error('Document not found or access denied.');
  await updateDoc(doc(db, 'documents', documentId), {
    archivedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const existing = await getDocumentById(userId, documentId);
  if (!existing) throw new Error('Document not found or access denied.');
  // Delete checklist items
  const checklistQuery = query(
    collection(db, 'checklist_items'),
    where('userId', '==', userId),
    where('documentId', '==', documentId)
  );
  const checklistSnapshot = await getDocs(checklistQuery);
  const batch = writeBatch(db);
  checklistSnapshot.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'documents', documentId));
  await batch.commit();
}

// ==================== RENEWAL EVENTS ====================

export async function createRenewalEvent(
  userId: string,
  document: RemnexaDocument,
  renewalData: RenewalFormData
): Promise<void> {
  const batch = writeBatch(db);

  // Create renewal event
  const eventRef = doc(collection(db, 'renewal_events'));
  batch.set(eventRef, {
    userId,
    documentId: document.id,
    documentName: document.name,
    documentCategory: document.category,
    previousExpiryDate: document.expiryDate,
    newExpiryDate: renewalData.newExpiryDate,
    renewedOn: renewalData.renewedOn || getTodayString(),
    notes: renewalData.notes.trim() || null,
    createdAt: serverTimestamp(),
  });

  // Update document expiry
  const docRef = doc(db, 'documents', document.id);
  const docUpdates: Record<string, unknown> = {
    expiryDate: renewalData.newExpiryDate,
    updatedAt: serverTimestamp(),
  };
  if (renewalData.newRenewalUrl?.trim()) {
    docUpdates.renewalUrl = renewalData.newRenewalUrl.trim();
  }
  batch.update(docRef, docUpdates);

  // Reset checklist items
  const checklistQuery = query(
    collection(db, 'checklist_items'),
    where('userId', '==', userId),
    where('documentId', '==', document.id)
  );
  const checklistSnapshot = await getDocs(checklistQuery);
  checklistSnapshot.docs.forEach((d) => {
    batch.update(d.ref, {
      isComplete: false,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function getRenewalEvents(userId: string): Promise<RenewalEvent[]> {
  const q = query(
    collection(db, 'renewal_events'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      documentId: data.documentId,
      documentName: data.documentName,
      documentCategory: data.documentCategory,
      previousExpiryDate: data.previousExpiryDate || undefined,
      newExpiryDate: data.newExpiryDate,
      renewedOn: data.renewedOn,
      notes: data.notes || undefined,
      createdAt: serializeTimestamp(data.createdAt),
    };
  });
}

export async function getDocumentRenewalEvents(
  userId: string,
  documentId: string
): Promise<RenewalEvent[]> {
  const q = query(
    collection(db, 'renewal_events'),
    where('userId', '==', userId),
    where('documentId', '==', documentId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      documentId: data.documentId,
      documentName: data.documentName,
      documentCategory: data.documentCategory,
      previousExpiryDate: data.previousExpiryDate || undefined,
      newExpiryDate: data.newExpiryDate,
      renewedOn: data.renewedOn,
      notes: data.notes || undefined,
      createdAt: serializeTimestamp(data.createdAt),
    };
  });
}

// ==================== CHECKLIST ITEMS ====================

export async function getDocumentChecklist(
  userId: string,
  documentId: string
): Promise<ChecklistItem[]> {
  const q = query(
    collection(db, 'checklist_items'),
    where('userId', '==', userId),
    where('documentId', '==', documentId),
    orderBy('sortOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      documentId: data.documentId,
      title: data.title,
      description: data.description || undefined,
      sortOrder: data.sortOrder,
      isComplete: data.isComplete,
      completedAt: data.completedAt || null,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    };
  });
}

export async function toggleChecklistItem(
  userId: string,
  itemId: string,
  isComplete: boolean
): Promise<void> {
  const itemRef = doc(db, 'checklist_items', itemId);
  const snapshot = await getDoc(itemRef);
  if (!snapshot.exists() || (snapshot.data() as Record<string, unknown>).userId !== userId) {
    throw new Error('Checklist item not found or access denied.');
  }
  await updateDoc(itemRef, {
    isComplete,
    completedAt: isComplete ? new Date().toISOString() : null,
    updatedAt: serverTimestamp(),
  });
}

// ==================== PROFILE ====================

export async function getOrCreateProfile(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Promise<void> {
  const profileRef = doc(db, 'profiles', user.uid);
  const snapshot = await getDoc(profileRef);
  if (!snapshot.exists()) {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(profileRef, {
      id: user.uid,
      displayName: user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update last sign-in info
    await updateDoc(profileRef, {
      displayName: user.displayName || snapshot.data().displayName,
      photoURL: user.photoURL || snapshot.data().photoURL,
      updatedAt: serverTimestamp(),
    });
  }
}
