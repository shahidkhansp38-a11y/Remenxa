'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import { createDocument } from '@/lib/firestore';
import { DOCUMENT_CATEGORIES, type DocumentFormData } from '@/lib/types';
import { isValidUrl } from '@/lib/dates';

export default function NewDocumentPage() {
  return (
    <ProtectedRoute>
      <NewDocumentContent />
    </ProtectedRoute>
  );
}

function NewDocumentContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<DocumentFormData>({
    name: '',
    category: 'insurance',
    issuer: '',
    referenceNumber: '',
    issueDate: '',
    expiryDate: '',
    renewalUrl: '',
    notes: '',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Document name is required.';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required. Remnexa uses this to track when your document needs renewal.';
    }

    if (formData.issueDate && formData.expiryDate && formData.issueDate > formData.expiryDate) {
      newErrors.issueDate = 'Issue date must be before the expiry date.';
    }

    if (formData.renewalUrl && !isValidUrl(formData.renewalUrl)) {
      newErrors.renewalUrl = 'Please enter a valid URL (e.g. https://example.com).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    try {
      setSaving(true);
      await createDocument(user.uid, formData);
      addToast('success', 'Document saved.');
      router.push('/documents');
    } catch (err) {
      console.error('[Remnexa] Save error:', err);
      addToast('error', 'We could not save this document. Your changes are still here. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="page-content" style={{ maxWidth: '640px' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Link href="/documents" className="btn btn-tertiary btn-sm" style={{ marginBottom: 'var(--space-3)' }}>
            <ArrowLeft size={14} />
            Back to documents
          </Link>
          <h1 className="page-title">Add document</h1>
          <p className="text-secondary text-sm mt-2">
            Enter the details of the document you want to track. The expiry date is used to calculate status and reminders.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card">
            <div className="form-group mb-4">
              <label htmlFor="name" className="form-label">
                Document name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Car Insurance Policy"
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="expiryDate" className="form-label">
                Expiry date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className={`form-input ${errors.expiryDate ? 'error' : ''}`}
                value={formData.expiryDate}
                onChange={handleChange}
              />
              {errors.expiryDate && <span className="form-error">{errors.expiryDate}</span>}
              {!errors.expiryDate && (
                <span className="form-hint">When does this document expire? This drives reminders and status tracking.</span>
              )}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="issueDate" className="form-label">Issue date</label>
              <input
                type="date"
                id="issueDate"
                name="issueDate"
                className={`form-input ${errors.issueDate ? 'error' : ''}`}
                value={formData.issueDate}
                onChange={handleChange}
              />
              {errors.issueDate && <span className="form-error">{errors.issueDate}</span>}
            </div>

            <div className="form-group mb-4">
              <label htmlFor="issuer" className="form-label">Issuer / Provider</label>
              <input
                type="text"
                id="issuer"
                name="issuer"
                className="form-input"
                value={formData.issuer}
                onChange={handleChange}
                placeholder="e.g. State Farm, DMV"
              />
            </div>

            <div className="form-group mb-4">
              <label htmlFor="referenceNumber" className="form-label">Document / Reference number</label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                className="form-input"
                value={formData.referenceNumber}
                onChange={handleChange}
                placeholder="e.g. POL-12345678"
              />
              <span className="form-hint">This is stored securely and not shown in list views.</span>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="renewalUrl" className="form-label">Renewal URL</label>
              <input
                type="url"
                id="renewalUrl"
                name="renewalUrl"
                className={`form-input ${errors.renewalUrl ? 'error' : ''}`}
                value={formData.renewalUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
              {errors.renewalUrl && <span className="form-error">{errors.renewalUrl}</span>}
              <span className="form-hint">Link to the external portal where you can renew this document.</span>
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="form-textarea"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
            <Link href="/documents" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving...' : 'Save document'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
