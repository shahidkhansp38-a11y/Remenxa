'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { History, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import { getRenewalEvents } from '@/lib/firestore';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { getCategoryLabel, type RenewalEvent } from '@/lib/types';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<RenewalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getRenewalEvents(user.uid);
      setEvents(data);
    } catch {
      setError('Failed to load renewal history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <AppShell>
      <div className="page-content">
        <div className="page-title-bar">
          <div>
            <h1 className="page-title">
              <History size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Renewal History
            </h1>
            <p className="text-secondary text-sm mt-2">
              A record of all document renewals, sorted newest first.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-danger-soft)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" onClick={loadEvents}>Retry</button>
          </div>
        )}

        {loading ? (
          <div>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-block" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><History size={48} /></div>
            <h2 className="empty-state-title">No renewal history</h2>
            <p className="empty-state-desc">
              When you mark a document as renewed, the event will appear here.
            </p>
            <Link href="/renewal-assistant" className="btn btn-primary">
              Go to Renewal Assistant
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Renewed on</th>
                  <th>Previous expiry</th>
                  <th>New expiry</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="font-medium">{event.documentName}</td>
                    <td className="text-sm text-secondary">{getCategoryLabel(event.documentCategory)}</td>
                    <td className="text-sm tabular-nums">{formatDate(event.renewedOn)}</td>
                    <td className="text-sm tabular-nums text-secondary">
                      {event.previousExpiryDate ? formatDate(event.previousExpiryDate) : '-'}
                    </td>
                    <td className="text-sm tabular-nums">{formatDate(event.newExpiryDate)}</td>
                    <td className="text-sm text-secondary" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.notes || '-'}
                    </td>
                    <td>
                      <Link href={`/documents/${event.documentId}`} className="btn btn-tertiary btn-sm">
                        View doc
                      </Link>
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
