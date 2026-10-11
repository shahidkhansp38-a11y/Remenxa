'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  getUserDocuments,
  getDocumentChecklist,
  toggleChecklistItem,
  createRenewalEvent,
} from '@/lib/firestore';
import {
  getExpiryInfo,
  getStatusLabel,
  formatDate,
  getTodayString,
  needsAttention,
} from '@/lib/dates';
import { getCategoryLabel, type RemnexaDocument, type ChecklistItem, type RenewalFormData } from '@/lib/types';

export default function RenewalAssistantPage() {
  return (
    <ProtectedRoute>
      <RenewalAssistantContent />
    </ProtectedRoute>
  );
}

function RenewalAssistantContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<RemnexaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<RemnexaDocument | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [renewalSaving, setRenewalSaving] = useState(false);
  const [renewalForm, setRenewalForm] = useState<RenewalFormData>({
    newExpiryDate: '',
    renewedOn: getTodayString(),
    notes: '',
    newRenewalUrl: '',
  });
  const [renewalErrors, setRenewalErrors] = useState<Record<string, string>>({});

  const loadDocs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const docs = await getUserDocuments(user.uid);
      setDocuments(docs);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleSelectDoc = async (doc: RemnexaDocument) => {
    if (!user) return;
    setSelectedDoc(doc);
    setShowRenewalForm(false);
    setRenewalForm({ newExpiryDate: '', renewedOn: getTodayString(), notes: '', newRenewalUrl: '' });
    try {
      setChecklistLoading(true);
      const items = await getDocumentChecklist(user.uid, doc.id);
      setChecklist(items);
    } catch {
      addToast('error', 'Failed to load checklist.');
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleChecklist = async (itemId: string, isComplete: boolean) => {
    if (!user) return;
    try {
      await toggleChecklistItem(user.uid, itemId, isComplete);
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isComplete, completedAt: isComplete ? new Date().toISOString() : null } : item
        )
      );
    } catch {
      addToast('error', 'Failed to update checklist.');
    }
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoc) return;

    const errs: Record<string, string> = {};
    if (!renewalForm.newExpiryDate) errs.newExpiryDate = 'New expiry date is required.';
    if (Object.keys(errs).length > 0) { setRenewalErrors(errs); return; }

    try {
      setRenewalSaving(true);
      await createRenewalEvent(user.uid, selectedDoc, renewalForm);
      addToast('success', `"${selectedDoc.name}" marked as renewed.`);
      setSelectedDoc(null);
      setShowRenewalForm(false);
      await loadDocs();
    } catch {
      addToast('error', 'Failed to record renewal.');
    } finally {
      setRenewalSaving(false);
    }
  };

  const expiryInfo = selectedDoc ? getExpiryInfo(selectedDoc.expiryDate) : null;
  const completedCount = checklist.filter((c) => c.isComplete).length;
  const attentionCount = documents
    .map((d) => getExpiryInfo(d.expiryDate))
    .filter((info) => info && needsAttention(info.status)).length;

  return (
    <AppShell attentionCount={attentionCount}>
      <div className="page-content">
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">
              <RefreshCw size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Renewal Assistant
            </h1>
            <p className="text-secondary text-sm mt-2">
              Select a document, review the checklist, visit the renewal portal, and record the renewal.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-danger-soft)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
            {error}
            <button className="btn btn-sm btn-secondary" onClick={loadDocs} style={{ marginLeft: 'var(--space-3)' }}>Retry</button>
          </div>
        )}

        <div className="grid-2col" style={{ alignItems: 'flex-start' }}>
          {/* Document picker */}
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Select a document</h3>
            {loading ? (
              <div className="skeleton skeleton-block" />
            ) : documents.length === 0 ? (
              <div className="card">
                <p className="text-secondary text-sm">No documents found. Add a document first.</p>
                <Link href="/documents/new" className="btn btn-primary btn-sm mt-4">Add document</Link>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, maxHeight: '480px', overflowY: 'auto' }}>
                {documents.map((doc) => {
                  const info = getExpiryInfo(doc.expiryDate);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        background: selectedDoc?.id === doc.id ? 'var(--color-primary-soft)' : 'var(--color-canvas)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-size-sm)',
                        transition: 'background-color var(--transition-fast)',
                      }}
                    >
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-secondary">{getCategoryLabel(doc.category)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {info && <StatusBadge status={info.status} label={getStatusLabel(info.status)} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workflow panel */}
          <div>
            {!selectedDoc ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <FileText size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                <p className="text-secondary text-sm">Select a document from the list to start the renewal process.</p>
              </div>
            ) : (
              <>
                {/* Document info */}
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 style={{ fontSize: 'var(--font-size-md)' }}>{selectedDoc.name}</h3>
                    {expiryInfo && <StatusBadge status={expiryInfo.status} label={getStatusLabel(expiryInfo.status)} />}
                  </div>
                  <div className="text-sm text-secondary">
                    <span>Expiry: {formatDate(selectedDoc.expiryDate)}</span>
                    {expiryInfo && <span> &middot; {expiryInfo.label}</span>}
                  </div>
                </div>

                {/* Checklist */}
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 style={{ fontSize: 'var(--font-size-md)' }}>Renewal checklist</h3>
                    <span className="text-xs text-secondary tabular-nums">{completedCount}/{checklist.length}</span>
                  </div>
                  <p className="text-xs text-secondary mb-3">General guidance steps. Not official requirements.</p>
                  {checklistLoading ? (
                    <div className="skeleton skeleton-block" />
                  ) : checklist.length > 0 ? (
                    checklist.map((item) => (
                      <div key={item.id} className="checklist-item">
                        <button
                          className={`checklist-checkbox ${item.isComplete ? 'checked' : ''}`}
                          onClick={() => handleToggleChecklist(item.id, !item.isComplete)}
                          aria-label={item.isComplete ? `Mark "${item.title}" incomplete` : `Mark "${item.title}" complete`}
                        >
                          {item.isComplete && <Check size={12} />}
                        </button>
                        <span className={`checklist-text ${item.isComplete ? 'completed' : ''}`}>{item.title}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-secondary text-sm">No checklist items.</p>
                  )}
                </div>

                {/* Renewal link */}
                {selectedDoc.renewalUrl ? (
                  <div className="card mb-4">
                    <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Renewal portal</h3>
                    <a href={selectedDoc.renewalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      <ExternalLink size={14} /> Open renewal portal
                    </a>
                    <p className="text-xs text-secondary mt-2">Opens in a new tab. Visiting the portal does not complete the renewal.</p>
                  </div>
                ) : (
                  <div className="card mb-4">
                    <p className="text-secondary text-sm">No renewal link added. <Link href={`/documents/${selectedDoc.id}`}>Edit document</Link> to add one.</p>
                  </div>
                )}

                {/* Mark as renewed */}
                {!showRenewalForm ? (
                  <button className="btn btn-primary w-full" onClick={() => setShowRenewalForm(true)}>
                    <RefreshCw size={14} /> Mark as renewed
                  </button>
                ) : (
                  <div className="card">
                    <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Record renewal</h3>
                    <form onSubmit={handleRenewalSubmit} noValidate>
                      <div className="form-group mb-4">
                        <label htmlFor="ra-newExpiryDate" className="form-label">New expiry date <span className="required">*</span></label>
                        <input type="date" id="ra-newExpiryDate" name="newExpiryDate" className={`form-input ${renewalErrors.newExpiryDate ? 'error' : ''}`} value={renewalForm.newExpiryDate} onChange={(e) => { setRenewalForm((p) => ({ ...p, newExpiryDate: e.target.value })); setRenewalErrors({}); }} />
                        {renewalErrors.newExpiryDate && <span className="form-error">{renewalErrors.newExpiryDate}</span>}
                      </div>
                      <div className="form-group mb-4">
                        <label htmlFor="ra-renewedOn" className="form-label">Renewed on</label>
                        <input type="date" id="ra-renewedOn" name="renewedOn" className="form-input" value={renewalForm.renewedOn} onChange={(e) => setRenewalForm((p) => ({ ...p, renewedOn: e.target.value }))} />
                      </div>
                      <div className="form-group mb-4">
                        <label htmlFor="ra-notes" className="form-label">Notes</label>
                        <textarea id="ra-notes" name="notes" className="form-textarea" value={renewalForm.notes} onChange={(e) => setRenewalForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
                      </div>
                      <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowRenewalForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={renewalSaving}>
                          {renewalSaving && <span className="spinner" />}
                          {renewalSaving ? 'Saving...' : 'Confirm renewal'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
