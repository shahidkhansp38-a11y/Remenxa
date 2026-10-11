'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Bell, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUserDocuments } from '@/lib/firestore';
import { getExpiryInfo, getStatusLabel, formatDate, needsAttention, type ExpiryStatus } from '@/lib/dates';
import { getCategoryLabel, type RemnexaDocument } from '@/lib/types';

type ReminderFilter = 'all' | 'overdue' | 'urgent' | 'upcoming';

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <RemindersContent />
    </ProtectedRoute>
  );
}

function RemindersContent() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RemnexaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderFilter>('all');

  const loadDocs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const docs = await getUserDocuments(user.uid);
      setDocuments(docs);
    } catch {
      setError('Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const docsWithStatus = useMemo(
    () =>
      documents
        .map((d) => ({ ...d, expiryInfo: getExpiryInfo(d.expiryDate) }))
        .filter((d) => d.expiryInfo && d.expiryInfo.status !== 'later')
        .sort((a, b) => (a.expiryInfo?.daysRemaining ?? 0) - (b.expiryInfo?.daysRemaining ?? 0)),
    [documents]
  );

  const counts = useMemo(() => {
    const c = { all: 0, overdue: 0, urgent: 0, upcoming: 0 };
    docsWithStatus.forEach((d) => {
      if (!d.expiryInfo) return;
      c.all++;
      if (d.expiryInfo.status === 'overdue' || d.expiryInfo.status === 'expires_today') c.overdue++;
      else if (d.expiryInfo.status === 'urgent') c.urgent++;
      else if (d.expiryInfo.status === 'upcoming') c.upcoming++;
    });
    return c;
  }, [docsWithStatus]);

  const filtered = useMemo(() => {
    if (filter === 'all') return docsWithStatus;
    return docsWithStatus.filter((d) => {
      if (!d.expiryInfo) return false;
      if (filter === 'overdue') return d.expiryInfo.status === 'overdue' || d.expiryInfo.status === 'expires_today';
      if (filter === 'urgent') return d.expiryInfo.status === 'urgent';
      if (filter === 'upcoming') return d.expiryInfo.status === 'upcoming';
      return true;
    });
  }, [docsWithStatus, filter]);

  const attentionCount = docsWithStatus.filter(
    (d) => d.expiryInfo && needsAttention(d.expiryInfo.status)
  ).length;

  const tabs: { key: ReminderFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'urgent', label: 'Urgent', count: counts.urgent },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
  ];

  return (
    <AppShell attentionCount={attentionCount}>
      <div className="page-content">
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">
              <Bell size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Reminders
            </h1>
            <p className="text-secondary text-sm mt-2">
              Documents that need your attention based on their expiry dates. These are in-app reminders only.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-danger-soft)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" onClick={loadDocs}>Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab ${filter === t.key ? 'active' : ''}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              <span className="tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-block" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={48} /></div>
            <h2 className="empty-state-title">
              {filter === 'all' ? 'No reminders' : `No ${filter} documents`}
            </h2>
            <p className="empty-state-desc">
              {filter === 'all'
                ? 'All your documents are valid and not expiring within 30 days.'
                : `No documents match the "${filter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Expiry date</th>
                  <th>Status</th>
                  <th>Time remaining</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-medium">{doc.name}</td>
                    <td className="text-sm text-secondary">{getCategoryLabel(doc.category)}</td>
                    <td className="text-sm tabular-nums">{formatDate(doc.expiryDate)}</td>
                    <td>
                      {doc.expiryInfo && (
                        <StatusBadge status={doc.expiryInfo.status} label={getStatusLabel(doc.expiryInfo.status)} />
                      )}
                    </td>
                    <td className="text-sm tabular-nums" style={{
                      color: doc.expiryInfo && doc.expiryInfo.daysRemaining < 0 ? 'var(--color-danger)' : undefined,
                    }}>
                      {doc.expiryInfo?.label}
                    </td>
                    <td>
                      <Link href={`/documents/${doc.id}`} className="btn btn-tertiary btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
