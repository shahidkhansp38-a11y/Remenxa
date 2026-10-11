'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut, Trash2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Delete the user's Firebase Auth account
      await user.delete();
      addToast('success', 'Your account has been deleted.');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/requires-recent-login') {
        addToast('error', 'For security, please sign out and sign back in before deleting your account.');
      } else {
        addToast('error', 'Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <AppShell>
      <div className="page-content" style={{ maxWidth: '640px' }}>
        <div className="page-title-bar">
          <h1 className="page-title">
            <Settings size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Settings
          </h1>
        </div>

        {/* Profile */}
        <div className="card mb-6">
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>
            <User size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Profile
          </h2>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.displayName?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 'var(--font-size-md)' }}>
                {user?.displayName || 'User'}
              </div>
              <div className="text-secondary text-sm">{user?.email || ''}</div>
              <div className="text-xs text-secondary mt-1">Signed in with Google</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card mb-6">
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Notifications</h2>
          <p className="text-secondary text-sm">
            Remnexa currently provides in-app reminders only. Email, SMS, and push notifications are not configured.
            Check the Reminders page when you sign in to see documents that need attention.
          </p>
        </div>

        {/* Legal */}
        <div className="card mb-6">
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Legal</h2>
          <div className="flex gap-4">
            <Link href="/privacy" className="btn btn-tertiary btn-sm">Privacy Policy</Link>
            <Link href="/terms" className="btn btn-tertiary btn-sm">Terms and Conditions</Link>
          </div>
        </div>

        {/* Account actions */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-4)' }}>Account</h2>
          <div className="flex flex-col gap-3">
            <button className="btn btn-secondary" onClick={handleSignOut}>
              <LogOut size={14} />
              Sign out
            </button>
            <hr className="divider" style={{ margin: 'var(--space-2) 0' }} />
            <div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-danger)' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Delete account
              </button>
              <p className="text-xs text-secondary mt-2">
                This will permanently delete your account and sign you out. Your stored documents and renewal history in the database may be retained until a data cleanup process removes them. Contact the site administrator to request full data deletion.
              </p>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Delete account">
              <h2 className="modal-title">Delete your account?</h2>
              <p className="text-secondary text-sm">
                This will permanently delete your authentication account. You will be signed out immediately. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  <Trash2 size={14} />
                  Delete my account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
