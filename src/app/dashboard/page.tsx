'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { getUserDocuments } from '@/lib/firestore';
import { getRenewalEvents } from '@/lib/firestore';
import { getExpiryInfo, getStatusLabel, formatDate, needsAttention } from '@/lib/dates';
import type { RemnexaDocument, RenewalEvent } from '@/lib/types';
import { getCategoryLabel } from '@/lib/types';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RemnexaDocument[]>([]);
  const [renewalEvents, setRenewalEvents] = useState<RenewalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [docs, events] = await Promise.all([
        getUserDocuments(user.uid),
        getRenewalEvents(user.uid),
      ]);
      setDocuments(docs);
      setRenewalEvents(events);
    } catch (err) {
      console.error('[Remnexa] Dashboard load error:', err);
      setError('Failed to load your documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute stats
  const docsWithStatus = documents.map((doc) => ({
    ...doc,
    expiryInfo: getExpiryInfo(doc.expiryDate),
  }));

  const totalActive = documents.length;
  const overdueCount = docsWithStatus.filter(
    (d) => d.expiryInfo?.status === 'overdue' || d.expiryInfo?.status === 'expires_today'
  ).length;
  const urgentCount = docsWithStatus.filter(
    (d) => d.expiryInfo?.status === 'urgent'
  ).length;
  const expiringSoonCount = overdueCount + urgentCount;

  // Current month renewals
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const renewedThisMonth = renewalEvents.filter(
    (e) => e.renewedOn && e.renewedOn.startsWith(thisMonth)
  ).length;

  // Needs attention (overdue + expires today + urgent), sorted by expiry
  const attentionDocs = docsWithStatus
    .filter((d) => d.expiryInfo && needsAttention(d.expiryInfo.status))
    .sort((a, b) => (a.expiryInfo?.daysRemaining ?? 0) - (b.expiryInfo?.daysRemaining ?? 0));

  // Upcoming expiries (next 30 days, excluding attention items)
  const upcomingDocs = docsWithStatus
    .filter((d) => d.expiryInfo?.status === 'upcoming')
    .sort((a, b) => (a.expiryInfo?.daysRemaining ?? 0) - (b.expiryInfo?.daysRemaining ?? 0))
    .slice(0, 5);

  // Recent renewals
  const recentRenewals = renewalEvents.slice(0, 5);

  const attentionCount = attentionDocs.length;

  return (
    <AppShell attentionCount={attentionCount}>
      <div className="page-content">
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-secondary text-sm" style={{ marginTop: 'var(--space-1)' }}>
              {user?.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'Welcome back'}
            </p>
          </div>
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
            <button className="btn btn-sm btn-secondary" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : totalActive === 0 ? (
          <EmptyDashboard />
        ) : (
          <>
            {/* Stats */}
            <div className="grid-stats mb-6">
              <div className="stat-box">
                <div className="stat-box-label">Total Documents</div>
                <div className="stat-box-value">{totalActive}</div>
              </div>
              <div className="stat-box" style={expiringSoonCount > 0 ? { borderColor: 'var(--color-warning)' } : {}}>
                <div className="stat-box-label">Expiring Soon</div>
                <div className="stat-box-value" style={expiringSoonCount > 0 ? { color: 'var(--color-warning)' } : {}}>
                  {expiringSoonCount}
                </div>
              </div>
              <div className="stat-box" style={overdueCount > 0 ? { borderColor: 'var(--color-danger)' } : {}}>
                <div className="stat-box-label">Overdue</div>
                <div className="stat-box-value" style={overdueCount > 0 ? { color: 'var(--color-danger)' } : {}}>
                  {overdueCount}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-box-label">Renewed This Month</div>
                <div className="stat-box-value">{renewedThisMonth}</div>
              </div>
            </div>

            {/* Needs Attention */}
            {attentionDocs.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: 'var(--font-size-lg)' }}>
                    <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-warning)' }} />
                    Needs attention
                  </h2>
                  <Link href="/reminders" className="btn btn-tertiary btn-sm">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="card" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Category</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {attentionDocs.slice(0, 5).map((doc) => (
                        <tr key={doc.id}>
                          <td className="font-medium">{doc.name}</td>
                          <td className="text-secondary text-sm">{getCategoryLabel(doc.category)}</td>
                          <td className="tabular-nums text-sm">{formatDate(doc.expiryDate)}</td>
                          <td>
                            {doc.expiryInfo && (
                              <StatusBadge status={doc.expiryInfo.status} label={getStatusLabel(doc.expiryInfo.status)} />
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
              </section>
            )}

            {/* Upcoming + Recent Renewals side by side */}
            <div className="grid-2col">
              {/* Upcoming expiries */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: 'var(--font-size-lg)' }}>
                    <Clock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                    Upcoming expiries
                  </h2>
                </div>
                {upcomingDocs.length > 0 ? (
                  <div className="card" style={{ padding: 0 }}>
                    {upcomingDocs.map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-3) var(--space-4)',
                          borderBottom: '1px solid var(--color-border)',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-secondary">{formatDate(doc.expiryDate)}</div>
                        </div>
                        <span className="text-sm tabular-nums" style={{ color: 'var(--color-primary)' }}>
                          {doc.expiryInfo?.daysRemaining}d
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card">
                    <p className="text-secondary text-sm">No upcoming expiries in the next 30 days.</p>
                  </div>
                )}
              </section>

              {/* Recent renewals */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: 'var(--font-size-lg)' }}>
                    <RefreshCw size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                    Recent renewals
                  </h2>
                  {recentRenewals.length > 0 && (
                    <Link href="/history" className="btn btn-tertiary btn-sm">
                      View all <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
                {recentRenewals.length > 0 ? (
                  <div className="card" style={{ padding: 0 }}>
                    {recentRenewals.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--space-3) var(--space-4)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{event.documentName}</div>
                          <div className="text-xs text-secondary">
                            Renewed on {formatDate(event.renewedOn)}
                          </div>
                        </div>
                        <div className="text-xs text-secondary tabular-nums">
                          New expiry: {formatDate(event.newExpiryDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card">
                    <p className="text-secondary text-sm">No renewals recorded yet.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyDashboard() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FileText size={48} />
      </div>
      <h2 className="empty-state-title">Add your first document</h2>
      <p className="empty-state-desc">
        Start by adding a document with an expiry date. Remnexa will track its status and help you renew on time.
      </p>
      <Link href="/documents/new" className="btn btn-primary">
        <PlusCircle size={16} />
        Add document
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid-stats mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-box">
            <div className="skeleton skeleton-text" style={{ width: '80px' }} />
            <div className="skeleton skeleton-heading" style={{ width: '48px', marginTop: '8px' }} />
          </div>
        ))}
      </div>
      <div className="skeleton skeleton-block" />
      <div className="skeleton skeleton-block" />
    </>
  );
}
