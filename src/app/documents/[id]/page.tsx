'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Check,
  Calendar,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentChecklist,
  toggleChecklistItem,
  createRenewalEvent,
  getDocumentRenewalEvents,
} from '@/lib/firestore';
import {
  getExpiryInfo,
  getStatusLabel,
  formatDate,
  isValidUrl,
  getTodayString,
} from '@/lib/dates';
import { DOCUMENT_CATEGORIES, getCategoryLabel, type DocumentFormData, type RenewalFormData, type RemnexaDocument, type ChecklistItem, type RenewalEvent } from '@/lib/types';

export default function DocumentDetailPage() {
  return (
    <ProtectedRoute>
      <DocumentDetailContent />
    </ProtectedRoute>
  );
}

function DocumentDetailContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [doc, setDoc] = useState<RemnexaDocument | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [renewalEvents, setRenewalEvents] = useState<RenewalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !documentId) return;
    try {
      setLoading(true);
      setError(null);
      const [docData, checklistData, eventsData] = await Promise.all([
        getDocumentById(user.uid, documentId),
        getDocumentChecklist(user.uid, documentId),
        getDocumentRenewalEvents(user.uid, documentId),
      ]);
      if (!docData) {
        setError('This document is unavailable or you do not have permission to access it.');
        setDoc(null);
      } else {
        setDoc(docData);
        setChecklist(checklistData);
        setRenewalEvents(eventsData);
      }
    } catch (err) {
      console.error('[Remnexa] Document load error:', err);
      setError('Failed to load document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleChecklist = async (itemId: string, isComplete: boolean) => {
    if (!user) return;
    try {
      await toggleChecklistItem(user.uid, itemId, isComplete);
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, isComplete, completedAt: isComplete ? new Date().toISOString() : null }
            : item
        )
      );
    } catch {
      addToast('error', 'Failed to update checklist item.');
    }
  };

  const handleDelete = async () => {
    if (!user || !doc) return;
    try {
      await deleteDocument(user.uid, doc.id);
      addToast('success', 'Document deleted.');
      router.push('/documents');
    } catch {
      addToast('error', 'Failed to delete document. Please try again.');
    }
  };

  const expiryInfo = doc ? getExpiryInfo(doc.expiryDate) : null;

  if (loading) {
    return (
      <AppShell>
        <div className="page-content" style={{ maxWidth: '800px' }}>
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-block" />
        </div>
      </AppShell>
    );
  }

  if (error || !doc) {
    return (
      <AppShell>
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h2 className="empty-state-title">Document not found</h2>
            <p className="empty-state-desc">
              {error || 'This document is unavailable or you do not have permission to access it.'}
            </p>
            <Link href="/documents" className="btn btn-primary">
              Back to documents
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-content" style={{ maxWidth: '800px' }}>
        {/* Back button */}
        <Link href="/documents" className="btn btn-tertiary btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          <ArrowLeft size={14} />
          Back to documents
        </Link>

        {/* Header */}
        <div className="doc-detail-header">
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
              <h1 className="page-title">{doc.name}</h1>
              {expiryInfo && (
                <StatusBadge status={expiryInfo.status} label={getStatusLabel(expiryInfo.status)} />
              )}
            </div>
            <p className="text-secondary text-sm">
              {getCategoryLabel(doc.category)}
              {doc.issuer && ` \u00b7 ${doc.issuer}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
              <Edit2 size={14} />
              Edit
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRenewalModal(true)}>
              <RefreshCw size={14} />
              Mark renewed
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(true)} style={{ color: 'var(--color-danger)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="doc-detail-meta">
          <div className="doc-detail-meta-item">
            <span className="doc-detail-meta-label">
              <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Expiry date
            </span>
            <span className="doc-detail-meta-value tabular-nums">{formatDate(doc.expiryDate)}</span>
          </div>
          <div className="doc-detail-meta-item">
            <span className="doc-detail-meta-label">
              <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Days remaining
            </span>
            <span className="doc-detail-meta-value tabular-nums" style={{
              color: expiryInfo && expiryInfo.daysRemaining < 0 ? 'var(--color-danger)' : undefined,
            }}>
              {expiryInfo?.label || '-'}
            </span>
          </div>
          {doc.issueDate && (
            <div className="doc-detail-meta-item">
              <span className="doc-detail-meta-label">Issue date</span>
              <span className="doc-detail-meta-value tabular-nums">{formatDate(doc.issueDate)}</span>
            </div>
          )}
          <div className="doc-detail-meta-item">
            <span className="doc-detail-meta-label">
              <Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Category
            </span>
            <span className="doc-detail-meta-value">{getCategoryLabel(doc.category)}</span>
          </div>
          {doc.issuer && (
            <div className="doc-detail-meta-item">
              <span className="doc-detail-meta-label">Issuer</span>
              <span className="doc-detail-meta-value">{doc.issuer}</span>
            </div>
          )}
          {doc.referenceNumber && (
            <div className="doc-detail-meta-item">
              <span className="doc-detail-meta-label">Reference number</span>
              <span className="doc-detail-meta-value" style={{ fontFamily: 'monospace' }}>{doc.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Renewal link */}
        {doc.renewalUrl && (
          <div className="card mb-6">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Renewal portal</h3>
            <a
              href={doc.renewalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={14} />
              Open renewal portal
            </a>
            <p className="text-xs text-secondary mt-2">
              Opens in a new tab. Visiting the portal does not automatically complete a renewal.
            </p>
          </div>
        )}

        {/* Notes */}
        {doc.notes && (
          <div className="card mb-6">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Notes</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {doc.notes}
            </p>
          </div>
        )}

        {/* Checklist */}
        <div className="card mb-6">
          <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-1)' }}>Renewal checklist</h3>
          <p className="text-xs text-secondary mb-4">
            General guidance steps. These are not official requirements.
          </p>
          {checklist.length > 0 ? (
            <div>
              {checklist.map((item) => (
                <div key={item.id} className="checklist-item">
                  <button
                    className={`checklist-checkbox ${item.isComplete ? 'checked' : ''}`}
                    onClick={() => handleToggleChecklist(item.id, !item.isComplete)}
                    aria-label={item.isComplete ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
                  >
                    {item.isComplete && <Check size={12} />}
                  </button>
                  <span className={`checklist-text ${item.isComplete ? 'completed' : ''}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary text-sm">No checklist items for this document.</p>
          )}
        </div>

        {/* Renewal history */}
        {renewalEvents.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Renewal history</h3>
            {renewalEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Renewed on {formatDate(event.renewedOn)}</span>
                  </div>
                  <div className="text-xs text-secondary tabular-nums">
                    {event.previousExpiryDate && `${formatDate(event.previousExpiryDate)} \u2192 `}
                    {formatDate(event.newExpiryDate)}
                  </div>
                </div>
                {event.notes && (
                  <p className="text-xs text-secondary mt-1">{event.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <EditDocumentModal
            doc={doc}
            onClose={() => setShowEditModal(false)}
            onSaved={() => {
              setShowEditModal(false);
              loadData();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Delete document">
              <h2 className="modal-title">Delete document</h2>
              <p className="text-secondary text-sm">
                Are you sure you want to permanently delete &ldquo;{doc.name}&rdquo;? This will also remove its checklist items. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Trash2 size={14} />
                  Delete permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Renewal Modal */}
        {showRenewalModal && (
          <RenewalModal
            doc={doc}
            onClose={() => setShowRenewalModal(false)}
            onRenewed={() => {
              setShowRenewalModal(false);
              loadData();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

// Edit Document Modal
function EditDocumentModal({
  doc,
  onClose,
  onSaved,
}: {
  doc: RemnexaDocument;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<DocumentFormData>({
    name: doc.name,
    category: doc.category,
    issuer: doc.issuer || '',
    referenceNumber: doc.referenceNumber || '',
    issueDate: doc.issueDate || '',
    expiryDate: doc.expiryDate,
    renewalUrl: doc.renewalUrl || '',
    notes: doc.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Document name is required.';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required.';
    if (formData.renewalUrl && !isValidUrl(formData.renewalUrl)) newErrors.renewalUrl = 'Invalid URL.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      setSaving(true);
      await updateDocument(user.uid, doc.id, formData);
      addToast('success', 'Document updated.');
      onSaved();
    } catch {
      addToast('error', 'Failed to update document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit document" style={{ maxWidth: '560px' }}>
        <h2 className="modal-title">Edit document</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-4">
            <label htmlFor="edit-name" className="form-label">Name <span className="required">*</span></label>
            <input type="text" id="edit-name" name="name" className={`form-input ${errors.name ? 'error' : ''}`} value={formData.name} onChange={handleChange} />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-category" className="form-label">Category</label>
            <select id="edit-category" name="category" className="form-select" value={formData.category} onChange={handleChange}>
              {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-expiryDate" className="form-label">Expiry date <span className="required">*</span></label>
            <input type="date" id="edit-expiryDate" name="expiryDate" className={`form-input ${errors.expiryDate ? 'error' : ''}`} value={formData.expiryDate} onChange={handleChange} />
            {errors.expiryDate && <span className="form-error">{errors.expiryDate}</span>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-issueDate" className="form-label">Issue date</label>
            <input type="date" id="edit-issueDate" name="issueDate" className="form-input" value={formData.issueDate} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-issuer" className="form-label">Issuer</label>
            <input type="text" id="edit-issuer" name="issuer" className="form-input" value={formData.issuer} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-referenceNumber" className="form-label">Reference number</label>
            <input type="text" id="edit-referenceNumber" name="referenceNumber" className="form-input" value={formData.referenceNumber} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-renewalUrl" className="form-label">Renewal URL</label>
            <input type="url" id="edit-renewalUrl" name="renewalUrl" className={`form-input ${errors.renewalUrl ? 'error' : ''}`} value={formData.renewalUrl} onChange={handleChange} />
            {errors.renewalUrl && <span className="form-error">{errors.renewalUrl}</span>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="edit-notes" className="form-label">Notes</label>
            <textarea id="edit-notes" name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} rows={3} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Renewal Modal
function RenewalModal({
  doc,
  onClose,
  onRenewed,
}: {
  doc: RemnexaDocument;
  onClose: () => void;
  onRenewed: () => void;
}) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<RenewalFormData>({
    newExpiryDate: '',
    renewedOn: getTodayString(),
    notes: '',
    newRenewalUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newErrors: Record<string, string> = {};
    if (!formData.newExpiryDate) newErrors.newExpiryDate = 'New expiry date is required.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      setSaving(true);
      await createRenewalEvent(user.uid, doc, formData);
      addToast('success', `"${doc.name}" marked as renewed. Expiry updated to ${formData.newExpiryDate}.`);
      onRenewed();
    } catch {
      addToast('error', 'Failed to record renewal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Mark as renewed">
        <h2 className="modal-title">Mark as renewed</h2>
        <p className="text-secondary text-sm mb-4">
          Record a renewal for &ldquo;{doc.name}&rdquo;. Current expiry: {formatDate(doc.expiryDate)}.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-4">
            <label htmlFor="renewal-newExpiryDate" className="form-label">New expiry date <span className="required">*</span></label>
            <input type="date" id="renewal-newExpiryDate" name="newExpiryDate" className={`form-input ${errors.newExpiryDate ? 'error' : ''}`} value={formData.newExpiryDate} onChange={handleChange} />
            {errors.newExpiryDate && <span className="form-error">{errors.newExpiryDate}</span>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="renewal-renewedOn" className="form-label">Renewed on</label>
            <input type="date" id="renewal-renewedOn" name="renewedOn" className="form-input" value={formData.renewedOn} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="renewal-newRenewalUrl" className="form-label">New renewal URL (optional)</label>
            <input type="url" id="renewal-newRenewalUrl" name="newRenewalUrl" className="form-input" value={formData.newRenewalUrl} onChange={handleChange} />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="renewal-notes" className="form-label">Notes</label>
            <textarea id="renewal-notes" name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} rows={2} placeholder="e.g. Renewed online, confirmation #12345" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving...' : 'Confirm renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
