/**
 * Document categories and types for Remnexa.
 */

export const DOCUMENT_CATEGORIES = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'passport_identity', label: 'Passport and Identity' },
  { value: 'certificate_permit', label: 'Certificate or Permit' },
  { value: 'other', label: 'Other' },
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]['value'];

export interface RemnexaDocument {
  id: string;
  userId: string;
  name: string;
  category: DocumentCategory;
  issuer?: string;
  referenceNumber?: string;
  issueDate?: string;       // YYYY-MM-DD
  expiryDate: string;       // YYYY-MM-DD
  renewalUrl?: string;
  notes?: string;
  storagePath?: string;
  archivedAt?: string | null;
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
}

export interface RenewalEvent {
  id: string;
  userId: string;
  documentId: string;
  documentName: string;     // Denormalized for display when doc is deleted
  documentCategory: string;
  previousExpiryDate?: string;
  newExpiryDate: string;
  renewedOn: string;        // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isComplete: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

// Form types
export interface DocumentFormData {
  name: string;
  category: DocumentCategory;
  issuer: string;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string;
  renewalUrl: string;
  notes: string;
}

export interface RenewalFormData {
  newExpiryDate: string;
  renewedOn: string;
  notes: string;
  newRenewalUrl: string;
}

// Default checklist items per category (general guidance, not official requirements)
export const DEFAULT_CHECKLIST_ITEMS: Record<string, string[]> = {
  insurance: [
    'Review current coverage details',
    'Compare renewal quotes',
    'Check for no-claim bonus eligibility',
    'Update personal information if changed',
    'Complete payment for renewal',
  ],
  vehicle: [
    'Check vehicle registration validity',
    'Ensure insurance is up to date',
    'Schedule inspection if required',
    'Gather required documentation',
    'Submit renewal application',
  ],
  driving_licence: [
    'Check licence validity period',
    'Prepare passport-size photographs',
    'Get medical certificate if required',
    'Gather identity and address proof',
    'Apply through the licensing authority',
  ],
  passport_identity: [
    'Check passport validity and pages remaining',
    'Gather supporting documents',
    'Fill out the renewal application',
    'Schedule appointment if required',
    'Submit application and track status',
  ],
  certificate_permit: [
    'Review certificate or permit requirements',
    'Gather required supporting documents',
    'Check for any exam or assessment requirements',
    'Complete the renewal application',
    'Pay applicable fees',
  ],
  other: [
    'Review document requirements',
    'Gather necessary documentation',
    'Complete the renewal or update process',
  ],
};

export function getCategoryLabel(value: string): string {
  const cat = DOCUMENT_CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
}
