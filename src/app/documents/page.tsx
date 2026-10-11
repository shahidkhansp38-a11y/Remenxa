'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, FileText, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUserDocuments } from '@/lib/firestore';
import { getExpiryInfo, getStatusLabel, formatDate, needsAttention } from '@/lib/dates';
import { DOCUMENT_CATEGORIES, getCategoryLabel } from '@/lib/types';
import type { RemnexaDocument } from '@/lib/types';

type SortKey = 'expiry' | 'name' | 'created' | 'updated';
type StatusFilter = 'all' | 'overdue' | 'urgent' | 'upcoming' | 'valid';

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsContent />
    </ProtectedRoute>
  );
}

function DocumentsContent() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RemnexaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('expiry');

  const loadDocs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const docs = await getUserDocuments(user.uid);
      setDocuments(docs);
    } catch (err) {
      console.error('[Remnexa] Documents load error:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const docsWithStatus = useMemo(
    () => documents.map((d) => ({ ...d, expiryInfo: getExpiryInfo(d.expiryDate) })),
    [documents]
  );

  const filtered = useMemo(() => {
    let result = docsWithStatus;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          getCategoryLabel(d.category).toLowerCase().includes(q) ||
          (d.issuer && d.issuer.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((d) => {
        if (!d.expiryInfo) return false;
        switch (statusFilter) {
          case 'overdue':
            return d.expiryInfo.status === 'overdue' || d.expiryInfo.status === 'expires_today';
          case 'urgent':
            return d.expiryInfo.status === 'urgent';
          case 'upcoming':
            return d.expiryInfo.status === 'upcoming';
          case 'valid':
            return d.expiryInfo.status === 'later';
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'expiry':
          return a.expiryDate.localeCompare(b.expiryDate);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt.localeCompare(a.createdAt);
        case 'updated':
          return b.updatedAt.localeCompare(a.updatedAt);
        default:
          return 0;
      }
    });

    return result;
  }, [docsWithStatus, search, categoryFilter, statusFilter, sortBy]);

  const attentionCount = docsWithStatus.filter(
    (d) => d.expiryInfo && needsAttention(d.expiryInfo.status)
  ).length;

  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  return (
    <AppShell attentionCount={attentionCount}>
      <div className="page-content">
        <div className="page-title-bar">
          <h1 className="page-title">Documents</h1>
          <Link href="/documents/new" className="btn btn-primary">
            <PlusCircle size={16} />
            Add document
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-danger-soft)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" onClick={loadDocs}>
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search documents"
            />
          </div>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="all">All categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="all">All statuses</option>
            <option value="overdue">Overdue</option>
            <option value="urgent">Urgent</option>
            <option value="upcoming">Upcoming</option>
            <option value="valid">Valid</option>
          </select>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label="Sort by"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="expiry">Sort by expiry</option>
            <option value="name">Sort by name</option>
            <option value="created">Sort by created</option>
            <option value="updated">Sort by updated</option>
          </select>
          {hasActiveFilters && (
            <button className="btn btn-tertiary btn-sm" onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-block" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          hasActiveFilters ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={48} /></div>
              <h2 className="empty-state-title">No documents match your filters</h2>
              <p className="empty-state-desc">Try adjusting your search or filter criteria.</p>
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={48} /></div>
              <h2 className="empty-state-title">No documents yet</h2>
              <p className="empty-state-desc">Add your first document to start tracking expiry dates and renewals.</p>
              <Link href="/documents/new" className="btn btn-primary">
                <PlusCircle size={16} />
                Add document
              </Link>
            </div>
          )
        ) : (
          <div className="data-table-responsive">
            <div className="card" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Category</th>
                    <th>Expiry date</th>
                    <th>Status</th>
                    <th>Days</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-medium"
                          style={{ color: 'var(--color-ink)', textDecoration: 'none' }}
                        >
                          {doc.name}
                        </Link>
                        {doc.issuer && (
                          <div className="text-xs text-secondary">{doc.issuer}</div>
                        )}
                      </td>
                      <td className="text-sm text-secondary">{getCategoryLabel(doc.category)}</td>
                      <td className="text-sm tabular-nums">{formatDate(doc.expiryDate)}</td>
                      <td>
                        {doc.expiryInfo && (
                          <StatusBadge status={doc.expiryInfo.status} label={getStatusLabel(doc.expiryInfo.status)} />
                        )}
                      </td>
                      <td className="text-sm tabular-nums">
                        {doc.expiryInfo && (
                          <span style={{
                            color: doc.expiryInfo.daysRemaining < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                          }}>
                            {doc.expiryInfo.daysRemaining < 0
                              ? `${Math.abs(doc.expiryInfo.daysRemaining)}d overdue`
                              : doc.expiryInfo.daysRemaining === 0
                              ? 'Today'
                              : `${doc.expiryInfo.daysRemaining}d`}
                          </span>
                        )}
                      </td>
                      <td>
                        <Link href={`/documents/${doc.id}`} className="btn btn-tertiary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-secondary mt-4">
              Showing {filtered.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
